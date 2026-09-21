import { render, screen } from '@testing-library/react';
import { it, vi, expect, describe, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({ submissions: [] }));

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [new URLSearchParams()],
}));

vi.mock('src/hooks/socket', () => ({
  default: { on: vi.fn(), off: vi.fn() },
}));

vi.mock('src/hooks/use-get-v4-submissions', () => ({
  useGetV4Submissions: () => ({
    submissions: mocks.submissions,
    grouped: {},
    submissionsLoading: false,
    submissionsMutate: vi.fn(),
  }),
}));

vi.mock('src/auth/hooks', () => ({
  useAuthContext: () => ({ user: { id: 'admin-1', role: 'admin' } }),
}));

vi.mock('./submissions/v4/video-submission', () => ({ default: () => null }));
vi.mock('./submissions/v4/photo-submission', () => ({ default: () => null }));
vi.mock('./submissions/v4/raw-footage-submission', () => ({ default: () => null }));
vi.mock('./submissions/v4/mobile/mobile-creator-submissions', () => ({ default: () => null }));
vi.mock('./submissions/v4/shared/use-v4-submission-list-socket', () => ({ default: vi.fn() }));

const { default: CampaignCreatorSubmissionsV4 } = await import(
  './campaign-creator-submissions-v4'
);

const campaign = {
  id: 'campaign-1',
  submissionVersion: 'v4',
  shortlisted: [
    {
      id: 'shortlist-1',
      userId: 'creator-1',
      user: { id: 'creator-1', name: 'Alex Creator', email: 'alex@example.com' },
    },
  ],
  logistics: [],
};

beforeEach(() => {
  mocks.submissions = [];
});

describe('CampaignCreatorSubmissionsV4 empty state', () => {
  it('shows guidance and hides list controls when the campaign has no content submissions', () => {
    render(<CampaignCreatorSubmissionsV4 campaign={campaign} />);

    expect(screen.getByText('No creator submissions yet')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Creator submissions will appear here once creators are ready to submit content.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Search creators...')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /alphabetical/i })).not.toBeInTheDocument();
  });

  it('does not count an agreement as a creator content submission', () => {
    mocks.submissions = [{ id: 'agreement-1', submissionType: { type: 'AGREEMENT_FORM' } }];

    render(<CampaignCreatorSubmissionsV4 campaign={campaign} />);

    expect(screen.getByText('No creator submissions yet')).toBeInTheDocument();
  });
});
