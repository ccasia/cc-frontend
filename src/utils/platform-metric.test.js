import { it, expect, describe } from 'vitest';

import {
  metricLabel,
  parseRecentViews,
  formatPrimaryMetric,
  hasSafePrimaryMetric,
  isRecentViewsPlatform,
  normalizePrimaryMetric,
  formatPrimaryMetricInput,
  sanitizePrimaryMetricInput,
} from './platform-metric';

describe('parseRecentViews mirrors the backend parser', () => {
  it.each([
    ['1300000', '1300000'],
    [1300000, '1300000'],
    ['1,300,000', '1300000'],
    ['1.3M', '1300000'],
    ['1.3m recent views', '1300000'],
    ['850k', '850000'],
    ['850K views', '850000'],
    ['2B', '2000000000'],
    ['0', '0'],
    [' 12 345 ', '12345'],
  ])('%s -> %s', (input, expected) => {
    expect(parseRecentViews(input)).toBe(expected);
  });

  it.each([null, undefined, '', '   ', 'views'])('%s is empty', (input) => {
    expect(parseRecentViews(input)).toBeNull();
  });

  it.each(['1.5', '4.2%', '1.3MM', 'abc', '-5', '1.2.3M', '1001B', {}])(
    '%s is invalid',
    (input) => {
      expect(parseRecentViews(input)).toBe('invalid');
    }
  );
});

describe('primary metric per platform', () => {
  it('only Threads uses Recent Views', () => {
    expect(isRecentViewsPlatform('threads')).toBe(true);
    expect(isRecentViewsPlatform('instagram')).toBe(false);
    expect(metricLabel('threads')).toBe('Recent Views');
    expect(metricLabel('threads', { short: true })).toBe('Recent views');
    expect(metricLabel('tiktok')).toBe('Engagement Rate');
    expect(metricLabel(null, { short: true })).toBe('Engagement rate');
  });

  it('validates each slot by its own rule', () => {
    expect(hasSafePrimaryMetric('threads', '1.3M')).toBe(true);
    expect(hasSafePrimaryMetric('threads', '')).toBe(false);
    expect(hasSafePrimaryMetric('threads', '4.2%')).toBe(false);
    expect(hasSafePrimaryMetric('instagram', '4.27')).toBe(true);
    expect(hasSafePrimaryMetric('instagram', '1.3M')).toBe(false);
    expect(hasSafePrimaryMetric('tiktok', '1001')).toBe(false);
  });

  it('formats Recent Views as a number and a rate as a percent', () => {
    expect(formatPrimaryMetric('threads', '1300000')).toBe('1,300,000');
    expect(formatPrimaryMetric('threads', 1300000, { compact: true })).toBe('1.3M');
    expect(formatPrimaryMetric('threads', '')).toBeNull();
    expect(formatPrimaryMetric('instagram', '5.40')).toBe('5.4%');
    expect(formatPrimaryMetric('tiktok', null)).toBeNull();
  });

  it('sanitizes input per platform', () => {
    expect(sanitizePrimaryMetricInput('threads', '1.3M recent views')).toBe('1.3M');
    expect(sanitizePrimaryMetricInput('threads', '1,300,000')).toBe('1300000');
    expect(sanitizePrimaryMetricInput('instagram', '4.2.7%')).toBe('4.2.7');
    expect(sanitizePrimaryMetricInput('threads', '1.2.3M')).toBe('1.2.3M');
  });

  it('rejects a second dot instead of joining the parts', () => {
    expect(hasSafePrimaryMetric('threads', '1.2.3M')).toBe(false);
    expect(hasSafePrimaryMetric('instagram', '4.2.7')).toBe(false);
  });

  it('adds commas to typed Recent Views digits only', () => {
    expect(formatPrimaryMetricInput('threads', '1250000')).toBe('1,250,000');
    expect(formatPrimaryMetricInput('threads', '1.3M')).toBe('1.3M');
    expect(formatPrimaryMetricInput('threads', '')).toBe('');
    expect(formatPrimaryMetricInput('instagram', '1250')).toBe('1250');
  });

  it('normalizes only Threads for the request', () => {
    expect(normalizePrimaryMetric('threads', '1.3M')).toBe('1300000');
    expect(normalizePrimaryMetric('threads', '')).toBe('');
    expect(normalizePrimaryMetric('instagram', '4.27')).toBe('4.27');
  });
});
