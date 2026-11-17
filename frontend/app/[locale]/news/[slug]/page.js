import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMessages } from '@/lib/getMessages';
import { getNewsArticle } from '@/lib/api';
import JsonLd from '@/components/JsonLd';

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

export default async function NewsArticlePage({ params }) {
  const { locale, slug } = params;
  const t = getMessages(locale);
  const article = await getNewsArticle(locale, slug);

  if (!article) notFound();

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    datePublished: article.publishedAt,
    image: article.coverImageUrl || undefined
  };

  return (
    <article className="mx-auto max-w-2xl px-5 py-16 md:px-8">
      <JsonLd data={structuredData} />
      <Link href={`/${locale}/news`} className="focus-ring rounded text-sm font-medium text-clinic hover:text-clinic-dark">
        ← {t.news.backToNews}
      </Link>

      <p className="mt-6 font-mono text-xs uppercase tracking-wider text-ink/40">
        {formatDate(article.publishedAt, locale)}
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-clinic-dark md:text-4xl">
        {article.title}
      </h1>

      {article.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={article.coverImageUrl} alt="" className="mt-8 w-full rounded-2xl object-cover" />
      )}

      <div className="prose prose-neutral mt-8 max-w-none whitespace-pre-line text-base leading-relaxed text-ink/80">
        {article.body}
      </div>
    </article>
  );
}
