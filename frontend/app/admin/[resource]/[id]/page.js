'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ADMIN_RESOURCES } from '@/lib/adminResources';
import { getResource, updateResource, deleteResource } from '@/lib/adminApi';
import ResourceForm from '@/components/admin/ResourceForm';

export default function EditResourcePage({ params }) {
  const { resource, id } = params;
  const config = ADMIN_RESOURCES[resource];
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!config) return;
    getResource(resource, id)
      .then(setItem)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource, id]);

  if (!config) return <p className="text-sm text-alert">Unknown resource: {resource}</p>;
  if (loading) return <p className="text-sm text-ink/50">Loading…</p>;
  if (error && !item) return <p className="text-sm text-alert">{error}</p>;

  async function handleSubmit(values) {
    setSubmitting(true);
    setError('');
    try {
      await updateResource(resource, id, values);
      router.push(`/admin/${resource}`);
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete this ${config.singular.toLowerCase()}? This can't be undone.`)) return;
    try {
      await deleteResource(resource, id);
      router.push(`/admin/${resource}`);
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-clinic-dark">Edit {config.singular}</h1>
        <button
          type="button"
          onClick={handleDelete}
          className="focus-ring text-sm font-medium text-alert hover:opacity-80"
        >
          Delete
        </button>
      </div>
      <ResourceForm
        config={config}
        initialValues={item}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
        error={error}
        submitting={submitting}
      />
    </div>
  );
}
