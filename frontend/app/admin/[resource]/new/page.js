'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ADMIN_RESOURCES } from '@/lib/adminResources';
import { createResource } from '@/lib/adminApi';
import ResourceForm from '@/components/admin/ResourceForm';

export default function NewResourcePage({ params }) {
  const { resource } = params;
  const config = ADMIN_RESOURCES[resource];
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!config) return <p className="text-sm text-alert">Unknown resource: {resource}</p>;

  async function handleSubmit(values) {
    setSubmitting(true);
    setError('');
    try {
      await createResource(resource, values);
      router.push(`/admin/${resource}`);
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-display text-2xl font-semibold text-clinic-dark">New {config.singular}</h1>
      <ResourceForm config={config} onSubmit={handleSubmit} submitLabel="Create" error={error} submitting={submitting} />
    </div>
  );
}
