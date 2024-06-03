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
    brand: {
      manage: `${ROOTS.DASHBOARD}/brand/manage`,
      create: `${ROOTS.DASHBOARD}/brand/create`,
      discover: `${ROOTS.DASHBOARD}/brand/discover`,
    },
    campaign: {
      manage: `${ROOTS.DASHBOARD}/campaign/manage`,
      create: `${ROOTS.DASHBOARD}/campaign/create`,
      view: `${ROOTS.DASHBOARD}/campaign/discover`,
    },
    user: {
      root: `${ROOTS.DASHBOARD}/user`,
      profile: `${ROOTS.DASHBOARD}/user/profile`,
    },
    creator: {
      root: `${ROOTS.DASHBOARD}/creator/lists`,
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
