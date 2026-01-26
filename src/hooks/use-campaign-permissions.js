import { useMemo } from 'react';

/**
 * Hook to calculate campaign permissions for the current user.
 * Determines if a user is in view-only mode based on their role and campaign assignment.
 *
 * @param {Object} campaign - The campaign object with campaignAdmin array
 * @param {Object} user - The current user object from auth context
 * @returns {Object} - { isViewOnly: boolean, isManagingAdmin: boolean }
 */
export const useCampaignPermissions = (campaign, user) => {
  return useMemo(() => {
    // Superadmin/god always have full access
    if (user?.role === 'superadmin' || user?.admin?.mode === 'god') {
      return { isViewOnly: false, isManagingAdmin: true };
    }

    // Finance role with advanced mode - existing view-only behavior
    if (user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced') {
      return { isViewOnly: true, isManagingAdmin: false };
    }

    // CSM role check (handles both 'CSM' and 'Customer Success Manager' naming)
    const isCSM =
      user?.admin?.role?.name === 'CSM' || user?.admin?.role?.name === 'Customer Success Manager';

    if (isCSM) {
      // Check if user is assigned to this campaign
      // Handle multiple possible ID matching patterns based on data structure
      const isManagingAdmin = campaign?.campaignAdmin?.some((admin) => {
        return (
          admin.adminId === user?.id ||
          admin.admin?.userId === user?.id ||
          admin.admin?.user?.id === user?.id
        );
      });

      return { isViewOnly: !isManagingAdmin, isManagingAdmin };
    }

    // Default: full access for other admin roles (BD, Growth, etc.)
    return { isViewOnly: false, isManagingAdmin: true };
  }, [campaign, user]);
};
