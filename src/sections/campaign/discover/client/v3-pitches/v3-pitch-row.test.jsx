import { it, vi, expect, describe, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: vi.fn() }) }));
vi.mock('react-router-dom', () => ({
  Link: ({ children }) => children,
}));
vi.mock('src/auth/hooks', () => ({
  useAuthContext: () => ({ user: { id: 'admin-1', role: 'admin' } }),
}));
vi.mock('src/hooks/use-responsive', () => ({ useResponsive: () => true }));
vi.mock('src/utils/axios', () => ({
  default: { patch: vi.fn() },
  endpoints: { campaign: { pitch: { v3: { outreachStatus: () => '/x' } } } },
}));
vi.mock('./v3-pitch-actions', () => ({ default: () => null }));

const { default: PitchRow } = await import('./v3-pitch-row');

const basePitch = {
  id: 'p1',
  userId: 'u1',
  type: 'shortlisted',
  status: 'SENT_TO_CLIENT',
  createdAt: '2026-09-09T00:00:00.000Z',
  user: { id: 'u1', name: 'Lina King', photoURL: null, creator: { isGuest: true } },
};

const renderRow = (pitch) =>
  render(
    <table>
      <tbody>
        <PitchRow
          pitch={pitch}
          displayStatus="SENT_TO_CLIENT"
          statusInfo={{ color: '#1340FF', borderColor: '#1340FF' }}
          isGuestCreator
          campaign={{ id: 'c1' }}
          onViewPitch={() => {}}
        />
      </tbody>
    </table>
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe('pending scrape metrics', () => {
  it('shows loading on followers and engagement while pendingExtractionId is set', () => {
    renderRow({ ...basePitch, pendingExtractionId: 'ext-1' });

    expect(screen.getAllByTestId('creator-field-loading')).toHaveLength(2);
    expect(screen.getByLabelText('Fetching engagement rate')).toBeInTheDocument();
    expect(screen.getByLabelText('Fetching follower count')).toBeInTheDocument();
  });

  it('shows the numbers once the pending link is gone', () => {
    renderRow({
      ...basePitch,
      pendingExtractionId: null,
      followerCount: '6849',
      engagementRate: '4.08',
    });

    expect(screen.queryByTestId('creator-field-loading')).toBeNull();
    expect(screen.getByText('4.08%')).toBeInTheDocument();
    expect(screen.queryByTestId('dia-text-reveal')).toBeNull();
  });

  it('reveals the numbers with Dia text when scrape loading ends', () => {
    const { rerender } = render(
      <table>
        <tbody>
          <PitchRow
            pitch={{ ...basePitch, pendingExtractionId: 'ext-1' }}
            displayStatus="SENT_TO_CLIENT"
            statusInfo={{ color: '#1340FF', borderColor: '#1340FF' }}
            isGuestCreator
            campaign={{ id: 'c1' }}
            onViewPitch={() => {}}
          />
        </tbody>
      </table>
    );

    rerender(
      <table>
        <tbody>
          <PitchRow
            pitch={{
              ...basePitch,
              pendingExtractionId: null,
              followerCount: '6849',
              engagementRate: '4.08',
              _creditTier: { name: 'Macro', creditsPerVideo: 8 },
            }}
            displayStatus="SENT_TO_CLIENT"
            statusInfo={{ color: '#1340FF', borderColor: '#1340FF' }}
            isGuestCreator
            campaign={{ id: 'c1' }}
            onViewPitch={() => {}}
          />
        </tbody>
      </table>
    );

    expect(screen.queryByTestId('creator-field-loading')).toBeNull();
    expect(screen.getAllByTestId('dia-text-reveal')).toHaveLength(5);
    expect(screen.getByText('Lina King')).toBeInTheDocument();
    expect(screen.getByText('4.08%')).toBeInTheDocument();
    expect(screen.getByText('Macro')).toBeInTheDocument();
    expect(screen.getByText('8 Credits')).toBeInTheDocument();
  });
});
