require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/db/pool');

async function seed() {
  console.log('Seeding database...');

  const { rows: locationRows } = await pool.query(
    `INSERT INTO locations
      (slug, city_en, city_ar, country_en, country_ar, address_en, address_ar, phone, email, hours_en, hours_ar, timezone, latitude, longitude)
     VALUES
      ('cairo', 'Cairo', 'القاهرة', 'Egypt', 'مصر',
       'Street Address, Building No., Cairo, Egypt', 'اسم الشارع، رقم المبنى، القاهرة، مصر',
       '+20 2 000 0000', 'cairo@clinicname.com', 'Sat-Thu, 10:00 AM - 8:00 PM', 'السبت-الخميس، 10:00 صباحًا - 8:00 مساءً', 'Africa/Cairo', 30.0444, 31.2357),
      ('dubai', 'Dubai', 'دبي', 'United Arab Emirates', 'الإمارات العربية المتحدة',
       'Street Address, Building No., Dubai, UAE', 'اسم الشارع، رقم المبنى، دبي، الإمارات',
       '+971 4 000 0000', 'dubai@clinicname.com', 'Sun-Thu, 9:00 AM - 7:00 PM', 'الأحد-الخميس، 9:00 صباحًا - 7:00 مساءً', 'Asia/Dubai', 25.2048, 55.2708)
     ON CONFLICT (slug) DO NOTHING
     RETURNING id, slug;`
  );

  // Fetch ids regardless of whether the insert above hit ON CONFLICT DO NOTHING
  const { rows: allLocations } = await pool.query('SELECT id, slug FROM locations');
  const cairo = allLocations.find((l) => l.slug === 'cairo');
  const dubai = allLocations.find((l) => l.slug === 'dubai');

  const services = [
    ['Consultations', 'الاستشارات', 'Initial and follow-up consultations with a focus on understanding your full history.', 'استشارات أولية ومتابعة، مع التركيز على فهم تاريخك الطبي الكامل.'],
    ['Diagnostics', 'التشخيص', 'On-site diagnostic support to reach a clear picture quickly.', 'دعم تشخيصي داخل العيادة للوصول إلى صورة واضحة بسرعة.'],
    ['Specialist Care', 'الرعاية التخصصية', 'Tailored treatment plans, reviewed and adjusted as needed.', 'خطط علاجية مصممة خصيصًا لحالتك، تتم مراجعتها وتعديلها عند الحاجة.'],
    ['Follow-up & Care Plans', 'المتابعة وخطط الرعاية', 'Structured follow-ups so nothing falls through the cracks.', 'متابعة منظمة حتى لا يفوتنا أي تفصيل مهم.']
  ];

  for (const [i, [titleEn, titleAr, descEn, descAr]] of services.entries()) {
    await pool.query(
      `INSERT INTO services (title_en, title_ar, description_en, description_ar, sort_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [titleEn, titleAr, descEn, descAr, i]
    );
  }

  // ── Clinic hours (drives booking availability) ──────────────────────
  // day_of_week: 0=Sun ... 6=Sat. Cairo: Sat-Thu 10:00-20:00, closed Friday.
  // Dubai: Sun-Thu 9:00-19:00, closed Friday & Saturday.
  if (cairo) {
    for (let day = 0; day <= 6; day++) {
      const isClosed = day === 5; // Friday
      await pool.query(
        `INSERT INTO clinic_hours (location_id, day_of_week, is_closed, open_time, close_time, slot_duration_minutes)
         VALUES ($1,$2,$3,$4,$5,30)
         ON CONFLICT (location_id, day_of_week) DO NOTHING`,
        [cairo.id, day, isClosed, isClosed ? null : '10:00', isClosed ? null : '20:00']
      );
    }
  }
  if (dubai) {
    for (let day = 0; day <= 6; day++) {
      const isClosed = day === 5 || day === 6; // Friday & Saturday
      await pool.query(
        `INSERT INTO clinic_hours (location_id, day_of_week, is_closed, open_time, close_time, slot_duration_minutes)
         VALUES ($1,$2,$3,$4,$5,30)
         ON CONFLICT (location_id, day_of_week) DO NOTHING`,
        [dubai.id, day, isClosed, isClosed ? null : '09:00', isClosed ? null : '19:00']
      );
    }
  }

  // ── Initial admin user ────────────────────────────────────────────────
  const adminEmail = (process.env.ADMIN_SEED_EMAIL || 'admin@clinicname.com').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'change-this-password';
  const adminName = process.env.ADMIN_SEED_NAME || 'Clinic Admin';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await pool.query(
    `INSERT INTO admin_users (email, password_hash, name, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO NOTHING`,
    [adminEmail, passwordHash, adminName]
  );

  // ── Sample news article ─────────────────────────────────────────────
  await pool.query(
    `INSERT INTO news (slug, title_en, title_ar, excerpt_en, excerpt_ar, body_en, body_ar, is_published)
     VALUES (
       'welcome-to-our-new-website',
       'Welcome to our new website', 'مرحبًا بكم في موقعنا الجديد',
       'We''re excited to launch our new bilingual site, now serving both Cairo and Dubai.',
       'يسعدنا إطلاق موقعنا الجديد ثنائي اللغة، ليخدم الآن مرضانا في القاهرة ودبي.',
       'This is a placeholder article. Replace it with real clinic news and updates from the admin panel.',
       'هذا مقال تجريبي. استبدله بأخبار وتحديثات حقيقية للعيادة من خلال لوحة التحكم.',
       true
     )
     ON CONFLICT (slug) DO NOTHING`
  );

  console.log(`Seeded ${allLocations.length} location(s), ${services.length} service(s), clinic hours, 1 news article.`);
  console.log(`Admin login ready — email: ${adminEmail} (password from ADMIN_SEED_PASSWORD in .env)`);
  console.log('Note: doctors and testimonials are intentionally left empty until real content is ready.');

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
