import { getNewsList, getDoctors } from '@/lib/api';

const STATIC_PATHS = [
  '', '/about', '/services', '/doctors', '/locations', '/news', '/testimonials', '/booking', '/contact', '/privacy', '/terms'
];

export default async function sitemap() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const locales = ['en', 'ar'];
  const entries = [];

  for (const locale of locales) {
    for (const path of STATIC_PATHS) {
      entries.push({ url: `${base}/${locale}${path}`, changeFrequency: 'weekly', priority: path === '' ? 1 : 0.7 });
    }

    const [news, doctors] = await Promise.all([getNewsList(locale), getDoctors(locale)]);

    for (const article of news) {
      entries.push({
        url: `${base}/${locale}/news/${article.slug}`,
        lastModified: article.publishedAt,
        changeFrequency: 'monthly',
        priority: 0.5
      });
    }

    for (const doctor of doctors || []) {
      if (doctor.slug) {
        entries.push({ url: `${base}/${locale}/doctors/${doctor.slug}`, changeFrequency: 'monthly', priority: 0.5 });
      }
    }
  }

  return entries;
}
