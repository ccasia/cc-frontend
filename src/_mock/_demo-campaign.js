// ----------------------------------------------------------------------
// MOCK DATA — Demo campaign "The Local Discovery Series"
//
// This is the single source of truth for the demo campaign shown at
// /dashboard/demo-campaigns. Everything here is mock data: edit, add or
// remove freely. No backend/DB is involved - the data hooks short-circuit
// to these values whenever the campaign id matches `DEMO_CAMPAIGN_ID`
// (see src/hooks/use-get-campaign-by-id.js and the other demo guards).
//
// The campaign is a v4 "normal" campaign. POSTED video submissions carry a
// posting URL so the Analytics tab can show real-looking numbers from
// `demoInsights` (consumed via the mocked useSocialInsights hook).
//
// To add / edit / remove a creator (and their submission row + status),
// just edit the `demoCreators` array below — everything else (shortlisted,
// per-creator submissions, the flat submission list, and analytics insights)
// is derived from it.
// ----------------------------------------------------------------------

export const DEMO_CAMPAIGN_ID = 'cmb4il1dx002wt001qoba4enx';
export const DEMO_CREATOR_ID = 'demo-creator-aisyah-001';

// --- Easily-swappable asset URLs (used across the mock) --------------------
const COVER_IMAGE =
  'https://storage.googleapis.com/cult_production/campaign/Syafiq-Kyle-and-Koe-Yeet-Spritzer-.webp?v=2025-05-26T03:41:07+00:00';
const COMPANY_LOGO =
  'https://storage.googleapis.com/cult_production/companyLogo/spritzer logo.jpg';
const AISYAH_AVATAR =
  'https://images.pexels.com/photos/16314164/pexels-photo-16314164/free-photo-of-a-woman-in-a-skirt-and-heels-standing-on-some-stairs.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500';
const ARIF_AVATAR =
  'https://images.pexels.com/photos/16873325/pexels-photo-16873325/free-photo-of-man-singing-during-service.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500';
const NAYLISA_AVATAR =
  'https://images.pexels.com/photos/13571800/pexels-photo-13571800.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500';
const SAM_AVATAR =
  'https://images.pexels.com/photos/26761661/pexels-photo-26761661/free-photo-of-portrait-of-man-in-a-rusty-valley.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500';
const ADMIN_AVATAR_1 = 'https://storage.googleapis.com/cult_production/admin/_MG_4004.JPG';
const ADMIN_AVATAR_2 =
  'https://lh3.googleusercontent.com/a/ACg8ocI7ey9Z1lBM3e6muozZQS8sQLjp-xU1IwpJY7lrvz7z68il_4o=s96-c';
const SAMPLE_VIDEO =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const SAMPLE_VIDEO_2 =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4';
const SAMPLE_AGREEMENT_PDF =
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

// NOTE: no trailing slash — must match the URL that `extractPostingSubmissions`
// pulls out of `content` (analytics matches insight.postUrl === submission.postUrl).
const IG_POST_URL = 'https://www.instagram.com/reel/DEMOaaa11122';
const TIKTOK_POST_URL = 'https://www.tiktok.com/@samnights/video/7400000000000000456';

// Post thumbnails for the Analytics creator cards.
const IG_THUMBNAIL =
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80';
const TIKTOK_THUMBNAIL =
  'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=400&q=80';

// --- Creator identities ----------------------------------------------------
// The main demo creator (Aisyah) carries a richer profile + payment form.
const demoCreatorUser = {
  id: DEMO_CREATOR_ID,
  name: 'Aisyah Rahman',
  email: 'aisyah.demo@cultcreative.asia',
  photoURL: AISYAH_AVATAR,
  status: 'active',
  // Some views read instagramUser/tiktokUser directly off `user`.
  instagramUser: { username: 'aisyaheats', followers_count: 48200, engagement_rate: 0.066 },
  tiktokUser: { username: 'aisyaheats', follower_count: 31000 },
  // Used by the Agreements table to resolve price/currency.
  shortlisted: [{ amount: 1500, currency: 'MYR' }],
  paymentForm: {
    bankAccountName: 'Aisyah Rahman',
    bankName: 'Maybank',
    accountNumber: '5123 4567 8901',
    icNumber: '990101-14-5678',
    reason: '',
  },
  creator: {
    id: 'demo-creator-profile-001',
    about: 'Food & lifestyle creator spotlighting Malaysia’s hidden cafés and local gems.',
    profileLink: 'https://instagram.com/aisyaheats',
    isGuest: false,
    creditTier: null,
    instagram: 'aisyaheats',
    tiktok: 'aisyaheats',
    instagramUser: { username: 'aisyaheats', followers_count: 48200, engagement_rate: 0.066 },
    tiktokUser: { username: 'aisyaheats', follower_count: 31000 },
    interests: [{ name: 'F&B' }, { name: 'Lifestyle' }, { name: 'Hotel & Travel' }],
  },
};

// Lightweight creator factory — produces a full user object (with nested
// `creator`) so the Master List, Overview and Submissions views all render
// consistent names/avatars/handles.
const makeCreatorUser = ({ id, name, email, photoURL, ig, igFollowers, tk, tkFollowers, about }) => ({
  id,
  name,
  email,
  photoURL,
  status: 'active',
  instagramUser: { username: ig, followers_count: igFollowers, engagement_rate: 0.05 },
  tiktokUser: { username: tk, follower_count: tkFollowers },
  creator: {
    id: `${id}-profile`,
    about,
    profileLink: `https://instagram.com/${ig}`,
    isGuest: false,
    instagram: ig,
    tiktok: tk,
    instagramUser: { username: ig, followers_count: igFollowers, engagement_rate: 0.05 },
    tiktokUser: { username: tk, follower_count: tkFollowers },
    interests: [{ name: 'F&B' }, { name: 'Lifestyle' }],
  },
});

const arifUser = makeCreatorUser({
  id: 'demo-creator-arif',
  name: 'Arif Sufri',
  email: 'arif.demo@cultcreative.asia',
  photoURL: ARIF_AVATAR,
  ig: 'arifexplores',
  igFollowers: 26500,
  tk: 'arifexplores',
  tkFollowers: 18000,
  about: 'Art & culture creator hunting Malaysia’s quirkiest corners.',
});

const naylisaUser = makeCreatorUser({
  id: 'demo-creator-naylisa',
  name: 'Naylisa Husni',
  email: 'naylisa.demo@cultcreative.asia',
  photoURL: NAYLISA_AVATAR,
  ig: 'naylisaoutdoors',
  igFollowers: 41200,
  tk: 'naylisaoutdoors',
  tkFollowers: 33500,
  about: 'Outdoor & lifestyle creator chasing waterfalls and golden hour.',
});

const samUser = makeCreatorUser({
  id: 'demo-creator-sam',
  name: 'Sam Ng',
  email: 'sam.demo@cultcreative.asia',
  photoURL: SAM_AVATAR,
  ig: 'samnights',
  igFollowers: 52800,
  tk: 'samnights',
  tkFollowers: 47000,
  about: 'Nightlife & food creator mapping the best date spots in KL.',
});

// --- Creator pitches (Overview > Creator Pitches) --------------------------
// All four identities appear here so the pitches card stays populated.
export const demoPitches = [
  {
    id: 'demo-pitch-1',
    pitchId: 'demo-pitch-1',
    userId: DEMO_CREATOR_ID,
    status: 'APPROVED',
    type: 'text',
    content:
      'Hi! I’d love to take Spritzer on a tour of Ipoh’s most underrated cafés — pairing every sip with a hidden gem. Expect cosy aesthetics, warm storytelling and that satisfying fizz moment.',
    createdAt: '2025-05-28T09:00:00.000Z',
    user: demoCreatorUser,
  },
  {
    id: 'demo-pitch-2',
    pitchId: 'demo-pitch-2',
    userId: arifUser.id,
    status: 'APPROVED',
    type: 'text',
    content:
      'I explore street art and indie galleries around Melaka — Spritzer Sparkling fits perfectly into a creative day-out narrative.',
    createdAt: '2025-05-29T09:00:00.000Z',
    user: arifUser,
  },
  {
    id: 'demo-pitch-3',
    pitchId: 'demo-pitch-3',
    userId: naylisaUser.id,
    status: 'APPROVED',
    type: 'text',
    content:
      'Outdoor & nature is my niche — short trails, waterfalls and scenic picnic spots. Staying hydrated the Spritzer way is a natural fit.',
    createdAt: '2025-05-30T09:00:00.000Z',
    user: naylisaUser,
  },
  {
    id: 'demo-pitch-4',
    pitchId: 'demo-pitch-4',
    userId: samUser.id,
    status: 'APPROVED',
    type: 'text',
    content:
      'Date night & nightlife spots are my thing — rooftop bars, live music cafés. I’ll show Spritzer as the perfect refreshing pairing.',
    createdAt: '2025-05-31T09:00:00.000Z',
    user: samUser,
  },
];

// --- Creators on the campaign (edit me) ------------------------------------
// One entry per shortlisted creator. `video.status` drives the submission
// pill; POSTED videos additionally need `platform`, `content` (posting URL)
// and an `insight` payload so they show up in Campaign Analytics.
const demoCreators = [
  {
    key: 'aisyah',
    user: demoCreatorUser,
    outreachStatus: 'CONFIRMED',
    amount: 1500,
    currency: 'MYR',
    shortlistedDate: '2025-05-30T00:00:00.000Z',
    video: {
      status: 'POSTED',
      platform: 'Instagram',
      content: IG_POST_URL,
      url: SAMPLE_VIDEO,
      thumbnail: IG_THUMBNAIL,
      caption:
        'Found the cleanest cold brew in Ipoh 🧊 Spritzer Sparkling on the side = perfection. #SpritzerApproved #ad',
      createdAt: '2025-09-12T08:30:00.000Z',
      insight: [
        { name: 'views', value: 124000 },
        { name: 'likes', value: 8200 },
        { name: 'comments', value: 340 },
        { name: 'shares', value: 560 },
        { name: 'saved', value: 1500 },
        { name: 'reach', value: 98000 },
        { name: 'total_interactions', value: 10600 },
      ],
    },
  },
  {
    key: 'sam',
    user: samUser,
    outreachStatus: 'FOLLOWED_UP',
    amount: 1800,
    currency: 'MYR',
    shortlistedDate: '2025-05-31T00:00:00.000Z',
    video: {
      status: 'POSTED',
      platform: 'TikTok',
      content: TIKTOK_POST_URL,
      url: SAMPLE_VIDEO_2,
      thumbnail: TIKTOK_THUMBNAIL,
      caption:
        'Rooftop sunset + Spritzer Sparkling = the perfect KL date night 🌆 #SpritzerApproved #ad',
      createdAt: '2025-10-03T10:00:00.000Z',
      insight: [
        { name: 'views', value: 256000 },
        { name: 'likes', value: 19500 },
        { name: 'comments', value: 720 },
        { name: 'shares', value: 2100 },
        { name: 'saved', value: 0 },
        { name: 'reach', value: 210000 },
        { name: 'total_interactions', value: 22320 },
      ],
    },
  },
  {
    key: 'arif',
    user: arifUser,
    outreachStatus: 'OUTREACHED',
    amount: 1200,
    currency: 'MYR',
    shortlistedDate: '2025-05-29T00:00:00.000Z',
    video: {
      status: 'PENDING_REVIEW',
      url: SAMPLE_VIDEO,
      caption:
        'Chasing street-art murals in Georgetown 🎨 staying refreshed with Spritzer. #SpritzerApproved #ad',
      createdAt: '2025-10-20T09:00:00.000Z',
    },
  },
  {
    key: 'naylisa',
    user: naylisaUser,
    outreachStatus: 'INTERESTED',
    amount: 1400,
    currency: 'MYR',
    shortlistedDate: '2025-05-30T00:00:00.000Z',
    video: {
      status: 'NOT_STARTED',
      createdAt: '2025-10-22T09:00:00.000Z',
    },
  },
];

// --- Derive submissions from `demoCreators` --------------------------------
// Each creator gets an APPROVED agreement form (required for the submission
// row to render) plus one VIDEO submission in their chosen status.
const makeAgreementSubmission = (creator) => ({
  id: `demo-sub-${creator.key}-agreement`,
  status: 'APPROVED',
  submissionType: { type: 'AGREEMENT_FORM' },
  userId: creator.user.id,
  campaignId: DEMO_CAMPAIGN_ID,
  content: SAMPLE_AGREEMENT_PDF,
  createdAt: '2025-06-02T09:15:00.000Z',
  video: [],
  photos: [],
  rawFootages: [],
  feedback: [],
});

const makeVideoSubmission = (creator) => {
  const { video } = creator;
  const id = `demo-sub-${creator.key}-video`;
  // POSTED rows keep an APPROVED inner video; other statuses mirror the row status.
  const innerStatus = video.status === 'POSTED' ? 'APPROVED' : video.status;
  return {
    id,
    status: video.status,
    submissionType: { type: 'VIDEO' },
    caption: video.caption || '',
    content: video.content || '', // posting link (only set for POSTED)
    userId: creator.user.id,
    campaignId: DEMO_CAMPAIGN_ID,
    campaign: { id: DEMO_CAMPAIGN_ID, campaignType: 'normal' },
    createdAt: video.createdAt,
    video: video.url
      ? [{ id: `${id}-file`, url: video.url, status: innerStatus, createdAt: video.createdAt }]
      : [],
    photos: [],
    rawFootages: [],
    feedback: [],
  };
};

const submissionsByUser = {};
const allSubmissions = [];

demoCreators.forEach((creator) => {
  const agreement = makeAgreementSubmission(creator);
  const video = makeVideoSubmission(creator);
  submissionsByUser[creator.user.id] = {
    submissions: [agreement, video],
    grouped: { videos: [video], photos: [], rawFootage: [], agreement },
    total: 2,
  };
  allSubmissions.push(agreement, video);
});

// --- V4 submissions (useGetV4Submissions → per-creator) --------------------
export const getDemoV4Submissions = (userId) =>
  submissionsByUser[userId] || {
    submissions: [],
    grouped: { videos: [], photos: [], rawFootage: [], agreement: null },
    total: 0,
  };

// --- Social insights (useSocialInsights → { data }) ------------------------
// One entry per POSTED video that carries an `insight`. Shape matches
// socialMetricsCalculator: an `insight` array of { name, value } pairs.
export const demoInsights = demoCreators
  .filter((creator) => creator.video.status === 'POSTED' && creator.video.insight)
  .map((creator) => ({
    id: `demo-sub-${creator.key}-video`,
    submissionId: `demo-sub-${creator.key}-video`,
    user: creator.user.id,
    platform: creator.video.platform,
    postUrl: creator.video.content,
    thumbnail: creator.video.thumbnail,
    insight: creator.video.insight,
  }));

// --- Creator lookup (useGetCreatorById → { data }) -------------------------
// Resolves a demo creator's full profile by userId so the Analytics creator
// cards / top-performer card render real names + avatars + handles.
const demoCreatorsById = demoCreators.reduce((acc, creator) => {
  acc[creator.user.id] = { user: creator.user };
  return acc;
}, {});

export const getDemoCreatorById = (userId) => demoCreatorsById[userId] || null;

// --- Engagement-rate heatmap (useGetEngagementHeatmap → heatmapData) --------
// 6 weeks × 7 days (Mon–Sun). Colors render purely from `engagementRate` vs the
// `summary.scales` ranges; cell dates (relative to today) are only for tooltips.
const HEATMAP_WEEKS = 6;
const buildDemoHeatmap = () => {
  // Engagement-rate % per [week][day]; null = no post that day.
  const rates = [
    [null, 2.1, null, 3.4, 4.8, null, 1.9],
    [2.8, null, 3.9, null, 5.6, 6.2, null],
    [null, 4.1, 4.6, 5.2, null, 6.9, 3.3],
    [3.6, 4.4, null, 5.8, 6.4, null, 4.0],
    [null, 5.1, 5.7, null, 7.2, 7.8, 4.9],
    [4.2, null, 6.1, 6.8, null, 8.4, 5.5],
  ];
  // Monday of the oldest displayed week.
  const today = new Date();
  const dow = (today.getDay() + 6) % 7; // 0 = Monday
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - dow);
  const firstMonday = new Date(thisMonday);
  firstMonday.setDate(thisMonday.getDate() - (HEATMAP_WEEKS - 1) * 7);

  return rates.map((week, weekIndex) =>
    week.map((engagementRate, dayIndex) => {
      const date = new Date(firstMonday);
      date.setDate(firstMonday.getDate() + weekIndex * 7 + dayIndex);
      return {
        date: date.toISOString(),
        engagementRate,
        totalPosts: engagementRate == null ? null : 1,
        totalViews: engagementRate == null ? null : Math.round(engagementRate * 20000),
        hasData: engagementRate != null,
      };
    })
  );
};

export const demoEngagementHeatmap = {
  summary: {
    scales: {
      lowest: { max: 2.5, label: '< 2.5%' },
      mediumLow: { max: 4.5, label: '2.5% - 4.5%' },
      mediumHigh: { max: 6.5, label: '4.5% - 6.5%' },
      highest: { label: '> 6.5%' },
    },
  },
  heatmap: buildDemoHeatmap(),
};

// --- Top creators trend (useGetTopCreatorsTrend → trendData) ----------------
// One snapshot per day of the CURRENT week (Mon–Sun) so the line chart, which
// maps onto the current week by default, always renders lines. Built lazily so
// the dates track "today" whenever the demo is opened.
const TREND_CREATORS = [
  { key: 'aisyah', base: 18000, growth: 6000 },
  { key: 'sam', base: 24000, growth: 9000 },
  { key: 'arif', base: 9000, growth: 3000 },
  { key: 'naylisa', base: 6000, growth: 2200 },
];

export const getDemoTopCreatorsTrend = () => {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() - dow);
  monday.setHours(0, 0, 0, 0);

  const creators = TREND_CREATORS.map((tc) => {
    const found = demoCreators.find((c) => c.key === tc.key);
    return { ...tc, userId: found.user.id, userName: found.user.name };
  });

  const trend = [];
  for (let i = 0; i <= dow; i += 1) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    trend.push({
      date: date.toISOString(),
      topCreators: creators.map((c) => ({
        userId: c.userId,
        userName: c.userName,
        // Rising daily views with a little per-day variation.
        views: Math.round(c.base + c.growth * i + ((i * 37) % 5) * 400),
      })),
    });
  }
  return { trend };
};

// --- The campaign object (returned by useGetCampaignByIdScoped) ------------
export const demoCampaign = {
  id: DEMO_CAMPAIGN_ID,
  campaignId: 'C162',
  name: 'The Local Discovery Series',
  description:
    'Much like how Michelin sold more tyres by inspiring people to explore restaurants, Spritzer can sell more water by making people thirsty for Malaysia’s best local discoveries. From cafés in Ipoh to art spaces in Melaka, Spritzer-Approved becomes the cultural passport for places worth discovering — powered by hydration.',
  status: 'ACTIVE',
  submissionVersion: 'v4',
  campaignType: 'normal',
  origin: 'ADMIN',
  productName: 'Sparkling Water / Natural Mineral Water',
  brandTone: 'Engaging, Fun, Creative, Inspiring',
  brandAbout:
    'In the market of beverages, where choices abound, discerning businesses and consumers are increasingly turning to Spritzer for a refreshing and holistic experience. As a stalwart in the industry, Spritzer has carved a niche for itself, not only as a purveyor of natural mineral water but also as a beacon of quality, sustainability, and innovation.',
  logisticsType: '', // empty string hides the Logistics tab
  spreadSheetURL: null,
  isPCRReady: true,
  isCreditTier: false,
  isKWSPCampaign: false,

  // Deliverable-type flags (only "UGC Videos" should display).
  rawFootage: false,
  photos: false,
  ads: false,
  crossPosting: false,

  // Credits (Overview > Credits Tracking). Requires company.subscriptions
  // below to be non-empty for the breakdown to render.
  campaignCredits: 10,
  creditsUtilized: 8,
  creditsPending: 2,

  campaignBrief: {
    images: [COVER_IMAGE],
    startDate: '2025-05-07T00:00:00.000Z',
    endDate: '2025-11-21T00:00:00.000Z',
    postingStartDate: '2025-08-01T00:00:00.000Z',
    postingEndDate: '2025-11-15T00:00:00.000Z',
    industries: 'FMCG',
    objectives: 'Increase Brand Awareness',
    secondaryObjectives: [],
    primaryKPI: '',
    performanceBaseline: '',
    boostContent: '',
    socialMediaPlatform: ['Instagram', 'TikTok'],
    videoAngle: [],
    otherAttachments: [],
    attachments: [],
    referencesLinks: [],
  },

  campaignRequirement: {
    gender: ['female', 'male'],
    age: ['18-25', '26-34', '35-40'],
    language: ['English', 'Malay', 'Mandarin Chinese'],
    creator_persona: [
      'Entertainment',
      'F&B',
      'FMCG',
      'Hotel & Travel',
      'Lifestyle',
      'Motherhood & Family',
      'Wellness',
    ],
    user_persona:
      'Hidden Cafés - Underrated gems in Ipoh, PJ, Penang\n' +
      'Art & Culture - Street art, indie galleries, installations\n' +
      'Outdoor & Nature - Short trails, waterfalls, scenic picnic spots\n' +
      'Date/Nightlife - Romantic bars, rooftops, live music cafés\n' +
      'Food Pairings - Spritzer Sparkling + spicy Penang laksa = 💯\n' +
      'Local Oddities - Vintage stores, themed cafés, quirky corners',
    geographic_focus: '',
    geographicFocusOthers: '',
  },

  // Client (Spritzer). company.brand is intentionally not an array so the
  // Details tab falls back to campaignBrief.industries for "Industry".
  company: {
    id: 'demo-company-spritzer',
    name: 'Spritzer',
    logo: COMPANY_LOGO,
    about:
      'In the market of beverages, where choices abound, discerning businesses and consumers are increasingly turning to Spritzer for a refreshing and holistic experience. As a stalwart in the industry, Spritzer has carved a niche for itself, not only as a purveyor of natural mineral water but also as a beacon of quality, sustainability, and innovation.',
    address: 'Lot 898, Jalan Reservoir, Off Jalan Air Kuning, 34000 Taiping, Perak Darul Ridzuan, Malaysia',
    email: 'brendachong@spritzer.com.my',
    website: 'https://www.spritzer.com.my/',
    pic: [{ name: 'Brenda Chong', email: 'brendachong@spritzer.com.my' }],
    // Drives the "Credits Tracking" card (must be non-empty to show the breakdown).
    subscriptions: [
      {
        id: 'demo-subscription-1',
        createdAt: '2025-05-01T00:00:00.000Z',
        totalCredits: 10,
        creditsUsed: 8,
        package: { name: 'UGC Package', credits: 10 },
      },
    ],
  },

  // Campaign managers (real admin users from production data).
  // Shape: { id, admin: { user: {...} } }.
  campaignAdmin: [
    {
      id: 'demo-ca-1',
      adminId: 'cm3fjl5jx000ibrupm44bbxmz',
      admin: {
        user: { id: 'cm3fjl5jx000ibrupm44bbxmz', name: 'Dulya Wijeratne', photoURL: ADMIN_AVATAR_1 },
        role: { name: 'CSM' },
      },
    },
    {
      id: 'demo-ca-2',
      adminId: 'cmbfzddtu00lao101ggfym0j6',
      admin: {
        user: { id: 'cmbfzddtu00lao101ggfym0j6', name: 'Irsalina', photoURL: ADMIN_AVATAR_2 },
        role: { name: 'CSL' },
      },
    },
  ],

  campaignClients: [],
  campaignAdditionalDetails: [],
  internalComments: '',

  // Shortlisted (approved) creators — derived from `demoCreators`.
  shortlisted: demoCreators.map((creator) => ({
    userId: creator.user.id,
    status: 'shortlisted',
    amount: creator.amount,
    currency: creator.currency,
    outreachStatus: creator.outreachStatus,
    shortlisted_date: creator.shortlistedDate,
    user: creator.user,
  })),

  // Pitch records (approved) — drives the Overview "Creator Pitches" card.
  pitch: demoPitches,
  // Kept empty so the v4 Master List uses `shortlisted` (the four creators above).
  pitches: [],

  // Flat submissions list — used by analytics + agreement counting.
  submission: allSubmissions,

  logistic: [],
};

// --- Agreements (useGetAgreements → { data }) ------------------------------
// Note: the Agreements tab is hidden in the demo (client layout); kept for
// completeness / future use.
export const demoAgreements = demoCreators.map((creator) => ({
  id: `demo-agreement-${creator.key}`,
  userId: creator.user.id,
  campaignId: DEMO_CAMPAIGN_ID,
  amount: creator.amount,
  currency: creator.currency,
  isSent: true,
  agreementUrl: SAMPLE_AGREEMENT_PDF,
  createdAt: '2025-06-01T09:00:00.000Z',
  updatedAt: '2025-06-02T09:15:00.000Z',
  user: creator.user,
}));

// --- Invoices (useGetInvoicesByCampId → { campaigns }) ---------------------
const INVOICE_ITEMS = [
  {
    id: 'demo-inv-item-1',
    title: 'UGC Video — The Local Discovery Series',
    description: 'Instagram Reel + TikTok video deliverables (2x)',
    service: 'UGC Video',
    price: 750,
    quantity: 2,
    total: 1500,
  },
];

const invoiceFrom = {
  id: 'demo-inv-from',
  name: 'Aisyah Rahman',
  email: 'aisyah.demo@cultcreative.asia',
  fullAddress: '12, Jalan SS2/24, 47300 Petaling Jaya, Selangor, Malaysia',
  phoneNumber: '+60 12-345 6789',
  company: 'Aisyah Rahman',
};

const invoiceTo = {
  id: 'demo-inv-to',
  name: 'Cult Creative Sdn Bhd',
  email: 'hello@cultcreative.asia',
  fullAddress: 'Kuala Lumpur, Malaysia',
  phoneNumber: '+60 16-267 8757',
  company: 'Cult Creative Sdn Bhd',
};

export const demoInvoices = [
  {
    id: 'demo-invoice-1',
    invoiceId: 'demo-invoice-1',
    invoiceNumber: 'INV-C162-001',
    status: 'approved',
    amount: 1500,
    subTotal: 1500,
    totalAmount: 1500,
    taxes: 0,
    discount: 0,
    shipping: 0,
    currency: 'MYR',
    items: INVOICE_ITEMS,
    task: {
      title: 'UGC Video x2',
      description: 'Instagram Reel + TikTok video',
      service: 'UGC Video',
      price: 1500,
    },
    invoiceFrom,
    invoiceTo,
    createDate: '2025-10-10T00:00:00.000Z',
    createdAt: '2025-10-10T00:00:00.000Z',
    dueDate: '2025-10-25T00:00:00.000Z',
    sent: 1,
    campaignId: DEMO_CAMPAIGN_ID,
    campaign: { name: 'The Local Discovery Series', company: { name: 'Spritzer' } },
    creator: { user: { name: 'Aisyah Rahman', email: 'aisyah.demo@cultcreative.asia', paymentForm: demoCreatorUser.paymentForm } },
    user: { name: 'Aisyah Rahman' },
  },
];

// --- Summary card data for the static demo card on the listing page --------
export const demoCampaignCard = {
  id: DEMO_CAMPAIGN_ID,
  name: 'The Local Discovery Series',
  company: 'Spritzer',
  industry: 'FMCG',
  dateRange: '07 May 2025 - 21 Nov 2025',
  image: COVER_IMAGE,
  logo: COMPANY_LOGO,
  status: 'ACTIVE',
};
