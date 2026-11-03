export const VERSION_REGEX = /^\d+(\.\d+){0,2}$/;

export const isVersion = (value) => VERSION_REGEX.test(value || '');

const MAX_DIGITS = 9;

const digitsOf = (value) => value.replace(/\D/g, '').slice(0, MAX_DIGITS);

// "123" → "1.2.3": one digit for major and minor, the rest is the patch
const autoDot = (digits) => {
  const [major, minor, ...patch] = digits;
  return [major, minor, patch.join('')].filter(Boolean).join('.');
};

const sanitize = (raw) =>
  raw
    .replace(/^v/i, '')
    .replace(/[^\d.]/g, '')
    .replace(/\.{2,}/g, '.')
    .replace(/^\./, '')
    .split('.')
    .slice(0, 3)
    .join('.');

/**
 * Formats a version field while typing. Digits get dots added automatically; once the
 * user types or pastes a dot themselves (needed for 1.10.0), their dots are kept instead.
 */
export const formatVersionInput = (prev, raw, manual) => {
  const clean = sanitize(raw);
  if (!clean) return { value: '', manual: false };

  const typedDot = clean.length > prev.length && digitsOf(clean) === digitsOf(prev);
  const pastedDots = clean.length - prev.length > 1 && clean.includes('.');
  const isManual = manual || prev !== autoDot(digitsOf(prev)) || typedDot || pastedDots;

  return { value: isManual ? clean : autoDot(digitsOf(clean)), manual: isManual };
};

// "1.2" → "1.2.0", "01.2." → "1.2.0"
export const normalizeVersion = (value) => {
  const parts = sanitize(value).split('.').filter(Boolean).map(Number);
  if (!parts.length) return '';
  while (parts.length < 3) parts.push(0);
  return parts.join('.');
};

export const bumpVersion = (version, part) => {
  const [major, minor, patch] = normalizeVersion(version).split('.').map(Number);
  return part === 'minor' ? `${major}.${minor + 1}.0` : `${major}.${minor}.${patch + 1}`;
};

// Same text as cult-app (force-update-screen.tsx, soft-update-dialog.tsx). A custom message
// replaces the body on both screens.
export const APP_SCREENS = {
  force: {
    title: 'Time to update',
    body: 'This version of CULT is no longer supported. Please update to keep using the app.',
  },
  soft: {
    title: 'Update available',
    body: (latestVersion) => `Version ${latestVersion} is ready with new features and fixes.`,
  },
};

export const PLATFORM_META = {
  IOS: {
    label: 'iOS',
    icon: 'mdi:apple',
    store: 'App Store',
    storeRef: 'the App Store',
    storeIcon: 'hugeicons:app-store',
  },
  ANDROID: {
    label: 'Android',
    icon: 'mdi:android',
    store: 'Google Play',
    storeRef: 'Google Play',
    storeIcon: 'hugeicons:play-store',
  },
};

export const COLORS = {
  text: '#0F172A',
  border: '#E7E7E7',
  muted: '#F9FAFB',
  danger: '#DC2626',
  warning: '#FFAB00',
  success: '#22C55E',
};

export const ICONS = {
  minimum: 'hugeicons:unavailable',
  latest: 'hugeicons:sparkles',
  upToDate: 'solar:check-circle-bold',
  message: 'hugeicons:message-01',
  edit: 'hugeicons:pencil-edit-02',
  editor: 'solar:user-rounded-bold',
  syncOn: 'solar:refresh-circle-bold',
  syncOff: 'solar:danger-triangle-bold',
  warning: 'solar:danger-triangle-bold',
  store: 'hugeicons:arrow-up-right-01',
  saved: 'hugeicons:tick-02',
  lastSaved: 'hugeicons:clock-01',
  synced: 'hugeicons:refresh',
  quickSet: 'hugeicons:magic-wand-01',
  chevronDown: 'hugeicons:arrow-down-01',
};

export const TONES = {
  success: { color: COLORS.success, icon: 'solar:check-circle-bold' },
  warning: { color: COLORS.warning, icon: 'solar:danger-triangle-bold' },
  info: { color: '#1340FF', icon: 'solar:info-circle-bold' },
};

export const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Health check for a platform, shown in the tab dot and beside the "Versions" title.
 * `label` is the short pill text, `message` the full line, `fix` an optional one-click change.
 */
export const getPolicyStatus = (policy) => {
  const { store, storeRef } = PLATFORM_META[policy.platform];
  const latest = normalizeVersion(policy.latestVersion);
  const live = policy.storeVersion;

  if (!live) {
    return {
      tone: 'info',
      label: policy.storeSyncEnabled ? `${store} unreachable` : 'Not connected',
      message: policy.storeSyncEnabled
        ? `Couldn't read ${storeRef} right now. The saved versions still apply.`
        : `${capitalize(storeRef)} isn't connected. After each ${store} release, raise the latest version by hand.`,
    };
  }

  const gap = compareVersions(latest, live);
  if (gap > 0) {
    // Lowering latest below the minimum is not allowed, so no one-click fix then
    const canMatch = compareVersions(policy.minimumVersion, live) <= 0;
    return {
      tone: 'warning',
      label: `Ahead of ${store}`,
      message: `Latest (${latest}) is ahead of ${storeRef} (${live}). Prompted users can't find this update yet.`,
      ...(canMatch && { fix: { label: `Match ${store}`, latestVersion: live } }),
    };
  }
  if (gap < 0) {
    return {
      tone: 'warning',
      label: `Behind ${store}`,
      message: `${capitalize(storeRef)} has ${live}, but the latest version is ${latest}. Users on older versions get no prompt yet.`,
      fix: { label: `Match ${store}`, latestVersion: live },
    };
  }
  return {
    tone: 'success',
    label: `Matches ${store}`,
    message: `Latest matches ${storeRef} (${live}).`,
  };
};

// Lowest value latest can take: the store version when it is lower, else the saved latest
export const getLatestFloor = (policy) =>
  policy.storeVersion && compareVersions(policy.storeVersion, policy.latestVersion) < 0
    ? policy.storeVersion
    : policy.latestVersion;

const toParts = (version) => {
  const parts = String(version).split('.').map(Number);
  while (parts.length < 3) parts.push(0);
  return parts;
};

// Negative when a < b, zero when equal, positive when a > b (same rule as the backend)
export const compareVersions = (a, b) => {
  const left = toParts(a);
  const right = toParts(b);
  for (let i = 0; i < 3; i += 1) {
    if (left[i] !== right[i]) return left[i] - right[i];
  }
  return 0;
};
