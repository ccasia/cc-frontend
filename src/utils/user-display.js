// Soft-deleted accounts are retained (status === 'deleted') and their email is renamed to
// `deleted_<id>_<original>` to free the unique constraint. Admin/client views must not show that
// mangled email (it leaks the original address) or the stale name. Detect deletion via the explicit
// status when present, with the email prefix as a universal fallback for payloads lacking status.
const DELETED_EMAIL_PREFIX = /^deleted_/;

export const DELETED_USER_LABEL = 'Deleted user';

export const isDeletedUser = (user) =>
  user?.status === 'deleted' || DELETED_EMAIL_PREFIX.test(user?.email || '');

/**
 * Returns display-safe identity fields for a user.
 * For deleted users: name becomes "Deleted user" and email is blanked.
 * @param {{ name?: string, email?: string, status?: string } | null | undefined} user
 * @returns {{ isDeleted: boolean, name: string, email: string }}
 */
export const getUserDisplay = (user) => {
  const deleted = isDeletedUser(user);
  return {
    isDeleted: deleted,
    name: deleted ? DELETED_USER_LABEL : user?.name ?? '',
    email: deleted ? '' : user?.email ?? '',
  };
};
