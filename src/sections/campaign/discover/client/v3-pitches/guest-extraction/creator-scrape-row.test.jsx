import { it, vi, expect, describe } from 'vitest';
import { render, screen } from '@testing-library/react';

import CreatorScrapeRow from './creator-scrape-row';
import { createRow, ROW_STATUS } from './creator-row-machine';

const dispatch = vi.fn();
const onLinkChange = vi.fn();

describe('Dia reveal after scrape', () => {
  it('sweeps name, rate, and followers when loading ends', () => {
    const loadingRow = createRow({
      status: ROW_STATUS.RUNNING,
      profileLink: 'https://www.instagram.com/jisoo/',
      platform: 'instagram',
    });

    const { rerender } = render(
      <CreatorScrapeRow row={loadingRow} dispatch={dispatch} onLinkChange={onLinkChange} />
    );

    expect(screen.getAllByTestId('creator-field-loading')).toHaveLength(3);

    rerender(
      <CreatorScrapeRow
        row={{
          ...loadingRow,
          status: ROW_STATUS.READY,
          name: 'JISOO',
          engagementRate: '4.08',
          followerCount: '6849',
        }}
        dispatch={dispatch}
        onLinkChange={onLinkChange}
      />
    );

    expect(screen.queryByTestId('creator-field-loading')).toBeNull();
    expect(screen.getAllByTestId('dia-text-reveal')).toHaveLength(3);
    expect(screen.getByDisplayValue('JISOO')).toBeInTheDocument();
    expect(screen.getByDisplayValue('4.08')).toBeInTheDocument();
  });
});

describe('a Threads row', () => {
  const threadsRow = (engagementRate) =>
    createRow({
      status: ROW_STATUS.READY,
      profileLink: 'https://www.threads.com/@example',
      platform: 'threads',
      name: 'Example',
      followerCount: '36',
      engagementRate,
    });

  it('asks for Recent Views without a percent sign', () => {
    render(
      <CreatorScrapeRow row={threadsRow('')} dispatch={dispatch} onLinkChange={onLinkChange} />
    );
    expect(screen.getByText('Recent Views')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Recent Views')).toBeInTheDocument();
    expect(screen.getByText('Copy from the Threads app')).toBeInTheDocument();
    expect(screen.queryByText('%')).toBeNull();
    expect(screen.queryByLabelText('How this engagement rate was worked out')).toBeNull();
  });

  it('shows typed Recent Views with commas and never as edited', () => {
    render(
      <CreatorScrapeRow
        row={threadsRow('1250000')}
        dispatch={dispatch}
        onLinkChange={onLinkChange}
      />
    );
    expect(screen.getByDisplayValue('1,250,000')).toBeInTheDocument();
    expect(screen.getByText('Recent Views')).toBeInTheDocument();
    expect(screen.queryByText(/Recent Views \(edited\)/)).toBeNull();
  });

  it('flags a second dot instead of joining the parts', () => {
    render(
      <CreatorScrapeRow
        row={threadsRow('1.2.3M')}
        dispatch={dispatch}
        onLinkChange={onLinkChange}
      />
    );
    expect(screen.getByDisplayValue('1.2.3M')).toBeInTheDocument();
    expect(
      screen.getByText('Enter recent views as a whole number, for example 1,300,000 or 1.3M.')
    ).toBeInTheDocument();
  });

  it('flags Recent Views that do not parse', () => {
    render(
      <CreatorScrapeRow row={threadsRow('1.3%')} dispatch={dispatch} onLinkChange={onLinkChange} />
    );
    expect(
      screen.getByText('Enter recent views as a whole number, for example 1,300,000 or 1.3M.')
    ).toBeInTheDocument();
  });
});
