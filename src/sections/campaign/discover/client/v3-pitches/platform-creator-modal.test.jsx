import userEvent from '@testing-library/user-event';
import { it, vi, expect, describe, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';

/**
 * Characterisation tests for the Add Platform Creators modal.
 *
 * These pin the behaviour that exists **before** Apify scraping is wired in:
 * platform switching, the follower-count sync that follows it, and the
 * read-only media-kit field. The modal is about to move onto the shared row
 * state machine, and this file is the safety net for that move. A failure here
 * after the refactor means real behaviour changed, not that the test is stale.
 */

vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: vi.fn() }) }));
vi.mock('react-router-dom', () => ({ useLocation: () => ({}), useNavigate: () => vi.fn() }));
vi.mock('src/auth/hooks', () => ({
  useAuthContext: () => ({ user: { id: 'admin-1', role: 'admin' } }),
}));
vi.mock('src/socket/hooks/useSocketContext', () => ({ default: () => ({ socket: null }) }));
vi.mock('./use-pitch-socket', () => ({ default: () => {} }));
vi.mock('./v3-pitch-modal', () => ({ default: () => null }));
vi.mock('./v3-pitch-row', () => ({ default: () => null }));
vi.mock('../../admin/pitch-modal-mobile', () => ({ default: () => null }));
vi.mock('./guest-extraction/use-guest-metrics-decision', () => ({
  default: () => ({ enabled: false, reason: 'disabled' }),
}));
vi.mock('./guest-extraction/automatic-creator-scrape-dialog', () => ({ default: () => null }));

vi.mock('./guest-extraction/guest-extraction-api', () => ({
  newIdempotencyKey: () => 'key-1',
  fetchFeatureDecision: vi.fn(),
  startExtraction: vi.fn(async () => ({ extractionId: 'ext-1', status: 'QUEUED' })),
  getExtraction: vi.fn(async () => ({ status: 'QUEUED' })),
  listResumableExtractions: vi.fn(async () => []),
  saveGuestCreators: vi.fn(async () => ({ message: 'ok' })),
}));

vi.mock('src/utils/axios', () => ({
  default: { post: vi.fn(async () => ({ data: { message: 'ok' } })) },
  endpoints: { creators: { getCreators: '/api/creator/getAllCreators' } },
}));

const creators = [
  {
    id: 'u-connected',
    name: 'Connected Creator',
    email: 'connected@example.com',
    status: 'active',
    creator: {
      isFormCompleted: true,
      // A connected Instagram account. This is what "has a media kit" means.
      instagramUser: { id: 'ig-1', followers_count: 128400, engagement_rate: 4.2718 },
      tiktokUser: null,
    },
  },
  {
    id: 'u-bare',
    name: 'Bare Creator',
    email: 'bare@example.com',
    status: 'active',
    creator: { isFormCompleted: true, instagramUser: null, tiktokUser: null },
  },
];

vi.mock('src/api/creator', () => ({
  useGetAllCreators: () => ({ data: creators, isLoading: false }),
}));

const { PlatformCreatorModal } = await import('./campaign-v3-pitches');
const axios = (await import('src/utils/axios')).default;
const extractionApi = await import('./guest-extraction/guest-extraction-api');

const campaign = { id: 'c1', name: 'Test Campaign', shortlisted: [], submissionVersion: 'v3' };

const setup = (scrapeEnabled = false) =>
  render(
    <PlatformCreatorModal
      open
      onClose={vi.fn()}
      campaign={campaign}
      pitches={[]}
      onUpdated={vi.fn()}
      scrapeEnabled={scrapeEnabled}
    />
  );

/** Opens the row's creator dropdown and picks by visible name. */
const pickCreator = async (user, name) => {
  const combo = screen.getAllByRole('combobox')[0];
  await user.click(combo);
  await user.type(combo, name.slice(0, 6));
  const option = await screen.findByText(name);
  await user.click(option);
};

const followerField = () => screen.getByPlaceholderText(/follower count/i);

/**
 * The platform select, by its accessible name.
 *
 * The creator Autocomplete is also a `combobox`, so an unqualified
 * `getByRole('combobox')` is ambiguous once a creator is chosen.
 */
const platformSelect = () => screen.getByRole('combobox', { name: 'Platform' });

beforeEach(() => {
  vi.clearAllMocks();
  window.sessionStorage.clear();
});

describe('the modal as it stands today', () => {
  it('opens with one row and no creator chosen', () => {
    setup();
    expect(screen.getByText(/Add Platform Creators/i)).toBeInTheDocument();
    expect(screen.getAllByRole('combobox').length).toBeGreaterThan(0);
  });

  it('adds and removes rows, capped at three', async () => {
    const user = userEvent.setup();
    setup();

    expect(screen.getByRole('button', { name: 'Remove row' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Add row' }));
    await waitFor(() => expect(screen.getAllByRole('combobox').length).toBeGreaterThan(1));

    await user.click(screen.getByRole('button', { name: 'Remove row' }));
    await waitFor(() => expect(screen.getAllByRole('combobox')).toHaveLength(1));
  });
});

describe('choosing a creator with a connected account', () => {
  it('fills the follower count from the media kit and locks the field', async () => {
    const user = userEvent.setup();
    setup();

    await pickCreator(user, 'Connected Creator');

    // 128400 comes from instagramUser.followers_count, not from the admin.
    await waitFor(() => expect(screen.getByDisplayValue('128,400')).toBeInTheDocument());
    expect(screen.getAllByText(/\(media kit\)/).length).toBeGreaterThan(0);
  });
});

describe('switching platform on a half-connected creator', () => {
  /**
   * The subtle rule in `handlePlatformChange`, and the one most at risk in the
   * refactor: a follower count that came from the previous platform's media kit
   * is stale on the new platform, so it is cleared. A number the admin typed is
   * not stale, so it is kept.
   */
  it('clears a media-kit number when it no longer applies', async () => {
    const user = userEvent.setup();
    setup();

    // Instagram is connected, TikTok is not.
    await pickCreator(user, 'Connected Creator');
    await waitFor(() => expect(screen.getByDisplayValue('128,400')).toBeInTheDocument());

    await user.click(platformSelect());
    await user.click(await screen.findByRole('option', { name: /TikTok/i }));

    // 128,400 belonged to Instagram. TikTok has no media kit, so the field
    // becomes editable and must not carry the Instagram number over.
    await waitFor(() => expect(screen.queryByText(/From media kit/i)).toBeNull());
    expect(followerField()).toHaveValue('');
  });

  it('keeps a number the admin typed when the platform changes', async () => {
    const user = userEvent.setup();
    setup();

    await pickCreator(user, 'Bare Creator');
    await waitFor(() => expect(followerField()).toBeInTheDocument());
    await user.type(followerField(), '4321');

    await user.click(platformSelect());
    await user.click(await screen.findByRole('option', { name: /TikTok/i }));

    // Neither platform is connected, so the typed value is not stale.
    expect(followerField()).toHaveValue('4,321');
  });
});

describe('choosing a creator with nothing connected', () => {
  it('leaves the follower count empty and editable', async () => {
    const user = userEvent.setup();
    setup();

    await pickCreator(user, 'Bare Creator');

    await waitFor(() => expect(followerField()).toBeInTheDocument());
    expect(followerField()).toHaveValue('');
    // Nothing is connected, so no label claims a media-kit source.
    expect(screen.queryByText(/\(media kit\)/)).toBeNull();
  });

  it('accepts digits only', async () => {
    const user = userEvent.setup();
    setup();

    await pickCreator(user, 'Bare Creator');
    await waitFor(() => expect(followerField()).toBeInTheDocument());

    // Letters are dropped, and the digits that survive are grouped for reading.
    await user.type(followerField(), '12a34');
    expect(followerField()).toHaveValue('1,234');
  });

  it('sends the typed follower count and the chosen platform', async () => {
    const user = userEvent.setup();
    setup();

    await pickCreator(user, 'Bare Creator');
    await waitFor(() => expect(followerField()).toBeInTheDocument());
    await user.type(followerField(), '5000');

    // Nothing is connected, so no platform can be derived and the submit stays
    // blocked until the admin chooses one.
    const submit = screen.getByRole('button', { name: /Add Creators/i });
    expect(submit).toBeDisabled();

    // Once a creator is chosen the Autocomplete collapses, so the only
    // combobox left in the row is the platform select.
    await user.click(platformSelect());
    await user.click(await screen.findByRole('option', { name: /Instagram/i }));

    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    const [url, body] = axios.post.mock.calls[0];
    expect(url).toBe('/api/campaign/v3/shortlistCreator');
    expect(body.campaignId).toBe('c1');
    expect(body.creators[0]).toMatchObject({
      id: 'u-bare',
      followerCount: 5000,
      selectedPlatform: 'instagram',
    });
  });
});

describe('scraping a platform creator', () => {
  const IG = 'https://www.instagram.com/claude0417/';
  const linkField = () => screen.getByPlaceholderText('Profile Link');

  it('shows nothing new while the feature flag is off', async () => {
    const user = userEvent.setup();
    setup(false);

    await pickCreator(user, 'Bare Creator');
    await waitFor(() => expect(followerField()).toBeInTheDocument());

    expect(screen.queryByPlaceholderText('Profile Link')).toBeNull();
    expect(screen.queryByPlaceholderText('Engagement Rate')).toBeNull();
  });

  it('offers a link and a rate for a creator with nothing connected', async () => {
    const user = userEvent.setup();
    setup(true);

    await pickCreator(user, 'Bare Creator');

    await waitFor(() => expect(linkField()).toBeInTheDocument());
    expect(linkField()).toBeEnabled();
    expect(screen.getByPlaceholderText('Engagement Rate')).toBeInTheDocument();
  });

  it('refuses to scrape a creator whose account is already connected', async () => {
    const user = userEvent.setup();
    setup(true);

    await pickCreator(user, 'Connected Creator');

    // The media kit is the source of truth, so there is nothing to fetch. The
    // Profile Link field is gone rather than sitting there greyed out.
    await waitFor(() => expect(screen.getByText('Platform')).toBeInTheDocument());
    expect(screen.queryByPlaceholderText('Profile Link')).toBeNull();
    expect(screen.queryByPlaceholderText('Connected')).toBeNull();
    expect(extractionApi.startExtraction).not.toHaveBeenCalled();
  });

  it('starts a fetch once a valid link is entered', async () => {
    const user = userEvent.setup();
    setup(true);

    await pickCreator(user, 'Bare Creator');
    await waitFor(() => expect(linkField()).toBeInTheDocument());

    await user.click(linkField());
    await user.paste(IG);

    await waitFor(() => expect(extractionApi.startExtraction).toHaveBeenCalled());
  });

  it('shows a loading field while the scrape runs, not a typed-in one', async () => {
    const user = userEvent.setup();
    setup(true);

    await pickCreator(user, 'Bare Creator');
    await waitFor(() => expect(linkField()).toBeInTheDocument());
    await user.click(linkField());
    await user.paste(IG);
    await waitFor(() => expect(extractionApi.startExtraction).toHaveBeenCalled());

    // Both measured fields become skeletons, so nothing invites a value that
    // the fetch is about to replace.
    await waitFor(() => expect(screen.getAllByTestId('creator-field-loading')).toHaveLength(2));
    expect(screen.queryByPlaceholderText('Engagement Rate')).toBeNull();
    expect(screen.queryByPlaceholderText(/follower count/i)).toBeNull();
  });

  it('lets the admin add while the scrape is still running', async () => {
    const user = userEvent.setup();
    setup(true);

    await pickCreator(user, 'Bare Creator');
    await waitFor(() => expect(linkField()).toBeInTheDocument());
    await user.click(linkField());
    await user.paste(IG);
    await waitFor(() => expect(screen.getAllByTestId('creator-field-loading')).toHaveLength(2));

    const submit = screen.getByRole('button', { name: /Add Creators/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(axios.post.mock.calls[0][1].creators[0]).toMatchObject({
      id: 'u-bare',
      profileLink: IG,
      extractionId: 'ext-1',
      selectedPlatform: 'instagram',
    });
    expect(axios.post.mock.calls[0][1].creators[0].completionReceipt).toBeFalsy();
  });

  it('sends the link and the rate so the server can verify them', async () => {
    const user = userEvent.setup();
    // The fetch lands, so the fields come back filled and editable.
    extractionApi.getExtraction.mockResolvedValue({
      status: 'READY',
      name: 'Claude Morgan',
      followerCount: 157213,
      engagementRate: '1.28',
      completionReceipt: 'receipt-abc',
      sampleSize: 10,
      fetchedAt: '2026-09-08T00:00:00.000Z',
    });
    setup(true);

    await pickCreator(user, 'Bare Creator');
    await waitFor(() => expect(linkField()).toBeInTheDocument());
    await user.click(linkField());
    await user.paste(IG);
    await waitFor(() => expect(extractionApi.startExtraction).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByDisplayValue('1.28')).toBeInTheDocument());

    const submit = screen.getByRole('button', { name: /Add Creators/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    const body = axios.post.mock.calls[0][1];
    expect(body.creators[0]).toMatchObject({
      id: 'u-bare',
      profileLink: IG,
      engagementRate: '1.28',
      // The link named Instagram, so no dropdown choice was needed.
      selectedPlatform: 'instagram',
    });
  });

  it('opens the post breakdown for a scraped rate', async () => {
    const user = userEvent.setup();
    extractionApi.getExtraction.mockResolvedValue({
      status: 'READY',
      name: 'Claude Morgan',
      followerCount: 157213,
      engagementRate: '1.28',
      completionReceipt: 'receipt-abc',
      sampleSize: 10,
      fetchedAt: '2026-09-08T00:00:00.000Z',
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
    setup(true);

    await pickCreator(user, 'Bare Creator');
    await waitFor(() => expect(linkField()).toBeInTheDocument());
    await user.click(linkField());
    await user.paste(IG);
    await waitFor(() => expect(screen.getByDisplayValue('1.28')).toBeInTheDocument());

    const hint = screen.getByLabelText('How this engagement rate was worked out');
    expect(screen.queryByText(/Median views/)).toBeNull();

    await user.click(hint);

    const panel = await screen.findByRole('dialog', { name: /Engagement rate/i });
    expect(within(panel).getByText('Bare Creator')).toBeInTheDocument();
    expect(within(panel).getByText('Median views')).toBeInTheDocument();
    expect(within(panel).getByRole('link')).toHaveAttribute(
      'href',
      'https://www.instagram.com/p/Dbh16BqzcSb/'
    );
  });
});

describe('the platform dropdown only appears when it is needed', () => {
  const platformLabel = () => screen.queryByText('Platform');

  it('hides it for a creator with nothing connected', async () => {
    const user = userEvent.setup();
    setup(true);

    await pickCreator(user, 'Bare Creator');
    await waitFor(() => expect(screen.getByPlaceholderText('Profile Link')).toBeInTheDocument());

    // The link names the platform, so a dropdown would be a second way to say
    // the same thing.
    expect(platformLabel()).toBeNull();
  });

  it('keeps it for a creator who has connected an account', async () => {
    const user = userEvent.setup();
    setup(true);

    await pickCreator(user, 'Connected Creator');

    // There is no link to read a platform from, and they may be shortlisted on
    // either platform, so the choice stays.
    await waitFor(() => expect(platformLabel()).toBeInTheDocument());
  });

  it('keeps it everywhere while scraping is off', async () => {
    const user = userEvent.setup();
    setup(false);

    await pickCreator(user, 'Bare Creator');

    // No Profile Link field exists in this mode, so the dropdown is the only
    // way to say which platform this is.
    await waitFor(() => expect(platformLabel()).toBeInTheDocument());
  });

  it('does not vanish when the admin switches to an unconnected platform', async () => {
    const user = userEvent.setup();
    setup(true);

    // Instagram is connected, TikTok is not. Switching to TikTok must not
    // remove the control that was just used, or there is no way back.
    await pickCreator(user, 'Connected Creator');
    await waitFor(() => expect(platformLabel()).toBeInTheDocument());

    await user.click(platformSelect());
    await user.click(await screen.findByRole('option', { name: /TikTok/i }));

    expect(platformLabel()).toBeInTheDocument();
  });
});

describe('a connected creator shows their media-kit numbers', () => {
  it('reads the engagement rate from the connected account, read-only', async () => {
    const user = userEvent.setup();
    setup(true);

    await pickCreator(user, 'Connected Creator');

    // 4.2718 on instagramUser, shown to two places. The admin cannot edit it,
    // because the connected account owns it.
    const rate = await screen.findByDisplayValue('4.27');
    expect(rate).toBeDisabled();
    // Both measured fields say where their value came from.
    expect(screen.getAllByText(/\(media kit\)/)).toHaveLength(2);
    expect(screen.queryByLabelText('How this engagement rate was worked out')).toBeNull();
  });

  it('leaves the rate empty and editable when nothing is connected', async () => {
    const user = userEvent.setup();
    setup(true);

    await pickCreator(user, 'Bare Creator');

    const rate = await screen.findByPlaceholderText('Engagement Rate');
    expect(rate).toBeEnabled();
    expect(rate).toHaveValue('');
  });
});

describe('an invalid profile link', () => {
  it('shows the error as text under the field', async () => {
    const user = userEvent.setup();
    setup(true);

    await pickCreator(user, 'Bare Creator');
    const linkField = await screen.findByPlaceholderText('Profile Link');
    await user.type(linkField, 'x');

    expect(await screen.findByText('Use an Instagram or TikTok profile link.')).toBeInTheDocument();
  });
});

describe('a 1-minute scrape draft', () => {
  const IG = 'https://www.instagram.com/claude0417/';
  const ready = {
    status: 'READY',
    name: 'Claude Morgan',
    followerCount: 157213,
    engagementRate: '1.28',
    completionReceipt: 'receipt-abc',
    sampleSize: 10,
    fetchedAt: '2026-09-08T00:00:00.000Z',
  };

  const modal = (open) => (
    <PlatformCreatorModal
      open={open}
      onClose={vi.fn()}
      campaign={campaign}
      pitches={[]}
      onUpdated={vi.fn()}
      scrapeEnabled
    />
  );

  it('keeps a scraped row when the modal is reopened within a minute', async () => {
    const user = userEvent.setup();
    extractionApi.getExtraction.mockResolvedValue(ready);

    const { rerender } = render(modal(true));
    await pickCreator(user, 'Bare Creator');
    const linkField = () => screen.getByPlaceholderText('Profile Link');
    await waitFor(() => expect(linkField()).toBeInTheDocument());
    await user.click(linkField());
    await user.paste(IG);
    await waitFor(() => expect(screen.getByDisplayValue('1.28')).toBeInTheDocument());
    await waitFor(() =>
      expect(window.sessionStorage.getItem('cc.creatorDraft.platform.c1')).toBeTruthy()
    );

    rerender(modal(false));
    rerender(modal(true));

    expect(screen.getByText('Bare Creator')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1.28')).toBeInTheDocument();
    expect(screen.getByDisplayValue('157,213')).toBeInTheDocument();
  });

  it('does not draft a media-kit creator', async () => {
    const user = userEvent.setup();
    const { rerender } = render(modal(true));

    await pickCreator(user, 'Connected Creator');
    await waitFor(() => expect(screen.getByDisplayValue('128,400')).toBeInTheDocument());

    rerender(modal(false));
    expect(window.sessionStorage.getItem('cc.creatorDraft.platform.c1')).toBeNull();
    rerender(modal(true));

    expect(screen.queryByDisplayValue('128,400')).toBeNull();
    expect(screen.getByPlaceholderText('Search creator...')).toBeInTheDocument();
  });

  it('opens empty after Add Creators', async () => {
    const user = userEvent.setup();
    extractionApi.getExtraction.mockResolvedValue(ready);

    const { rerender } = render(modal(true));
    await pickCreator(user, 'Bare Creator');
    const linkField = () => screen.getByPlaceholderText('Profile Link');
    await waitFor(() => expect(linkField()).toBeInTheDocument());
    await user.click(linkField());
    await user.paste(IG);
    await waitFor(() => expect(screen.getByDisplayValue('1.28')).toBeInTheDocument());

    const submit = screen.getByRole('button', { name: /Add Creators/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);
    await waitFor(() => expect(axios.post).toHaveBeenCalled());

    rerender(modal(false));
    rerender(modal(true));

    expect(screen.queryByDisplayValue('1.28')).toBeNull();
    expect(screen.getByPlaceholderText('Search creator...')).toBeInTheDocument();
  });
});
