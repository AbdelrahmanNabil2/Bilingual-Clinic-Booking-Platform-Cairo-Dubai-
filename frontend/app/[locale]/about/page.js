import { getMessages } from '@/lib/getMessages';

export default function AboutPage({ params }) {
  const t = getMessages(params.locale);

  return (
    <div className="mx-auto max-w-content px-5 py-16 md:px-8">
      <p className="font-mono text-xs uppercase tracking-widest text-gold">{t.nav.about}</p>
      <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold text-clinic-dark md:text-4xl">
        {t.about.title}
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink/70">{t.about.intro}</p>

      <div className="mt-14 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="font-display text-xl font-semibold text-clinic-dark">{t.about.missionTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink/70">{t.about.missionBody}</p>
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold text-clinic-dark">{t.about.valuesTitle}</h2>
          <ul className="mt-3 space-y-4">
            {t.about.values.map((v) => (
              <li key={v.title}>
                <p className="text-sm font-medium text-clinic">{v.title}</p>
                <p className="text-sm leading-relaxed text-ink/70">{v.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
