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
