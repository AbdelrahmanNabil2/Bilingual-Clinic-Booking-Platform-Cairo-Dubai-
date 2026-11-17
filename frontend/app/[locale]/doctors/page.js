import { getMessages } from '@/lib/getMessages';
import { getDoctors } from '@/lib/api';
import DoctorCard from '@/components/DoctorCard';

export const dynamic = 'force-dynamic';

export default async function DoctorsPage({ params }) {
  const { locale } = params;
  const t = getMessages(locale);
  const doctors = (await getDoctors(locale)) || Array.from({ length: 3 }).map(() => ({
    name: t.doctors.placeholderName,
    title: t.doctors.placeholderTitle,
    bio: t.doctors.placeholderBio,
    location: t.doctors.placeholderLocation
  }));

  return (
    <div className="mx-auto max-w-content px-5 py-16 md:px-8">
      <p className="font-mono text-xs uppercase tracking-widest text-gold">{t.nav.doctors}</p>
      <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold text-clinic-dark md:text-4xl">
        {t.doctors.title}
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink/70">{t.doctors.intro}</p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {doctors.map((doc, i) => (
          <DoctorCard
            key={doc.slug || i}
            name={doc.name}
            title={doc.title}
            bio={doc.bio}
            location={doc.location}
            slug={doc.slug}
            photoUrl={doc.photoUrl}
            locale={locale}
            viewProfileLabel={t.doctors.viewProfile}
          />
        ))}
      </div>
    </div>
  );
}
