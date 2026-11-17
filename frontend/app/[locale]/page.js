import Link from 'next/link';
import { getMessages } from '@/lib/getMessages';
import { getServices, getLocations } from '@/lib/api';
import ServiceCard from '@/components/ServiceCard';
import LocationCard from '@/components/LocationCard';
import JsonLd from '@/components/JsonLd';

export const dynamic = 'force-dynamic';

export default async function HomePage({ params }) {
  const { locale } = params;
  const t = getMessages(locale);

  const services = ((await getServices(locale)) || t.services.items).slice(0, 4);
  const locations = (await getLocations(locale)) || { cairo: t.locations.cairo, dubai: t.locations.dubai };

  const structuredData = Object.values(locations).map((loc) => ({
    '@context': 'https://schema.org',
    '@type': 'MedicalClinic',
    name: `${t.meta.siteName} — ${loc.city}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: loc.addressLine1,
      addressLocality: loc.city,
      addressCountry: loc.country
    },
    telephone: loc.phone,
    email: loc.email
  }));

  return (
    <>
      {structuredData.map((d, i) => <JsonLd key={i} data={d} />)}
      {/* Hero */}
      <section className="mx-auto max-w-content px-5 pb-16 pt-16 md:px-8 md:pt-24">
        <p className="font-mono text-xs uppercase tracking-widest text-gold">{t.home.heroEyebrow}</p>
        <h1 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-tight text-clinic-dark md:text-5xl">
          {t.home.heroTitle}
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-ink/70 md:text-lg">
          {t.home.heroSubtitle}
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href={`/${locale}/contact`}
            className="focus-ring rounded-full bg-clinic px-6 py-3 text-sm font-medium text-base transition-colors hover:bg-clinic-dark"
          >
            {t.home.heroCtaPrimary}
          </Link>
          <Link
            href={`/${locale}/services`}
            className="focus-ring rounded-full border border-clinic/30 px-6 py-3 text-sm font-medium text-clinic-dark transition-colors hover:border-clinic"
          >
            {t.home.heroCtaSecondary}
          </Link>
        </div>

        {/* Route-thread signature: twin cities */}
        <div className="route-thread mt-16 flex max-w-md items-center justify-between text-clinic-dark/60">
          <span className="bg-base pr-3 font-mono text-xs uppercase tracking-wider rtl:pl-3 rtl:pr-0">
            {t.home.citiesLabel}
          </span>
        </div>
        <div className="mt-3 flex max-w-md items-center justify-between">
          <span className="font-display text-lg font-medium text-clinic">{locations.cairo.city}</span>
          <span aria-hidden="true" className="text-ink/20">&mdash;&mdash;&mdash;</span>
          <span className="font-display text-lg font-medium text-clinic">{locations.dubai.city}</span>
        </div>
      </section>

      {/* Intro */}
      <section className="border-y border-ink/10 bg-sand/60">
        <div className="mx-auto max-w-content px-5 py-14 md:px-8">
          <h2 className="max-w-lg font-display text-2xl font-semibold text-clinic-dark md:text-3xl">
            {t.home.introTitle}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink/70 md:text-base">
            {t.home.introBody}
          </p>
        </div>
      </section>

      {/* Services preview */}
      <section className="mx-auto max-w-content px-5 py-16 md:px-8">
        <div className="mb-8 max-w-lg">
          <h2 className="font-display text-2xl font-semibold text-clinic-dark md:text-3xl">
            {t.home.servicesTitle}
          </h2>
          <p className="mt-2 text-sm text-ink/60">{t.home.servicesSubtitle}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((item) => (
            <ServiceCard key={item.title} title={item.title} body={item.body} />
          ))}
        </div>
      </section>

      {/* Why us */}
      <section className="border-y border-ink/10 bg-clinic-dark text-base">
        <div className="mx-auto max-w-content px-5 py-16 md:px-8">
          <h2 className="font-display text-2xl font-semibold md:text-3xl">{t.home.whyTitle}</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {t.home.whyItems.map((item) => (
              <div key={item.title}>
                <h3 className="font-display text-lg font-medium text-gold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-base/80">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Locations preview */}
      <section className="mx-auto max-w-content px-5 py-16 md:px-8">
        <h2 className="mb-8 font-display text-2xl font-semibold text-clinic-dark md:text-3xl">
          {t.home.locationsTitle}
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <LocationCard data={locations.cairo} labels={t.locations} />
          <LocationCard data={locations.dubai} labels={t.locations} />
        </div>
      </section>

      {/* CTA banner */}
      <section className="mx-auto max-w-content px-5 pb-20 md:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-sand p-8 md:flex-row md:items-center md:p-12">
          <div>
            <h2 className="font-display text-xl font-semibold text-clinic-dark md:text-2xl">
              {t.home.ctaBannerTitle}
            </h2>
            <p className="mt-2 max-w-md text-sm text-ink/70">{t.home.ctaBannerBody}</p>
          </div>
          <Link
            href={`/${locale}/contact`}
            className="focus-ring shrink-0 rounded-full bg-clinic px-6 py-3 text-sm font-medium text-base transition-colors hover:bg-clinic-dark"
          >
            {t.home.ctaBannerButton}
          </Link>
        </div>
      </section>
    </>
  );
}
