import { useMemo } from 'react';

/**
 * Hook to calculate campaign permissions for the current user.
 * Determines if a user is in view-only mode based on their role and campaign assignment.
 *
 * @param {Object} campaign - The campaign object with campaignAdmin array
 * @param {Object} user - The current user object from auth context
 * @returns {{ isViewOnly: boolean, isManagingAdmin: boolean }}
 */
export const useCampaignPermissions = (campaign, user) => {
  const userId = user?.id;
  const userRole = user?.role;
  const adminMode = user?.admin?.mode;
  const adminRoleName = user?.admin?.role?.name;
  const adminRoleSlug = user?.admin?.role?.slug;
  const campaignAdmin = campaign?.campaignAdmin;

  return useMemo(() => {
    if (userRole === 'superadmin' || adminMode === 'god') {
      return { isViewOnly: false, isManagingAdmin: true };
    }

    if (
      userRole === 'admin' &&
      adminRoleSlug === 'sales_and_marketing' &&
      !campaignAdmin?.some((a) => a.adminId === userId)
    ) {
      return {
        isViewOnly: true,
        isManagingAdmin: false,
      };
    }
    if (adminRoleName === 'Finance' && adminMode === 'advanced') {
      return { isViewOnly: true, isManagingAdmin: false };
    }

    const isCSM = adminRoleName === 'CSM' || adminRoleName === 'Customer Success Manager';

    if (isCSM) {
      const isManagingAdmin =
        campaignAdmin?.some(
          (admin) =>
            admin.adminId === userId ||
            admin.admin?.userId === userId ||
            admin.admin?.user?.id === userId
        ) ?? false;

      return { isViewOnly: !isManagingAdmin, isManagingAdmin };
    }

    return { isViewOnly: false, isManagingAdmin: true };
  }, [userId, userRole, adminMode, adminRoleName, adminRoleSlug, campaignAdmin]);
};
