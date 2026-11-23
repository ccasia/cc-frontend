export const MAX_COUNT = 2_000_000_000;

export const METRIC_LABELS = {
  views: 'Views',
  likes: 'Likes',
  comments: 'Comments',
  shares: 'Shares',
  saved: 'Saves',
};

/** Counters the admin must enter: views always, the rest only when the scrape did not get them. */
export const missingFields = (partial, isInstagram) => {
  if (partial) return ['views'];
  return isInstagram ? ['views', 'likes', 'comments'] : ['views', 'likes', 'comments', 'shares'];
};

/** Counters a scraped post shows as 0 or not at all. Saves are shown for Instagram only. */
export const zeroFields = (counts, isInstagram) =>
  ['views', 'likes', 'comments', 'shares', ...(isInstagram ? ['saved'] : [])].filter(
    (field) => !counts?.[field]
  );

/** The same rule the backend stores: (likes + comments + shares + saves) / views. */
export const scrapeEngagementRate = ({ views, likes, comments, shares, saved }) => {
  if (!views) return null;
  return (((likes ?? 0) + (comments ?? 0) + (shares ?? 0) + (saved ?? 0)) / views) * 100;
};
