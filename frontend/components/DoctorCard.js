import Link from 'next/link';

export default function DoctorCard({ name, title, bio, location, slug, photoUrl, locale, viewProfileLabel }) {
  const content = (
    <>
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={name} className="h-44 w-full object-cover" />
      ) : (
        <div className="flex h-44 items-center justify-center bg-sand font-mono text-xs uppercase tracking-wider text-ink/40">
          Photo
        </div>
      )}
      <div className="p-6">
        <h3 className="font-display text-lg font-semibold text-clinic-dark">{name}</h3>
        <p className="mt-1 text-sm font-medium text-gold">{title}</p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">{bio}</p>
        <p className="mt-3 font-mono text-xs uppercase tracking-wider text-ink/40">{location}</p>
        {slug && (
          <p className="mt-4 text-sm font-medium text-clinic">{viewProfileLabel} →</p>
        )}
      </div>
    </>
  );

  if (slug) {
    return (
      <Link
        href={`/${locale}/doctors/${slug}`}
        className="focus-ring group block overflow-hidden rounded-2xl border border-ink/10 bg-white/60 transition-shadow hover:shadow-md"
      >
        {content}
      </Link>
    );
  }

  return <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white/60">{content}</div>;
}
