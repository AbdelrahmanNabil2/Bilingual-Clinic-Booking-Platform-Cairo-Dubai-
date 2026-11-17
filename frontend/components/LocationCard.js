import MapEmbed from './MapEmbed';

export default function LocationCard({ data, labels }) {
  const mapQuery = encodeURIComponent(`${data.addressLine1}, ${data.addressLine2}`);
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  return (
    <div className="route-thread overflow-hidden rounded-2xl border border-ink/10 bg-white/60">
      <div className="h-40 w-full">
        <MapEmbed lat={data.latitude} lng={data.longitude} label={data.city} />
      </div>

      <div className="border-b border-ink/10 p-6">
        <p className="font-mono text-xs uppercase tracking-wider text-gold">{data.country}</p>
        <h3 className="mt-1 font-display text-2xl font-semibold text-clinic-dark">{data.city}</h3>
      </div>

      <div className="space-y-3 p-6 text-sm text-ink/75">
        <p>{data.addressLine1}{data.addressLine2 ? <><br />{data.addressLine2}</> : null}</p>

        <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-2 pt-2 font-mono text-xs">
          <span className="text-ink/40">{labels.callLabel}</span>
          <span>{data.phone}</span>
          <span className="text-ink/40">{labels.emailLabel}</span>
          <span className="break-all">{data.email}</span>
          <span className="text-ink/40">{labels.hoursLabel}</span>
          <span>{data.hours}</span>
        </div>

        <a
          href={mapHref}
          target="_blank"
          rel="noreferrer"
          className="focus-ring mt-2 inline-block rounded-full border border-clinic px-4 py-2 text-sm font-medium text-clinic transition-colors hover:bg-clinic hover:text-base"
        >
          {labels.getDirections}
        </a>
      </div>
    </div>
  );
}
