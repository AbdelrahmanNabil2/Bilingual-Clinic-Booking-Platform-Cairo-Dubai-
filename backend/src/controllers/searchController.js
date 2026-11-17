const pool = require('../db/pool');

// Simple ILIKE-based search across news and services. Good enough for a
// small clinic site's content volume; swap for full-text search
// (tsvector) if the content library grows significantly.
async function search(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json({ data: { news: [], services: [] } });

    const like = `%${q}%`;

    const [newsResult, servicesResult] = await Promise.all([
      pool.query(
        `SELECT slug, title_en, title_ar, excerpt_en, excerpt_ar
         FROM news
         WHERE is_published = true AND (title_en ILIKE $1 OR title_ar ILIKE $1 OR body_en ILIKE $1 OR body_ar ILIKE $1)
         ORDER BY published_at DESC LIMIT 10`,
        [like]
      ),
      pool.query(
        `SELECT id, title_en, title_ar, description_en, description_ar
         FROM services
         WHERE title_en ILIKE $1 OR title_ar ILIKE $1 OR description_en ILIKE $1 OR description_ar ILIKE $1
         ORDER BY sort_order ASC LIMIT 10`,
        [like]
      )
    ]);

    res.json({ data: { news: newsResult.rows, services: servicesResult.rows } });
  } catch (err) {
    next(err);
  }
}

module.exports = { search };
