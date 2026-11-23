import { cleanLabel, groupFields } from 'src/sections/insight-ocr/constants';

// Capitalizes the first letter of each word: "avg. watch time" -> "Avg. Watch Time".
export const toTitleCase = (text = '') =>
  text.replace(/(^|\s)(\S)/g, (_, space, letter) => space + letter.toUpperCase());

const GROUP_TITLES = { Summary: 'Performance' };
const GROUP_ICONS = {
  Summary: 'solar:eye-linear',
  Interactions: 'solar:heart-linear',
  'What impacts views': 'solar:graph-up-linear',
  'Sources of views': 'solar:share-circle-linear',
  'Search queries': 'solar:magnifer-linear',
  'Who viewed': 'solar:users-group-rounded-linear',
  Age: 'solar:calendar-linear',
  Country: 'solar:globe-linear',
  Gender: 'solar:user-linear',
  Other: 'solar:list-linear',
};
const SHORT_LABELS = {
  avg_watch_time: 'Avg. Watch Time',
  total_play_time: 'Total Play Time',
  full_watch_rate: 'Watched Full Video',
  new_viewers_pct: 'New Viewers',
  returning_viewers_pct: 'Returning Viewers',
  profile_visits: 'Profile Visits',
  followers_pct: 'Followers',
  non_followers_pct: 'Non-followers',
};
export const groupTitle = (label, platform) =>
  toTitleCase(platform?.groupTitles?.[label] ?? GROUP_TITLES[label] ?? label);
export const groupIcon = (label) => GROUP_ICONS[label] ?? 'solar:list-linear';
export const fieldLabel = (field) => SHORT_LABELS[field.key] ?? field.label;

// One post is on one platform. Its screenshots must come from the same app.
export const PLATFORMS = {
  instagram: {
    name: 'Instagram',
    icon: 'prime:instagram',
    tabs: 'Overview, Engagement and Audience tabs',
  },
  tiktok: {
    name: 'TikTok',
    icon: 'prime:tiktok',
    tabs: 'Overview, Viewers and Engagement tabs',
    // The section names TikTok Studio shows.
    groupTitles: {
      Summary: 'Key metrics',
      Interactions: 'Engagement',
      'Sources of views': 'Traffic sources',
      'Who viewed': 'Viewer types',
      Country: 'Locations',
    },
    // TikTok shows "Watched full video" inside Key metrics, not in its own section.
    ratesInSummary: true,
  },
};

export const groupPlatformFields = (fields, platform) => {
  const groups = groupFields(fields);
  if (!platform?.ratesInSummary) return groups;

  const rates = groups.find((group) => group.label === 'What impacts views');
  if (!rates) return groups;

  const hasSummary = groups.some((group) => group.label === 'Summary');
  return groups
    .filter((group) => group !== rates || !hasSummary)
    .map((group) => {
      if (group.label === 'Summary')
        return { ...group, fields: [...group.fields, ...rates.fields] };
      if (group === rates) return { ...group, label: 'Summary', variant: 'tile' };
      return group;
    });
};

export const postPlatform = (postUrl = '') => {
  if (/instagram\.com|instagr\.am/i.test(postUrl)) return PLATFORMS.instagram;
  if (/tiktok\.com/i.test(postUrl)) return PLATFORMS.tiktok;
  return null;
};

// TikTok shows durations as "16h:48m:08s". We show "16h 48m 08s".
export const formatDuration = (value = '') => value.replace(/(\d[hm])\s*:\s*/gi, '$1 ');

export const HIGHLIGHT_KEYS = ['views', 'likes', 'comments', 'shares', 'saves'];

// Search queries are what people typed, so they keep their exact case ("wall e", not "Wall E").
const isTypedText = (key) => key.startsWith('search_query_');

const displayLabel = (field) => {
  const label = cleanLabel(field.label);
  return isTypedText(field.key) ? label : toTitleCase(label);
};

// One field per key, in screenshot order, with the label and text as shown on screen.
export const toDisplayFields = (row) => {
  const byKey = new Map();
  (row?.screenshots ?? []).forEach((screenshot) =>
    screenshot.fields?.forEach((field) => {
      if (!byKey.has(field.key)) byKey.set(field.key, { ...field, label: displayLabel(field) });
    })
  );
  return [...byKey.values()];
};

export const countUnread = (row) => (row?.screenshots ?? []).filter((s) => s.error).length;

// Screenshots saved before uploaders were tracked belong to the record's creator.
export const screenshotUploader = (screenshot, row) =>
  screenshot.uploadedBy ?? row?.createdBy ?? null;

export const uploaderNames = (row) => [
  ...new Set((row?.screenshots ?? []).map((s) => screenshotUploader(s, row)?.name).filter(Boolean)),
];

export const lastAddedAt = (row) =>
  (row?.screenshots ?? [])
    .map((s) => s.uploadedAt)
    .filter(Boolean)
    .sort()
    .pop() ?? row?.createdAt;

export const joinNames = (names) =>
  names.length > 1
    ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
    : (names[0] ?? '');
