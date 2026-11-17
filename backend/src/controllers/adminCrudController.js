const pool = require('../db/pool');

/**
 * Generic admin CRUD factory for simple content tables (services, doctors,
 * testimonials, locations). `fields` is a fixed whitelist of column names
 * defined in code — request bodies only ever supply *values* for columns
 * on that whitelist, never column names, so this stays injection-safe
 * despite building SQL dynamically.
 */
function makeCrudController({ table, fields, hasUpdatedAt = true, orderBy = 'id ASC' }) {
  async function list(req, res, next) {
    try {
      const { rows } = await pool.query(`SELECT * FROM ${table} ORDER BY ${orderBy}`);
      res.json({ data: rows });
    } catch (err) {
      next(err);
    }
  }

  async function get(req, res, next) {
    try {
      const { rows } = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [req.params.id]);
      if (!rows[0]) return res.status(404).json({ message: 'Not found.' });
      res.json({ data: rows[0] });
    } catch (err) {
      next(err);
    }
  }

  async function create(req, res, next) {
    try {
      const present = fields.filter((f) => req.body[f] !== undefined);
      if (present.length === 0) {
        return res.status(400).json({ message: 'No recognized fields were provided.' });
      }

      const columns = present.join(', ');
      const placeholders = present.map((_, i) => `$${i + 1}`).join(', ');
      const values = present.map((f) => req.body[f]);

      const { rows } = await pool.query(
        `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      res.status(201).json({ data: rows[0] });
    } catch (err) {
      next(err);
    }
  }

  async function update(req, res, next) {
    try {
      const present = fields.filter((f) => req.body[f] !== undefined);
      if (present.length === 0) {
        return res.status(400).json({ message: 'No recognized fields were provided.' });
      }

      const assignments = present.map((f, i) => `${f} = $${i + 1}`);
      if (hasUpdatedAt) assignments.push('updated_at = now()');

      const values = present.map((f) => req.body[f]);
      values.push(req.params.id);

      const { rows } = await pool.query(
        `UPDATE ${table} SET ${assignments.join(', ')} WHERE id = $${values.length} RETURNING *`,
        values
      );
      if (!rows[0]) return res.status(404).json({ message: 'Not found.' });
      res.json({ data: rows[0] });
    } catch (err) {
      next(err);
    }
  }

  async function remove(req, res, next) {
    try {
      const { rowCount } = await pool.query(`DELETE FROM ${table} WHERE id = $1`, [req.params.id]);
      if (!rowCount) return res.status(404).json({ message: 'Not found.' });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  }

  return { list, get, create, update, remove };
}

module.exports = { makeCrudController };
