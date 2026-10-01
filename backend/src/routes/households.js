const express = require('express');
const schemas = require('../lib/schemas');
const { HttpError, parse, likePattern, paginate } = require('../lib/http');
const { audit } = require('../lib/audit');
const { requireAuth, requireRole } = require('../middleware/auth');

const HOUSEHOLD_FIELDS = [
  'name',
  'address_line1',
  'address_line2',
  'city',
  'state',
  'postal_code',
  'country',
  'notes',
  'color_theme',
];
const MEMBER_FIELDS = ['first_name', 'last_name', 'nickname', 'birthday', 'email', 'phone', 'notes'];
const PREVIEW_SIZE = 4;

const listQuery = schemas.listQuery(24, 100);

module.exports = function householdRoutes(db) {
  const router = express.Router();
  router.use(requireAuth);

  const canEdit = requireRole('admin', 'editor');

  const getHousehold = (id) => db.prepare('SELECT * FROM households WHERE id = ?').get(id);
  const getMembers = (householdId) =>
    db
      .prepare(
        'SELECT * FROM household_members WHERE household_id = ? ORDER BY first_name COLLATE NOCASE, last_name COLLATE NOCASE'
      )
      .all(householdId);

  const findHouseholdOr404 = (rawId) => {
    const household = getHousehold(parse(schemas.id, rawId));
    if (!household) throw new HttpError(404, 'Household not found');
    return household;
  };

  router.get('/', (req, res) => {
    const { page, limit, search } = parse(listQuery, req.query);
    const q = likePattern(search);

    const where = search
      ? `WHERE h.name LIKE @q ESCAPE '\\' OR h.city LIKE @q ESCAPE '\\' OR h.postal_code LIKE @q ESCAPE '\\'
           OR EXISTS (SELECT 1 FROM household_members m WHERE m.household_id = h.id
                      AND (m.first_name LIKE @q ESCAPE '\\' OR m.last_name LIKE @q ESCAPE '\\'
                           OR m.nickname LIKE @q ESCAPE '\\'))`
      : '';

    const { total } = db.prepare(`SELECT COUNT(*) AS total FROM households h ${where}`).get({ q });
    const households = db
      .prepare(
        `SELECT h.*, (SELECT COUNT(*) FROM household_members m WHERE m.household_id = h.id) AS member_count
         FROM households h ${where}
         ORDER BY h.name COLLATE NOCASE
         LIMIT @limit OFFSET @offset`
      )
      .all({ q, limit, offset: (page - 1) * limit });

    // A few member names per card for the avatar stack.
    const previews = new Map(households.map((h) => [h.id, []]));
    if (households.length) {
      const rows = db
        .prepare(
          `SELECT household_id, first_name, last_name FROM household_members
           WHERE household_id IN (SELECT value FROM json_each(?))
           ORDER BY first_name COLLATE NOCASE`
        )
        .all(JSON.stringify(households.map((h) => h.id)));
      for (const row of rows) {
        const list = previews.get(row.household_id);
        if (list.length < PREVIEW_SIZE) list.push({ first_name: row.first_name, last_name: row.last_name });
      }
    }

    res.json({
      households: households.map((h) => ({ ...h, members_preview: previews.get(h.id) })),
      pagination: paginate(total, page, limit),
    });
  });

  router.get('/:id', (req, res) => {
    const household = findHouseholdOr404(req.params.id);
    res.json({ ...household, members: getMembers(household.id) });
  });

  router.post('/', canEdit, (req, res) => {
    const data = parse(schemas.household, req.body);
    const id = db.transaction(() => {
      const { lastInsertRowid } = db
        .prepare(
          `INSERT INTO households (${HOUSEHOLD_FIELDS.join(', ')})
           VALUES (${HOUSEHOLD_FIELDS.map((f) => `@${f}`).join(', ')})`
        )
        .run(data);
      audit(db, {
        userId: req.user.id,
        action: 'CREATE',
        entityType: 'household',
        entityId: lastInsertRowid,
        details: { name: data.name },
      });
      return lastInsertRowid;
    })();
    res.status(201).json({ ...getHousehold(id), members: [] });
  });

  router.put('/:id', canEdit, (req, res) => {
    const household = findHouseholdOr404(req.params.id);
    const data = parse(schemas.household, req.body);
    db.transaction(() => {
      db.prepare(
        `UPDATE households SET ${HOUSEHOLD_FIELDS.map((f) => `${f} = @${f}`).join(', ')},
           updated_at = CURRENT_TIMESTAMP
         WHERE id = @id`
      ).run({ ...data, id: household.id });
      audit(db, {
        userId: req.user.id,
        action: 'UPDATE',
        entityType: 'household',
        entityId: household.id,
        details: { name: data.name },
      });
    })();
    res.json({ ...getHousehold(household.id), members: getMembers(household.id) });
  });

  router.delete('/:id', requireRole('admin'), (req, res) => {
    const household = findHouseholdOr404(req.params.id);
    db.transaction(() => {
      // Members are removed by ON DELETE CASCADE.
      db.prepare('DELETE FROM households WHERE id = ?').run(household.id);
      audit(db, {
        userId: req.user.id,
        action: 'DELETE',
        entityType: 'household',
        entityId: household.id,
        details: { name: household.name },
      });
    })();
    res.status(204).end();
  });

  // ---- Members ------------------------------------------------------------

  const findMemberOr404 = (household, rawMemberId) => {
    const member = db
      .prepare('SELECT * FROM household_members WHERE id = ? AND household_id = ?')
      .get(parse(schemas.id, rawMemberId), household.id);
    if (!member) throw new HttpError(404, 'Member not found');
    return member;
  };

  router.post('/:id/members', canEdit, (req, res) => {
    const household = findHouseholdOr404(req.params.id);
    const data = parse(schemas.member, req.body);
    const id = db.transaction(() => {
      const { lastInsertRowid } = db
        .prepare(
          `INSERT INTO household_members (household_id, ${MEMBER_FIELDS.join(', ')})
           VALUES (@household_id, ${MEMBER_FIELDS.map((f) => `@${f}`).join(', ')})`
        )
        .run({ ...data, household_id: household.id });
      audit(db, {
        userId: req.user.id,
        action: 'CREATE',
        entityType: 'household_member',
        entityId: lastInsertRowid,
        details: { household_id: household.id, first_name: data.first_name, last_name: data.last_name },
      });
      return lastInsertRowid;
    })();
    res.status(201).json(db.prepare('SELECT * FROM household_members WHERE id = ?').get(id));
  });

  router.put('/:id/members/:memberId', canEdit, (req, res) => {
    const household = findHouseholdOr404(req.params.id);
    const member = findMemberOr404(household, req.params.memberId);
    const data = parse(schemas.member, req.body);
    db.transaction(() => {
      db.prepare(
        `UPDATE household_members SET ${MEMBER_FIELDS.map((f) => `${f} = @${f}`).join(', ')},
           updated_at = CURRENT_TIMESTAMP
         WHERE id = @id`
      ).run({ ...data, id: member.id });
      audit(db, {
        userId: req.user.id,
        action: 'UPDATE',
        entityType: 'household_member',
        entityId: member.id,
        details: { household_id: household.id, first_name: data.first_name, last_name: data.last_name },
      });
    })();
    res.json(db.prepare('SELECT * FROM household_members WHERE id = ?').get(member.id));
  });

  router.delete('/:id/members/:memberId', canEdit, (req, res) => {
    const household = findHouseholdOr404(req.params.id);
    const member = findMemberOr404(household, req.params.memberId);
    db.transaction(() => {
      db.prepare('DELETE FROM household_members WHERE id = ?').run(member.id);
      audit(db, {
        userId: req.user.id,
        action: 'DELETE',
        entityType: 'household_member',
        entityId: member.id,
        details: { household_id: household.id, first_name: member.first_name, last_name: member.last_name },
      });
    })();
    res.status(204).end();
  });

  return router;
};
