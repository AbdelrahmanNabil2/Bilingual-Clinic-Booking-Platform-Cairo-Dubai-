const pool = require('../db/pool');

function slugify(text) {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 160);
}

async function uniqueSlug(base, excludeId = null) {
  let slug = base || 'article';
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { rows } = await pool.query(
      excludeId
        ? 'SELECT id FROM news WHERE slug = $1 AND id <> $2'
        : 'SELECT id FROM news WHERE slug = $1',
      excludeId ? [slug, excludeId] : [slug]
    );
    if (rows.length === 0) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

// ── Public ──────────────────────────────────────────────────────────────

async function listPublished(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT id, slug, title_en, title_ar, excerpt_en, excerpt_ar, cover_image_url, published_at
       FROM news WHERE is_published = true ORDER BY published_at DESC`
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

async function getBySlug(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT id, slug, title_en, title_ar, excerpt_en, excerpt_ar, body_en, body_ar,
              cover_image_url, published_at
       FROM news WHERE slug = $1 AND is_published = true`,
      [req.params.slug]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Article not found.' });
    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
}

// ── Admin ───────────────────────────────────────────────────────────────

async function adminList(req, res, next) {
  try {
    const { rows } = await pool.query('SELECT * FROM news ORDER BY created_at DESC');
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

async function adminGet(req, res, next) {
  try {
    const { rows } = await pool.query('SELECT * FROM news WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Not found.' });
    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function adminCreate(req, res, next) {
  try {
    const { title_en, title_ar, excerpt_en, excerpt_ar, body_en, body_ar, cover_image_url, is_published } = req.body || {};

    if (!title_en || !title_ar || !body_en || !body_ar) {
      return res.status(400).json({ message: 'Title and body are required in both languages.' });
    }

    const slug = await uniqueSlug(slugify(req.body.slug || title_en));
    const published = is_published !== false;

    const { rows } = await pool.query(
      `INSERT INTO news
        (slug, title_en, title_ar, excerpt_en, excerpt_ar, body_en, body_ar, cover_image_url, is_published, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now())
       RETURNING *`,
      [slug, title_en, title_ar, excerpt_en || null, excerpt_ar || null, body_en, body_ar, cover_image_url || null, published]
    );
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function adminUpdate(req, res, next) {
  try {
    const existing = await pool.query('SELECT * FROM news WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) return res.status(404).json({ message: 'Not found.' });

    const current = existing.rows[0];
    const body = req.body || {};

    let slug = current.slug;
    if (body.slug && body.slug !== current.slug) {
      slug = await uniqueSlug(slugify(body.slug), current.id);
    }

    const merged = {
      title_en: body.title_en ?? current.title_en,
      title_ar: body.title_ar ?? current.title_ar,
      excerpt_en: body.excerpt_en ?? current.excerpt_en,
      excerpt_ar: body.excerpt_ar ?? current.excerpt_ar,
      body_en: body.body_en ?? current.body_en,
      body_ar: body.body_ar ?? current.body_ar,
      cover_image_url: body.cover_image_url ?? current.cover_image_url,
      is_published: body.is_published ?? current.is_published
    };

    const { rows } = await pool.query(
      `UPDATE news SET
        slug = $1, title_en = $2, title_ar = $3, excerpt_en = $4, excerpt_ar = $5,
        body_en = $6, body_ar = $7, cover_image_url = $8, is_published = $9, updated_at = now()
       WHERE id = $10
       RETURNING *`,
      [slug, merged.title_en, merged.title_ar, merged.excerpt_en, merged.excerpt_ar,
       merged.body_en, merged.body_ar, merged.cover_image_url, merged.is_published, current.id]
    );
    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function adminRemove(req, res, next) {
  try {
    const { rowCount } = await pool.query('DELETE FROM news WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Not found.' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { listPublished, getBySlug, adminList, adminGet, adminCreate, adminUpdate, adminRemove };
