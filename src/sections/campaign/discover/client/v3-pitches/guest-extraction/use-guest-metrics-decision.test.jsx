import { it, vi, expect, describe, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('./guest-extraction-api', () => ({
  fetchFeatureDecision: vi.fn(),
  newIdempotencyKey: () => 'key-1',
  startExtraction: vi.fn(),
  getExtraction: vi.fn(),
  listResumableExtractions: vi.fn(async () => []),
  saveGuestCreators: vi.fn(),
}));

const api = await import('./guest-extraction-api');
const { default: useGuestMetricsDecision } = await import('./use-guest-metrics-decision');

/** The parent picks a dialog from this hook, so read it through a probe. */
function Probe() {
  const { enabled, loading, decision } = useGuestMetricsDecision();
  const label = loading ? 'loading' : 'manual';
  return (
    <div>
      <span data-testid="flow">{enabled && !loading ? 'automatic' : label}</span>
      <span data-testid="reason">{decision.reason}</span>
    </div>
  );
}

const flow = () => screen.getByTestId('flow').textContent;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('the browser never decides', () => {
  it('shows the manual flow while the answer is still unknown', () => {
    api.fetchFeatureDecision.mockReturnValue(new Promise(() => {}));
    render(<Probe />);
    expect(flow()).toBe('loading');
  });

  it('shows the automatic flow only when the server enables it', async () => {
    api.fetchFeatureDecision.mockResolvedValue({ enabled: true, reason: 'allowlisted' });
    render(<Probe />);

    await waitFor(() => expect(flow()).toBe('automatic'));
    expect(screen.getByTestId('reason').textContent).toBe('allowlisted');
  });

  it('shows the manual flow when the server disables it', async () => {
    api.fetchFeatureDecision.mockResolvedValue({ enabled: false, reason: 'not_allowlisted' });
    render(<Probe />);

    await waitFor(() => expect(flow()).toBe('manual'));
    expect(screen.getByTestId('reason').textContent).toBe('not_allowlisted');
  });

  it('falls back to the manual flow when the decision call fails', async () => {
    api.fetchFeatureDecision.mockRejectedValue(new Error('500'));
    render(<Probe />);

    await waitFor(() => expect(flow()).toBe('manual'));
    expect(screen.getByTestId('reason').textContent).toBe('disabled');
  });

  it('asks the server once', async () => {
    api.fetchFeatureDecision.mockResolvedValue({ enabled: true, reason: 'enabled' });
    render(<Probe />);

    await waitFor(() => expect(flow()).toBe('automatic'));
    expect(api.fetchFeatureDecision).toHaveBeenCalledTimes(1);
  });
});

describe('the parent keeps both flows', () => {
  it('renders the automatic dialog only on the enabled branch', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      'src/sections/campaign/discover/client/v3-pitches/campaign-v3-pitches.jsx',
      'utf8'
    );

    expect(source).toContain('guestMetricsEnabled ? (');
    expect(source).toContain('<AutomaticCreatorScrapeDialog');
    // The current manual component stays, on the other branch.
    expect(source).toContain('<NonPlatformCreatorFormDialog');
    expect(source).toContain('export function NonPlatformCreatorFormDialog');
  });
});
