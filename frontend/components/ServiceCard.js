export default function ServiceCard({ title, body }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white/60 p-6 transition-shadow hover:shadow-md">
      <h3 className="font-display text-lg font-semibold text-clinic-dark">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink/70">{body}</p>
    </div>
  );
}
