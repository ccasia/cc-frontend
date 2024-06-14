// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
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
      forgetPassword: `${ROOTS.AUTH}/jwt/forgot-password`,
    },
    verify: `${ROOTS.AUTH}/verify`,
  },
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    admins: `${ROOTS.DASHBOARD}/admins`,
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
    },
    user: {
      root: `${ROOTS.DASHBOARD}/user`,
      profile: `${ROOTS.DASHBOARD}/user/profile`,
    },
    creator: {
      root: `${ROOTS.DASHBOARD}/creator`,
      list: `${ROOTS.DASHBOARD}/creator/lists`,
      mediaKit: (id) => `${ROOTS.DASHBOARD}/creator/media-kits/${id}`,
      mediaKitCreator: `${ROOTS.DASHBOARD}/mediakit`,
      mediaKitLists: `${ROOTS.DASHBOARD}/creator/media-kits`,
    },
    landing: {
      creator: `${ROOTS.DASHBOARD}/landing/creator`,
      brand: `${ROOTS.DASHBOARD}/landing/brand`,
    },
    calendar: {
      root: `${ROOTS.DASHBOARD}/calendar`,
    },
  },
};
