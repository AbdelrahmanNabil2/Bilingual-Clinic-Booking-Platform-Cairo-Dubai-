process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-integration-tests-only';

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const { createApp } = require('../src/app');
const pool = require('../src/db/pool');

const app = createApp();

// These integration tests need a real, throwaway Postgres database — set
// DATABASE_URL before running `npm test` (see README). They're skipped
// automatically if no DATABASE_URL is configured, so `npm test` still works
// in environments without a database (the unit tests above still run).
const hasDb = !!process.env.DATABASE_URL;
const describeIfDb = hasDb ? describe : describe.skip;

describeIfDb('API integration', () => {
  let locationId;
  let adminToken;

  beforeAll(async () => {
    const schema = fs.readFileSync(path.join(__dirname, '..', 'src', 'db', 'schema.sql'), 'utf8');
    await pool.query(schema);

    const { rows } = await pool.query(
      `INSERT INTO locations
        (slug, city_en, city_ar, country_en, country_ar, address_en, address_ar, phone, email, hours_en, hours_ar, timezone)
       VALUES ('testville', 'Testville', 'تيست', 'Testland', 'تيست',
        'Addr', 'عنوان', '+1', 'test@example.com', '9-5', '٩-٥', 'UTC')
       ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug
       RETURNING id`
    );
    locationId = rows[0].id;

    // Open every day 09:00-17:00 so availability tests aren't day-of-week sensitive.
    for (let day = 0; day <= 6; day++) {
      await pool.query(
        `INSERT INTO clinic_hours (location_id, day_of_week, is_closed, open_time, close_time, slot_duration_minutes)
         VALUES ($1,$2,false,'09:00','17:00',30)
         ON CONFLICT (location_id, day_of_week) DO UPDATE SET is_closed = false, open_time = '09:00', close_time = '17:00'`,
        [locationId, day]
      );
    }

    const passwordHash = await bcrypt.hash('TestPassword123', 10);
    await pool.query(
      `INSERT INTO admin_users (email, password_hash, name, role)
       VALUES ('integration-test-admin@example.com', $1, 'Test Admin', 'admin')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [passwordHash]
    );
  });

  afterAll(async () => {
    await pool.query('DELETE FROM appointments WHERE location_id = $1', [locationId]);
    await pool.query('DELETE FROM clinic_hours WHERE location_id = $1', [locationId]);
    await pool.query('DELETE FROM locations WHERE id = $1', [locationId]);
    await pool.query("DELETE FROM admin_users WHERE email = 'integration-test-admin@example.com'");
    await pool.end();
  });

  test('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('POST /api/contact rejects an incomplete submission', async () => {
    const res = await request(app).post('/api/contact').send({});
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/login rejects a wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'integration-test-admin@example.com', password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  test('POST /api/auth/login succeeds with correct credentials and returns an access token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'integration-test-admin@example.com', password: 'TestPassword123' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.admin.role).toBe('admin');
    adminToken = res.body.accessToken;
  });

  test('GET /api/admin/services rejects an unauthenticated request', async () => {
    const res = await request(app).get('/api/admin/services');
    expect(res.status).toBe(401);
  });

  test('GET /api/admin/services accepts a valid access token', async () => {
    const res = await request(app).get('/api/admin/services').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('availability returns computed open slots for the seeded location', async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const res = await request(app).get(`/api/appointments/availability?location=testville&date=${tomorrow}`);
    expect(res.status).toBe(200);
    expect(res.body.data.slots).toContain('09:00');
    expect(res.body.data.slots.length).toBeGreaterThan(0);
  });

  test('booking the same slot twice is rejected on the second attempt', async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const payload = {
      patient_name: 'Test Patient', email: 'patient@example.com',
      location: 'testville', date: tomorrow, time: '10:00'
    };

    const first = await request(app).post('/api/appointments').send(payload);
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/appointments')
      .send({ ...payload, email: 'other-patient@example.com' });
    expect(second.status).toBe(409);
  });
});
