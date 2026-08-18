/**
 * Decides whether a campaign form actually holds work worth keeping.
 *
 * Neither the autosave status nor React Hook Form's `isDirty` can answer this:
 * autosave writes a snapshot on mount, and MUI fields normalise their values as
 * they mount, so an untouched form reports "saved" and can report "dirty".
 *
 * So compare the real values against the form defaults, after stripping
 * everything empty. Seeded defaults such as `campaignDo: [{ value: '' }]`
 * collapse to `[]` on both sides and correctly count as nothing.
 */

const isFile = (value) => typeof File !== 'undefined' && value instanceof File;

/** Reduce a value to a comparable shape, or `undefined` when it carries nothing. */
function normalise(value) {
  if (value === null || value === undefined || value === '' || value === false) return undefined;

  if (isFile(value)) return `file:${value.name}:${value.size}`;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
  }

  if (Array.isArray(value)) {
    const items = value.map(normalise).filter((item) => item !== undefined);
    return items.length ? items : undefined;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([key, item]) => [key, normalise(item)])
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));
    return entries.length ? Object.fromEntries(entries) : undefined;
  }

  return value;
}

const stable = (value) => JSON.stringify(value ?? null);

/**
 * Field names whose value differs from the baseline. Empty means nothing to keep.
 *
 * Walks the DEFAULTS, not the values. The form also carries system-injected
 * fields the user never authors -- `campaignId` is stamped on by the general
 * info step from a server counter -- and those are absent from the defaults,
 * so walking the values would count every one of them as user content.
 */
export function diffUserContent(values, defaults) {
  if (!values || !defaults) return [];

  return Object.keys(defaults).filter((key) => {
    const value = normalise(values[key]);

    // An empty field is the absence of work, whatever the default happened to
    // be. Without this a stale draft that merely cleared a seeded default
    // (deliverables [] against ['UGC_VIDEOS']) reads as content on a form the
    // admin can see is blank.
    if (value === undefined) return false;

    return stable(value) !== stable(normalise(defaults[key]));
  });
}

export default function hasUserContent(values, defaults) {
  return diffUserContent(values, defaults).length > 0;
}
