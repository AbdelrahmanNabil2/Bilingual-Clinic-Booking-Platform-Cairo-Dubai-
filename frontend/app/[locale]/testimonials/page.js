import { getMessages } from '@/lib/getMessages';
import { getTestimonials } from '@/lib/api';
import ReviewForm from '@/components/ReviewForm';

export const dynamic = 'force-dynamic';

export default async function TestimonialsPage({ params }) {
  const t = getMessages(params.locale);
  const testimonials = (await getTestimonials(params.locale)) || t.testimonials.items;

  return (
    <div className="mx-auto max-w-content px-5 py-16 md:px-8">
      <p className="font-mono text-xs uppercase tracking-widest text-gold">{t.nav.testimonials}</p>
      <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold text-clinic-dark md:text-4xl">
        {t.testimonials.title}
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink/70">{t.testimonials.intro}</p>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {testimonials.map((item, i) => (
          <figure key={i} className="rounded-2xl border border-ink/10 bg-white/60 p-6">
            <blockquote className="font-display text-base leading-relaxed text-clinic-dark">
              &ldquo;{item.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-4 font-mono text-xs uppercase tracking-wider text-ink/40">
              {item.name}
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mx-auto mt-16 max-w-xl">
        <ReviewForm messages={t} />
      </div>
    </div>
  );
}
