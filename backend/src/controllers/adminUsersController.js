const bcrypt = require('bcryptjs');
const pool = require('../db/pool');

async function list(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, name, role, totp_enabled, created_at FROM admin_users ORDER BY created_at ASC'
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { email, password, name, role } = req.body || {};
    if (!email || !password || password.length < 8 || !name) {
      return res.status(400).json({ message: 'Name, email, and an 8+ character password are required.' });
    }
    const validRole = ['staff', 'manager', 'admin'].includes(role) ? role : 'manager';
    const passwordHash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO admin_users (email, password_hash, name, role)
       VALUES ($1,$2,$3,$4) RETURNING id, email, name, role, created_at`,
      [email.trim().toLowerCase(), passwordHash, name.trim(), validRole]
    );
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'That email is already in use.' });
    next(err);
  }
}

async function updateRole(req, res, next) {
  try {
    const { role } = req.body || {};
    if (!['staff', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'role must be staff, manager, or admin.' });
    }
    const { rows } = await pool.query(
      'UPDATE admin_users SET role = $1 WHERE id = $2 RETURNING id, email, name, role',
      [role, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Not found.' });
    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    if (Number(req.params.id) === req.admin.sub) {
      return res.status(400).json({ message: "You can't delete your own account while logged in as it." });
    }
    const { rowCount } = await pool.query('DELETE FROM admin_users WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Not found.' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, updateRole, remove };
