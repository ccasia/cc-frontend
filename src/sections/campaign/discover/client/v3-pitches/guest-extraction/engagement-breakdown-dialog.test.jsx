import userEvent from '@testing-library/user-event';
import { it, vi, expect, describe } from 'vitest';
import { render, screen } from '@testing-library/react';

import EngagementBreakdownDialog from './engagement-breakdown-dialog';

const POSTS = [
  {
    postId: '1',
    postUrl: 'https://www.tiktok.com/@cultcreative/video/74012',
    publishedAt: '2026-08-28T11:02:13.000Z',
    likes: 5210,
    comments: 118,
    shares: 402,
    saves: 270,
    views: 100000,
    caption: 'First look at the summer drop',
    ratePercent: null,
  },
  {
    postId: '2',
    postUrl: 'https://www.tiktok.com/@cultcreative/video/74013',
    publishedAt: '2026-08-24T07:41:55.000Z',
    likes: 5210,
    comments: 118,
    shares: 402,
    saves: 270,
    views: 200000,
    caption: 'Creator tips for brand collabs',
    ratePercent: null,
  },
];

const setup = (over = {}) =>
  render(
    <EngagementBreakdownDialog
      open
      onClose={vi.fn()}
      posts={POSTS}
      formulaVersion="tiktok_recent_10_median_view_v2"
      engagementRate="3.00"
      creatorName="Cult Creative"
      {...over}
    />
  );

describe('the breakdown dialog', () => {
  it('renders nothing until it is opened', () => {
    setup({ open: false });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('has an accessible name and names the creator', () => {
    setup();
    const panel = screen.getByRole('dialog', { name: /Engagement rate/i });
    expect(panel).toBeInTheDocument();
    expect(screen.getByText('Cult Creative')).toBeInTheDocument();
  });

  it('puts source and formula in a tooltip beside the heading', async () => {
    const user = userEvent.setup();
    setup();
    expect(screen.queryByText('TikTok, 10 most recent posts')).toBeNull();

    await user.hover(screen.getByRole('button', { name: 'Source and formula' }));
    expect(await screen.findByText('TikTok, 10 most recent posts')).toBeInTheDocument();
    expect(
      screen.getByText('100 × (mean of likes + comments + saves + shares) ÷ median views')
    ).toBeInTheDocument();
  });

  it('shows the posts and the working', () => {
    setup();
    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.getByText('28/08/26')).toBeInTheDocument();
    expect(screen.getByText('First look at the summer drop')).toBeInTheDocument();
    expect(screen.getByText('Average total engagement')).toBeInTheDocument();
    expect(screen.getByText('6,000')).toBeInTheDocument();
    expect(screen.getByText('Median views')).toBeInTheDocument();
    expect(screen.getByText('150,000')).toBeInTheDocument();
    expect(screen.getByText('3.00%')).toBeInTheDocument();
  });

  it('closes from the cross', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    setup({ onClose });

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape, so it never traps the modal underneath', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    setup({ onClose });

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('copes with a result that stored no per-post detail', () => {
    setup({ posts: null });
    expect(screen.getByText(/No per-post detail was stored/)).toBeInTheDocument();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });
});
