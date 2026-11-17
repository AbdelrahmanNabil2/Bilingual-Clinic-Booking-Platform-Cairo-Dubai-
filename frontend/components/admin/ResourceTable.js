'use client';

import Link from 'next/link';

export default function ResourceTable({ resource, config, items, onDelete }) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-clinic-dark">{config.label}</h1>
        <Link
          href={`/admin/${resource}/new`}
          className="focus-ring rounded-full bg-clinic px-5 py-2 text-sm font-medium text-base transition-colors hover:bg-clinic-dark"
        >
          + New {config.singular}
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-ink/50">No {config.label.toLowerCase()} yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white/60">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase tracking-wider text-ink/40">
                {config.listColumns.map((col) => (
                  <th key={col.key} className="px-4 py-3 text-start font-medium">{col.label}</th>
                ))}
                <th className="px-4 py-3 text-end font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-ink/5 last:border-0">
                  {config.listColumns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-ink/80">
                      {col.type === 'boolean' ? (item[col.key] ? 'Yes' : 'No') : String(item[col.key] ?? '—')}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-end">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/admin/${resource}/${item.id}`}
                        className="focus-ring text-sm font-medium text-clinic hover:text-clinic-dark"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        className="focus-ring text-sm font-medium text-alert hover:opacity-80"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
