const useGetPermission = (user) => {
  const manageCreator = user?.admin?.manageCreatorPermission;
  const manageBrand = user?.admin?.manageBrandPermission;
  const manageCampaign = user?.admin?.manageCampaignPermission;
  return { manageCreator, manageBrand, manageCampaign };
};

export default useGetPermission;
