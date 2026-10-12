import { TYPE_LABEL, TYPE_ORDER, STATUS_CHIP } from './constants';

export const getStatusChip = (status) => STATUS_CHIP[status] ?? STATUS_CHIP.NOT_STARTED;

export const getSubmissionLabel = (submission) => {
  const { type } = submission.submissionType;
  return type === 'VIDEO'
    ? `${TYPE_LABEL[type]} ${submission.contentOrder ?? ''}`.trim()
    : TYPE_LABEL[type];
};

const byTypeThenOrder = (a, b) =>
  TYPE_ORDER.indexOf(a.submissionType.type) - TYPE_ORDER.indexOf(b.submissionType.type) ||
  (a.contentOrder ?? 0) - (b.contentOrder ?? 0);

export const groupByCreator = (submissions) => {
  const groups = submissions
    .filter((submission) => TYPE_LABEL[submission.submissionType?.type])
    .sort(byTypeThenOrder)
    .reduce((acc, submission) => {
      const { user } = submission;
      acc[user.id] ??= { user, submissions: [] };
      acc[user.id].submissions.push(submission);
      return acc;
    }, {});

  return Object.values(groups);
};

export const getInitials = (name) =>
  (name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');

const PROFILE_URL = {
  instagram: (username) => `https://www.instagram.com/${username}`,
  tiktok: (username) => `https://www.tiktok.com/@${username}`,
};

export const getCreatorHandle = ({ creator, shortlisted }) => {
  const platform = shortlisted?.[0]?.selectedPlatform ?? 'instagram';
  const scraped = creator?.discoveryProfiles?.find((profile) => profile.platform === platform);
  const username = (
    creator?.[`${platform}User`]?.username ||
    creator?.[platform] ||
    scraped?.handle
  )?.replace(/^@/, '');

  if (!username) return null;

  return { username, url: PROFILE_URL[platform](username) };
};

export const getSubmittedAt = (submission) => {
  if (submission.submissionDate) return submission.submissionDate;

  const uploads = [
    ...(submission.video ?? []),
    ...(submission.photos ?? []),
    ...(submission.rawFootages ?? []),
  ];

  return (
    uploads
      .map((upload) => upload.createdAt)
      .sort()
      .at(-1) ?? null
  );
};

export const filterSubmissions = (submissions, { search, statusFilter, typeFilter }) => {
  const query = search.trim().toLowerCase();

  return submissions.filter(({ user, status, submissionType }) => {
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    const matchesType = typeFilter === 'all' || submissionType?.type === typeFilter;
    const matchesSearch =
      !query ||
      user.name?.toLowerCase().includes(query) ||
      getCreatorHandle(user)?.username.toLowerCase().includes(query);

    return matchesStatus && matchesType && matchesSearch;
  });
};
