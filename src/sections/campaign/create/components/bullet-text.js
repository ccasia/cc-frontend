const BLOCK_TAGS = new Set([
  'P',
  'DIV',
  'UL',
  'OL',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'TR',
  'BLOCKQUOTE',
]);
const BULLET_GLYPHS = /^(\s*)[•·◦▪●○■]\s*/gm;
const LIST_LINE = /^(\s*)(•|-|\*|(\d+)([.)]))\s+(.*)$/;

// Turns copied HTML into plain lines, and keeps list items as "• item" / "1. item"
const htmlToText = (html) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const lines = [];
  let current = '';

  const flush = () => {
    if (current.trim()) lines.push(current.trimEnd());
    current = '';
  };

  const walk = (node, depth) => {
    if (node.nodeType === Node.TEXT_NODE) {
      current += node.textContent.replace(/\s+/g, ' ');
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const { tagName } = node;
    if (tagName === 'BR') {
      flush();
      return;
    }
    if (tagName === 'LI') {
      flush();
      const list = node.parentElement;
      const order =
        list?.tagName === 'OL' ? `${Array.from(list.children).indexOf(node) + 1}. ` : '• ';
      current = `${'  '.repeat(Math.max(depth - 1, 0))}${order}`;
      node.childNodes.forEach((child) => walk(child, depth));
      flush();
      return;
    }
    const isList = tagName === 'UL' || tagName === 'OL';
    if (BLOCK_TAGS.has(tagName)) flush();
    node.childNodes.forEach((child) => walk(child, isList ? depth + 1 : depth));
    if (BLOCK_TAGS.has(tagName)) flush();
  };

  walk(doc.body, 0);
  flush();
  return lines.join('\n');
};

// Inserts text at the selection so the browser keeps undo history and React sees the change
const insertText = (el, text, start, end) => {
  el.setSelectionRange(start, end);
  const done = text
    ? document.execCommand('insertText', false, text)
    : document.execCommand('delete');
  if (done) return;
  const next = el.value.slice(0, start) + text + el.value.slice(end);
  const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
  setValue.call(el, next);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.setSelectionRange(start + text.length, start + text.length);
};

const handlePaste = (event) => {
  const html = event.clipboardData.getData('text/html');
  const plain = event.clipboardData.getData('text/plain');
  const text = /<li[\s>]/i.test(html) ? htmlToText(html) : plain.replace(BULLET_GLYPHS, '$1• ');
  if (!text || text === plain) return;
  event.preventDefault();
  const el = event.target;
  insertText(el, text, el.selectionStart, el.selectionEnd);
};

// Enter on a list line starts the next item; Enter on an empty item ends the list
const handleKeyDown = (event) => {
  if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
  const el = event.target;
  const { selectionStart: start, selectionEnd: end, value } = el;
  if (start !== end) return;
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const lineEnd = value.indexOf('\n', start);
  const line = value.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
  const match = line.match(LIST_LINE);
  if (!match) return;
  const [prefixAndContent, indent, marker, number, separator, content] = match;
  if (start - lineStart < prefixAndContent.length - content.length) return;
  event.preventDefault();
  if (!content.trim()) {
    insertText(el, '', lineStart, lineStart + line.length);
    return;
  }
  const nextMarker = number ? `${Number(number) + 1}${separator}` : marker;
  insertText(el, `\n${indent}${nextMarker} `, start, start);
};

export const bulletInputProps = { onPaste: handlePaste, onKeyDown: handleKeyDown };
