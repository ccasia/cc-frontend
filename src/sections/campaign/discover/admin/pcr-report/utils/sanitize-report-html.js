import DOMPurify from 'dompurify';

export const sanitizeReportHtml = (html) =>
  DOMPurify.sanitize(html || '', {
    ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 'br', 'div', 'span'],
    ALLOWED_ATTR: [],
  });
