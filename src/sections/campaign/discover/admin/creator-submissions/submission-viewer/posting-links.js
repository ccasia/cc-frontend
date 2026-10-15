// Posting link rules for the viewer. Mirrors cc-backend/src/utils/postingLinkValidation.ts
// (the backend has the final say) so admins get the same messages inline, before submitting.

export const MAX_POSTING_LINKS = 2;

const TIKTOK_HOSTS = [
  'tiktok.com',
  'www.tiktok.com',
  'm.tiktok.com',
  'vm.tiktok.com',
  'vt.tiktok.com',
];
const INSTAGRAM_HOSTS = ['instagram.com', 'www.instagram.com', 'm.instagram.com'];

const KNOWN_HOST_WITHOUT_SCHEME = /^(?:(?:www|m|vm|vt)\.)?(?:tiktok|instagram)\.com(?:[/?#]|$)/i;
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;
const TIKTOK_POST_PATH = /^\/@[^/]+\/(?:video|photo)\/\d+/;
const TIKTOK_SHORT_PATH = /^\/t\/[\w-]+/;
const INSTAGRAM_POST_PATH = /^\/(?:[\w.]+\/)?(?:p|reels?|tv)\/[\w-]+/;

const NOT_A_LINK =
  "Not a TikTok or Instagram link. Paste the post's link, e.g. https://www.tiktok.com/@name/video/123.";

/**
 * Checks one link. Returns { link } with https:// added / http upgraded, or { error } with a
 * message the admin can act on. Empty input returns {} (nothing to check).
 */
export const checkPostingLink = (rawLink) => {
  let value = (rawLink || '').trim();
  if (!value) return {};

  if (/\s/.test(value)) {
    return {
      error: /(?:tiktok|instagram)\.com/i.test(value)
        ? 'This link has a space in it. Paste just the link.'
        : NOT_A_LINK,
    };
  }

  if (!HAS_SCHEME.test(value)) {
    if (!KNOWN_HOST_WITHOUT_SCHEME.test(value)) return { error: NOT_A_LINK };
    value = `https://${value}`;
  }

  let url;
  try {
    url = new URL(value);
  } catch (e) {
    return { error: "This isn't a valid link. Check it for typos." };
  }

  if (url.protocol === 'http:') url.protocol = 'https:';
  if (url.protocol !== 'https:')
    return { error: 'This should be a web link starting with https://.' };

  const host = url.hostname.toLowerCase();
  const path = url.pathname;

  if (TIKTOK_HOSTS.includes(host)) {
    const isShortLink =
      host.startsWith('vm.') || host.startsWith('vt.')
        ? path.length > 1
        : TIKTOK_SHORT_PATH.test(path);
    if (!isShortLink && !TIKTOK_POST_PATH.test(path)) {
      return {
        error:
          "This TikTok link isn't to a post. Open the video and copy its link (it has /video/ in it).",
      };
    }
  } else if (INSTAGRAM_HOSTS.includes(host)) {
    if (!INSTAGRAM_POST_PATH.test(path)) {
      return {
        error:
          "This Instagram link isn't to a post. Open the post or reel and copy its link (it has /p/ or /reel/ in it).",
      };
    }
  } else {
    return { error: `Only TikTok and Instagram links are accepted, not ${host}.` };
  }

  return { link: url.toString() };
};

// Same post regardless of tracking params or a trailing slash
const postKey = (link) => {
  const url = new URL(link);
  return `${url.hostname.replace(/^(?:www|m)\./, '')}${url.pathname.replace(/\/$/, '')}`;
};

/**
 * Checks every draft field: { links, errors } where links are the normalized non-empty links
 * and errors[i] is the message for field i (duplicates included), or null.
 */
export const checkPostingLinks = (drafts) => {
  const seen = new Map();
  const links = [];
  const errors = drafts.map((draft, index) => {
    const { link, error } = checkPostingLink(draft);
    if (error) return error;
    if (!link) return null;
    const key = postKey(link);
    if (seen.has(key)) return `Same post as link ${seen.get(key) + 1}.`;
    seen.set(key, index);
    links.push(link);
    return null;
  });
  return { links, errors };
};

// Same rule as the backend's canAddPostingLink
export const canAddPostingLink = (submission) => {
  if (!submission || submission.campaign?.campaignType === 'ugc') return false;
  if (!['VIDEO', 'PHOTO'].includes(submission.submissionType?.type)) return false;
  const videoStatus = submission.video?.[0]?.status || 'PENDING';
  return (
    (submission.status === 'APPROVED' && videoStatus === 'APPROVED') ||
    ['CLIENT_APPROVED', 'REJECTED'].includes(submission.status)
  );
};

// The link was added by an admin rather than the creator, so it needs an approver
export const isAdminAddedLink = (submission) => Boolean(submission?.admin?.userId);

// Same group the backend allows (utils/postingLinkApprovers.ts)
export const canApproveAdminAddedLinks = (user) => {
  const roleName = (user?.admin?.role?.name || '').trim().toLowerCase();
  return (
    user?.role === 'superadmin' ||
    ['god', 'advanced'].includes(user?.admin?.mode) ||
    roleName === 'csl' ||
    roleName.includes('cs lead')
  );
};
