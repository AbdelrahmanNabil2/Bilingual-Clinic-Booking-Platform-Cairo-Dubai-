import Link from 'next/link';
import { getMessages } from '@/lib/getMessages';
import { getNewsList } from '@/lib/api';

export const dynamic = 'force-dynamic';

function formatDate(iso, locale) {
  try {
    return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return '';
  }
}

export default async function NewsPage({ params }) {
  const { locale } = params;
  const t = getMessages(locale);
  const articles = await getNewsList(locale);

  return (
    <div className="mx-auto max-w-content px-5 py-16 md:px-8">
      <p className="font-mono text-xs uppercase tracking-widest text-gold">{t.nav.news}</p>
      <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold text-clinic-dark md:text-4xl">
        {t.news.title}
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink/70">{t.news.intro}</p>

      {articles.length === 0 ? (
        <p className="mt-12 text-sm text-ink/50">{t.news.empty}</p>
      ) : (
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/${locale}/news/${article.slug}`}
              className="focus-ring group flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white/60 transition-shadow hover:shadow-md"
            >
              {article.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={article.coverImageUrl} alt="" className="h-44 w-full object-cover" />
              ) : (
                <div className="flex h-44 items-center justify-center bg-sand font-mono text-xs uppercase tracking-wider text-ink/40">
                  {t.meta.siteName}
                </div>
              )}
              <div className="flex flex-1 flex-col p-6">
                <p className="font-mono text-xs uppercase tracking-wider text-ink/40">
                  {formatDate(article.publishedAt, locale)}
                </p>
                <h2 className="mt-2 font-display text-lg font-semibold text-clinic-dark group-hover:text-clinic">
                  {article.title}
                </h2>
                {article.excerpt && (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink/70">{article.excerpt}</p>
                )}
                <span className="mt-4 text-sm font-medium text-clinic">{t.news.readMore} →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
