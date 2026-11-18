export const MAX_SCREENSHOTS = 10;

export const ACCENT = '#1340FF';
export const BOX_COLOR = '#22C55E';
export const BOX_ACTIVE_COLOR = '#FFAB00';
export const BORDER = '1px solid #E7E7E7';

export const METRIC_ICONS = {
  likes: 'solar:heart-linear',
  comments: 'solar:chat-round-linear',
  reposts: 'mingcute:repeat-line',
  shares: 'mingcute:send-plane-line',
  saves: 'solar:bookmark-linear',
  profile_visits: 'solar:user-circle-linear',
  follows: 'solar:user-plus-linear',
};

const inList = (list) => (key) => list.includes(key);

// variant: 'tile' = big number, 'icon' = row with icon, 'bar' = percentage bar, 'row' = plain row
const GROUPS = [
  {
    label: 'Summary',
    variant: 'tile',
    match: inList(['views', 'viewers', 'avg_watch_time', 'total_play_time', 'follows']),
  },
  { label: 'Interactions', variant: 'icon', match: (key) => key in METRIC_ICONS },
  { label: 'What impacts views', variant: 'row', match: (key) => key.endsWith('_rate') },
  { label: 'Sources of views', variant: 'bar', match: (key) => key.startsWith('source_') },
  { label: 'Search queries', variant: 'bar', match: (key) => key.startsWith('search_query_') },
  {
    label: 'Who viewed',
    variant: 'bar',
    match: (key) => key.endsWith('followers_pct') || key.endsWith('viewers_pct'),
  },
  { label: 'Age', variant: 'bar', match: (key) => key.startsWith('age_') },
  { label: 'Country', variant: 'bar', match: (key) => key.startsWith('country_') },
  { label: 'Gender', variant: 'bar', match: (key) => key.startsWith('gender_') },
  { label: 'Other', variant: 'row', match: () => true },
];

export const groupFields = (fields) =>
  GROUPS.map(({ label, variant }, i) => ({
    label,
    variant,
    fields: fields.filter((field) => GROUPS.findIndex((g) => g.match(field.key)) === i),
  })).filter((group) => group.fields.length);

export const cleanLabel = (label) => label.replace(/\s*\(icon\)$/i, '');

export const combineFields = (items, resultsById) => {
  const byKey = new Map();

  items.forEach((item) =>
    resultsById[item.id]?.data?.fields?.forEach((field) => {
      const source = {
        itemId: item.id,
        fileName: item.file.name,
        value: field.value,
        hasBox: !!field.box,
      };
      const existing = byKey.get(field.key);

      if (existing) {
        existing.sources.push(source);
        if (existing.number !== field.number) existing.conflict = true;
        return;
      }

      byKey.set(field.key, {
        key: field.key,
        label: cleanLabel(field.label),
        value: field.value,
        number: field.number,
        sources: [source],
        conflict: false,
      });
    })
  );

  return [...byKey.values()];
};

export const BOX_PADDING = 4;

export const toBoxStyle = ([ymin, xmin, ymax, xmax], pad = 0) => ({
  top: `calc(${ymin / 10}% - ${pad}px)`,
  left: `calc(${xmin / 10}% - ${pad}px)`,
  width: `calc(${(xmax - xmin) / 10}% + ${pad * 2}px)`,
  height: `calc(${(ymax - ymin) / 10}% + ${pad * 2}px)`,
});

export const formatUsd = (value) => `$${value.toFixed(4)}`;

export const truncateMiddle = (text, max) => {
  if (text.length <= max) return text;
  const side = Math.floor((max - 1) / 2);
  return `${text.slice(0, side)}…${text.slice(-side)}`;
};
