import { it, expect, describe } from 'vitest';

import { toPlainText, encodeMentions, toNoteSegments, getMentionQuery } from './mentions';

const participants = [
  { id: 'u1', name: 'Mei' },
  { id: 'u2', name: 'Mei Ling' },
  { id: 'u3', name: 'Haris' },
];

describe('encodeMentions', () => {
  it('prefers the longest matching name', () => {
    expect(encodeMentions('@Mei Ling and @Mei', participants)).toBe(
      '@[Mei Ling](u2) and @[Mei](u1)'
    );
  });

  it('leaves unknown names and partial words alone', () => {
    expect(encodeMentions('@Harison @Nobody', participants)).toBe('@Harison @Nobody');
  });
});

describe('toNoteSegments', () => {
  it('splits text around mention tokens', () => {
    expect(toNoteSegments('hi @[Haris](u3), check')).toEqual([
      { type: 'text', value: 'hi ' },
      { type: 'mention', name: 'Haris', id: 'u3' },
      { type: 'text', value: ', check' },
    ]);
  });
});

describe('toPlainText', () => {
  it('drops the user id from tokens', () => {
    expect(toPlainText('@[Mei Ling](u2) ok')).toBe('@Mei Ling ok');
  });
});

describe('getMentionQuery', () => {
  it('finds the @word before the caret', () => {
    expect(getMentionQuery('ping @Me', 8)).toEqual({ start: 5, query: 'Me' });
  });

  it('ignores @ inside a word', () => {
    expect(getMentionQuery('mail@host', 9)).toBeNull();
  });
});
