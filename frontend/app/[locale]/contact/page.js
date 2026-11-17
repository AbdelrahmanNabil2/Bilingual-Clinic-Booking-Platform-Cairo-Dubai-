import { getMessages } from '@/lib/getMessages';
import ContactForm from '@/components/ContactForm';

export default function ContactPage({ params }) {
  const t = getMessages(params.locale);

  return (
    <div className="mx-auto max-w-content px-5 py-16 md:px-8">
      <p className="font-mono text-xs uppercase tracking-widest text-gold">{t.nav.contact}</p>
      <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold text-clinic-dark md:text-4xl">
        {t.contact.title}
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink/70">{t.contact.intro}</p>

      <div className="mt-12 grid gap-12 md:grid-cols-[1.2fr,1fr]">
        <ContactForm messages={t} />

        <div>
          <h2 className="font-display text-lg font-semibold text-clinic-dark">{t.contact.directTitle}</h2>
          <div className="mt-4 space-y-6">
            <div>
              <p className="font-medium text-clinic">{t.locations.cairo.city}</p>
              <p className="mt-1 font-mono text-sm text-ink/70">{t.locations.cairo.phone}</p>
              <p className="font-mono text-sm text-ink/70">{t.locations.cairo.email}</p>
            </div>
            <div>
              <p className="font-medium text-clinic">{t.locations.dubai.city}</p>
              <p className="mt-1 font-mono text-sm text-ink/70">{t.locations.dubai.phone}</p>
              <p className="font-mono text-sm text-ink/70">{t.locations.dubai.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
