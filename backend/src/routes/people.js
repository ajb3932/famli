const express = require('express');
const { db } = require('../database/schema');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all people/members across all households with pagination and search
router.get('/', (req, res) => {
  const { page = 1, limit = 50, search = '', sortBy = 'first_name' } = req.query;
  const offset = (page - 1) * limit;

  const validSortFields = ['first_name', 'last_name'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'first_name';

  let query = `
    SELECT hm.*, h.name as household_name, h.color_theme, h.city, h.state
    FROM household_members hm
    JOIN households h ON hm.household_id = h.id
  `;
  let countQuery = `
    SELECT COUNT(*) as total
    FROM household_members hm
    JOIN households h ON hm.household_id = h.id
  `;
  const params = [];

  if (search) {
    const whereClause = ' WHERE hm.first_name LIKE ? OR hm.last_name LIKE ? OR h.name LIKE ?';
    query += whereClause;
    countQuery += whereClause;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY hm.${sortField} ASC, hm.last_name ASC LIMIT ? OFFSET ?`;

  db.get(countQuery, params, (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    db.all(query, [...params, parseInt(limit), parseInt(offset)], (err, people) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        people,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

module.exports = router;
