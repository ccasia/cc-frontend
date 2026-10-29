/** The backend stops the daily retry after this many failed days in a row (MAX_FAILED_SCRAPE_DAYS). */
const RETRY_DAYS = 3;

const BY_HAND = 'Open the post and enter the views, likes and comments by hand.';
const RETRY =
  'We will try again tonight while the campaign is running, up to 3 days in a row. You can also enter the views, likes and comments by hand.';

const COPY = {
  HIDDEN: {
    headline: 'Cannot open this post',
    message:
      'This post may be private, deleted, or age-restricted. Ask the creator to check the link, or enter the views, likes and comments by hand.',
  },
  LIKES_HIDDEN: {
    headline: 'Likes are hidden on this post',
    message:
      'Instagram did not show the likes or comments for this post. This usually means the creator turned on "Hide like counts". Ask the creator for an Insights screenshot, then enter the numbers by hand.',
  },
  TIKTOK_COUNTS_MISSING: {
    headline: 'TikTok did not show the numbers',
    message:
      'TikTok did not show the views, likes or comments for this post. This can happen when a post is new or under review.',
    retry: true,
  },
  PAGE_ERROR: {
    headline: 'Post did not load',
    message: 'The post page did not load correctly. This is usually temporary.',
    retry: true,
  },
  REEL_VIEWS_NOT_FOUND: {
    headline: 'Views not found',
    message: 'Instagram did not show the views for this Reel. Open the Reel and enter the views by hand.',
  },
  TIMED_OUT: { headline: 'Check took too long', message: 'The post took too long to load.', retry: true },
  JOB_FAILED: { headline: 'Check did not finish', message: 'Something went wrong while we checked this post.', retry: true },
  START_AMBIGUOUS: { headline: 'Check did not start', message: 'We could not start the check for this post.', retry: true },
  ERROR: { headline: 'Check was stopped', message: 'The check stopped before it finished.', retry: true },
  FALLBACK: { headline: 'Could not check this post', message: 'Something went wrong while we checked this post.', retry: true },
};

const HIDDEN_REASON =
  /PRIVATE_PROFILE|PROFILE_NOT_FOUND|private|dead[_ -]?page|login|restricted|audiences|not[_ -]?found|does not exist|unavailable/i;

const copyFor = (failure) => {
  if (failure?.code === 'PARSE_FAILED') {
    const reason = failure.message || '';
    if (HIDDEN_REASON.test(reason)) return COPY.HIDDEN;
    if (/no readable counters/i.test(reason)) {
      return /instagram/i.test(reason) ? COPY.LIKES_HIDDEN : COPY.TIKTOK_COUNTS_MISSING;
    }
    return COPY.PAGE_ERROR;
  }
  return COPY[failure?.code] || COPY.FALLBACK;
};

export const scrapeFailureHeadline = (failure) => copyFor(failure).headline;

export const scrapeFailureMessage = (failure) => {
  const { message, retry } = copyFor(failure);
  if (!retry) return message;
  return `${message} ${(failure?.streak ?? 1) < RETRY_DAYS ? RETRY : BY_HAND}`;
};
