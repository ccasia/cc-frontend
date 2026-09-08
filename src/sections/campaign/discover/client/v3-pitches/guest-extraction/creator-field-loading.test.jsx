import { it, expect, describe } from 'vitest';
import { render, screen } from '@testing-library/react';

import CreatorFieldLoading from './creator-field-loading';
import { setReducedMotion } from '../../../../../../../vitest.setup';
import { CC, FIELD_HEIGHT, SHIMMER_DURATION_MS, SPINNER_DURATION_MS } from './creator-field-tokens';

const style = (testId) => window.getComputedStyle(screen.getByTestId(testId));

/** jsdom does not expand CSS shorthands, so read the injected rules instead. */
const injectedCss = () =>
  Array.from(document.querySelectorAll('style'))
    .map((tag) => tag.textContent)
    .join('');

describe('the loading field matches the design handoff', () => {
  it('matches the height of the fields around it, so the row never jumps', () => {
    render(<CreatorFieldLoading />);
    expect(style('creator-field-loading').height).toBe(`${FIELD_HEIGHT}px`);
    // The handoff specifies a 44px input.
    expect(FIELD_HEIGHT).toBe(44);
  });

  it('uses the brand blue', () => {
    expect(CC.blue500).toBe('#1340FF');
    expect(CC.blue100).toBe('rgba(19, 64, 255, 0.1)');
  });

  it('greys the field while it loads', () => {
    render(<CreatorFieldLoading />);
    expect(style('creator-field-loading').backgroundColor).toBe('rgb(255, 255, 255)');
  });

  it('runs the shimmer at the handoff timing', () => {
    render(<CreatorFieldLoading />);
    const { animation } = style('creator-field-shimmer');

    expect(animation).toContain(`${SHIMMER_DURATION_MS}ms`);
    expect(animation).toContain('linear');
    expect(animation).toContain('infinite');
  });

  it('scrolls the gradient the way the prototype does', () => {
    render(<CreatorFieldLoading />);
    const css = injectedCss();

    expect(css).toContain('background-size:600px 100%');
    expect(css).toContain('background-position:-300px 0');
    expect(css).toContain('background-position:300px 0');
    expect(style('creator-field-shimmer').background).toContain('rgba(19, 64, 255, 0.1) 50%');
  });

  it('shows the spinner only when asked', () => {
    const { rerender } = render(<CreatorFieldLoading />);
    expect(screen.queryByTestId('creator-field-spinner')).toBeNull();

    rerender(<CreatorFieldLoading showSpinner />);
    const spinner = style('creator-field-spinner');
    expect(spinner.width).toBe('16px');
    expect(spinner.animation).toContain(`${SPINNER_DURATION_MS}ms`);
    expect(spinner.borderTopColor).toBe('rgb(19, 64, 255)');
  });
});

describe('accessibility', () => {
  it('marks the field busy and announces it', () => {
    render(<CreatorFieldLoading label="Fetching engagement rate" />);
    const field = screen.getByTestId('creator-field-loading');

    expect(field).toHaveAttribute('aria-busy', 'true');
    expect(field).toHaveAttribute('aria-live', 'polite');
    expect(field).toHaveAttribute('role', 'status');
    expect(field).toHaveAccessibleName('Fetching engagement rate');
  });

  it('has a sensible default announcement', () => {
    render(<CreatorFieldLoading />);
    expect(screen.getByTestId('creator-field-loading')).toHaveAccessibleName(
      'Fetching creator details'
    );
  });
});

describe('reduced motion', () => {
  it('shows a static blue placeholder instead of the shimmer', () => {
    setReducedMotion(true);
    render(<CreatorFieldLoading showSpinner />);

    const shimmer = style('creator-field-shimmer');
    expect(shimmer.animation).toBe('');
    expect(shimmer.backgroundColor).toBe('rgba(19, 64, 255, 0.1)');

    expect(style('creator-field-spinner').animation).toBe('');
    setReducedMotion(false);
  });

  it('still marks the field busy with reduced motion', () => {
    setReducedMotion(true);
    render(<CreatorFieldLoading />);
    expect(screen.getByTestId('creator-field-loading')).toHaveAttribute('aria-busy', 'true');
    setReducedMotion(false);
  });
});

describe('the runtime never touches the prototype asset', () => {
  it('renders no iframe, no fetch, and no external asset', () => {
    const { container } = render(<CreatorFieldLoading showSpinner />);
    expect(container.querySelector('iframe')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container.innerHTML).not.toMatch(/loading-ani|\.dc\.html|support\.js/);
  });
});
