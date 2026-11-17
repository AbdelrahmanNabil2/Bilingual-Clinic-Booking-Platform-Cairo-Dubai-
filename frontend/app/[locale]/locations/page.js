import { getMessages } from '@/lib/getMessages';
import { getLocations } from '@/lib/api';
import LocationCard from '@/components/LocationCard';

export const dynamic = 'force-dynamic';

export default async function LocationsPage({ params }) {
  const t = getMessages(params.locale);
  const locations = (await getLocations(params.locale)) || { cairo: t.locations.cairo, dubai: t.locations.dubai };

  return (
    <div className="mx-auto max-w-content px-5 py-16 md:px-8">
      <p className="font-mono text-xs uppercase tracking-widest text-gold">{t.nav.locations}</p>
      <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold text-clinic-dark md:text-4xl">
        {t.locations.title}
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink/70">{t.locations.intro}</p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <LocationCard data={locations.cairo} labels={t.locations} />
        <LocationCard data={locations.dubai} labels={t.locations} />
      </div>
    </div>
  );
}
