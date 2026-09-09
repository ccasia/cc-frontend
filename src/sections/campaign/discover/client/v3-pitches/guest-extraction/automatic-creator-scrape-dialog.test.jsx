import userEvent from '@testing-library/user-event';
import { it, vi, expect, describe, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';

vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: vi.fn() }) }));

// A counting key, so a test can tell one batch from the next.
let keySeq = 1;

vi.mock('./guest-extraction-api', () => ({
  newIdempotencyKey: vi.fn(() => `key-${keySeq++}`),
  fetchFeatureDecision: vi.fn(),
  startExtraction: vi.fn(),
  getExtraction: vi.fn(),
  listResumableExtractions: vi.fn(async () => []),
  saveGuestCreators: vi.fn(async () => ({ message: 'ok' })),
}));

const api = await import('./guest-extraction-api');
const { default: AutomaticCreatorScrapeDialog } = await import('./automatic-creator-scrape-dialog');

const IG = 'https://www.instagram.com/cultcreative.asia/';

const setup = () =>
  render(
    <AutomaticCreatorScrapeDialog open onClose={vi.fn()} campaignId="c1" onUpdated={vi.fn()} />
  );

const linkField = () => screen.getByPlaceholderText('Profile Link');

const waitForAutoFetch = () => waitFor(() => expect(api.startExtraction).toHaveBeenCalled());

const fillLink = async (user, value = IG, input = linkField()) => {
  await user.click(input);
  await user.clear(input);
  await user.paste(value);
  await waitForAutoFetch();
};

beforeEach(() => {
  vi.clearAllMocks();
  window.sessionStorage.clear();
  api.listResumableExtractions.mockResolvedValue([]);
  api.saveGuestCreators.mockResolvedValue({ message: 'ok' });
});

describe('entering a link', () => {
  it('starts work once a valid link is accepted', async () => {
    const user = userEvent.setup();
    api.startExtraction.mockResolvedValue({ extractionId: 'ext-1', status: 'QUEUED' });
    api.getExtraction.mockResolvedValue({ status: 'QUEUED' });
    setup();

    await fillLink(user);

    expect(api.startExtraction).toHaveBeenCalledTimes(1);
    expect(api.startExtraction.mock.calls[0][0]).toMatchObject({
      campaignId: 'c1',
      profileLink: IG,
    });
    expect(api.startExtraction.mock.calls[0][0].idempotencyKey).toBeTruthy();
  });

  it('does not render a Fetch button', () => {
    setup();
    expect(screen.queryByRole('button', { name: /^Fetch$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Refetch$/i })).toBeNull();
  });

  it('reports the derived platform in the link field, with no Platform field', async () => {
    const user = userEvent.setup();
    api.startExtraction.mockResolvedValue({ extractionId: 'ext-1', status: 'QUEUED' });
    api.getExtraction.mockResolvedValue({ status: 'QUEUED' });
    setup();

    await fillLink(user, 'https://www.tiktok.com/@cultcreative');

    expect(screen.getByLabelText('TikTok')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /platform/i })).toBeNull();
    expect(screen.queryByText('Platform')).toBeNull();
  });

  it('reports a bad link and does not start a fetch', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(linkField());
    await user.paste('https://www.instagram.com/p/C9aBcDeFgHi/');
    await waitFor(() =>
      expect(screen.getByText(/Use the profile link, not a post link/i)).toBeInTheDocument()
    );

    expect(api.startExtraction).not.toHaveBeenCalled();
  });
});

describe('the automatic fetch', () => {
  it('shows the shimmer in all three metric fields while the link stays visible', async () => {
    const user = userEvent.setup();
    api.startExtraction.mockResolvedValue({ extractionId: 'ext-1', status: 'QUEUED' });
    api.getExtraction.mockResolvedValue({ status: 'RUNNING' });
    setup();

    await fillLink(user);

    await waitFor(() => expect(screen.getAllByTestId('creator-field-loading')).toHaveLength(3));

    // Every field that is being fetched shows that it is being fetched.
    expect(screen.getAllByTestId('creator-field-spinner')).toHaveLength(3);
    // The link stays on screen and stays editable.
    expect(linkField()).toHaveValue(IG);
    expect(screen.getByTestId('creator-scrape-row')).toHaveAttribute('aria-busy', 'true');
  });

  it('does not offer a Stop control on the profile link', async () => {
    const user = userEvent.setup();
    api.startExtraction.mockResolvedValue({ extractionId: 'ext-1', status: 'QUEUED' });
    api.getExtraction.mockResolvedValue({ status: 'RUNNING' });
    setup();

    await fillLink(user);

    await waitFor(() =>
      expect(screen.getByTestId('creator-scrape-row')).toHaveAttribute('aria-busy', 'true')
    );
    expect(screen.queryByRole('button', { name: /^Stop$/i })).toBeNull();
  });
});

describe('a ready row', () => {
  const ready = {
    status: 'READY',
    name: 'Cult Creative',
    followerCount: 128400,
    engagementRate: '6.45',
    completionReceipt: 'receipt-abc',
    sampleSize: 10,
    fetchedAt: '2026-09-03T00:00:00.000Z',
  };

  const reachReady = async (user) => {
    api.startExtraction.mockResolvedValue({ extractionId: 'ext-1', status: 'QUEUED' });
    api.getExtraction.mockResolvedValue(ready);
    setup();

    await fillLink(user);
    await waitFor(() => expect(screen.getByDisplayValue('Cult Creative')).toBeInTheDocument());
  };

  it('fills the three fields and shows the evidence', async () => {
    const user = userEvent.setup();
    await reachReady(user);

    expect(screen.getByDisplayValue('128,400')).toBeInTheDocument();
    expect(screen.getByDisplayValue('6.45')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
    expect(screen.getAllByText(/\(extracted\)/)).toHaveLength(3);
    expect(screen.getAllByTestId('dia-text-reveal')).toHaveLength(3);
  });

  it('stays saveable after an edit, and says it is an override', async () => {
    const user = userEvent.setup();
    await reachReady(user);

    const rate = screen.getByDisplayValue('6.45');
    await user.clear(rate);
    await user.type(rate, '3.20');

    expect(await screen.findByText(/Saved as a manual override/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Add Creator$/i })).toBeEnabled();
    expect(screen.getByText(/\(edited\)/)).toBeInTheDocument();
    expect(screen.getAllByText(/\(extracted\)/)).toHaveLength(2);
  });

  it('clears everything when the link changes', async () => {
    const user = userEvent.setup();
    await reachReady(user);

    api.startExtraction.mockResolvedValue({ extractionId: 'ext-2', status: 'QUEUED' });
    api.getExtraction.mockResolvedValue({ status: 'RUNNING' });

    await user.clear(linkField());
    await user.paste('https://www.instagram.com/someone.else');

    await waitFor(() => expect(screen.queryByDisplayValue('Cult Creative')).toBeNull());
    expect(screen.queryByDisplayValue('6.45')).toBeNull();
    await waitFor(() => expect(screen.getByRole('button', { name: /^Add Creator$/i })).toBeEnabled());
  });

  it('lets the admin add while the scrape is still running', async () => {
    const user = userEvent.setup();
    api.startExtraction.mockResolvedValue({ extractionId: 'ext-1', status: 'QUEUED' });
    api.getExtraction.mockResolvedValue({ status: 'RUNNING' });
    setup();

    await fillLink(user);
    await waitFor(() => expect(screen.getByRole('button', { name: /^Add Creator$/i })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: /^Add Creator$/i }));

    await waitFor(() => expect(api.saveGuestCreators).toHaveBeenCalledTimes(1));
    expect(api.saveGuestCreators.mock.calls[0][0].guestCreators[0]).toMatchObject({
      extractionId: 'ext-1',
      name: 'cultcreative.asia',
      profileLink: 'https://www.instagram.com/cultcreative.asia',
    });
    expect(api.saveGuestCreators.mock.calls[0][0].guestCreators[0].completionReceipt).toBeFalsy();
  });

  it('sends reviewed values and the receipt, and no raw actor data', async () => {
    const user = userEvent.setup();
    await reachReady(user);

    await user.click(screen.getByRole('button', { name: /^Add Creator$/i }));

    await waitFor(() => expect(api.saveGuestCreators).toHaveBeenCalledTimes(1));
    const body = api.saveGuestCreators.mock.calls[0][0];

    expect(body.guestCreators).toHaveLength(1);
    expect(body.guestCreators[0]).toMatchObject({
      profileLink: 'https://www.instagram.com/cultcreative.asia',
      completionReceipt: 'receipt-abc',
      engagementRate: '6.45',
    });
    expect(body.idempotencyKey).toBeTruthy();
    expect(JSON.stringify(body)).not.toMatch(/apify|actorBuild|selectedPosts/i);
  });
});

describe('refresh recovery', () => {
  it('re-derives the platform from the saved link', async () => {
    window.sessionStorage.setItem(
      'cc.guestExtraction.c1',
      JSON.stringify({ 'row-restored': { extractionId: 'ext-9', profileLink: IG } })
    );
    api.listResumableExtractions.mockResolvedValue([{ id: 'ext-9', status: 'READY' }]);
    api.getExtraction.mockResolvedValue({
      status: 'READY',
      name: 'Cult Creative',
      followerCount: 20452,
      engagementRate: '0.98',
      completionReceipt: 'r',
      sampleSize: 10,
      fetchedAt: '2026-09-07T07:05:52.000Z',
      formulaVersion: 'instagram_recent_10_median_view_v2',
      selectedPosts: [
        {
          postId: '1',
          publishedAt: '2026-08-30T09:12:44.000Z',
          likes: 8123,
          comments: 214,
          shares: null,
          saves: null,
          views: 122000,
          ratePercent: null,
        },
      ],
    });

    setup();

    // The bug: a restored row used to lose the platform derived from the link.
    await waitFor(() => expect(screen.getByLabelText('Instagram')).toBeInTheDocument());
    expect(screen.getByDisplayValue('Cult Creative')).toBeInTheDocument();
  });

  it('shows the breakdown once a result is ready', async () => {
    const user = userEvent.setup();
    api.startExtraction.mockResolvedValue({ extractionId: 'ext-1', status: 'QUEUED' });
    api.getExtraction.mockResolvedValue({
      status: 'READY',
      name: 'Cult Creative',
      followerCount: 20452,
      engagementRate: '0.98',
      completionReceipt: 'r',
      sampleSize: 10,
      fetchedAt: '2026-09-07T07:05:52.000Z',
      formulaVersion: 'instagram_recent_10_median_view_v2',
      selectedPosts: [
        {
          postId: '1',
          postUrl: 'https://www.instagram.com/p/Dbh16BqzcSb/',
          publishedAt: '2026-08-30T09:12:44.000Z',
          likes: 8123,
          comments: 214,
          shares: null,
          saves: null,
          views: 122000,
          caption: 'Behind the scenes with our creator community.',
          ratePercent: null,
        },
      ],
    });
    setup();

    await fillLink(user);
    await waitFor(() => expect(screen.getByDisplayValue('0.98')).toBeInTheDocument());

    // The numbers live behind a button now, not in a tooltip.
    const hint = screen.getByLabelText('How this engagement rate was worked out');
    expect(screen.queryByText(/Median views:/)).toBeNull();

    await user.click(hint);

    const panel = await screen.findByRole('dialog', { name: /Engagement rate/i });
    await user.hover(within(panel).getByRole('button', { name: 'Source and formula' }));
    expect(
      await screen.findByText('100 × (mean of likes + comments) ÷ median views')
    ).toBeInTheDocument();
    expect(within(panel).getByText('8,123')).toBeInTheDocument();
    expect(within(panel).getByText('Median views')).toBeInTheDocument();
    expect(within(panel).getAllByText('122,000').length).toBeGreaterThan(0);
    expect(within(panel).getByRole('link')).toHaveAttribute(
      'href',
      'https://www.instagram.com/p/Dbh16BqzcSb/'
    );
    expect(within(panel).getByRole('link')).toHaveTextContent('30/08/26');
    expect(
      within(panel).getByText('Behind the scenes with our creator community.')
    ).toBeInTheDocument();
    // It says whose rate this is, because a batch can hold three creators.
    expect(within(panel).getByText('Cult Creative')).toBeInTheDocument();

    await user.click(within(panel).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText(/Median views:/)).toBeNull());
  });
});

describe('fallback rules', () => {
  const reach = async (user, record) => {
    api.startExtraction.mockResolvedValue({ extractionId: 'ext-1', status: 'QUEUED' });
    api.getExtraction.mockResolvedValue(record);
    setup();

    await fillLink(user);
  };

  it('offers a confirmed fallback for insufficient data', async () => {
    const user = userEvent.setup();
    await reach(user, { status: 'INSUFFICIENT_DATA', sampleSize: 3 });

    const checkbox = await screen.findByRole('checkbox');
    expect(screen.getByText(/fewer than 10 usable public posts/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Add Creator$/i })).toBeDisabled();

    await user.type(screen.getByPlaceholderText('Creator Name'), 'Creator');
    await user.type(screen.getByPlaceholderText('Follower Count'), '9120');
    await user.click(checkbox);

    await waitFor(() => expect(screen.getByRole('button', { name: /^Add Creator$/i })).toBeEnabled());
  });

  it('offers no fallback for a provider schema change', async () => {
    const user = userEvent.setup();
    await reach(user, {
      status: 'FAILED',
      failureCode: 'PROVIDER_SCHEMA_CHANGED',
      failureMessage: 'The provider changed its output.',
    });

    expect(await screen.findByText(/The provider changed its output/)).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(screen.getByRole('button', { name: /^Add Creator$/i })).toBeDisabled();
  });

  it.each(['COST_LIMIT', 'TIMED_OUT', 'HTTP_401'])('offers no fallback for %s', async (code) => {
    const user = userEvent.setup();
    await reach(user, { status: 'FAILED', failureCode: code, failureMessage: 'Nope.' });

    await screen.findByText(/Nope\./);
    expect(screen.queryByRole('checkbox')).toBeNull();
  });
});

describe('the save action follows eligibility', () => {
  it('keeps the save action disabled while nothing is eligible', () => {
    setup();
    expect(screen.getByRole('button', { name: /^Add Creator$/i })).toBeDisabled();
  });
});

describe('rows stay removable', () => {
  it('has no per-row cross, matching the handoff', () => {
    setup();
    expect(screen.queryByRole('button', { name: /Remove creator/i })).toBeNull();
  });

  it('removes a row that is still fetching', async () => {
    const user = userEvent.setup();
    api.startExtraction.mockResolvedValue({ extractionId: 'ext-1', status: 'QUEUED' });
    api.getExtraction.mockResolvedValue({ status: 'RUNNING' });
    setup();

    // The minus button drops the last row, so give it a second one to drop.
    await user.click(screen.getByRole('button', { name: /Add row/i }));
    const links = screen.getAllByPlaceholderText('Profile Link');
    await fillLink(user, IG, links[links.length - 1]);
    await waitFor(() =>
      expect(screen.getAllByTestId('creator-scrape-row')[1]).toHaveAttribute('aria-busy', 'true')
    );

    await user.click(screen.getByRole('button', { name: /Remove row/i }));

    await waitFor(() => expect(screen.getAllByTestId('creator-scrape-row')).toHaveLength(1));
  });

  it('removes the last row from the minus button, matching the manual modal', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', { name: /Add row/i }));
    await waitFor(() => expect(screen.getAllByTestId('creator-scrape-row')).toHaveLength(2));

    await user.click(screen.getByRole('button', { name: /Remove row/i }));
    await waitFor(() => expect(screen.getAllByTestId('creator-scrape-row')).toHaveLength(1));
  });
});

describe('reopening the dialog after adding a creator', () => {
  const ready = {
    status: 'READY',
    name: 'Cult Creative',
    followerCount: 128400,
    engagementRate: '6.45',
    completionReceipt: 'receipt-abc',
    sampleSize: 10,
    fetchedAt: '2026-09-03T00:00:00.000Z',
  };

  /** MUI keeps a closed dialog mounted, so only the `open` prop changes. */
  const renderWithOpen = (open) =>
    render(
      <AutomaticCreatorScrapeDialog
        open={open}
        onClose={vi.fn()}
        campaignId="c1"
        onUpdated={vi.fn()}
      />
    );

  it('starts empty instead of showing the creator just added', async () => {
    const user = userEvent.setup();
    api.startExtraction.mockResolvedValue({ extractionId: 'ext-1', status: 'QUEUED' });
    api.getExtraction.mockResolvedValue(ready);

    const { rerender } = renderWithOpen(true);
    await fillLink(user);
    await waitFor(() => expect(screen.getByDisplayValue('Cult Creative')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /^Add Creator$/i }));
    await waitFor(() => expect(api.saveGuestCreators).toHaveBeenCalledTimes(1));

    // The parent only flips `open`; the component is never unmounted.
    rerender(
      <AutomaticCreatorScrapeDialog
        open={false}
        onClose={vi.fn()}
        campaignId="c1"
        onUpdated={vi.fn()}
      />
    );
    rerender(
      <AutomaticCreatorScrapeDialog open onClose={vi.fn()} campaignId="c1" onUpdated={vi.fn()} />
    );

    await waitFor(() => expect(screen.queryByDisplayValue('Cult Creative')).toBeNull());
    expect(linkField()).toHaveValue('');
    expect(screen.getByRole('button', { name: /^Add Creator$/i })).toBeDisabled();
  });

  it('issues a new idempotency key, so the second add is not read as a replay', async () => {
    const user = userEvent.setup();
    api.startExtraction.mockResolvedValue({ extractionId: 'ext-1', status: 'QUEUED' });
    api.getExtraction.mockResolvedValue(ready);

    const { rerender } = renderWithOpen(true);
    await fillLink(user);
    await waitFor(() => expect(screen.getByDisplayValue('Cult Creative')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /^Add Creator$/i }));
    await waitFor(() => expect(api.saveGuestCreators).toHaveBeenCalledTimes(1));
    const firstKey = api.saveGuestCreators.mock.calls[0][0].idempotencyKey;

    rerender(
      <AutomaticCreatorScrapeDialog
        open={false}
        onClose={vi.fn()}
        campaignId="c1"
        onUpdated={vi.fn()}
      />
    );
    rerender(
      <AutomaticCreatorScrapeDialog open onClose={vi.fn()} campaignId="c1" onUpdated={vi.fn()} />
    );
    await waitFor(() => expect(linkField()).toHaveValue(''));

    await fillLink(user);
    await waitFor(() => expect(screen.getByDisplayValue('Cult Creative')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /^Add Creator$/i }));
    await waitFor(() => expect(api.saveGuestCreators).toHaveBeenCalledTimes(2));

    expect(api.saveGuestCreators.mock.calls[1][0].idempotencyKey).not.toBe(firstKey);
  });
});

describe('a 1-minute scrape draft', () => {
  const ready = {
    status: 'READY',
    name: 'Cult Creative',
    followerCount: 128400,
    engagementRate: '6.45',
    completionReceipt: 'receipt-abc',
    sampleSize: 10,
    fetchedAt: '2026-09-03T00:00:00.000Z',
  };

  const dialog = (open) => (
    <AutomaticCreatorScrapeDialog
      open={open}
      onClose={vi.fn()}
      campaignId="c1"
      onUpdated={vi.fn()}
    />
  );

  const waitForDraft = () =>
    waitFor(() => expect(window.sessionStorage.getItem('cc.creatorDraft.guest.c1')).toBeTruthy());

  it('keeps scraped fields when the dialog is reopened within a minute', async () => {
    const user = userEvent.setup();
    api.startExtraction.mockResolvedValue({ extractionId: 'ext-1', status: 'QUEUED' });
    api.getExtraction.mockResolvedValue(ready);

    const { rerender } = render(dialog(true));
    await fillLink(user);
    await waitFor(() => expect(screen.getByDisplayValue('Cult Creative')).toBeInTheDocument());
    await waitForDraft();

    rerender(dialog(false));
    rerender(dialog(true));

    expect(screen.getByDisplayValue('Cult Creative')).toBeInTheDocument();
    expect(screen.getByDisplayValue('128,400')).toBeInTheDocument();
    expect(screen.getByDisplayValue('6.45')).toBeInTheDocument();
    expect(screen.getAllByTestId('creator-scrape-row')).toHaveLength(1);
  });

  it('opens with one empty row after the minute is up', async () => {
    const user = userEvent.setup();
    api.startExtraction.mockResolvedValue({ extractionId: 'ext-1', status: 'QUEUED' });
    api.getExtraction.mockResolvedValue(ready);

    const { rerender } = render(dialog(true));
    await fillLink(user);
    await waitFor(() => expect(screen.getByDisplayValue('Cult Creative')).toBeInTheDocument());
    await waitForDraft();

    rerender(dialog(false));
    const key = 'cc.creatorDraft.guest.c1';
    const draft = JSON.parse(window.sessionStorage.getItem(key));
    window.sessionStorage.setItem(key, JSON.stringify({ ...draft, expiresAt: Date.now() - 1 }));
    rerender(dialog(true));

    await waitFor(() => expect(screen.queryByDisplayValue('Cult Creative')).toBeNull());
    expect(linkField()).toHaveValue('');
    expect(screen.getAllByTestId('creator-scrape-row')).toHaveLength(1);
    expect(screen.getByRole('button', { name: /^Add Creator$/i })).toBeDisabled();
  });

  it('restores every scraped row, then falls back to one empty row after expiry', async () => {
    const user = userEvent.setup();
    api.startExtraction.mockResolvedValue({ extractionId: 'ext-1', status: 'QUEUED' });
    api.getExtraction.mockResolvedValue(ready);

    const { rerender } = render(dialog(true));
    await fillLink(user);
    await waitFor(() => expect(screen.getByDisplayValue('Cult Creative')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /Add row/i }));
    await user.click(screen.getByRole('button', { name: /Add row/i }));
    await waitFor(() => expect(screen.getAllByPlaceholderText('Profile Link')).toHaveLength(3));

    const links = [
      'https://www.instagram.com/someone.else/',
      'https://www.instagram.com/third.creator/',
    ];
    const fields = screen.getAllByPlaceholderText('Profile Link');
    await user.click(fields[1]);
    await user.paste(links[0]);
    await user.click(fields[2]);
    await user.paste(links[1]);

    await waitFor(() => expect(screen.getAllByDisplayValue('Cult Creative')).toHaveLength(3));
    await waitFor(() => {
      const stored = JSON.parse(window.sessionStorage.getItem('cc.creatorDraft.guest.c1'));
      expect(stored.rows).toHaveLength(3);
    });

    rerender(dialog(false));
    rerender(dialog(true));
    expect(screen.getAllByTestId('creator-scrape-row')).toHaveLength(3);

    rerender(dialog(false));
    const key = 'cc.creatorDraft.guest.c1';
    const draft = JSON.parse(window.sessionStorage.getItem(key));
    window.sessionStorage.setItem(key, JSON.stringify({ ...draft, expiresAt: Date.now() - 1 }));
    rerender(dialog(true));

    await waitFor(() => expect(screen.getAllByTestId('creator-scrape-row')).toHaveLength(1));
    expect(linkField()).toHaveValue('');
  });
});
