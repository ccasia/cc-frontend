// ----------------------------------------------------------------------
// MOCK DATA — Demo campaign "The Kahf Es-scent-sials 🍃"
//
// This is the single source of truth for the demo campaign shown at
// /dashboard/demo-campaigns. Everything here is mock data derived from a
// real Kahf Malaysia campaign (campaignId C478). No backend/DB is involved -
// the data hooks short-circuit to these values whenever the campaign id
// matches `DEMO_CAMPAIGN_ID` (see src/hooks/use-get-campaign-by-id.js and the
// other demo guards).
//
// The campaign is a v4 "normal" campaign. POSTED video submissions carry a
// TikTok posting URL so the Analytics tab can show numbers from `demoInsights`
// (consumed via the mocked useSocialInsights hook). Per-post analytics numbers
// are SYNTHESIZED from each creator's follower count (real post metrics were
// not extracted) - see `makeInsight`.
//
// The Creator List shows every entry in `CREATORS`. Creators with a
// non-empty `drafts` array have a playable video submission; creators with
// `submissionStatus: 'NOT_STARTED'` and no drafts appear in the list but have
// nothing to play.
//
// To add / edit / remove a creator (and their submission + draft history),
// just edit the `CREATORS` array below — everything else (shortlisted,
// per-creator submissions, the flat submission list, pitches, agreements and
// analytics insights) is derived from it.
// ----------------------------------------------------------------------

export const DEMO_CAMPAIGN_ID = 'cmb4il1dx002wt001qoba4enx';
// Primary demo creator (carries the payment form + invoice). Adam Hazly.
export const DEMO_CREATOR_ID = 'cm7cngq8400rpp901q6gzlnrr';

const CAMPAIGN_NAME = 'The Kahf Es-scent-sials 🍃';

// --- Easily-swappable asset URLs (used across the mock) --------------------
const COVER_IMAGE =
  'https://storage.googleapis.com/cult_production/campaign/1781835369459_campaign-image.jpg?v=2026-06-19T02%3A16%3A09%2B00%3A00';
// Kahf Malaysia client logo, matching the stored GCS URL from the real campaign.
const COMPANY_LOGO =
  'https://storage.googleapis.com/cult_production/companyLogo/Screenshot%202025-12-30%20at%209.26.02%C3%A2%C2%80%C2%AFAM.png';
const ADMIN_AVATAR_1 = 'https://storage.googleapis.com/cult_production/admin/_MG_4004.JPG';
const ADMIN_AVATAR_2 =
  'https://lh3.googleusercontent.com/a/ACg8ocI7ey9Z1lBM3e6muozZQS8sQLjp-xU1IwpJY7lrvz7z68il_4o=s96-c';
const SAMPLE_AGREEMENT_PDF =
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
// Fallback post thumbnail for Analytics creator cards (used when a creator has no avatar).
const TIKTOK_THUMBNAIL =
  'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=400&q=80';

// --- Analytics insight synthesizer -----------------------------------------
// Real per-post metrics were not extracted, so we derive plausible numbers
// from a creator's follower count. Shape matches socialMetricsCalculator:
// an `insight` array of { name, value } pairs.
const makeInsight = (followers) => {
  const f = followers || 5000;
  const views = Math.round(f * 5.5);
  const reach = Math.round(views * 0.82);
  const likes = Math.round(views * 0.075);
  const comments = Math.round(views * 0.004);
  const shares = Math.round(views * 0.015);
  const saved = Math.round(views * 0.02);
  const total_interactions = likes + comments + shares + saved;
  return [
    { name: 'views', value: views },
    { name: 'likes', value: likes },
    { name: 'comments', value: comments },
    { name: 'shares', value: shares },
    { name: 'saved', value: saved },
    { name: 'reach', value: reach },
    { name: 'total_interactions', value: total_interactions },
  ];
};

// --- Raw creator config (edit me) ------------------------------------------
// One entry per creator shown in the Creator List. `drafts` are ordered
// latest-first (the modal shows up to 3). A submission with an early
// REVISION_REQUESTED draft followed by a later APPROVED / SENT_TO_CLIENT draft
// shows the review/revision history.
const CREATORS = [
  {
    key: 'ahmadjaris',
    id: 'cmkqc0h5t0e3qo301hijgv3vm',
    name: 'Ahmad Jaris',
    email: 'jarispro1@gmail.com',
    photoURL: 'https://storage.googleapis.com/cult_production/creator/IMG_0329.jpeg',
    ig: 'realjarisgc',
    igFollowers: 119,
    tk: 'realjarispg',
    tkFollowers: 6115,
    engagement: 0.145,
    about: 'spread love chat',
    profileLink: 'https://www.tiktok.com/@realjarispg',
    amount: 570,
    shortlistedDate: '2026-06-19T03:51:50.289Z',
    followers: 6115,
    submissionStatus: 'POSTED',
    platform: 'TikTok',
    postingUrl: 'https://vt.tiktok.com/ZSCFwcKya/',
    submittedAt: '2026-06-19T06:58:30.338Z',
    caption: `forced to gatekeep everything around him 😓\n\n#KahfExtrait #KahfEDP #KahfPerfume #LuxuryParfume #LongLastingParfume`,
    drafts: [
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqkkuxxe02h0o201xfb98ll6_1991CED5-7170-41EE-AC1A-A97C75D3EAD7.mov?v=2026-06-24T05%3A54%3A21%2B00%3A00',
        status: 'APPROVED',
        createdAt: '2026-06-24T05:54:21.677Z',
      },
    ],
  },
  {
    key: 'amsyar',
    id: 'cml5zpmas00xooo0177td48sy',
    name: 'Amsyar Irs',
    email: 'hello@amsyarirs.com',
    photoURL: '',
    ig: '',
    igFollowers: 0,
    tk: 'chee22y',
    tkFollowers: 2537,
    engagement: 0.043,
    about: '',
    profileLink: 'https://www.tiktok.com/@chee22y',
    amount: 370,
    shortlistedDate: '2026-06-19T03:52:12.341Z',
    followers: 2537,
    submissionStatus: 'POSTED',
    platform: 'TikTok',
    postingUrl: 'https://vt.tiktok.com/ZSCYPKwNX/',
    submittedAt: '2026-06-19T06:26:30.246Z',
    caption: `Main perfume lately? Definitely Kahf. 🌿\n\nHumbling Forest has been my go-to daily fragrance—fresh, clean, and easy to wear every day.\n\nNeed something that lasts longer? Aquaterrae Extrait is the one. Rich scent with performance that can last up to 24 hours.\n\n#KahfExtrait #KahfEDP #KahfPerfume #LuxuryParfume #LongLastingParfume`,
    drafts: [
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqkjpsdh025ro201hmsc3pek_0623%20(1).mp4?v=2026-06-24T02%3A49%3A10%2B00%3A00',
        status: 'APPROVED',
        createdAt: '2026-06-24T02:49:10.689Z',
      },
    ],
  },
  {
    key: 'irfan',
    id: 'cmbytbkvo02nplg01cz46i1c9',
    name: 'Muhammad Irfan Bin Hamzah',
    email: 'irfanhamzah.works@gmail.com',
    photoURL: 'https://storage.googleapis.com/cult_production/creator/IMG_1531.png',
    ig: 'efanhamza',
    igFollowers: 4369,
    tk: 'efanhamza',
    tkFollowers: 28211,
    engagement: 0.05,
    about: '',
    profileLink: 'https://www.tiktok.com/@efanhamza',
    amount: 570,
    shortlistedDate: '2026-06-19T03:53:45.717Z',
    followers: 28211,
    submissionStatus: 'POSTED',
    platform: 'TikTok',
    postingUrl: 'https://vt.tiktok.com/ZSCPgVhFP/',
    submittedAt: '2026-06-26T15:16:38.804Z',
    caption: `Disebabkan ramai salah pakai perfume dekat sesuatu tempat, so ni cadangan aku untuk pakai perfume apa bila hiking, running, pergi office or event.\n\n#KahfExtrait\n#KahfEDP\n#KahfPerfume\n#LuxuryParfume\n #LongLastingParfume`,
    drafts: [
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqmj6q0h04vso2015v0zwgmo_copy_B531EB91-2BBF-4404-AE05-304B74030E12.mov?v=2026-06-26T15%3A16%3A38%2B00%3A00',
        status: 'APPROVED',
        createdAt: '2026-06-26T15:16:38.804Z',
      },
    ],
  },
  {
    key: 'lutfil',
    id: 'cmkqoxf3g00q8o701909ehnva',
    name: 'Muhammad Lutfil Hadi',
    email: 'lutfillehadi@gmail.com',
    photoURL: 'https://storage.googleapis.com/cult_production/creator/Gemini_Generated_Image_nkay2inkay2inkay.png',
    ig: '',
    igFollowers: 0,
    tk: '',
    tkFollowers: 0,
    engagement: 0.05,
    about: '',
    profileLink: '',
    amount: 370,
    shortlistedDate: '2026-06-19T03:54:54.750Z',
    followers: 0,
    submissionStatus: 'POSTED',
    platform: 'TikTok',
    postingUrl: 'https://vt.tiktok.com/ZSCDyYRLR/',
    submittedAt: '2026-06-26T06:07:22.378Z',
    caption: '2nd amended draft submission',
    drafts: [
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqmj7lgw04w5o201snfrm98z_copy_45D34A62-1E0F-4BAD-ADBE-1E582691EC0E.mov?v=2026-06-26T06%3A07%3A22%2B00%3A00',
        status: 'APPROVED',
        createdAt: '2026-06-26T06:07:22.378Z',
      },
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqmj7lgw04w5o201snfrm98z_copy_8CDF02C2-457B-44A9-BAC2-835F76656759.mov?v=2026-06-26T03%3A07%3A56%2B00%3A00',
        status: 'REVISION_REQUESTED',
        createdAt: '2026-06-26T03:07:56.889Z',
      },
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqmj7lgw04w5o201snfrm98z_copy_CACECB5E-1215-46D7-912D-2DBE31BCC749.mov?v=2026-06-24T16%3A12%3A38%2B00%3A00',
        status: 'REVISION_REQUESTED',
        createdAt: '2026-06-24T16:12:38.258Z',
      },
    ],
  },
  {
    key: 'nadzmeen',
    id: 'cml6877x7024foo015zigvdmn',
    name: 'Nadzmeen',
    email: 'nadzmeennadzri@gmail.com',
    photoURL:
      'https://lh3.googleusercontent.com/a/ACg8ocICKUzR-RNOqT9nhq3YFtnXQwX2ju6LAqCxWc8_nAgKX2dMApKG=s96-c',
    ig: '',
    igFollowers: 0,
    tk: 'dilweed317',
    tkFollowers: 5575,
    engagement: 0.05,
    about: '',
    profileLink: 'https://www.tiktok.com/@dilweed317',
    amount: 470,
    shortlistedDate: '2026-06-19T03:55:38.986Z',
    followers: 5575,
    submissionStatus: 'POSTED',
    platform: 'TikTok',
    postingUrl: 'https://vt.tiktok.com/ZSCUrD9Pq/',
    submittedAt: '2026-06-26T19:56:04.960Z',
    caption:
      'Biar tak power janji bau tak masam. Yang nak sparring badminton boleh comment #KahfExtrait #KahfEDP #KahfPerfume #LuxuryParfume #LongLastingParfum',
    drafts: [
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqkj37uf020ro201nq6nvz3h_copy_0C4B755C-C14B-4022-AEFE-99D85748E02E.mov?v=2026-06-26T19%3A56%3A04%2B00%3A00',
        status: 'APPROVED',
        createdAt: '2026-06-26T19:56:04.960Z',
      },
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqkj37uf020ro201nq6nvz3h_copy_92659329-4CFB-4A8C-A1AD-3865ED65FD4A.mov?v=2026-06-22T03%3A40%3A07%2B00%3A00',
        status: 'REVISION_REQUESTED',
        createdAt: '2026-06-22T03:40:07.706Z',
      },
    ],
  },
  {
    key: 'shahrul',
    id: 'cmkqima2v0f6so30169il9wno',
    name: 'SHAHRUL ZAKARIA',
    email: 'theshahzakaria@gmail.com',
    photoURL: '',
    ig: '',
    igFollowers: 0,
    tk: '',
    tkFollowers: 0,
    engagement: 0.05,
    about: '',
    profileLink: '',
    amount: 370,
    shortlistedDate: '2026-06-19T03:56:41.641Z',
    followers: 0,
    submissionStatus: 'POSTED',
    platform: 'TikTok',
    postingUrl: 'https://vt.tiktok.com/ZSCDsPj8w/',
    submittedAt: '2026-06-27T12:24:55.390Z',
    caption: `Dua-dua perfume Kaft ni memang bagi vibe perfume mahal dan yang penting tahan lama. Kalau korang tengah cari perfume untuk daily wear atau special occasion, boleh cuba combo yang ni. \n\n#KahfExtrait\n#KahfEDP\n#KahfPerfume\n#LuxuryParfume\n#LongLastingParfume`,
    drafts: [
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqmj822o04wio201a1d13j0n_copy_C6D11F39-4179-4E4E-97FE-29E3F7FF5B20.mov?v=2026-06-27T12%3A24%3A55%2B00%3A00',
        status: 'APPROVED',
        createdAt: '2026-06-27T12:24:55.390Z',
      },
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqmj822o04wio201a1d13j0n_copy_0F5D56EA-EEE8-468C-83C0-3174CCB5179B.mov?v=2026-06-25T10%3A32%3A21%2B00%3A00',
        status: 'REVISION_REQUESTED',
        createdAt: '2026-06-25T10:32:21.633Z',
      },
    ],
  },
  {
    key: 'ali',
    id: 'cmqlj0nc504ero20108ek4i2a',
    name: 'MUHAMMAD ALI NASRULLAH',
    email: 'alinasrul124@gmail.com',
    photoURL: '',
    ig: '',
    igFollowers: 0,
    tk: '',
    tkFollowers: 0,
    engagement: 0.05,
    about: '',
    profileLink: '',
    amount: 420,
    shortlistedDate: '2026-06-19T03:59:01.598Z',
    followers: 0,
    submissionStatus: 'POSTED',
    platform: 'TikTok',
    postingUrl: 'https://vt.tiktok.com/ZSCUFQ8q1/',
    submittedAt: '2026-06-26T07:17:39.931Z',
    caption: `There’s something about nature that just makes everything feel lighter 🍃\n\nHumbling Forest gives me that calm, woody, fresh feeling I always look for, while AquaTerrae adds a clean, refreshing touch that’s perfect for everyday wear.\n\nEnjoy up to 50% OFF on selected KAHF fragrances for a limited time.`,
    drafts: [
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqmj6b8304vfo201gvog5nhe_copy_D6080A95-5B89-4EE8-B2D5-1316A5D0378B.mov?v=2026-06-26T07%3A17%3A39%2B00%3A00',
        status: 'APPROVED',
        createdAt: '2026-06-26T07:17:39.931Z',
      },
    ],
  },
  {
    key: 'farhan',
    id: 'cm7q46xt800crms01uk73l8fl',
    name: 'Muhammad Farhan bin Anuar',
    email: 'farhanuar.work@gmail.com',
    photoURL: '',
    ig: 'farhanpretzel',
    igFollowers: 4940,
    tk: 'farhanpretzel',
    tkFollowers: 57880,
    engagement: 0.142,
    about: '',
    profileLink: 'https://www.tiktok.com/@farhanpretzel',
    amount: 570,
    shortlistedDate: '2026-06-19T04:20:41.699Z',
    followers: 57880,
    submissionStatus: 'CLIENT_APPROVED',
    platform: 'TikTok',
    postingUrl: '',
    submittedAt: '2026-07-01T13:32:19.946Z',
    caption: `okehhh Kahf you did something LEVEL UP right here… \n#KahfExtrait\n#KahfEDP\n#KahfPerfume\n#LuxuryParfume\n#LongLastingParfum`,
    drafts: [
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqoeqqhw06rko201esknmaw7_1782912715894_copy_6D5E1D10-3943-459D-8011-EEDB7D25681E.mov?v=2026-07-01T13%3A32%3A19%2B00%3A00',
        status: 'APPROVED',
        createdAt: '2026-07-01T13:32:19.946Z',
      },
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqoeqqhw06rko201esknmaw7_copy_2A3B8EF2-9DFD-4B60-BBB1-B723C95C26E4.mov?v=2026-06-30T15%3A16%3A35%2B00%3A00',
        status: 'REVISION_REQUESTED',
        createdAt: '2026-06-30T15:16:35.898Z',
      },
    ],
  },
  {
    key: 'adam',
    id: 'cm7cngq8400rpp901q6gzlnrr',
    name: 'Adam Hazly',
    email: 'ahmad.adam12@gmail.com',
    photoURL: '',
    ig: 'adamhazly',
    igFollowers: 988,
    tk: 'adamhazly',
    tkFollowers: 40449,
    engagement: 0.104,
    about: 'Tiktok: tiktok.com/@adamhazly\nInstagram: instagram.com/adamhazly',
    profileLink: 'https://www.tiktok.com/@adamhazly',
    amount: 470,
    shortlistedDate: '2026-06-19T06:33:26.282Z',
    followers: 40449,
    primary: true,
    submissionStatus: 'POSTED',
    platform: 'TikTok',
    postingUrl: 'https://vt.tiktok.com/ZSCyxMJao/',
    submittedAt: '2026-06-23T20:39:22.189Z',
    caption: `Not to be dramatic, but some of y'all NEED this 😭\nKahf Extrait Aquaterrae is now my go-to perfume, because you can smell expensive without spending crazy money. ✨\n\nAnd you can get yours for 50% off in the yellow cart right now, don't miss out!\n\n#KahfExtrait #KahfEDP #KahfPerfume #LuxuryParfume #LongLastingParfume`,
    drafts: [
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqkn7ttj02leo201g4q3e565_KahfExtrait_Draft.mp4?v=2026-06-23T20%3A39%3A22%2B00%3A00',
        status: 'APPROVED',
        createdAt: '2026-06-23T20:39:22.189Z',
      },
    ],
  },
  {
    key: 'ammar',
    id: 'cmikhz3890861o601bao05fkf',
    name: 'Ammar Nazhan',
    email: 'ammarnazhann@gmail.com',
    photoURL: '',
    ig: 'marnazhan',
    igFollowers: 496,
    tk: 'marnazhan',
    tkFollowers: 2871,
    engagement: 0.071,
    about: '',
    profileLink: 'https://www.tiktok.com/@marnazhan',
    amount: 470,
    shortlistedDate: '2026-06-19T06:34:10.885Z',
    followers: 2871,
    submissionStatus: 'POSTED',
    platform: 'TikTok',
    postingUrl: 'https://vt.tiktok.com/ZSCjXcaJh/',
    submittedAt: '2026-06-26T01:42:13.626Z',
    caption: `Wifey jangan salah faham tau, I nak bau wangi je sebab you selalu cakap I masam. Btw grab your Kahf perfume sekarang sementara ada promo!\n\n#KahfExtrait\n#KahfEDP\n#KahfPerfume\n#LuxuryPerfume\n#LongLastingPerfume`,
    drafts: [
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqmj52ok04v2o201dvv922e8_copy_8BC6B17A-BFA8-4472-B19C-55B7DEAAC59A.mov?v=2026-06-26T01%3A42%3A13%2B00%3A00',
        status: 'APPROVED',
        createdAt: '2026-06-26T01:42:13.626Z',
      },
    ],
  },
  {
    key: 'ariq',
    id: 'cmqmk44i0058ho201hnbnlhuv',
    name: 'Ariq Aiman',
    email: 'alariqaimann@gmail.com',
    photoURL: '',
    ig: '',
    igFollowers: 0,
    tk: '',
    tkFollowers: 0,
    engagement: 0.05,
    about: '',
    profileLink: '',
    amount: 470,
    shortlistedDate: '2026-06-19T06:37:12.134Z',
    followers: 0,
    submissionStatus: 'POSTED',
    platform: 'TikTok',
    postingUrl: 'https://vt.tiktok.com/ZSCfo4Y3c/',
    submittedAt: '2026-06-25T09:20:54.133Z',
    caption: `One spray before you step out.\nConfidence follows.\nKahf EDP — long-lasting, luxury scent.`,
    drafts: [
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqmkde2105dao2015v21dkqs_copy_629E8CFF-A538-461C-A09E-1636AB91B7D5.mov?v=2026-06-25T09%3A20%3A54%2B00%3A00',
        status: 'APPROVED',
        createdAt: '2026-06-25T09:20:54.133Z',
      },
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqmkde2105dao2015v21dkqs_copy_C2DADB9E-61C5-4F8F-A819-E7BC710D9731.mov?v=2026-06-25T03%3A20%3A10%2B00%3A00',
        status: 'REVISION_REQUESTED',
        createdAt: '2026-06-25T03:20:10.214Z',
      },
    ],
  },
  {
    key: 'sadlyhaka',
    id: 'cmqkql0ku03g8o201w8xq77bc',
    name: 'Sadlyhaka',
    email: 'hakapunya@gmail.com',
    photoURL: '',
    ig: '',
    igFollowers: 0,
    tk: '',
    tkFollowers: 0,
    engagement: 0.05,
    about: '',
    profileLink: '',
    amount: 570,
    shortlistedDate: '2026-06-19T06:38:30.809Z',
    followers: 0,
    submissionStatus: 'POSTED',
    platform: 'TikTok',
    postingUrl: 'https://vt.tiktok.com/ZSC6y5hFu/',
    submittedAt: '2026-06-25T13:07:13.214Z',
    caption: `Korang yang mana satu? Yang oenting kena wangi.\n#KahfExtrait\n#KahfEDP\n#KahfPerfume\n#LuxuryParfume\n#LongLastingParfume`,
    drafts: [
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqraups20ggmo2016e2f0xju_copy_677E9135-1D65-42D3-AB9E-5B4E0882918B.mov?v=2026-06-25T13%3A07%3A13%2B00%3A00',
        status: 'APPROVED',
        createdAt: '2026-06-25T13:07:13.214Z',
      },
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqraups20ggmo2016e2f0xju_copy_A9F875D2-9E6F-4474-8F3C-9BA24322ED51.mov?v=2026-06-25T04%3A13%3A57%2B00%3A00',
        status: 'REVISION_REQUESTED',
        createdAt: '2026-06-25T04:13:57.206Z',
      },
    ],
  },
  {
    key: 'arven',
    id: 'cmqm09ia604mbo201v78sxf4w',
    name: 'Arven Ramesh',
    email: 'arven12345arven@gmail.com',
    photoURL:
      'https://lh3.googleusercontent.com/a/ACg8ocKeFH0XJvm8rU4QQBdaO9G7urEWQPbpXPjrIop2R95Y_Fk359M=s96-c',
    ig: '',
    igFollowers: 0,
    tk: 'arvenramesh',
    tkFollowers: 1324,
    engagement: 0.075,
    about: '',
    profileLink: 'https://www.tiktok.com/@arvenramesh',
    amount: 370,
    shortlistedDate: '2026-06-19T06:42:34.841Z',
    followers: 1324,
    submissionStatus: 'PENDING_REVIEW',
    platform: 'TikTok',
    postingUrl: '',
    submittedAt: '2026-07-01T22:25:06.086Z',
    caption: `Who else can’t stand smelling bad ?!??\n#KahfExtrait #KahfEDP #KahfPerfume\n#LuxuryParfume #LongLastingParfume`,
    drafts: [
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqoew7uq06sfo201n20m1fc0_1782944691914_copy_9FE41E36-5F05-401B-8641-4428850D8AFF.mov?v=2026-07-01T22%3A25%3A06%2B00%3A00',
        status: 'PENDING',
        createdAt: '2026-07-01T22:25:06.086Z',
      },
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqoew7uq06sfo201n20m1fc0_copy_6C9552C6-8AF2-429C-8739-22A675F84BA4.mov?v=2026-06-26T15%3A42%3A00%2B00%3A00',
        status: 'REVISION_REQUESTED',
        createdAt: '2026-06-26T15:42:00.531Z',
      },
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqoew7uq06sfo201n20m1fc0_copy_9861C5E4-A5E9-4704-8BB6-E99CBEBA4A19.mov?v=2026-06-26T13%3A24%3A51%2B00%3A00',
        status: 'REVISION_REQUESTED',
        createdAt: '2026-06-26T13:24:51.401Z',
      },
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqoew7uq06sfo201n20m1fc0_copy_C830FEB4-29FD-4CAA-A0D4-DDA2DD29A27F.mov?v=2026-06-25T07%3A02%3A48%2B00%3A00',
        status: 'REVISION_REQUESTED',
        createdAt: '2026-06-25T07:02:48.421Z',
      },
    ],
  },
  {
    key: 'azim',
    id: 'cm40xzc9o00a954qgz5t9f80i',
    name: 'Azim Azariqh',
    email: 'azariqh@gmail.com',
    photoURL: '',
    ig: '',
    igFollowers: 0,
    tk: '',
    tkFollowers: 0,
    engagement: 0.05,
    about: '',
    profileLink: '',
    amount: 870,
    shortlistedDate: '2026-06-19T06:42:46.670Z',
    followers: 27200,
    submissionStatus: 'POSTED',
    platform: 'TikTok',
    postingUrl: 'https://vt.tiktok.com/ZSC6TsJ15/',
    submittedAt: '2026-06-24T09:13:01.773Z',
    caption: `Bro’s aura arrives 5 minutes before he does💀🤢\n\nThankfully, Kahf came through with fragrances that actually smell premium and last throughout the day. The Aquaterrae Extrait and Humbling Forest EDP both have that proper “bau mahal” vibe without breaking the bank.\n\n🔥 Kahf tengah promo keras\n🛒 Up to 50% off via Yellow Cart\n\nCheck YC now before the promo ends!\n\n#KahfExtrait #KahfEDP #KahfPerfume #LuxuryParfume #LongLastingParfume`,
    drafts: [
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqn9lrtl05t9o20172da08mn_copy_BC613788-CC31-4382-8237-954048B3FE3B.mov?v=2026-06-24T09%3A13%3A01%2B00%3A00',
        status: 'APPROVED',
        createdAt: '2026-06-24T09:13:01.773Z',
      },
    ],
  },
  {
    key: 'heezam',
    id: 'cm9ju40gz011wqv01jo8fqbfm',
    name: 'Heezam Roslan',
    email: 'heezamroslan@gmail.com',
    photoURL: '',
    ig: '',
    igFollowers: 0,
    tk: '',
    tkFollowers: 0,
    engagement: 0.05,
    about: '',
    profileLink: '',
    amount: 670,
    shortlistedDate: '2026-06-19T06:44:28.862Z',
    followers: 0,
    submissionStatus: 'POSTED',
    platform: 'TikTok',
    postingUrl: 'https://vt.tiktok.com/ZSCmkrTnk/',
    submittedAt: '2026-06-29T11:20:50.852Z',
    caption: `Fresh or woody? Why not both. 🌊🌲\nAquaterrae Extrait brings a fresh, premium scent that lasts, while Humbling Forest EDP gives a calming woody vibe for everyday wear. Both smell expensive without the expensive price.\nKahf tengah promo keras — up to 50% OFF! Check the Yellow Cart now before it's gone.\n#KahfExtrait #KahfEDP #KahfPerfume #LuxuryParfume #LongLastingParfume`,
    drafts: [
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqn7f3k505rao201buqzfjzy_c2f14ca28c3144eaa1e9922c28b86add.mp4?v=2026-06-29T11%3A20%3A50%2B00%3A00',
        status: 'APPROVED',
        createdAt: '2026-06-29T11:20:50.852Z',
      },
    ],
  },
  {
    key: 'farouk',
    id: 'cmnpmyssw03neo8017g29os1z',
    name: 'Farouk Razlan',
    email: 'faroukrazlan06@gmail.com',
    photoURL: '',
    ig: '',
    igFollowers: 0,
    tk: 'kingfarouk17',
    tkFollowers: 9811,
    engagement: 0.05,
    about: '',
    profileLink: 'https://www.tiktok.com/@kingfarouk17',
    amount: 570,
    shortlistedDate: '2026-06-22T03:13:38.677Z',
    followers: 9811,
    submissionStatus: 'POSTED',
    platform: 'TikTok',
    postingUrl: 'https://vt.tiktok.com/ZSChYeY1E/',
    submittedAt: '2026-06-26T06:28:51.315Z',
    caption: 'Your girlfriend said you smell like a fish? KAHF makes you smell like a king! Make sure to get yours now!!',
    drafts: [
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqouclep08ico201xp92lk3i_664a42d7d19b4a6aa23861980fdc92eb.mov?v=2026-06-26T06%3A28%3A51%2B00%3A00',
        status: 'APPROVED',
        createdAt: '2026-06-26T06:28:51.315Z',
      },
    ],
  },
  {
    key: 'adeeb',
    id: 'cmawcfwsw050xky01g7nv3duc',
    name: 'adeeb shukri',
    email: 'adeebshukri1414@gmail.com',
    photoURL:
      'https://lh3.googleusercontent.com/a/ACg8ocIvHoDyERVYGe_annQg8QJv6JyxvCZpCyC4GKEUbURNcYRiKOWSBA=s96-c',
    ig: '',
    igFollowers: 0,
    tk: '',
    tkFollowers: 0,
    engagement: 0.05,
    about: '',
    profileLink: '',
    amount: 370,
    shortlistedDate: '2026-06-22T03:17:19.567Z',
    followers: 0,
    submissionStatus: 'POSTED',
    platform: 'TikTok',
    postingUrl: 'https://vt.tiktok.com/ZSCU8FHdH/',
    submittedAt: '2026-06-26T07:46:05.382Z',
    caption: `Ever heard of mat salleh complaining they don’t like being sweaty? Here’s why!!\n#KahfExtrait\n#KahfEDP\n#KahfPerfume\n#LuxuryParfume\n#LongLastingParfume`,
    drafts: [
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqowhgrb08vho201wunsx0j1_67b48a41ac0a4cc790ef59898910e407.mov?v=2026-06-26T07%3A46%3A05%2B00%3A00',
        status: 'APPROVED',
        createdAt: '2026-06-26T07:46:05.382Z',
      },
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqowhgrb08vho201wunsx0j1_5e78799089c04ed0994e744f1c48f08b.mov?v=2026-06-26T06%3A49%3A40%2B00%3A00',
        status: 'REVISION_REQUESTED',
        createdAt: '2026-06-26T06:49:40.146Z',
      },
    ],
  },
  {
    key: 'dunia',
    id: 'cmc1imiai07dglg01j596cnif',
    name: 'Dunia Amir',
    email: 'duniaamirr@gmail.com',
    photoURL: 'https://storage.googleapis.com/cult_production/creator/IMG_2274 2.JPG',
    ig: 'itsduniaamir',
    igFollowers: 4815,
    tk: 'itsduniaamir',
    tkFollowers: 22463,
    engagement: 0.05,
    about: '',
    profileLink: 'https://www.tiktok.com/@itsduniaamir',
    amount: 670,
    shortlistedDate: '2026-06-22T03:19:10.164Z',
    followers: 22463,
    submissionStatus: 'POSTED',
    platform: 'TikTok',
    postingUrl: 'https://vt.tiktok.com/ZSCUMTbJX/',
    submittedAt: '2026-06-26T08:41:07.228Z',
    caption:
      'Kau ingat bau badan tu salah kau? Salahkan gen dulu. 😅 Tapi kalau nak upgrade, Kahf Extrait tahan 24 jam, bau mahal, sekarang 50% off dekat Beg Kuning. #KahfExtrait #KahfEDP #KahfPerfume #LuxuryParfume #LongLastingParfume',
    drafts: [
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqrr5ffk0ihjo2012f8ucyu9_Kahf%20Campaign.mov?v=2026-06-26T08%3A41%3A07%2B00%3A00',
        status: 'APPROVED',
        createdAt: '2026-06-26T08:41:07.228Z',
      },
    ],
  },
  {
    key: 'hakeem',
    id: 'cm6vnl4qs016eqo01gg3vbver',
    name: 'Hakeem',
    email: 'luqmannhakeem4@gmail.com',
    photoURL:
      'https://lh3.googleusercontent.com/a/ACg8ocLYzFt2C8VfD4BZ-gGWcDKUE8aSGFFTgu19ORRv33BJtlBHym3W=s96-c',
    ig: '',
    igFollowers: 0,
    tk: '',
    tkFollowers: 0,
    engagement: 0.05,
    about: '',
    profileLink: '',
    amount: 2700,
    shortlistedDate: '2026-06-25T03:09:05.818Z',
    followers: 0,
    submissionStatus: 'POSTED',
    platform: 'TikTok',
    postingUrl: 'https://vt.tiktok.com/ZSCUE4Ee7/',
    submittedAt: '2026-06-29T05:20:46.082Z',
    caption: 'ye lah kau kan terpaling mat perfume 🫩',
    drafts: [
      {
        url: 'https://storage.googleapis.com/cult_production/VIDEO/cmqszd1800ldlo201luqejigx_copy_293502FF-1B63-4ABB-AA48-3AB40AA74266.mov?v=2026-06-29T05%3A20%3A46%2B00%3A00',
        status: 'APPROVED',
        createdAt: '2026-06-29T05:20:46.082Z',
      },
    ],
  },
];

// Real credit tiers (from ShortListedCreator.creditTier). Drives the "Tier"
// column in the creator master list (pitch.user.creator.creditTier). Keyed by
// CREATORS.key; rejected / non-shortlisted creators have no assigned tier.
const REAL_TIERS = {
  adam: { name: 'Micro B', creditsPerVideo: 4 },
  ahmadjaris: { name: 'Nano B', creditsPerVideo: 2 },
  ammar: { name: 'Nano A', creditsPerVideo: 1 },
  amsyar: { name: 'Nano A', creditsPerVideo: 1 },
  azim: { name: 'Micro A', creditsPerVideo: 3 },
  arven: { name: 'Nano A', creditsPerVideo: 1 },
  farhan: { name: 'Micro C', creditsPerVideo: 5 },
  ericlim: { name: 'Micro C', creditsPerVideo: 5 },
  ammarwazien: { name: 'Nano A', creditsPerVideo: 1 },
  tengku: { name: 'Micro C', creditsPerVideo: 5 },
  sakura: { name: 'Nano B', creditsPerVideo: 2 },
};

// Real submission approval timestamps (Submission.approvedAt) pulled from the
// real Kahf campaign C478, keyed by CREATORS.key. Drives the "Date approved"
// line shown on POSTED submissions (posting-link-section.jsx reads
// submission.updatedAt). Creators still in review (e.g. arven) have no
// approval date and fall back to their submittedAt.
const REAL_APPROVED_AT = {
  adam: '2026-06-25T04:28:56.714Z',
  adeeb: '2026-06-29T01:03:00.998Z',
  ahmadjaris: '2026-06-25T04:29:02.594Z',
  ammar: '2026-06-26T03:09:09.153Z',
  amsyar: '2026-06-25T05:15:57.107Z',
  ariq: '2026-06-25T09:45:03.369Z',
  azim: '2026-06-26T09:01:59.675Z',
  dunia: '2026-06-26T14:32:53.635Z',
  farhan: '2026-07-02T07:56:16.358Z',
  farouk: '2026-06-26T14:32:49.447Z',
  hakeem: '2026-06-29T07:41:06.568Z',
  heezam: '2026-07-01T01:25:21.384Z',
  ali: '2026-06-26T14:32:39.154Z',
  irfan: '2026-06-29T07:41:12.404Z',
  lutfil: '2026-06-26T14:32:44.269Z',
  nadzmeen: '2026-06-29T07:41:16.639Z',
  sadlyhaka: '2026-06-26T03:08:50.604Z',
  shahrul: '2026-06-29T00:37:18.732Z',
};

// --- Build full user objects from the raw config --------------------------
const buildCreatorUser = (c) => {
  const igUser = c.ig
    ? { username: c.ig, followers_count: c.igFollowers || 0, engagement_rate: c.engagement || 0.05 }
    : null;
  const tkUser = c.tk ? { username: c.tk, follower_count: c.tkFollowers || 0 } : null;
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    photoURL: c.photoURL || '',
    status: 'active',
    instagramUser: igUser,
    tiktokUser: tkUser,
    ...(c.primary
      ? {
          shortlisted: [{ amount: c.amount, currency: 'MYR' }],
          paymentForm: {
            bankAccountName: c.name,
            bankName: 'Maybank',
            accountNumber: '5123 4567 8901',
            icNumber: '990101-14-5678',
            reason: '',
          },
        }
      : {}),
    creator: {
      id: `${c.id}-profile`,
      about: c.about || '',
      profileLink: c.profileLink || (c.tk ? `https://www.tiktok.com/@${c.tk}` : ''),
      isGuest: c.isGuest || false,
      creditTier: REAL_TIERS[c.key] || null,
      instagram: c.ig || '',
      tiktok: c.tk || '',
      instagramUser: igUser,
      tiktokUser: tkUser,
      interests: [{ name: 'Beauty & Skincare' }, { name: 'Lifestyle' }, { name: 'Wellness' }],
    },
  };
};

// --- Creators on the campaign (derived from CREATORS) ----------------------
const demoCreators = CREATORS.map((c) => ({
  key: c.key,
  user: buildCreatorUser(c),
  outreachStatus: c.outreachStatus || 'CONFIRMED',
  pitchStatus: c.pitchStatus || 'APPROVED',
  amount: c.amount,
  currency: 'MYR',
  shortlistedDate: c.shortlistedDate,
  followers: c.followers,
  submissionStatus: c.submissionStatus,
  platform: c.platform,
  postingUrl: c.postingUrl || '',
  caption: c.caption || '',
  submittedAt: c.submittedAt,
  drafts: c.drafts || [],
  insight: c.submissionStatus === 'POSTED' ? makeInsight(c.followers) : null,
  thumbnail: c.photoURL || TIKTOK_THUMBNAIL,
}));

const demoCreatorUsersById = demoCreators.reduce((acc, creator) => {
  acc[creator.user.id] = creator.user;
  return acc;
}, {});

const demoLogisticsProducts = [
  {
    id: 'cmqj9qwod00olpi01yge73ccl',
    productName: 'Kahf Extrait',
    description: null,
    isArchived: false,
    createdAt: '2026-06-18T08:59:40.141Z',
    updatedAt: '2026-06-18T08:59:40.141Z',
  },
  {
    id: 'cmqj9qwod00ompi01ulnsddqr',
    productName: 'Kahf EDP',
    description: null,
    isArchived: false,
    createdAt: '2026-06-18T08:59:40.141Z',
    updatedAt: '2026-06-18T08:59:40.141Z',
  },
  {
    id: 'cmqj9qwod00onpi01glpb4xp5',
    productName: 'Kahf Facewash',
    description: null,
    isArchived: false,
    createdAt: '2026-06-18T08:59:40.141Z',
    updatedAt: '2026-06-18T08:59:40.141Z',
  },
];

const DEMO_LOGISTICS_ADDRESS = 'Delivery address confirmed with creator.';

const DEMO_LOGISTICS_ROWS = [
  ['cmqkeq5p101fbo201t8pvlosl', 'cmkqc0h5t0e3qo301hijgv3vm', '2026-06-19T04:06:49.429Z', '2026-06-24T05:54:08.286Z'],
  ['cmqkopmp802ngo2017alb3ugo', 'cml6877x7024foo015zigvdmn', '2026-06-19T08:46:20.972Z', '2026-06-26T19:54:35.597Z'],
  ['cmqlrbb0y04g4o201cpnpq9ig', 'cm7q46xt800crms01uk73l8fl', '2026-06-20T02:46:57.682Z', '2026-07-01T13:31:56.008Z'],
  ['cmqn7ji0x05s5o201it3f0dku', 'cm9ju40gz011wqv01jo8fqbfm', '2026-06-21T03:09:00.033Z', '2026-06-29T11:20:14.749Z'],
  ['cmqokv4po07hno201xfmmyr8y', 'cmbytbkvo02nplg01cz46i1c9', '2026-06-22T02:09:43.836Z', '2026-06-26T15:16:02.742Z'],
  ['cmqouwecs08nho201d1n0dp7o', 'cm40xzc9o00a954qgz5t9f80i', '2026-06-22T06:50:39.147Z', '2026-06-24T09:12:22.379Z'],
  ['cmqowui6f0906o201mj6k1syz', 'cmqm09ia604mbo201v78sxf4w', '2026-06-22T07:45:10.023Z', '2026-07-01T22:24:52.023Z'],
  ['cmqpaocqe09o9o2019zyqz0cg', 'cm7cngq8400rpp901q6gzlnrr', '2026-06-22T14:12:17.654Z', '2026-06-23T20:38:51.905Z'],
  ['cmqpwc0zh0aq6o201ct1lar07', 'cmawcfwsw050xky01g7nv3duc', '2026-06-23T00:18:34.109Z', '2026-06-26T07:45:53.184Z'],
  ['cmqrgx9h20h65o201c3sjevlb', 'cml5zpmas00xooo0177td48sy', '2026-06-24T02:42:43.382Z', '2026-06-24T02:48:27.342Z'],
  ['cmqrqnoej0ig8o201zyvq59ml', 'cmnpmyssw03neo8017g29os1z', '2026-06-24T07:15:12.331Z', '2026-06-26T06:28:32.902Z'],
  ['cmqs33oay0jj1o2019mrbcgv0', 'cmkqima2v0f6so30169il9wno', '2026-06-24T13:03:34.090Z', '2026-06-27T12:24:26.162Z'],
  ['cmqs9qvkn0juso201v4fv9x95', 'cmkqoxf3g00q8o701909ehnva', '2026-06-24T16:09:34.295Z', '2026-06-26T06:06:26.271Z'],
  ['cmqsxi1jj0l40o201fi8xkv4x', 'cmqmk44i0058ho201hnbnlhuv', '2026-06-25T03:14:32.911Z', '2026-06-25T09:20:39.337Z'],
  ['cmqszcwz80ldfo201zjsugb91', 'cmqkql0ku03g8o201w8xq77bc', '2026-06-25T04:06:32.949Z', '2026-06-25T13:06:58.330Z'],
  ['cmqu9kltx02tko20117g8dxld', 'cmikhz3890861o601bao05fkf', '2026-06-26T01:40:14.085Z', '2026-06-26T01:41:58.441Z'],
  ['cmqul39va03vqo201abaz3pvq', 'cmqlj0nc504ero20108ek4i2a', '2026-06-26T07:02:40.822Z', '2026-06-26T07:17:11.043Z'],
  ['cmquojpw4048ko201re31dp2o', 'cmc1imiai07dglg01j596cnif', '2026-06-26T08:39:26.932Z', '2026-06-26T08:40:26.634Z'],
  ['cmqyrnn3v0a1ao201palpdr4u', 'cm6vnl4qs016eqo01gg3vbver', '2026-06-29T05:17:33.500Z', '2026-06-29T05:20:10.294Z'],
];

const demoLogistics = DEMO_LOGISTICS_ROWS.map(([id, creatorId, createdAt, completedAt]) => {
  const creator = demoCreatorUsersById[creatorId] || {
    id: creatorId,
    name: 'Creator',
    photoURL: '',
    creator: {},
  };

  return {
    id,
    type: 'PRODUCT_DELIVERY',
    status: 'COMPLETED',
    createdAt,
    updatedAt: completedAt,
    shippedAt: null,
    deliveredAt: null,
    receivedAt: null,
    completedAt,
    campaignId: DEMO_CAMPAIGN_ID,
    creatorId,
    creator,
    createdById: creatorId,
    deliveryDetails: {
      id: `${id}details`,
      trackingLink: null,
      address: DEMO_LOGISTICS_ADDRESS,
      expectedDeliveryDate: null,
      dietaryRestrictions: '',
      isConfirmed: true,
      createdAt,
      items: [],
    },
    issues: [],
  };
});

const CREATOR_SUBMISSIONS_KEYS = new Set([
  'adam',
  'ahmadjaris',
  'ammarwazien',
  'azim',
  'arven',
  'amsyar',
  'ericlim',
  'farhan',
  'sakura',
  'tengku',
]);

const demoSubmissionCreators = demoCreators.filter(
  (creator) => CREATOR_SUBMISSIONS_KEYS.has(creator.key) && creator.drafts.length > 0
);

// --- Creator pitches (Overview > Creator Pitches + client Master List) -----
// The client master list reads pitches (via useGetV3Pitches) and renders each
// pitch's real `status`, so this list carries the organic status mix
// (APPROVED for shortlisted/confirmed creators, REJECTED for the rest). Note:
// the master list maps these with isShortlisted:false, so `status` drives the
// pill directly. IDs are hyphen-free (see submission-id note below).
const CREATOR_MASTER_LIST_KEYS = new Set([
  'adam',
  'ahmadjaris',
  'ericlim',
  'ammarwazien',
  'azim',
  'arven',
  'amsyar',
  'tengku',
  'sakura',
  'farhan',
]);

const CREATOR_MASTER_LIST_STUBS = [
  {
    key: 'ericlim',
    id: 'cmqkfl5ce01mso201ti5ambug',
    name: 'Eric Lim',
    tk: 'ericlimzvv',
    tkFollowers: 59200,
    selectedPlatform: 'tiktok',
    followers: 59200,
    status: 'APPROVED',
    outreach: 'UNRESPONSIVE',
    createdAt: '2026-06-19T06:36:16.626Z',
  },
  {
    key: 'ammarwazien',
    id: 'cmm1kbibv00uwqs010ieka28i',
    name: 'Ammar Wazien',
    tk: 'ammarwazien',
    tkFollowers: 2654,
    igFollowers: 311,
    selectedPlatform: 'tiktok',
    followers: 2654,
    status: 'REJECTED',
    outreach: 'INTERESTED',
    createdAt: '2026-06-18T09:30:00.000Z',
  },
  {
    key: 'sakura',
    id: 'cmqkgldwk01poo201tupzq7qj',
    name: 'Sakura',
    tk: 'jasonvivyy',
    igFollowers: 8338,
    selectedPlatform: 'instagram',
    followers: 8338,
    status: 'REJECTED',
    outreach: 'REJECTED',
    createdAt: '2026-06-19T06:39:49.826Z',
  },
  {
    key: 'tengku',
    id: 'cmqoigndj075vo2015z81utm5',
    name: 'Tengku',
    tk: 'tengkumer',
    tkFollowers: 59800,
    selectedPlatform: 'tiktok',
    followers: 59800,
    status: 'REJECTED',
    outreach: 'OUTREACHED',
    createdAt: '2026-06-19T07:00:00.000Z',
  },
];

const makeStubPitchUser = (s) => {
  const igUser = s.igFollowers ? { username: '', followers_count: s.igFollowers, engagement_rate: 0.05 } : null;
  const tkUser = s.tk ? { username: s.tk, follower_count: s.tkFollowers || s.followers || 0 } : null;
  return {
    id: s.id,
    name: s.name,
    email: '',
    photoURL: '',
    status: 'active',
    instagramUser: igUser,
    tiktokUser: tkUser,
    creator: {
      id: `${s.id}-profile`,
      about: '',
      profileLink: s.tk ? `https://www.tiktok.com/@${s.tk}` : '',
      isGuest: true,
      creditTier: REAL_TIERS[s.key] || null,
      instagram: '',
      tiktok: s.tk || '',
      manualFollowerCount: s.followers || 0,
      instagramUser: igUser,
      tiktokUser: tkUser,
      interests: [],
    },
  };
};

export const demoPitches = [
  ...demoCreators.filter((creator) => CREATOR_MASTER_LIST_KEYS.has(creator.key)).map((creator) => ({
    id: `demopitch${creator.key}`,
    pitchId: `demopitch${creator.key}`,
    userId: creator.user.id,
    status: creator.pitchStatus,
    displayStatus: creator.pitchStatus,
    type: 'text',
    content: '',
    createdAt: creator.shortlistedDate,
    outreachStatus: creator.outreachStatus,
    selectedPlatform: creator.platform?.toLowerCase?.() || 'tiktok',
    adminComments: '',
    followerCount:
      creator.followers ??
      creator.user.tiktokUser?.follower_count ??
      creator.user.instagramUser?.followers_count ??
      null,
    user: creator.user,
  })),
  ...CREATOR_MASTER_LIST_STUBS.map((s) => ({
    id: `demopitch${s.key}`,
    pitchId: `demopitch${s.key}`,
    userId: s.id,
    status: s.status,
    displayStatus: s.status,
    type: 'text',
    content: '',
    createdAt: s.createdAt,
    outreachStatus: s.outreach,
    selectedPlatform: s.selectedPlatform || 'tiktok',
    adminComments: '',
    followerCount: s.followers,
    user: makeStubPitchUser(s),
  })),
];

// --- Derive submissions from `demoCreators` --------------------------------
// Each creator gets an APPROVED agreement form (required for the video row to
// render — see campaign-creator-submissions-v4.jsx `isAgreementApproved`) plus
// one VIDEO submission whose `video[]` array carries the draft/revision history
// (latest-first). Creators with no drafts render as their `submissionStatus`
// (e.g. NOT_STARTED) with nothing to play.
// NOTE: submission ids must be HYPHEN-FREE. The submissions view derives the
// active submission via `activeKey.split('-')` (campaign-creator-submissions-v4.jsx),
// so any hyphen in the id truncates it and the expanded panel renders nothing.
const makeAgreementSubmission = (creator) => ({
  id: `demoagr${creator.key}`,
  status: 'APPROVED',
  submissionType: { type: 'AGREEMENT_FORM' },
  userId: creator.user.id,
  user: creator.user,
  campaignId: DEMO_CAMPAIGN_ID,
  content: SAMPLE_AGREEMENT_PDF,
  createdAt: '2026-06-19T09:15:00.000Z',
  video: [],
  photos: [],
  rawFootages: [],
  feedback: [],
});

const makeVideoSubmission = (creator) => {
  const id = `demovid${creator.key}`;
  return {
    id,
    status: creator.submissionStatus,
    submissionType: { type: 'VIDEO' },
    caption: creator.caption || '',
    content: creator.postingUrl || '', // posting link (only set for POSTED)
    userId: creator.user.id,
    user: creator.user,
    creatorName: creator.user.name,
    campaignId: DEMO_CAMPAIGN_ID,
    campaign: { id: DEMO_CAMPAIGN_ID, campaignType: 'normal', name: CAMPAIGN_NAME, isDemo: true },
    createdAt: creator.submittedAt,
    // Real approval date (Submission.approvedAt from C478). posting-link-section
    // renders this as "Date approved" on POSTED submissions.
    approvedAt: REAL_APPROVED_AT[creator.key] || null,
    updatedAt: REAL_APPROVED_AT[creator.key] || creator.submittedAt,
    // Draft history, latest-first (matches backend Video ordering).
    video: (creator.drafts || []).map((d, i) => ({
      id: `${id}v${i}`,
      url: d.url,
      status: d.status,
      createdAt: d.createdAt,
      reasons: d.reasons || [],
      feedback: d.feedback || '',
    })),
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

const demoSubmissionCreatorIds = new Set(demoSubmissionCreators.map((creator) => creator.user.id));
const demoCampaignSubmissions = allSubmissions.filter((submission) =>
  demoSubmissionCreatorIds.has(submission.userId)
);

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
export const demoInsights = demoSubmissionCreators
  .filter((creator) => creator.submissionStatus === 'POSTED' && creator.insight)
  .map((creator) => ({
    id: `demovid${creator.key}`,
    submissionId: `demovid${creator.key}`,
    user: creator.user.id,
    platform: creator.platform,
    postUrl: creator.postingUrl,
    thumbnail: creator.thumbnail,
    insight: creator.insight,
  }));

// --- Creator lookup (useGetCreatorById → { data }) -------------------------
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
  const rates = [
    [null, 2.1, null, 3.4, 4.8, null, 1.9],
    [2.8, null, 3.9, null, 5.6, 6.2, null],
    [null, 4.1, 4.6, 5.2, null, 6.9, 3.3],
    [3.6, 4.4, null, 5.8, 6.4, null, 4.0],
    [null, 5.1, 5.7, null, 7.2, 7.8, 4.9],
    [4.2, null, 6.1, 6.8, null, 8.4, 5.5],
  ];
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
  { key: 'farhan', base: 26000, growth: 9000 },
  { key: 'adam', base: 22000, growth: 8000 },
  { key: 'azim', base: 15000, growth: 5000 },
  { key: 'ahmadjaris', base: 9000, growth: 3000 },
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
        views: Math.round(c.base + c.growth * i + ((i * 37) % 5) * 400),
      })),
    });
  }
  return { trend };
};

// --- The campaign object (returned by useGetCampaignByIdScoped) ------------
export const demoCampaign = {
  id: DEMO_CAMPAIGN_ID,
  campaignId: 'C478',
  name: CAMPAIGN_NAME,
  description:
    'Drive consideration and conversion for Kahf perfumes by positioning them as premium, long-lasting fragrances for Gen Z men and young working adults.',
  status: 'ACTIVE',
  isDemo: true,
  submissionVersion: 'v4',
  campaignType: 'normal',
  origin: 'ADMIN',
  productName: 'Kahf Extrait & Kahf EDP',
  brandTone: 'Confident, Fresh, Premium, Grounded',
  brandAbout:
    'Kahf was born from the belief that self-care is more than skin deep — it’s about confidence, balance, and purpose. Inspired by the spirit of nature and the drive of modern men, Kahf creates daily essentials that go beyond grooming.',
  logisticsType: 'PRODUCT_DELIVERY',
  products: demoLogisticsProducts,
  spreadSheetURL: null,
  isPCRReady: false,
  isCreditTier: true,
  isKWSPCampaign: false,

  // Deliverable-type flags (only "UGC Videos" should display).
  rawFootage: false,
  photos: false,
  ads: false,
  crossPosting: false,

  // Credits (Overview > Credits Tracking). Requires company.subscriptions
  // below to be non-empty for the breakdown to render.
  campaignCredits: 40,
  creditsUtilized: 40,
  creditsPending: 0,

  campaignBrief: {
    images: [COVER_IMAGE],
    startDate: '2026-06-17T16:00:00.000Z',
    endDate: '2026-09-17T16:00:00.000Z',
    postingStartDate: '2026-06-24T16:00:00.000Z',
    postingEndDate: '2026-07-04T16:00:00.000Z',
    industries: 'Fashion, Lifestyle, Beauty & Skincare',
    objectives: 'Awareness',
    secondaryObjectives: [
      'Brand Awareness (Introduce brands to new audiences)',
      'Product Launch (Generate buzz for new product/service)',
    ],
    primaryKPI: '',
    performanceBaseline: '',
    boostContent: '',
    socialMediaPlatform: ['TikTok', 'Instagram'],
    videoAngle: [],
    otherAttachments: [],
    attachments: [],
    referencesLinks: [],
  },

  campaignRequirement: {
    gender: ['male'],
    age: ['18-25', '26-34'],
    language: ['Malay', 'English'],
    creator_persona: ['Beauty & Skincare', 'Health', 'Lifestyle'],
    user_persona: 'Men who love fragrances',
    geographic_focus: 'Kuala Lumpur',
    geographicFocusOthers: '',
  },

  // Client (Kahf Malaysia). company.brand is intentionally not an array so the
  // Details tab falls back to campaignBrief.industries for "Industry".
  company: {
    id: 'demo-company-kahf',
    name: 'Kahf Malaysia',
    logo: COMPANY_LOGO,
    about:
      'Kahf was born from the belief that self-care is more than skin deep — it’s about confidence, balance, and purpose. Inspired by the spirit of nature and the drive of modern men, Kahf creates daily essentials that go beyond grooming.',
    address: '',
    email: '',
    website: 'https://www.kahfeveryday.com/',
    pic: [{ name: 'Ibnu', email: 'ibnu.aswan@paracorpgroup.com' }],
    // Drives the "Credits Tracking" card (must be non-empty to show the breakdown).
    subscriptions: [
      {
        id: 'demo-subscription-1',
        createdAt: '2026-06-01T00:00:00.000Z',
        totalCredits: 40,
        creditsUsed: 40,
        package: { name: 'Credit Tier Package', credits: 40 },
      },
    ],
  },

  // Campaign managers (real admin users from production data).
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

  // Creator Submissions list. Limited to the requested creators that actually
  // have V4 video submissions in the demo data.
  shortlisted: demoSubmissionCreators.map((creator) => ({
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
  // Kept empty so the v4 Master List uses `shortlisted` (the creators above).
  pitches: [],

  // Flat submissions list — used by analytics + agreement counting.
  submission: demoCampaignSubmissions,

  logistic: demoLogistics,
  logistics: demoLogistics,
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
  createdAt: '2026-06-19T09:00:00.000Z',
  updatedAt: '2026-06-19T09:15:00.000Z',
  user: creator.user,
}));

// --- Invoices (useGetInvoicesByCampId → { campaigns }) ---------------------
const primaryCreator = demoCreators.find((c) => CREATORS.find((rc) => rc.key === c.key)?.primary);

const INVOICE_ITEMS = [
  {
    id: 'demo-inv-item-1',
    title: `UGC Video — ${CAMPAIGN_NAME}`,
    description: 'TikTok video deliverable (1x)',
    service: 'UGC Video',
    price: primaryCreator?.amount || 470,
    quantity: 1,
    total: primaryCreator?.amount || 470,
  },
];

const invoiceFrom = {
  id: 'demo-inv-from',
  name: primaryCreator?.user.name || 'Adam Hazly',
  email: primaryCreator?.user.email || 'ahmad.adam12@gmail.com',
  fullAddress: 'Kuala Lumpur, Malaysia',
  phoneNumber: '+60 12-345 6789',
  company: primaryCreator?.user.name || 'Adam Hazly',
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
    invoiceNumber: 'INV-C478-001',
    status: 'approved',
    amount: primaryCreator?.amount || 470,
    subTotal: primaryCreator?.amount || 470,
    totalAmount: primaryCreator?.amount || 470,
    taxes: 0,
    discount: 0,
    shipping: 0,
    currency: 'MYR',
    items: INVOICE_ITEMS,
    task: {
      title: 'UGC Video x1',
      description: 'TikTok video',
      service: 'UGC Video',
      price: primaryCreator?.amount || 470,
    },
    invoiceFrom,
    invoiceTo,
    createDate: '2026-06-30T00:00:00.000Z',
    createdAt: '2026-06-30T00:00:00.000Z',
    dueDate: '2026-07-15T00:00:00.000Z',
    sent: 1,
    campaignId: DEMO_CAMPAIGN_ID,
    campaign: { name: CAMPAIGN_NAME, company: { name: 'Kahf Malaysia' } },
    creator: {
      user: {
        name: primaryCreator?.user.name || 'Adam Hazly',
        email: primaryCreator?.user.email || 'ahmad.adam12@gmail.com',
        paymentForm: primaryCreator?.user.paymentForm,
      },
    },
    user: { name: primaryCreator?.user.name || 'Adam Hazly' },
  },
];

// --- Summary card data for the static demo card on the listing page --------
export const demoCampaignCard = {
  id: DEMO_CAMPAIGN_ID,
  name: CAMPAIGN_NAME,
  company: 'Kahf Malaysia',
  industry: 'Beauty & Skincare',
  dateRange: '17 Jun 2026 - 17 Sep 2026',
  image: COVER_IMAGE,
  logo: COMPANY_LOGO,
  status: 'ACTIVE',
};
