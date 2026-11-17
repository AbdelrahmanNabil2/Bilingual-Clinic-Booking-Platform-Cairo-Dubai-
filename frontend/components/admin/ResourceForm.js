'use client';

import { useEffect, useState } from 'react';
import { listResource, uploadFile } from '@/lib/adminApi';

export default function ResourceForm({ config, initialValues, onSubmit, submitLabel, error, submitting }) {
  const [values, setValues] = useState(() => {
    const defaults = {};
    config.fields.forEach((f) => {
      defaults[f.key] = initialValues?.[f.key] ?? f.default ?? (f.type === 'checkbox' ? false : '');
    });
    return defaults;
  });
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    if (config.fields.some((f) => f.type === 'location-select')) {
      listResource('locations').then(setLocations).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(key, value) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const sanitized = { ...values };
    config.fields.forEach((f) => {
      if ((f.type === 'number' || f.type === 'location-select') && sanitized[f.key] === '') {
        sanitized[f.key] = null;
      }
    });
    onSubmit(sanitized);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {config.fields.map((field) => (
        <FieldInput
          key={field.key}
          field={field}
          value={values[field.key]}
          onChange={(v) => update(field.key, v)}
          locations={locations}
        />
      ))}

      <button
        type="submit"
        disabled={submitting}
        className="focus-ring rounded-full bg-clinic px-6 py-3 text-sm font-medium text-base transition-colors hover:bg-clinic-dark disabled:opacity-60"
      >
        {submitting ? 'Saving…' : submitLabel}
      </button>

      {error && <p role="alert" className="text-sm font-medium text-alert">{error}</p>}
    </form>
  );
}

function FieldInput({ field, value, onChange, locations }) {
  const label = (
    <span className="mb-1.5 block text-sm font-medium text-ink/80">
      {field.label}
      {field.required && <span className="text-alert"> *</span>}
    </span>
  );

  if (field.type === 'textarea') {
    return (
      <label className="block">
        {label}
        <textarea
          required={field.required}
          rows={field.rows || 4}
          dir={field.dir}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="focus-ring w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm"
        />
        {field.help && <span className="mt-1 block text-xs text-ink/40">{field.help}</span>}
      </label>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="focus-ring h-4 w-4 rounded border-ink/30"
        />
        <span className="text-sm font-medium text-ink/80">{field.label}</span>
      </label>
    );
  }

  if (field.type === 'number') {
    return (
      <label className="block">
        {label}
        <input
          type="number"
          step="any"
          required={field.required}
          value={value}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          className="focus-ring w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm"
        />
      </label>
    );
  }

  if (field.type === 'date') {
    return (
      <label className="block">
        {label}
        <input
          type="date"
          required={field.required}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="focus-ring w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm"
        />
      </label>
    );
  }

  if (field.type === 'image') {
    return <ImageField field={field} value={value} onChange={onChange} label={label} />;
  }

  if (field.type === 'location-select') {
    return (
      <label className="block">
        {label}
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          className="focus-ring w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm"
        >
          <option value="">— None —</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.city_en} ({loc.slug})
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="block">
      {label}
      <input
        type="text"
        required={field.required}
        dir={field.dir}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="focus-ring w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm"
      />
      {field.help && <span className="mt-1 block text-xs text-ink/40">{field.help}</span>}
    </label>
  );
}

function ImageField({ field, value, onChange, label }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const url = await uploadFile(file);
      onChange(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {label}
      <div className="flex items-center gap-4">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-16 w-16 rounded-lg object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-sand text-xs text-ink/40">
            None
          </div>
        )}
        <div className="flex-1">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFile}
            disabled={uploading}
            className="focus-ring block w-full text-sm text-ink/70 file:mr-3 file:rounded-full file:border-0 file:bg-clinic file:px-4 file:py-2 file:text-sm file:font-medium file:text-base"
          />
          {uploading && <p className="mt-1 text-xs text-ink/40">Uploading…</p>}
          {error && <p className="mt-1 text-xs text-alert">{error}</p>}
          {value && (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="focus-ring mt-2 w-full rounded-lg border border-ink/15 bg-white px-3 py-1.5 text-xs text-ink/60"
            />
          )}
        </div>
      </div>
    </div>
  );
}
