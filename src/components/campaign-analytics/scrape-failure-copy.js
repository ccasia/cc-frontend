/** Short titles for a failed post scrape, by `metricsScrapeFailure.code`. */
const HEADLINES = {
  REEL_VIEWS_NOT_FOUND: 'Views not found',
  PARSE_FAILED: 'No metrics returned',
  JOB_FAILED: 'Scrape job failed',
  TIMED_OUT: 'Scrape timed out',
  START_AMBIGUOUS: 'Scrape did not start',
};

export const scrapeFailureHeadline = (failure) => HEADLINES[failure?.code] || 'Scrape failed';

export const scrapeFailureMessage = (failure) => failure?.message || 'No reason was recorded.';
