const express = require('express');
const { db } = require('../database/schema');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all households with pagination and search
router.get('/', (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM households';
  let countQuery = 'SELECT COUNT(*) as total FROM households';
  const params = [];

  if (search) {
    query += ' WHERE name LIKE ? OR city LIKE ? OR postal_code LIKE ?';
    countQuery += ' WHERE name LIKE ? OR city LIKE ? OR postal_code LIKE ?';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY name ASC LIMIT ? OFFSET ?';

  db.get(countQuery, params, (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    db.all(query, [...params, parseInt(limit), parseInt(offset)], (err, households) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Get member counts for each household
      const householdIds = households.map(h => h.id).join(',');
      if (householdIds) {
        db.all(
          `SELECT household_id, COUNT(*) as member_count FROM household_members WHERE household_id IN (${householdIds}) GROUP BY household_id`,
          (err, counts) => {
            const countMap = {};
            if (!err && counts) {
              counts.forEach(c => {
                countMap[c.household_id] = c.member_count;
              });
            }

            const householdsWithCounts = households.map(h => ({
              ...h,
              member_count: countMap[h.id] || 0
            }));

            res.json({
              households: householdsWithCounts,
              pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult.total,
                pages: Math.ceil(countResult.total / limit)
              }
            });
          }
        );
      } else {
        res.json({
          households: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: countResult.total,
            pages: Math.ceil(countResult.total / limit)
          }
        });
      }
    });
  });
});

// Get single household with members
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM households WHERE id = ?', [id], (err, household) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!household) {
      return res.status(404).json({ error: 'Household not found' });
    }

    db.all('SELECT * FROM household_members WHERE household_id = ? ORDER BY first_name ASC', [id], (err, members) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ ...household, members });
    });
  });
});

// Create household (admin/editor only)
router.post('/', authorizeRole('admin', 'editor'), (req, res) => {
  const {
    name,
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    country,
    notes,
    color_theme
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Household name is required' });
  }

  db.run(
    `INSERT INTO households (name, address_line1, address_line2, city, state, postal_code, country, notes, color_theme)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, address_line1, address_line2, city, state, postal_code, country, notes, color_theme || '#3b82f6'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create household' });
      }

      // Log audit
      db.run(
        'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, 'CREATE', 'household', this.lastID, JSON.stringify({ name })]
      );

      db.get('SELECT * FROM households WHERE id = ?', [this.lastID], (err, household) => {
        res.status(201).json(household);
      });
    }
  );
});

// Update household (admin/editor only)
router.put('/:id', authorizeRole('admin', 'editor'), (req, res) => {
  const { id } = req.params;
  const {
    name,
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    country,
    notes,
    color_theme
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Household name is required' });
  }

  db.run(
    `UPDATE households
     SET name = ?, address_line1 = ?, address_line2 = ?, city = ?, state = ?,
         postal_code = ?, country = ?, notes = ?, color_theme = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [name, address_line1, address_line2, city, state, postal_code, country, notes, color_theme, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update household' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Household not found' });
      }

      // Log audit
      db.run(
        'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, 'UPDATE', 'household', id, JSON.stringify({ name })]
      );

      db.get('SELECT * FROM households WHERE id = ?', [id], (err, household) => {
        res.json(household);
      });
    }
  );
});

// Delete household (admin only)
router.delete('/:id', authorizeRole('admin'), (req, res) => {
  const { id } = req.params;

  db.get('SELECT name FROM households WHERE id = ?', [id], (err, household) => {
    if (!household) {
      return res.status(404).json({ error: 'Household not found' });
    }

    db.run('DELETE FROM households WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete household' });
      }

      // Log audit
      db.run(
        'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, 'DELETE', 'household', id, JSON.stringify({ name: household.name })]
      );

      res.json({ message: 'Household deleted successfully' });
    });
  });
});

// Get household members
router.get('/:id/members', (req, res) => {
  const { id } = req.params;

  db.all('SELECT * FROM household_members WHERE household_id = ? ORDER BY first_name ASC', [id], (err, members) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(members);
  });
});

// Add household member (admin/editor only)
router.post('/:id/members', authorizeRole('admin', 'editor'), (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, role, birthday, email, phone, notes } = req.body;

  if (!first_name) {
    return res.status(400).json({ error: 'First name is required' });
  }

  // Verify household exists
  db.get('SELECT id FROM households WHERE id = ?', [id], (err, household) => {
    if (!household) {
      return res.status(404).json({ error: 'Household not found' });
    }

    db.run(
      `INSERT INTO household_members (household_id, first_name, last_name, role, birthday, email, phone, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, first_name, last_name, role, birthday, email, phone, notes],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to add member' });
        }

        // Log audit
        db.run(
          'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
          [req.user.id, 'CREATE', 'household_member', this.lastID, JSON.stringify({ household_id: id, first_name, last_name })]
        );

        db.get('SELECT * FROM household_members WHERE id = ?', [this.lastID], (err, member) => {
          res.status(201).json(member);
        });
      }
    );
  });
});

// Update household member (admin/editor only)
router.put('/:householdId/members/:memberId', authorizeRole('admin', 'editor'), (req, res) => {
  const { householdId, memberId } = req.params;
  const { first_name, last_name, role, birthday, email, phone, notes } = req.body;

  if (!first_name) {
    return res.status(400).json({ error: 'First name is required' });
  }

  db.run(
    `UPDATE household_members
     SET first_name = ?, last_name = ?, role = ?, birthday = ?, email = ?, phone = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND household_id = ?`,
    [first_name, last_name, role, birthday, email, phone, notes, memberId, householdId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update member' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Member not found' });
      }

      // Log audit
      db.run(
        'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, 'UPDATE', 'household_member', memberId, JSON.stringify({ first_name, last_name })]
      );

      db.get('SELECT * FROM household_members WHERE id = ?', [memberId], (err, member) => {
        res.json(member);
      });
    }
  );
});

// Delete household member (admin/editor only)
router.delete('/:householdId/members/:memberId', authorizeRole('admin', 'editor'), (req, res) => {
  const { householdId, memberId } = req.params;

  db.get('SELECT first_name, last_name FROM household_members WHERE id = ? AND household_id = ?', [memberId, householdId], (err, member) => {
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    db.run('DELETE FROM household_members WHERE id = ? AND household_id = ?', [memberId, householdId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete member' });
      }

      // Log audit
      db.run(
        'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, 'DELETE', 'household_member', memberId, JSON.stringify({ first_name: member.first_name, last_name: member.last_name })]
      );

      res.json({ message: 'Member deleted successfully' });
    });
  });
});

module.exports = router;
