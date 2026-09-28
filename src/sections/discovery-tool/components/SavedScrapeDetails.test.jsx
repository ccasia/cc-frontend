import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import SavedScrapeDetails from './SavedScrapeDetails';

it('shows recorded post data, missing counters, and separate excluded posts', () => {
  render(<SavedScrapeDetails data={{ connected: true, scrapeDetails: {
    engagementRate: 7.55, scrapedAt: '2026-09-01', formulaVersion: 'instagram_recent_10_median_view_v2',
    selectedPosts: [{ postId: 'one', caption: 'Saved #caption', postUrl: 'https://www.instagram.com/p/one',
      publishedAt: '2026-08-01', likes: 0, comments: 2, views: 100, saves: null, shares: null }],
    candidatePosts: [{ postId: 'two', usedInSample: false, rejectedReason: 'PINNED', likes: 7 }],
  } }} />);
  expect(screen.getAllByText('Saved #caption')[0]).toBeInTheDocument();
  expect(screen.getByText('Excluded posts (1)')).toBeInTheDocument();
  expect(screen.getByText('PINNED')).toBeInTheDocument();
  expect(screen.getByText(/separate from connected account metrics/i)).toBeInTheDocument();
  expect(screen.getAllByText('—').length).toBeGreaterThan(0);
});
