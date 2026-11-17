'use client';

import { useEffect, useState } from 'react';
import { ADMIN_RESOURCES } from '@/lib/adminResources';
import { listResource, deleteResource } from '@/lib/adminApi';
import ResourceTable from '@/components/admin/ResourceTable';

export default function ResourceListPage({ params }) {
  const { resource } = params;
  const config = ADMIN_RESOURCES[resource];
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!config) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource]);

  function load() {
    setLoading(true);
    listResource(resource)
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  if (!config) return <p className="text-sm text-alert">Unknown resource: {resource}</p>;

  async function handleDelete(id) {
    if (!confirm(`Delete this ${config.singular.toLowerCase()}? This can't be undone.`)) return;
    try {
      await deleteResource(resource, id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      alert(e.message);
    }
  }

  if (loading) return <p className="text-sm text-ink/50">Loading…</p>;
  if (error) return <p className="text-sm text-alert">{error}</p>;

  return <ResourceTable resource={resource} config={config} items={items} onDelete={handleDelete} />;
}
