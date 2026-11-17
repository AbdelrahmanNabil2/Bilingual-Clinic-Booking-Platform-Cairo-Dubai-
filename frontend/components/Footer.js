import Link from 'next/link';
import NewsletterForm from './NewsletterForm';

export default function Footer({ locale, messages }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-ink/10 bg-sand">
      <div className="mx-auto grid max-w-content gap-10 px-5 py-14 md:grid-cols-4 md:px-8">
        <div>
          <p className="font-display text-lg font-semibold text-clinic">{messages.meta.siteName}</p>
          <p className="mt-2 max-w-xs text-sm text-ink/70">{messages.meta.tagline}</p>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-ink/50">{messages.footer.quickLinks}</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="focus-ring rounded text-ink/80 hover:text-clinic" href={`/${locale}/about`}>{messages.nav.about}</Link></li>
            <li><Link className="focus-ring rounded text-ink/80 hover:text-clinic" href={`/${locale}/services`}>{messages.nav.services}</Link></li>
            <li><Link className="focus-ring rounded text-ink/80 hover:text-clinic" href={`/${locale}/locations`}>{messages.nav.locations}</Link></li>
            <li><Link className="focus-ring rounded text-ink/80 hover:text-clinic" href={`/${locale}/contact`}>{messages.nav.contact}</Link></li>
          </ul>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-ink/50">{messages.footer.getInTouch}</p>
          <ul className="mt-3 space-y-2 text-sm text-ink/80">
            <li>{messages.locations.cairo.city}: {messages.locations.cairo.phone}</li>
            <li>{messages.locations.dubai.city}: {messages.locations.dubai.phone}</li>
          </ul>
          <ul className="mt-4 space-y-2 text-xs text-ink/50">
            <li><Link className="focus-ring rounded hover:text-clinic" href={`/${locale}/privacy`}>{messages.legal.privacyTitle}</Link></li>
            <li><Link className="focus-ring rounded hover:text-clinic" href={`/${locale}/terms`}>{messages.legal.termsTitle}</Link></li>
          </ul>
        </div>

        <NewsletterForm locale={locale} messages={messages} />
      </div>

      <div className="border-t border-ink/10 px-5 py-5 text-center text-xs text-ink/50 md:px-8">
        &copy; {year} {messages.meta.siteName}. {messages.footer.rights}
      </div>
    </footer>
  );
}
