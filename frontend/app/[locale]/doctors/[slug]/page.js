import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMessages } from '@/lib/getMessages';
import { getDoctor } from '@/lib/api';
import JsonLd from '@/components/JsonLd';

export const dynamic = 'force-dynamic';

export default async function DoctorDetailPage({ params }) {
  const { locale, slug } = params;
  const t = getMessages(locale);
  const doctor = await getDoctor(locale, slug);

  if (!doctor) notFound();

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Physician',
    name: doctor.name,
    jobTitle: doctor.title,
    description: doctor.bio,
    image: doctor.photoUrl || undefined
  };

  return (
    <div className="mx-auto max-w-2xl px-5 py-16 md:px-8">
      <JsonLd data={structuredData} />
      <Link href={`/${locale}/doctors`} className="focus-ring rounded text-sm font-medium text-clinic hover:text-clinic-dark">
        ← {t.doctors.backToDoctors}
      </Link>

      <div className="mt-8 flex flex-col items-start gap-6 sm:flex-row">
        {doctor.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={doctor.photoUrl} alt={doctor.name} className="h-40 w-40 shrink-0 rounded-2xl object-cover" />
        ) : (
          <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-2xl bg-sand font-mono text-xs uppercase tracking-wider text-ink/40">
            Photo
          </div>
        )}
        <div>
          <h1 className="font-display text-3xl font-semibold text-clinic-dark">{doctor.name}</h1>
          <p className="mt-1 text-base font-medium text-gold">{doctor.title}</p>
          {doctor.location && (
            <p className="mt-2 font-mono text-xs uppercase tracking-wider text-ink/40">{doctor.location}</p>
          )}
        </div>
      </div>

      <p className="mt-8 whitespace-pre-line text-base leading-relaxed text-ink/80">{doctor.bio}</p>

      <Link
        href={`/${locale}/booking`}
        className="focus-ring mt-10 inline-block rounded-full bg-clinic px-6 py-3 text-sm font-medium text-base transition-colors hover:bg-clinic-dark"
      >
        {t.nav.booking}
      </Link>
    </div>
  );
}
