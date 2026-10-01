const express = require('express');
const { z } = require('zod');
const schemas = require('../lib/schemas');
const { parse, likePattern, paginate } = require('../lib/http');
const { requireAuth } = require('../middleware/auth');

const listQuery = schemas.listQuery(50, 200).extend({
  sortBy: z.enum(['first_name', 'last_name']).catch('first_name'),
});

const birthdaysQuery = z.object({
  days: z.coerce.number().int().min(1).max(366).catch(30),
});

const DAY_MS = 24 * 60 * 60 * 1000;

// Days from `today` until the next anniversary of an ISO birthday string.
function daysUntilBirthday(birthday, today) {
  const [, month, day] = birthday.split('-').map(Number);
  if (!month || !day) return null;
  const year = today.getUTCFullYear();
  // Feb 29 birthdays are celebrated on Mar 1 in non-leap years (Date rolls over).
  let next = Date.UTC(year, month - 1, day);
  if (next < today.getTime()) next = Date.UTC(year + 1, month - 1, day);
  return Math.round((next - today.getTime()) / DAY_MS);
}

module.exports = function peopleRoutes(db) {
  const router = express.Router();
  router.use(requireAuth);

  router.get('/', (req, res) => {
    const { page, limit, search, sortBy } = parse(listQuery, req.query);
    const q = likePattern(search);
    const other = sortBy === 'first_name' ? 'last_name' : 'first_name';

    const where = search
      ? `WHERE m.first_name LIKE @q ESCAPE '\\' OR m.last_name LIKE @q ESCAPE '\\'
           OR m.email LIKE @q ESCAPE '\\' OR h.name LIKE @q ESCAPE '\\'`
      : '';
    const from = 'FROM household_members m JOIN households h ON h.id = m.household_id';

    const { total } = db.prepare(`SELECT COUNT(*) AS total ${from} ${where}`).get({ q });
    // sortBy/other come from a fixed enum, never from raw input.
    const people = db
      .prepare(
        `SELECT m.*, h.name AS household_name, h.color_theme, h.city, h.state
         ${from} ${where}
         ORDER BY COALESCE(NULLIF(m.${sortBy}, ''), m.${other}) COLLATE NOCASE, m.${other} COLLATE NOCASE
         LIMIT @limit OFFSET @offset`
      )
      .all({ q, limit, offset: (page - 1) * limit });

    res.json({ people, pagination: paginate(total, page, limit) });
  });

  router.get('/birthdays', (req, res) => {
    const { days } = parse(birthdaysQuery, req.query);
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    const people = db
      .prepare(
        `SELECT m.id, m.first_name, m.last_name, m.birthday, m.household_id,
                h.name AS household_name, h.color_theme
         FROM household_members m JOIN households h ON h.id = m.household_id
         WHERE m.birthday IS NOT NULL AND m.birthday != ''`
      )
      .all()
      .map((p) => ({ ...p, days_until: daysUntilBirthday(p.birthday, today) }))
      .filter((p) => p.days_until !== null && p.days_until <= days)
      .sort((a, b) => a.days_until - b.days_until);

    res.json({ people });
  });

  return router;
};

module.exports.daysUntilBirthday = daysUntilBirthday;
