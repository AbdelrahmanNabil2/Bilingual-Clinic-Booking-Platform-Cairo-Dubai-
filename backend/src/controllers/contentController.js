const pool = require('../db/pool');

/**
 * Builds a simple "list all" controller for a read-mostly table.
 * Kept generic since services/locations/doctors/testimonials all
 * follow the same "translated columns + sort order" shape.
 */
function listController(query) {
  return async (req, res, next) => {
    try {
      const { rows } = await pool.query(query);
      res.json({ data: rows });
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { listController };
