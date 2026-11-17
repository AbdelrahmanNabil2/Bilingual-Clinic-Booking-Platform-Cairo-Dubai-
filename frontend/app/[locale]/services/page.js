import { getMessages } from '@/lib/getMessages';
import { getServices } from '@/lib/api';
import ServiceCard from '@/components/ServiceCard';

export const dynamic = 'force-dynamic';

export default async function ServicesPage({ params }) {
  const t = getMessages(params.locale);
  const services = (await getServices(params.locale)) || t.services.items;

  return (
    <div className="mx-auto max-w-content px-5 py-16 md:px-8">
      <p className="font-mono text-xs uppercase tracking-widest text-gold">{t.nav.services}</p>
      <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold text-clinic-dark md:text-4xl">
        {t.services.title}
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink/70">{t.services.intro}</p>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((item) => (
          <ServiceCard key={item.title} title={item.title} body={item.body} />
        ))}
      </div>
    </div>
  );
}
