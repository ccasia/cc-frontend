import { it, expect, describe } from 'vitest';
import { render, screen } from '@testing-library/react';

import EngagementBreakdown, { medianOf, describeFormula, shortDate } from './engagement-breakdown';
import { embedFromPostUrl } from './post-thumb-url';

/** v1 TikTok evidence: each post carried its own rate. */
const TIKTOK_V1_POSTS = [
  {
    postId: '1',
    publishedAt: '2026-08-28T11:02:13.000Z',
    likes: 5210,
    comments: 118,
    shares: 402,
    views: 210430,
    ratePercent: 2.723,
  },
  {
    postId: '2',
    publishedAt: '2026-08-24T07:41:55.000Z',
    likes: 980,
    comments: 33,
    shares: 51,
    views: 12040,
    ratePercent: 8.8372,
  },
];

const INSTAGRAM_V1_POSTS = [
  {
    postId: '1',
    publishedAt: '2026-08-30T09:12:44.000Z',
    likes: 8123,
    comments: 214,
    shares: null,
    views: 91234,
    ratePercent: null,
  },
];

/** v2 evidence: no per-post rate, and saves ride along when reported. */
const v2Post = (over) => ({
  postId: '1',
  postUrl: 'https://www.instagram.com/p/Dbh16BqzcSb/',
  publishedAt: '2026-08-28T11:02:13.000Z',
  likes: 5210,
  comments: 118,
  shares: 402,
  saves: 270,
  views: 300000,
  caption: 'Behind the scenes with our creator community.',
  ratePercent: null,
  ...over,
});

const TIKTOK_V2_POSTS = [
  v2Post({ postId: '1', views: 100000 }),
  v2Post({ postId: '2', views: 200000 }),
  v2Post({ postId: '3', views: 300000 }),
  v2Post({ postId: '4', views: 400000 }),
];

describe('the v2 breakdown', () => {
  const renderV2 = (posts, version = 'tiktok_recent_10_median_view_v2') =>
    render(<EngagementBreakdown posts={posts} formulaVersion={version} engagementRate="3.00" />);

  it('explains the TikTok formula', () => {
    expect(describeFormula('tiktok_recent_10_median_view_v2')).toEqual({
      title: 'TikTok, 10 most recent posts',
      formula: '100 × (mean of likes + comments + saves + shares) ÷ median views',
      denominator: 'medianViews',
    });
  });

  it('shows the views column even though no post has its own rate', () => {
    renderV2(TIKTOK_V2_POSTS);
    // v2 divides by views, so hiding them would hide the denominator.
    expect(screen.getByText('Views')).toBeInTheDocument();
    expect(screen.queryByText('Rate')).toBeNull();
  });

  it('shows a saves column when the source reported saves', () => {
    renderV2(TIKTOK_V2_POSTS);
    expect(screen.getByText('Saves')).toBeInTheDocument();
    expect(screen.getAllByText('270')).toHaveLength(TIKTOK_V2_POSTS.length);
    expect(screen.queryByText(/Saves are not reported/)).toBeNull();
  });

  it('says so when the source reported no saves', () => {
    renderV2(TIKTOK_V2_POSTS.map((post) => ({ ...post, saves: null })));
    expect(screen.queryByText('Saves')).toBeNull();
    expect(screen.getByText(/Saves are not reported by this source/)).toBeInTheDocument();
  });

  it('shows the mean and the median that produced the rate', () => {
    renderV2(TIKTOK_V2_POSTS);
    // 5210 + 118 + 270 + 402 = 6000 on every post.
    expect(screen.getByText('Average total engagement')).toBeInTheDocument();
    expect(screen.getByText('6,000')).toBeInTheDocument();
    // Views 100000, 200000, 300000, 400000. The two middle values average 250000.
    expect(screen.getByText('Median views')).toBeInTheDocument();
    expect(screen.getByText('250,000')).toBeInTheDocument();
  });

  it('opens each post from its date', () => {
    renderV2(TIKTOK_V2_POSTS);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(TIKTOK_V2_POSTS.length);
    expect(links[0]).toHaveAttribute('href', 'https://www.instagram.com/p/Dbh16BqzcSb/');
    // A tooltip link opens away from the modal, and never leaks the opener.
    expect(links[0]).toHaveAttribute('target', '_blank');
    expect(links[0]).toHaveAttribute('rel', 'noopener noreferrer');
    expect(links[0]).toHaveTextContent('28/08/26');
    expect(screen.getAllByText('Behind the scenes with our creator community.')).toHaveLength(
      TIKTOK_V2_POSTS.length
    );
    expect(screen.getByText(/Each post opens in a new tab/)).toBeInTheDocument();
  });

  it('shows the date as plain text when the post has no URL', () => {
    renderV2(TIKTOK_V2_POSTS.map((post) => ({ ...post, postUrl: null })));

    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryByText(/Each post opens in a new tab/)).toBeNull();
    // The row is still listed; only the link is gone.
    expect(screen.getAllByText('5,210')).toHaveLength(TIKTOK_V2_POSTS.length);
    expect(screen.getAllByText('28/08/26')).toHaveLength(TIKTOK_V2_POSTS.length);
  });

  it('leaves followers out, because v2 does not divide by them', () => {
    render(
      <EngagementBreakdown
        posts={TIKTOK_V2_POSTS}
        formulaVersion="tiktok_recent_10_median_view_v2"
        engagementRate="3.00"
        followerCount={84210}
      />
    );
    expect(screen.queryByText('Followers')).toBeNull();
  });

  it('explains the Instagram formula and omits the counters it has none of', () => {
    expect(describeFormula('instagram_recent_10_median_view_v2')).toMatchObject({
      title: 'Instagram, 10 most recent Reels',
      formula: '100 × (mean of likes + comments) ÷ median views',
    });
    render(
      <EngagementBreakdown
        posts={TIKTOK_V2_POSTS.map((post) => ({ ...post, shares: null, saves: null }))}
        formulaVersion="instagram_recent_10_median_view_v2"
        engagementRate="5.00"
      />
    );
    expect(screen.queryByText('Shares')).toBeNull();
    expect(screen.queryByText('Saves')).toBeNull();
    expect(screen.getByText('Views')).toBeInTheDocument();
  });
});

describe('the median matches the backend', () => {
  it('averages the two middle values on an even count', () => {
    expect(medianOf([10, 20, 30, 40])).toBe(25);
  });

  it('takes the middle value on an odd count', () => {
    expect(medianOf([30, 10, 20])).toBe(20);
  });
});

describe('shortDate', () => {
  it('formats as dd/mm/yy', () => {
    expect(shortDate('2026-08-02T12:00:00.000Z')).toBe('02/08/26');
  });

  it('returns a dash for a bad value', () => {
    expect(shortDate('not-a-date')).toBe('—');
  });
});

describe('embedFromPostUrl', () => {
  it('builds an Instagram embed from a reel or post link', () => {
    expect(embedFromPostUrl('https://www.instagram.com/p/Dbh16BqzcSb/')).toBe(
      'https://www.instagram.com/p/Dbh16BqzcSb/embed/'
    );
    expect(embedFromPostUrl('https://www.instagram.com/reel/Dbh16BqzcSb/')).toBe(
      'https://www.instagram.com/p/Dbh16BqzcSb/embed/'
    );
  });

  it('builds a TikTok embed from a video link', () => {
    expect(embedFromPostUrl('https://www.tiktok.com/@cultcreative/video/74012')).toBe(
      'https://www.tiktok.com/embed/v2/74012'
    );
  });
});

describe('a v1 row keeps its own explanation', () => {
  it('lists likes, comments, shares, views and the per-post rate for TikTok', () => {
    render(
      <EngagementBreakdown
        posts={TIKTOK_V1_POSTS}
        formulaVersion="tiktok_recent_5_mean_view_rate_v1"
        engagementRate="5.00"
      />
    );

    expect(screen.getByText('5,210')).toBeInTheDocument();
    expect(screen.getByText('402')).toBeInTheDocument();
    expect(screen.getByText('210,430')).toBeInTheDocument();
    expect(screen.getByText('2.72%')).toBeInTheDocument();
    expect(describeFormula('tiktok_recent_5_mean_view_rate_v1').formula).toBe(
      '100 × mean of ((likes + comments + shares) ÷ views)'
    );
    // The v2 summary belongs to v2 rows only.
    expect(screen.queryByText('Median views')).toBeNull();
  });

  it('shows followers for Instagram and leaves out what that formula ignored', () => {
    render(
      <EngagementBreakdown
        posts={INSTAGRAM_V1_POSTS}
        formulaVersion="instagram_recent_5_followers_v1"
        engagementRate="6.45"
        followerCount={128400}
      />
    );

    expect(screen.queryByText('Shares')).toBeNull();
    // That formula divided by followers, so per-post views and rate are not shown.
    expect(screen.queryByText('Views')).toBeNull();
    expect(screen.queryByText('Rate')).toBeNull();
    expect(screen.getByText('Followers')).toBeInTheDocument();
    expect(screen.getByText('128,400')).toBeInTheDocument();
    expect(describeFormula('instagram_recent_5_followers_v1').formula).toBe(
      '100 × (mean of likes + comments) ÷ followers'
    );
  });

  it('copes with no stored detail', () => {
    render(<EngagementBreakdown posts={null} formulaVersion="instagram_recent_5_followers_v1" />);
    expect(screen.getByText(/No per-post detail was stored/)).toBeInTheDocument();
  });
});

describe('a future formula is never described wrongly', () => {
  it('prints the version name instead of guessing', () => {
    expect(describeFormula('instagram_weighted_v3')).toEqual({
      title: 'Engagement rate',
      formula: 'Formula instagram_weighted_v3',
      denominator: null,
    });
  });

  it('says so when no version was recorded', () => {
    expect(describeFormula(null).formula).toBe('Formula not recorded');
  });

  it('still lists the posts for an unknown formula', () => {
    render(
      <EngagementBreakdown
        posts={TIKTOK_V1_POSTS}
        formulaVersion="something_new_v9"
        engagementRate="4.10"
      />
    );
    expect(describeFormula('something_new_v9').formula).toBe('Formula something_new_v9');
    expect(screen.getByText('5,210')).toBeInTheDocument();
    // No claim is made about a mean or a median this build cannot verify.
    expect(screen.queryByText('Average total engagement')).toBeNull();
  });
});
