import { Suspense } from 'react';
import SearchClient from '@/components/SearchClient';

export default function SearchPage({ params }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-content px-5 py-16 md:px-8 text-sm text-ink/50">…</div>}>
      <SearchClient locale={params.locale} />
    </Suspense>
  );
}
