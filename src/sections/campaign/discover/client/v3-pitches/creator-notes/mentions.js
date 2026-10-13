// Stored as @[Name](userId) so names with spaces survive; the composer shows plain @Name.
const TOKEN = /@\[([^\]]+)\]\(([^)]+)\)/g;

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const toNoteSegments = (text = '') => {
  const segments = [];
  let last = 0;

  text.replace(TOKEN, (match, name, id, offset) => {
    if (offset > last) segments.push({ type: 'text', value: text.slice(last, offset) });
    segments.push({ type: 'mention', name, id });
    last = offset + match.length;
    return match;
  });

  if (last < text.length) segments.push({ type: 'text', value: text.slice(last) });
  return segments;
};

export const toPlainText = (text = '') => text.replace(TOKEN, '@$1');

export const encodeMentions = (draft, participants = []) =>
  [...participants]
    .filter((p) => p?.name)
    // Longest first, so "@Mei Ling" is not claimed by a participant named "Mei".
    .sort((a, b) => b.name.length - a.name.length)
    .reduce(
      (text, p) =>
        text.replace(new RegExp(`@${escapeRegExp(p.name)}(?![\\w])`, 'g'), `@[${p.name}](${p.id})`),
      draft
    );

// The @word being typed just before the caret, if any.
export const getMentionQuery = (value, caret) => {
  const match = /(^|\s)@([^\s@]*)$/.exec(value.slice(0, caret));

  if (!match) return null;

  return { start: caret - match[2].length - 1, query: match[2] };
};
