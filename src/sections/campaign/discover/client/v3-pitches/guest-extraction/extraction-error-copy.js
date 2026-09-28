/**
 * Admin-facing text for a fetch that did not produce a rate.
 *
 * The backend `failureMessage` is written for logs and can carry raw provider
 * text such as `no_items: Empty or private data for provided input`. The UI
 * reads the failure code and shows this copy instead.
 */

const SAMPLE_SIZE = 10;

const GENERIC_FAILURE = 'Could not fetch this profile right now. Try again, or enter the numbers by hand.';

const FAILURE_COPY = {
  PRIVATE_PROFILE: 'This account is private. Enter the numbers by hand.',
  PROFILE_NOT_FOUND: 'We could not find this account. Check the link.',
};

export function insufficientDataCopy(row) {
  const found = row?.sampleSize;
  const count = found == null ? '' : ` (found ${found} of ${SAMPLE_SIZE})`;
  if (row?.platform === 'tiktok') {
    return `Not enough usable videos${count}. Likes may be hidden, or recent videos are ads or reposts. Enter the rate by hand.`;
  }
  return `Not enough usable Reels${count}. Likes may be hidden, or recent posts are photos, carousels, or paid partnerships. Enter the rate by hand.`;
}

/** Copy for one failure code. Also used on a saved pitch, which has no count. */
export function failureCodeCopy(code, platform) {
  if (code === 'INSUFFICIENT_DATA') return insufficientDataCopy({ platform });
  return FAILURE_COPY[code] ?? GENERIC_FAILURE;
}

/**
 * One short line for a saved pitch, shown under a "Couldn't fetch" title next
 * to an action button. The button says what to do, so this only says why.
 */
const SHORT_REASON = {
  PRIVATE_PROFILE: 'This account is private.',
  PROFILE_NOT_FOUND: 'This account could not be found.',
  CANCELLED: 'The fetch was stopped before it finished.',
  STALE: 'The fetch was stopped before it finished.',
};

export function failureReasonShort(code, platform) {
  if (code === 'INSUFFICIENT_DATA') {
    return platform === 'tiktok'
      ? 'Fewer than 10 videos with public stats.'
      : 'Fewer than 10 Reels with public likes and views.';
  }
  return SHORT_REASON[code] ?? 'The profile could not be read right now.';
}

/**
 * The full explanation, for the manual entry dialog.
 *
 * A saved pitch keeps only the failure code, not which rule each post broke,
 * so an insufficient-data failure lists the likely causes rather than naming
 * one. The rules they describe are in the backend's validPostPolicy.ts.
 */
const DETAILS = {
  INSUFFICIENT_DATA: {
    instagram: {
      title: 'Not enough usable Reels',
      intro: 'We need 10 recent Reels that show likes, comments, and views. Common causes:',
      reasons: [
        'Like counts are hidden',
        'Mostly photos or carousels, which have no views',
        'Recent Reels are paid partnerships, pinned, or collabs posted by another account',
      ],
    },
    tiktok: {
      title: 'Not enough usable videos',
      intro: 'We need 10 recent videos that show likes, comments, shares, and views. Common causes:',
      reasons: [
        'Like counts are hidden',
        'Fewer than 10 videos posted',
        'Recent videos are ads, pinned, or reposts',
      ],
    },
  },
  PRIVATE_PROFILE: {
    title: 'This account is private',
    intro: 'We cannot read posts on a private account.',
    reasons: [],
  },
  PROFILE_NOT_FOUND: {
    title: 'Account not found',
    intro: 'No account is at this link. Common causes:',
    reasons: ['The username changed', 'The account was deleted or deactivated'],
  },
};

// Not a platform problem: the fetch never got to read the profile.
const STOPPED_DETAILS = {
  title: 'Fetch stopped',
  intro: 'The fetch was stopped before it finished, so no numbers were read.',
  reasons: [],
};
DETAILS.CANCELLED = STOPPED_DETAILS;
DETAILS.STALE = STOPPED_DETAILS;

const GENERIC_DETAILS = {
  title: 'We could not read this profile',
  intro: 'The fetch did not finish. Common causes:',
  reasons: ['The platform blocked the request for a short time', 'The fetch took too long'],
};

export function failureDetails(code, platform) {
  const entry = DETAILS[code];
  if (!entry) return GENERIC_DETAILS;
  if (entry.instagram) return platform === 'tiktok' ? entry.tiktok : entry.instagram;
  return entry;
}

/** Two or three words for a narrow table cell. The tooltip carries the rest. */
export function failureLabelShort(code, platform) {
  if (code === 'INSUFFICIENT_DATA') return platform === 'tiktok' ? 'Too few videos' : 'Too few Reels';
  if (code === 'PRIVATE_PROFILE') return 'Private account';
  if (code === 'PROFILE_NOT_FOUND') return 'Not found';
  if (code === 'CANCELLED' || code === 'STALE') return 'Fetch stopped';
  return 'Fetch failed';
}

/**
 * Copy for a row's fetch failure or fallback reason. Empty when there is none.
 *
 * A start-request error keeps its backend message, which is written for the
 * admin. A run failure gets generic copy, because its message can carry raw
 * provider text.
 */
export function extractionErrorCopy(row) {
  const code = row?.fallbackReason ?? row?.error?.code;
  if (code === 'INSUFFICIENT_DATA') return insufficientDataCopy(row);
  if (FAILURE_COPY[code]) return FAILURE_COPY[code];
  if (!row?.error) return '';
  if (row.error.source === 'request' && row.error.message) return row.error.message;
  return GENERIC_FAILURE;
}
