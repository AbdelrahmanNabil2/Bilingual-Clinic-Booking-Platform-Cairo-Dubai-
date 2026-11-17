'use client';

import dynamic from 'next/dynamic';

const MapEmbedInner = dynamic(() => import('./MapEmbedInner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-sand font-mono text-xs uppercase tracking-wider text-ink/40">
      Map
    </div>
  )
});

export default function MapEmbed({ lat, lng, label }) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  return <MapEmbedInner lat={lat} lng={lng} label={label} />;
}
