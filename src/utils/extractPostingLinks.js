const isValidSubmission = (submission) => {
  const content = submission.content?.toLowerCase() || '';

  const hasValidContent = content.includes('instagram.com') || content.includes('tiktok.com');
  const isRecent = new Date(submission.createdAt) > new Date('2023-01-01');

  return hasValidContent && isRecent;
};

// Normalize a post URL so that cosmetic variants (www., m., tracking params like ?igsh=,
// trailing slashes, case) collapse to the same canonical key.
export const canonicalizePostUrl = (url) => {
  if (!url) return '';
  const raw = String(url).trim();
  if (!raw) return '';

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase().replace(/^(www\.|m\.|vm\.|vt\.)/, '');
    const path = parsed.pathname.replace(/\/+$/, '').toLowerCase();
    return `${host}${path}`;
  } catch {
    return raw
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^(www\.|m\.|vm\.|vt\.)/, '')
      .split('?')[0]
      .split('#')[0]
      .replace(/\/+$/, '');
  }
};

export const extractPostingSubmissions = (submissions) => {
  if (!Array.isArray(submissions)) return [];

  const postings = submissions.filter((submission) => {
    const isV3Posting =
      submission.submissionType.type === 'POSTING' && submission.status === 'APPROVED';
    const isV4PostedWithLink =
      ['PHOTO', 'VIDEO'].includes(submission.submissionType.type) &&
      submission.status === 'POSTED' &&
      submission.content;

    return isV3Posting || isV4PostedWithLink;
  });

  const extractedSubmissions = [];
  const validPostings = postings.filter(isValidSubmission);

  validPostings.forEach((submission) => {
    const instagramRegex = /https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|reels|tv)\/[A-Za-z0-9_-]+(?:\?[^\s]*)?/gi;
    const tiktokRegex = /https?:\/\/(?:www\.|m\.|vm\.|vt\.)?tiktok\.com\/(?:@[^\s/]+\/video\/[0-9]+|t\/[A-Za-z0-9]+|[^\s]+)(?:\?[^\s]*)?/gi;

    const instagramMatches = [...(submission.content.matchAll(instagramRegex) || [])];
    const tiktokMatches = [...(submission.content.matchAll(tiktokRegex) || [])];

    instagramMatches.forEach((match) => {
      const cleanUrl = match[0].replace(/[.,;!?]+$/, '');
      extractedSubmissions.push({
        id: submission.id,
        type: submission.submissionType.type,
        content: submission.content,
        user: submission.userId,
        submissionId: submission.id,
        platform: 'Instagram',
        postUrl: cleanUrl,
        campaignName: submission.campaignId || 'Unknown Campaign',
        createdAt: submission.createdAt,
        isV4: ['PHOTO', 'VIDEO'].includes(submission.submissionType.type),
      });
    });

    tiktokMatches.forEach((match) => {
      const cleanUrl = match[0].replace(/[.,;!?]+$/, '');
      extractedSubmissions.push({
        id: submission.id,
        type: submission.submissionType.type,
        content: submission.content,
        user: submission.userId,
        submissionId: submission.id,
        platform: 'TikTok',
        postUrl: cleanUrl,
        campaignName: submission.campaignId || 'Unknown Campaign',
        createdAt: submission.createdAt,
        isV4: ['PHOTO', 'VIDEO'].includes(submission.submissionType.type),
      });
    });
  });

  // Deduplicate by (user, platform, canonicalUrl) so that the same post pasted with different
  // tracking params (?igsh=...), with/without www, or with a trailing slash collapses to one row.
  const seen = new Set();
  const uniqueSubmissions = extractedSubmissions.filter((sub) => {
    const canonical = canonicalizePostUrl(sub.postUrl);
    const key = `${sub.user}_${sub.platform}_${canonical}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return uniqueSubmissions;
};
