require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/db/pool');

async function main() {
  const [, , email, password, name, role] = process.argv;
  if (!email || !password) {
    console.error('Usage: node scripts/createAdmin.js <email> <password> ["Display Name"] [staff|manager|admin]');
    process.exit(1);
  }
  const validRole = ['staff', 'manager', 'admin'].includes(role) ? role : 'admin';

  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO admin_users (email, password_hash, name, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name, role = EXCLUDED.role`,
    [email.trim().toLowerCase(), hash, name || 'Clinic Admin', validRole]
  );

  console.log(`Admin user ready: ${email} (role: ${validRole})`);
  await pool.end();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
