// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
  PUBLIC: '/public',
};

// ----------------------------------------------------------------------

export const paths = {
  minimalUI: 'https://mui.com/store/items/minimal-dashboard/',
  // AUTH
  auth: {
    jwt: {
      login: `${ROOTS.AUTH}/jwt/login`,
      adminLogin: `${ROOTS.AUTH}/jwt/admin/login`,
      register: `${ROOTS.AUTH}/jwt/register`,
      clientRegister: `${ROOTS.AUTH}/jwt/client/register`,
      setupPassword: `${ROOTS.AUTH}/jwt/client/setup-password`,
      forgetPassword: `${ROOTS.AUTH}/jwt/forgot-password`,
      childAccountSetup: `${ROOTS.AUTH}/child-account-setup`,
    },
    verify: `${ROOTS.AUTH}/verify`,
  },
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    admins: `${ROOTS.DASHBOARD}/admins`, // /dashboard/admins
    kanban: `${ROOTS.DASHBOARD}/kanban`,
    analytics: `${ROOTS.DASHBOARD}/analytics`,
    client: `${ROOTS.DASHBOARD}/client`,
    faq: `${ROOTS.DASHBOARD}/faq`,
    company: {
      root: `${ROOTS.DASHBOARD}/company`,
      manage: `${ROOTS.DASHBOARD}/company/manage`,
      create: `${ROOTS.DASHBOARD}/company/create`,
      discover: `${ROOTS.DASHBOARD}/company/discover`,
      details: (id) => `${ROOTS.DASHBOARD}/company/details/${id}`,
      companyEdit: (id) => `${ROOTS.DASHBOARD}/company/edit/${id}`,
      brand: {
        details: (id) => `${ROOTS.DASHBOARD}/company/brand/${id}`,
        edit: (id) => `${ROOTS.DASHBOARD}/company/brand/edit/${id}`,
      },
    },
    campaign: {
      root: `${ROOTS.DASHBOARD}/campaign`,
      manage: `${ROOTS.DASHBOARD}/campaign/manage`,
      create: `${ROOTS.DASHBOARD}/campaign/create`,
      view: `${ROOTS.DASHBOARD}/campaign/discover`,
      settings: `${ROOTS.DASHBOARD}/campaign/settings`,
      details: (id) => `${ROOTS.DASHBOARD}/campaign/details/${id}`,
      adminCampaignDetail: (id) => `${ROOTS.DASHBOARD}/campaign/discover/detail/${id}`,
      adminCampaignManageDetail: (id) => `${ROOTS.DASHBOARD}/campaign/manage/${id}`,
      adminCampaignEdit: (id) => `${ROOTS.DASHBOARD}/campaign/manage/edit/${id}`,
      // pitch: (id) => `${ROOTS.DASHBOARD}/campaign/pitch/${id}`,
      pitch: (campaignId, pitchId) =>
        `${ROOTS.DASHBOARD}/campaign/discover/detail/${campaignId}/pitch/${pitchId}`,
      v3Pitches: (campaignId) =>
        `${ROOTS.DASHBOARD}/campaign/discover/detail/${campaignId}/v3-pitches`,
      creator: {
        manage: `${ROOTS.DASHBOARD}/campaign/VUquQR/HJUboKDBwJi71KQ==/manage`,
        detail: (id) => `${ROOTS.DASHBOARD}/campaign/VUquQR/HJUboKDBwJi71KQ==/manage/detail/${id}`,
        discover: (id) => `${ROOTS.DASHBOARD}/campaign/VUquQR/HJUboKDBwJi71KQ==/discover/${id}`,
      },
      manageCreator: (campaignId, creatorId, params) => {
        const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
        return `${ROOTS.DASHBOARD}/campaign/discover/detail/${campaignId}/creator/${creatorId}${queryString}`;
      },
      // manageCreator: (campaignId, creatorId, params) =>
      //   params
      //     ? `${ROOTS.DASHBOARD}/campaign/discover/detail/${campaignId}/creator/${creatorId}${params}`
      //     : `${ROOTS.DASHBOARD}/campaign/discover/detail/${campaignId}/creator/${creatorId}`,
    },
    user: {
      root: `${ROOTS.DASHBOARD}/user`,
      profile: `${ROOTS.DASHBOARD}/user/profile`,
      profileTabs: {
        // Admin profile tabs
        general: `${ROOTS.DASHBOARD}/user/profile/general`,
        security: `${ROOTS.DASHBOARD}/user/profile/security`,
        api: `${ROOTS.DASHBOARD}/user/profile/api`,
        // Creator profile tabs
        account: `${ROOTS.DASHBOARD}/user/profile/account`,
        socials: `${ROOTS.DASHBOARD}/user/profile/socials`,
        payment: `${ROOTS.DASHBOARD}/user/profile/payment`,
        billing: `${ROOTS.DASHBOARD}/user/profile/billing`,
        notifications: `${ROOTS.DASHBOARD}/user/profile/notifications`,
        preference: `${ROOTS.DASHBOARD}/user/profile/preference`,
        // Client profile tabs
        client: `${ROOTS.DASHBOARD}/user/profile/client`,
        accounts: `${ROOTS.DASHBOARD}/user/profile/accounts`,
        agreement: `${ROOTS.DASHBOARD}/user/profile/agreements`,
      },
      myTasks: `${ROOTS.DASHBOARD}/tasks`,
    },
    creator: {
      root: `${ROOTS.DASHBOARD}/creator`,
      list: `${ROOTS.DASHBOARD}/creator/lists`,
      mediaKit: (id) => `${ROOTS.DASHBOARD}/creator/media-kits/${id}`,
      mediaKitCreator: `${ROOTS.DASHBOARD}/mediakit`,
      mediaKitLists: `${ROOTS.DASHBOARD}/creator/media-kits`,
      invoiceCreator: `${ROOTS.DASHBOARD}/invoiceCreator`,
      invoiceDetail: (invoiceId) => `${ROOTS.DASHBOARD}/invoiceCreator/${invoiceId}`,
      inbox: `${ROOTS.DASHBOARD}/inbox`,
      profile: (id) => `/dashboard/creator/profile/${id}`,
    },
    landing: {
      creator: `${ROOTS.DASHBOARD}/landing/creator`,
      brand: `${ROOTS.DASHBOARD}/landing/brand`,
    },
    calendar: {
      root: `${ROOTS.DASHBOARD}/calendar`,
    },
    chat: {
      root: `${ROOTS.DASHBOARD}/chat`,
      thread: (id) => `${ROOTS.DASHBOARD}/chat/thread/${id}`,
    },
    finance: {
      root: `${ROOTS.DASHBOARD}/finance`,
      invoice: `${ROOTS.DASHBOARD}/invoice`,
      creatorInvoice: (id) => `${ROOTS.DASHBOARD}/invoice/creator-list/${id}`,
      invoiceDetail: (id) => `${ROOTS.DASHBOARD}/invoice/detail/${id}`,
      createInvoice: (id) => `${ROOTS.DASHBOARD}/invoice/create/${id}`,
    },
    roles: {
      root: `${ROOTS.DASHBOARD}/roles`,
      manage: (id) => `${ROOTS.DASHBOARD}/roles/manage/${id}`,
    },
    packages: {
      root: `${ROOTS.DASHBOARD}/packages`,
    },
    creditTier: {
      root: `${ROOTS.DASHBOARD}/credit-tier`,
    },
    report: {
      root: `${ROOTS.DASHBOARD}/report`,
    },
    template: {
      root: `${ROOTS.DASHBOARD}/template`,
    },
    overview: {
      root: `${ROOTS.DASHBOARD}/overview`,
    },
  },
  public: {
    creator: {
      mediaKit: (id) => `${ROOTS.PUBLIC}/media-kits/creator/${id}`,
    },
    manageCreator: (campaignId, creatorId, params) => {
      const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
      return `${ROOTS.PUBLIC}/campaign/discover/detail/${campaignId}/creator/${creatorId}${queryString}`;
    },
  },
};
