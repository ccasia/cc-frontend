// Analytics V2 - Mock Data
// 12 months of realistic data (Feb 2025 - Jan 2026)

const MONTHS = [
  'Feb 25', 'Mar 25', 'Apr 25', 'May 25', 'Jun 25', 'Jul 25',
  'Aug 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26',
];

// 1. Creator Growth Rate (24 months: Feb 2024 - Jan 2026)
const GROWTH_MONTHS = [
  'Feb 24', 'Mar 24', 'Apr 24', 'May 24', 'Jun 24', 'Jul 24',
  'Aug 24', 'Sep 24', 'Oct 24', 'Nov 24', 'Dec 24', 'Jan 25',
  'Feb 25', 'Mar 25', 'Apr 25', 'May 25', 'Jun 25', 'Jul 25',
  'Aug 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26',
];
export const MOCK_CREATOR_GROWTH = GROWTH_MONTHS.map((month, i) => {
  const totals = [
    5, 7, 9, 11, 12, 14, 18, 22, 30, 35, 52, 78,
    130, 185, 310, 450, 420, 690, 1100, 1850, 2400, 3200, 5800, 8500,
  ];
  const signups = [
    2, 3, 2, 4, 2, 5, 6, 8, 12, 9, 22, 35,
    68, 75, 150, 180, 15, 320, 480, 850, 700, 1050, 2900, 3200,
  ];
  const growthRates = [
    66.7, 40.0, 28.6, 22.2, 9.1, 16.7, 28.6, 22.2, 36.4, 16.7, 48.6, 50.0,
    66.7, 42.3, 67.6, 45.2, -6.7, 64.3, 59.4, 68.2, 29.7, 33.3, 81.3, 46.6,
  ];
  return {
    month,
    total: totals[i],
    newSignups: signups[i],
    growthRate: growthRates[i],
  };
});

// 4. Media Kit Activation (platform breakdown - static snapshot)
export const MOCK_MEDIA_KIT = [
  { platform: 'TikTok', rate: 62.4, connected: 1896, total: 3040 },
  { platform: 'Instagram', rate: 71.8, connected: 2183, total: 3040 },
];

// 5. Pitch Rate (growth with competitive dips and campaign-driven spikes)
export const MOCK_PITCH_RATE = MONTHS.map((month, i) => ({
  month,
  rate: [18.3, 22.1, 19.8, 24.5, 27.3, 25.1, 30.8, 28.2, 32.5, 29.7, 35.1, 33.4][i],
}));

// 6. AVG Agreement Response Time (hours — improving but with holiday/staffing spikes)
export const MOCK_AVG_AGREEMENT_TIME = MONTHS.map((month, i) => ({
  month,
  avgHours: [48.2, 42.1, 45.8, 38.3, 35.6, 40.2, 33.1, 29.8, 31.5, 27.4, 32.8, 24.6][i],
}));

// 7. AVG Time to First Campaign (hours — seasonal variation with ramp-up periods)
export const MOCK_AVG_FIRST_CAMPAIGN_TIME = MONTHS.map((month, i) => ({
  month,
  avgHours: [516, 454, 487, 410, 379, 422, 341, 324, 362, 307, 274, 288][i],
}));

// 8. AVG Submission Response Time (hours — improving with occasional backlogs)
export const MOCK_AVG_SUBMISSION_TIME = MONTHS.map((month, i) => ({
  month,
  avgHours: [36.4, 31.8, 34.5, 28.2, 25.1, 29.3, 22.8, 20.4, 23.6, 18.9, 16.2, 17.5][i],
}));

// 9. Creator Retention (growth with dips from campaign gaps and seasonal dropout)
export const MOCK_RETENTION = MONTHS.map((month, i) => ({
  month,
  rate: [15.2, 18.1, 16.5, 19.8, 22.4, 20.6, 24.3, 26.1, 23.8, 27.5, 30.2, 28.8][i],
}));

// 10. Creator Satisfaction (Star Rating)
export const MOCK_NPS_TREND = MONTHS.map((month, i) => ({
  month,
  rating: [3.8, 3.9, 3.7, 4.0, 4.1, 3.9, 4.0, 4.1, 4.2, 4.0, 4.3, 4.2][i],
}));

export const MOCK_NPS = {
  averageRating: 4.2,
  totalResponses: 403,
  distribution: [
    { rating: 1, count: 12 },
    { rating: 2, count: 25 },
    { rating: 3, count: 58 },
    { rating: 4, count: 142 },
    { rating: 5, count: 166 },
  ],
};

// 12. Rejection Rate (V4 campaigns)
export const MOCK_REJECTION_RATE = {
  avgRate: 18.5,
  breakdown: [
    { campaign: 'Nike Summer Drop', package: 'Pro', rate: 12.3, rejected: 8, total: 65 },
    { campaign: 'Grab Food Festival', package: 'Essential', rate: 22.1, rejected: 15, total: 68 },
    { campaign: 'Sephora Beauty', package: 'Pro', rate: 15.8, rejected: 9, total: 57 },
    { campaign: 'Shopee 11.11', package: 'Custom', rate: 25.0, rejected: 18, total: 72 },
    { campaign: 'Maybank Raya', package: 'Essential', rate: 10.5, rejected: 6, total: 57 },
    { campaign: 'Samsung Galaxy', package: 'Pro', rate: 19.4, rejected: 13, total: 67 },
    { campaign: 'Lazada Big Sale', package: 'Basic', rate: 21.7, rejected: 10, total: 46 },
    { campaign: 'Unilever Green', package: 'Custom', rate: 16.2, rejected: 11, total: 68 },
    { campaign: 'Adidas Originals MY', package: 'Pro', rate: 14.1, rejected: 7, total: 50 },
    { campaign: 'Petronas CNY', package: 'Essential', rate: 28.6, rejected: 20, total: 70 },
    { campaign: 'Dior Beauty Launch', package: 'Custom', rate: 8.3, rejected: 4, total: 48 },
    { campaign: 'Foodpanda Ramadan', package: 'Basic', rate: 30.2, rejected: 16, total: 53 },
    { campaign: 'Celcom 5G', package: 'Essential', rate: 17.9, rejected: 10, total: 56 },
    { campaign: 'H&M Conscious', package: 'Basic', rate: 24.4, rejected: 11, total: 45 },
    { campaign: 'Gong Cha Summer', package: 'Basic', rate: 18.8, rejected: 9, total: 48 },
    { campaign: 'Toyota Vios Launch', package: 'Pro', rate: 11.1, rejected: 5, total: 45 },
    { campaign: 'Watsons Health+', package: 'Essential', rate: 20.3, rejected: 12, total: 59 },
    { campaign: 'AirAsia ASEAN Pass', package: 'Custom', rate: 13.5, rejected: 7, total: 52 },
    { campaign: 'Boost Wallet Promo', package: 'Basic', rate: 26.8, rejected: 15, total: 56 },
    { campaign: 'L\'Oreal Paris MY', package: 'Pro', rate: 9.7, rejected: 4, total: 41 },
  ],
};

// 13. Require Changes (V2 vs V4 comparison)
export const MOCK_REQUIRE_CHANGES = {
  v2: MONTHS.map((month, i) => ({
    month,
    rate: [42.1, 40.5, 38.8, 37.2, 35.5, 34.0, 32.8, 31.5, 30.2, 29.0, 28.1, 27.2][i],
  })),
  v4: MONTHS.map((month, i) => ({
    month,
    rate: [35.0, 32.8, 30.5, 28.3, 26.5, 24.8, 23.2, 21.8, 20.5, 19.2, 18.0, 17.1][i],
  })),
};

// 14. Rejection Reasons Breakdown
export const MOCK_REJECTION_REASONS = [
  { reason: 'Low Video Quality', count: 45 },
  { reason: 'Off-Brand Content', count: 38 },
  { reason: 'Missing Deliverables', count: 32 },
  { reason: 'Wrong Format/Specs', count: 28 },
  { reason: 'Poor Audio', count: 22 },
  { reason: 'Late Submission', count: 18 },
  { reason: 'Other', count: 12 },
];

// 15. Credits per CS (per CS admin, breakdown by package type + V2/V4)
export const MOCK_CREDITS_PER_CS = [
  { csName: 'Sarah L.', basic: 45, essential: 82, pro: 120, custom: 35, v2Credits: 130, v4Credits: 152, campaigns: [
    { name: 'Nike Summer Drop', credits: 35, version: 'V4', package: 'Pro' },
    { name: 'Sephora Beauty', credits: 28, version: 'V4', package: 'Essential' },
    { name: 'Shopee 11.11', credits: 22, version: 'V2', package: 'Basic' },
    { name: 'Samsung Galaxy', credits: 45, version: 'V4', package: 'Pro' },
    { name: 'Maybank Raya', credits: 54, version: 'V2', package: 'Essential' },
    { name: 'Grab Food Festival', credits: 40, version: 'V4', package: 'Pro' },
    { name: 'Unilever Green', credits: 35, version: 'V2', package: 'Custom' },
    { name: 'Lazada Big Sale', credits: 23, version: 'V4', package: 'Basic' },
  ]},
  { csName: 'Ahmad R.', basic: 38, essential: 75, pro: 95, custom: 42, v2Credits: 115, v4Credits: 135, campaigns: [
    { name: 'Petronas CNY', credits: 42, version: 'V4', package: 'Custom' },
    { name: 'Dior Beauty Launch', credits: 38, version: 'V4', package: 'Pro' },
    { name: 'Celcom 5G', credits: 35, version: 'V2', package: 'Essential' },
    { name: 'H&M Conscious', credits: 30, version: 'V2', package: 'Basic' },
    { name: 'Foodpanda Ramadan', credits: 55, version: 'V4', package: 'Pro' },
    { name: 'AirAsia ASEAN Pass', credits: 50, version: 'V2', package: 'Essential' },
  ]},
  { csName: 'Priya K.', basic: 32, essential: 68, pro: 88, custom: 30, v2Credits: 100, v4Credits: 118, campaigns: [
    { name: 'Gong Cha Summer', credits: 32, version: 'V2', package: 'Basic' },
    { name: 'Toyota Vios Launch', credits: 48, version: 'V4', package: 'Pro' },
    { name: 'Watsons Health+', credits: 40, version: 'V4', package: 'Essential' },
    { name: 'Boost Wallet Promo', credits: 28, version: 'V2', package: 'Essential' },
    { name: "L'Oreal Paris MY", credits: 40, version: 'V4', package: 'Pro' },
    { name: 'Adidas Originals MY', credits: 30, version: 'V2', package: 'Custom' },
  ]},
  { csName: 'Daniel T.', basic: 28, essential: 60, pro: 78, custom: 25, v2Credits: 88, v4Credits: 103, campaigns: [
    { name: 'Nike Summer Drop', credits: 38, version: 'V4', package: 'Pro' },
    { name: 'Shopee 11.11', credits: 28, version: 'V2', package: 'Basic' },
    { name: 'Samsung Galaxy', credits: 40, version: 'V4', package: 'Pro' },
    { name: 'Grab Food Festival', credits: 35, version: 'V2', package: 'Essential' },
    { name: 'Maybank Raya', credits: 25, version: 'V4', package: 'Essential' },
    { name: 'Unilever Green', credits: 25, version: 'V2', package: 'Custom' },
  ]},
  { csName: 'Mei Ling C.', basic: 25, essential: 55, pro: 72, custom: 20, v2Credits: 80, v4Credits: 92, campaigns: [
    { name: 'Sephora Beauty', credits: 35, version: 'V4', package: 'Pro' },
    { name: 'Lazada Big Sale', credits: 25, version: 'V2', package: 'Basic' },
    { name: 'Petronas CNY', credits: 32, version: 'V4', package: 'Essential' },
    { name: 'Dior Beauty Launch', credits: 20, version: 'V2', package: 'Custom' },
    { name: 'Celcom 5G', credits: 37, version: 'V4', package: 'Pro' },
    { name: 'H&M Conscious', credits: 23, version: 'V4', package: 'Essential' },
  ]},
  { csName: 'Jason W.', basic: 20, essential: 48, pro: 60, custom: 18, v2Credits: 68, v4Credits: 78, campaigns: [
    { name: 'Foodpanda Ramadan', credits: 28, version: 'V2', package: 'Basic' },
    { name: 'AirAsia ASEAN Pass', credits: 32, version: 'V4', package: 'Pro' },
    { name: 'Gong Cha Summer', credits: 20, version: 'V2', package: 'Essential' },
    { name: 'Toyota Vios Launch', credits: 28, version: 'V4', package: 'Pro' },
    { name: 'Watsons Health+', credits: 18, version: 'V4', package: 'Custom' },
    { name: 'Boost Wallet Promo', credits: 20, version: 'V2', package: 'Essential' },
  ]},
  { csName: 'Aisha M.', basic: 18, essential: 42, pro: 52, custom: 15, v2Credits: 58, v4Credits: 69, campaigns: [
    { name: 'Nike Summer Drop', credits: 25, version: 'V4', package: 'Pro' },
    { name: 'Shopee 11.11', credits: 18, version: 'V2', package: 'Basic' },
    { name: 'Maybank Raya', credits: 22, version: 'V4', package: 'Essential' },
    { name: 'Grab Food Festival', credits: 27, version: 'V4', package: 'Pro' },
    { name: 'Unilever Green', credits: 15, version: 'V2', package: 'Custom' },
    { name: 'Samsung Galaxy', credits: 20, version: 'V2', package: 'Essential' },
  ]},
  { csName: 'Rachel T.', basic: 22, essential: 50, pro: 65, custom: 22, v2Credits: 72, v4Credits: 87, campaigns: [
    { name: 'Sephora Beauty', credits: 30, version: 'V4', package: 'Pro' },
    { name: 'Lazada Big Sale', credits: 22, version: 'V2', package: 'Basic' },
    { name: 'Petronas CNY', credits: 28, version: 'V4', package: 'Essential' },
    { name: 'Dior Beauty Launch', credits: 22, version: 'V4', package: 'Custom' },
    { name: 'Celcom 5G', credits: 35, version: 'V4', package: 'Pro' },
    { name: 'H&M Conscious', credits: 22, version: 'V2', package: 'Essential' },
  ]},
  { csName: 'Kevin O.', basic: 15, essential: 38, pro: 48, custom: 12, v2Credits: 52, v4Credits: 61, campaigns: [
    { name: 'Foodpanda Ramadan', credits: 22, version: 'V2', package: 'Basic' },
    { name: 'AirAsia ASEAN Pass', credits: 25, version: 'V4', package: 'Pro' },
    { name: 'Gong Cha Summer', credits: 18, version: 'V2', package: 'Essential' },
    { name: 'Toyota Vios Launch', credits: 23, version: 'V4', package: 'Pro' },
    { name: 'Boost Wallet Promo', credits: 25, version: 'V4', package: 'Essential' },
  ]},
  { csName: 'Nurul H.', basic: 30, essential: 62, pro: 82, custom: 28, v2Credits: 95, v4Credits: 107, campaigns: [
    { name: 'Nike Summer Drop', credits: 32, version: 'V4', package: 'Pro' },
    { name: 'Shopee 11.11', credits: 30, version: 'V2', package: 'Basic' },
    { name: 'Samsung Galaxy', credits: 35, version: 'V4', package: 'Essential' },
    { name: 'Grab Food Festival', credits: 28, version: 'V2', package: 'Custom' },
    { name: 'Maybank Raya', credits: 50, version: 'V4', package: 'Pro' },
    { name: 'Unilever Green', credits: 27, version: 'V2', package: 'Essential' },
  ]},
  { csName: 'Brandon F.', basic: 12, essential: 35, pro: 42, custom: 10, v2Credits: 45, v4Credits: 54, campaigns: [
    { name: 'Sephora Beauty', credits: 22, version: 'V4', package: 'Pro' },
    { name: 'Lazada Big Sale', credits: 15, version: 'V2', package: 'Basic' },
    { name: 'Petronas CNY', credits: 20, version: 'V4', package: 'Pro' },
    { name: 'Dior Beauty Launch', credits: 10, version: 'V2', package: 'Custom' },
    { name: 'Celcom 5G', credits: 32, version: 'V4', package: 'Essential' },
  ]},
  { csName: 'Siti A.', basic: 27, essential: 58, pro: 75, custom: 24, v2Credits: 85, v4Credits: 99, campaigns: [
    { name: 'H&M Conscious', credits: 27, version: 'V2', package: 'Basic' },
    { name: 'Foodpanda Ramadan', credits: 30, version: 'V4', package: 'Essential' },
    { name: 'AirAsia ASEAN Pass', credits: 24, version: 'V4', package: 'Custom' },
    { name: 'Gong Cha Summer', credits: 28, version: 'V2', package: 'Essential' },
    { name: 'Toyota Vios Launch', credits: 45, version: 'V4', package: 'Pro' },
    { name: 'Watsons Health+', credits: 30, version: 'V4', package: 'Pro' },
  ]},
  { csName: 'Marcus L.', basic: 16, essential: 40, pro: 55, custom: 14, v2Credits: 60, v4Credits: 65, campaigns: [
    { name: 'Nike Summer Drop', credits: 25, version: 'V4', package: 'Pro' },
    { name: 'Boost Wallet Promo', credits: 16, version: 'V2', package: 'Basic' },
    { name: 'Shopee 11.11', credits: 24, version: 'V2', package: 'Essential' },
    { name: "L'Oreal Paris MY", credits: 30, version: 'V4', package: 'Pro' },
    { name: 'Adidas Originals MY', credits: 14, version: 'V4', package: 'Custom' },
    { name: 'Maybank Raya', credits: 16, version: 'V2', package: 'Essential' },
  ]},
];

// 17. CS Admin Performance Radar (normalized 0-100 scores)
export const MOCK_CS_RADAR = [
  { name: 'Sarah L.', scores: [92, 78, 85, 88, 75] },
  { name: 'Ahmad R.', scores: [85, 82, 72, 80, 90] },
  { name: 'Priya K.', scores: [78, 90, 88, 65, 82] },
  { name: 'Daniel T.', scores: [70, 85, 95, 72, 68] },
];

// 18. Creator Funnel (lifecycle conversion)
export const MOCK_CREATOR_FUNNEL = [
  { stage: 'Total Creators', count: 2820 },
  { stage: 'Activated', count: 1475 },
  { stage: 'Pitched', count: 492 },
  { stage: 'Shortlisted', count: 342 },
  { stage: 'Completed', count: 285 },
  { stage: 'Retained', count: 210 },
];

// 16. Total Earnings per Creator (top 15) — campaign breakdown
export const MOCK_EARNINGS_CAMPAIGNS = [
  'Nike Summer Drop', 'Grab Food Festival', 'Sephora Beauty',
  'Shopee 11.11', 'Maybank Raya', 'Samsung Galaxy',
  'Lazada Big Sale', 'Unilever Green',
];

export const MOCK_EARNINGS_COLORS = [
  '#10B981', '#3B82F6', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
];

export const MOCK_EARNINGS = [
  { name: 'Maya Ahmad', avatar: 'https://i.pravatar.cc/40?img=1', campaigns: [
    { campaign: 'Nike Summer Drop', earnings: 1500 },
    { campaign: 'Sephora Beauty', earnings: 1200 },
    { campaign: 'Shopee 11.11', earnings: 900 },
    { campaign: 'Samsung Galaxy', earnings: 650 },
  ]},
  { name: 'Juan Fitness', avatar: 'https://i.pravatar.cc/40?img=2', campaigns: [
    { campaign: 'Nike Summer Drop', earnings: 1400 },
    { campaign: 'Grab Food Festival', earnings: 1100 },
    { campaign: 'Maybank Raya', earnings: 800 },
  ]},
  { name: 'Nura Aisyah', avatar: 'https://i.pravatar.cc/40?img=3', campaigns: [
    { campaign: 'Sephora Beauty', earnings: 1300 },
    { campaign: 'Shopee 11.11', earnings: 850 },
    { campaign: 'Unilever Green', earnings: 700 },
  ]},
  { name: 'Chef Tan', avatar: 'https://i.pravatar.cc/40?img=4', campaigns: [
    { campaign: 'Grab Food Festival', earnings: 1200 },
    { campaign: 'Lazada Big Sale', earnings: 800 },
    { campaign: 'Maybank Raya', earnings: 500 },
  ]},
  { name: 'Lin Mei Xin', avatar: 'https://i.pravatar.cc/40?img=5', campaigns: [
    { campaign: 'Samsung Galaxy', earnings: 1100 },
    { campaign: 'Nike Summer Drop', earnings: 900 },
    { campaign: 'Unilever Green', earnings: 350 },
  ]},
  { name: 'Amir Tech', avatar: 'https://i.pravatar.cc/40?img=6', campaigns: [
    { campaign: 'Samsung Galaxy', earnings: 1000 },
    { campaign: 'Shopee 11.11', earnings: 750 },
    { campaign: 'Lazada Big Sale', earnings: 450 },
  ]},
  { name: 'Sara Beauty', avatar: 'https://i.pravatar.cc/40?img=7', campaigns: [
    { campaign: 'Sephora Beauty', earnings: 1100 },
    { campaign: 'Unilever Green', earnings: 600 },
    { campaign: 'Maybank Raya', earnings: 350 },
  ]},
  { name: 'Hakim Wander', avatar: 'https://i.pravatar.cc/40?img=8', campaigns: [
    { campaign: 'Grab Food Festival', earnings: 900 },
    { campaign: 'Maybank Raya', earnings: 600 },
    { campaign: 'Nike Summer Drop', earnings: 400 },
  ]},
  { name: 'Ali Gaming', avatar: 'https://i.pravatar.cc/40?img=9', campaigns: [
    { campaign: 'Shopee 11.11', earnings: 800 },
    { campaign: 'Samsung Galaxy', earnings: 650 },
    { campaign: 'Lazada Big Sale', earnings: 350 },
  ]},
  { name: 'Penang Foodie', avatar: 'https://i.pravatar.cc/40?img=10', campaigns: [
    { campaign: 'Grab Food Festival', earnings: 1000 },
    { campaign: 'Lazada Big Sale', earnings: 500 },
    { campaign: 'Unilever Green', earnings: 200 },
  ]},
  { name: 'DIY Crafts', avatar: 'https://i.pravatar.cc/40?img=11', campaigns: [
    { campaign: 'Shopee 11.11', earnings: 700 },
    { campaign: 'Lazada Big Sale', earnings: 550 },
    { campaign: 'Unilever Green', earnings: 300 },
  ]},
  { name: 'Nina Fitness', avatar: 'https://i.pravatar.cc/40?img=12', campaigns: [
    { campaign: 'Nike Summer Drop', earnings: 800 },
    { campaign: 'Sephora Beauty', earnings: 500 },
    { campaign: 'Maybank Raya', earnings: 200 },
  ]},
  { name: 'Comedy King', avatar: 'https://i.pravatar.cc/40?img=13', campaigns: [
    { campaign: 'Grab Food Festival', earnings: 650 },
    { campaign: 'Shopee 11.11', earnings: 500 },
    { campaign: 'Samsung Galaxy', earnings: 300 },
  ]},
  { name: 'Travel Couple', avatar: 'https://i.pravatar.cc/40?img=14', campaigns: [
    { campaign: 'Maybank Raya', earnings: 600 },
    { campaign: 'Grab Food Festival', earnings: 450 },
    { campaign: 'Unilever Green', earnings: 250 },
  ]},
  { name: 'Pet Lovers KL', avatar: 'https://i.pravatar.cc/40?img=15', campaigns: [
    { campaign: 'Lazada Big Sale', earnings: 500 },
    { campaign: 'Unilever Green', earnings: 400 },
    { campaign: 'Sephora Beauty', earnings: 250 },
  ]},
];

// Top 10 Creators Shortlisted by CS
export const MOCK_TOP_SHORTLISTED_CREATORS = [
  { name: 'Maya Ahmad', avatar: 'https://i.pravatar.cc/40?img=1', csName: 'Sarah L.', count: 14, approved: 11, rejected: 3 },
  { name: 'Juan Fitness', avatar: 'https://i.pravatar.cc/40?img=2', csName: 'Ahmad R.', count: 12, approved: 9, rejected: 3 },
  { name: 'Nura Aisyah', avatar: 'https://i.pravatar.cc/40?img=3', csName: 'Priya K.', count: 10, approved: 8, rejected: 2 },
  { name: 'Chef Tan', avatar: 'https://i.pravatar.cc/40?img=4', csName: 'Sarah L.', count: 9, approved: 7, rejected: 2 },
  { name: 'Lin Mei Xin', avatar: 'https://i.pravatar.cc/40?img=5', csName: 'Daniel T.', count: 8, approved: 6, rejected: 2 },
  { name: 'Amir Tech', avatar: 'https://i.pravatar.cc/40?img=6', csName: 'Mei Ling C.', count: 7, approved: 5, rejected: 2 },
  { name: 'Sara Beauty', avatar: 'https://i.pravatar.cc/40?img=7', csName: 'Ahmad R.', count: 7, approved: 6, rejected: 1 },
  { name: 'Hakim Wander', avatar: 'https://i.pravatar.cc/40?img=8', csName: 'Priya K.', count: 6, approved: 4, rejected: 2 },
  { name: 'Ali Gaming', avatar: 'https://i.pravatar.cc/40?img=9', csName: 'Jason W.', count: 5, approved: 3, rejected: 2 },
  { name: 'Penang Foodie', avatar: 'https://i.pravatar.cc/40?img=10', csName: 'Nurul H.', count: 5, approved: 4, rejected: 1 },
];

// Response Time Details (per-month creator breakdown for drawer)
// avg values match MOCK_AVG_AGREEMENT_TIME, MOCK_AVG_FIRST_CAMPAIGN_TIME, MOCK_AVG_SUBMISSION_TIME
export const MOCK_RESPONSE_TIME_DETAILS = {
  'Feb 25': {
    agreement: {
      avg: 48.2,
      slowest: { name: 'Ali Gaming', avatar: 'https://i.pravatar.cc/40?img=9', time: 96.4, campaign: 'Petronas CNY' },
      fastest: { name: 'Maya Ahmad', avatar: 'https://i.pravatar.cc/40?img=1', time: 8.1, campaign: 'Nike Summer Drop' },
    },
    firstCampaign: {
      avg: 516,
      slowest: { name: 'Comedy King', avatar: 'https://i.pravatar.cc/40?img=13', time: 1120, campaign: 'Foodpanda Ramadan' },
      fastest: { name: 'Nura Aisyah', avatar: 'https://i.pravatar.cc/40?img=3', time: 72, campaign: 'Sephora Beauty' },
    },
    submission: {
      avg: 36.4,
      slowest: { name: 'Hakim Wander', avatar: 'https://i.pravatar.cc/40?img=8', time: 68.8, campaign: 'Grab Food Festival' },
      fastest: { name: 'Lin Mei Xin', avatar: 'https://i.pravatar.cc/40?img=5', time: 5.2, campaign: 'Samsung Galaxy' },
    },
  },
  'Mar 25': {
    agreement: {
      avg: 42.1,
      slowest: { name: 'Hakim Wander', avatar: 'https://i.pravatar.cc/40?img=8', time: 84.3, campaign: 'Grab Food Festival' },
      fastest: { name: 'Juan Fitness', avatar: 'https://i.pravatar.cc/40?img=2', time: 9.5, campaign: 'Nike Summer Drop' },
    },
    firstCampaign: {
      avg: 454,
      slowest: { name: 'Ali Gaming', avatar: 'https://i.pravatar.cc/40?img=9', time: 980, campaign: 'Shopee 11.11' },
      fastest: { name: 'Maya Ahmad', avatar: 'https://i.pravatar.cc/40?img=1', time: 65, campaign: 'Sephora Beauty' },
    },
    submission: {
      avg: 31.8,
      slowest: { name: 'Comedy King', avatar: 'https://i.pravatar.cc/40?img=13', time: 58.2, campaign: 'Maybank Raya' },
      fastest: { name: 'Nura Aisyah', avatar: 'https://i.pravatar.cc/40?img=3', time: 6.8, campaign: 'Samsung Galaxy' },
    },
  },
  'Apr 25': {
    agreement: {
      avg: 45.8,
      slowest: { name: 'Penang Foodie', avatar: 'https://i.pravatar.cc/40?img=10', time: 91.2, campaign: 'Lazada Big Sale' },
      fastest: { name: 'Lin Mei Xin', avatar: 'https://i.pravatar.cc/40?img=5', time: 7.3, campaign: 'Samsung Galaxy' },
    },
    firstCampaign: {
      avg: 487,
      slowest: { name: 'DIY Crafts', avatar: 'https://i.pravatar.cc/40?img=11', time: 1050, campaign: 'Unilever Green' },
      fastest: { name: 'Juan Fitness', avatar: 'https://i.pravatar.cc/40?img=2', time: 80, campaign: 'Nike Summer Drop' },
    },
    submission: {
      avg: 34.5,
      slowest: { name: 'Ali Gaming', avatar: 'https://i.pravatar.cc/40?img=9', time: 62.4, campaign: 'Shopee 11.11' },
      fastest: { name: 'Maya Ahmad', avatar: 'https://i.pravatar.cc/40?img=1', time: 4.8, campaign: 'Sephora Beauty' },
    },
  },
  'May 25': {
    agreement: {
      avg: 38.3,
      slowest: { name: 'Comedy King', avatar: 'https://i.pravatar.cc/40?img=13', time: 78.6, campaign: 'Foodpanda Ramadan' },
      fastest: { name: 'Sara Beauty', avatar: 'https://i.pravatar.cc/40?img=7', time: 6.9, campaign: 'Sephora Beauty' },
    },
    firstCampaign: {
      avg: 410,
      slowest: { name: 'Hakim Wander', avatar: 'https://i.pravatar.cc/40?img=8', time: 890, campaign: 'Grab Food Festival' },
      fastest: { name: 'Nura Aisyah', avatar: 'https://i.pravatar.cc/40?img=3', time: 58, campaign: 'Sephora Beauty' },
    },
    submission: {
      avg: 28.2,
      slowest: { name: 'Penang Foodie', avatar: 'https://i.pravatar.cc/40?img=10', time: 52.1, campaign: 'Lazada Big Sale' },
      fastest: { name: 'Lin Mei Xin', avatar: 'https://i.pravatar.cc/40?img=5', time: 4.1, campaign: 'Samsung Galaxy' },
    },
  },
  'Jun 25': {
    agreement: {
      avg: 35.6,
      slowest: { name: 'DIY Crafts', avatar: 'https://i.pravatar.cc/40?img=11', time: 72.8, campaign: 'Unilever Green' },
      fastest: { name: 'Maya Ahmad', avatar: 'https://i.pravatar.cc/40?img=1', time: 5.8, campaign: 'Nike Summer Drop' },
    },
    firstCampaign: {
      avg: 379,
      slowest: { name: 'Nina Fitness', avatar: 'https://i.pravatar.cc/40?img=12', time: 820, campaign: 'Nike Summer Drop' },
      fastest: { name: 'Chef Tan', avatar: 'https://i.pravatar.cc/40?img=4', time: 52, campaign: 'Grab Food Festival' },
    },
    submission: {
      avg: 25.1,
      slowest: { name: 'Comedy King', avatar: 'https://i.pravatar.cc/40?img=13', time: 48.5, campaign: 'Foodpanda Ramadan' },
      fastest: { name: 'Juan Fitness', avatar: 'https://i.pravatar.cc/40?img=2', time: 3.9, campaign: 'Nike Summer Drop' },
    },
  },
  'Jul 25': {
    agreement: {
      avg: 40.2,
      slowest: { name: 'Travel Couple', avatar: 'https://i.pravatar.cc/40?img=14', time: 82.4, campaign: 'Maybank Raya' },
      fastest: { name: 'Amir Tech', avatar: 'https://i.pravatar.cc/40?img=6', time: 7.6, campaign: 'Samsung Galaxy' },
    },
    firstCampaign: {
      avg: 422,
      slowest: { name: 'Pet Lovers KL', avatar: 'https://i.pravatar.cc/40?img=15', time: 910, campaign: 'Lazada Big Sale' },
      fastest: { name: 'Maya Ahmad', avatar: 'https://i.pravatar.cc/40?img=1', time: 48, campaign: 'Sephora Beauty' },
    },
    submission: {
      avg: 29.3,
      slowest: { name: 'Ali Gaming', avatar: 'https://i.pravatar.cc/40?img=9', time: 55.8, campaign: 'Shopee 11.11' },
      fastest: { name: 'Nura Aisyah', avatar: 'https://i.pravatar.cc/40?img=3', time: 5.1, campaign: 'Sephora Beauty' },
    },
  },
  'Aug 25': {
    agreement: {
      avg: 33.1,
      slowest: { name: 'Penang Foodie', avatar: 'https://i.pravatar.cc/40?img=10', time: 66.8, campaign: 'Grab Food Festival' },
      fastest: { name: 'Lin Mei Xin', avatar: 'https://i.pravatar.cc/40?img=5', time: 5.4, campaign: 'Samsung Galaxy' },
    },
    firstCampaign: {
      avg: 341,
      slowest: { name: 'Comedy King', avatar: 'https://i.pravatar.cc/40?img=13', time: 740, campaign: 'Foodpanda Ramadan' },
      fastest: { name: 'Juan Fitness', avatar: 'https://i.pravatar.cc/40?img=2', time: 42, campaign: 'Nike Summer Drop' },
    },
    submission: {
      avg: 22.8,
      slowest: { name: 'Hakim Wander', avatar: 'https://i.pravatar.cc/40?img=8', time: 44.2, campaign: 'Grab Food Festival' },
      fastest: { name: 'Sara Beauty', avatar: 'https://i.pravatar.cc/40?img=7', time: 3.5, campaign: 'Sephora Beauty' },
    },
  },
  'Sep 25': {
    agreement: {
      avg: 29.8,
      slowest: { name: 'Ali Gaming', avatar: 'https://i.pravatar.cc/40?img=9', time: 61.2, campaign: 'Shopee 11.11' },
      fastest: { name: 'Maya Ahmad', avatar: 'https://i.pravatar.cc/40?img=1', time: 4.9, campaign: 'Nike Summer Drop' },
    },
    firstCampaign: {
      avg: 324,
      slowest: { name: 'DIY Crafts', avatar: 'https://i.pravatar.cc/40?img=11', time: 695, campaign: 'Unilever Green' },
      fastest: { name: 'Nura Aisyah', avatar: 'https://i.pravatar.cc/40?img=3', time: 38, campaign: 'Sephora Beauty' },
    },
    submission: {
      avg: 20.4,
      slowest: { name: 'Travel Couple', avatar: 'https://i.pravatar.cc/40?img=14', time: 39.8, campaign: 'Maybank Raya' },
      fastest: { name: 'Chef Tan', avatar: 'https://i.pravatar.cc/40?img=4', time: 3.2, campaign: 'Grab Food Festival' },
    },
  },
  'Oct 25': {
    agreement: {
      avg: 31.5,
      slowest: { name: 'Nina Fitness', avatar: 'https://i.pravatar.cc/40?img=12', time: 64.6, campaign: 'Nike Summer Drop' },
      fastest: { name: 'Amir Tech', avatar: 'https://i.pravatar.cc/40?img=6', time: 5.8, campaign: 'Samsung Galaxy' },
    },
    firstCampaign: {
      avg: 362,
      slowest: { name: 'Hakim Wander', avatar: 'https://i.pravatar.cc/40?img=8', time: 780, campaign: 'Grab Food Festival' },
      fastest: { name: 'Lin Mei Xin', avatar: 'https://i.pravatar.cc/40?img=5', time: 45, campaign: 'Samsung Galaxy' },
    },
    submission: {
      avg: 23.6,
      slowest: { name: 'Penang Foodie', avatar: 'https://i.pravatar.cc/40?img=10', time: 45.1, campaign: 'Lazada Big Sale' },
      fastest: { name: 'Maya Ahmad', avatar: 'https://i.pravatar.cc/40?img=1', time: 3.8, campaign: 'Nike Summer Drop' },
    },
  },
  'Nov 25': {
    agreement: {
      avg: 27.4,
      slowest: { name: 'Comedy King', avatar: 'https://i.pravatar.cc/40?img=13', time: 56.2, campaign: 'Foodpanda Ramadan' },
      fastest: { name: 'Juan Fitness', avatar: 'https://i.pravatar.cc/40?img=2', time: 4.5, campaign: 'Nike Summer Drop' },
    },
    firstCampaign: {
      avg: 307,
      slowest: { name: 'Ali Gaming', avatar: 'https://i.pravatar.cc/40?img=9', time: 660, campaign: 'Shopee 11.11' },
      fastest: { name: 'Sara Beauty', avatar: 'https://i.pravatar.cc/40?img=7', time: 35, campaign: 'Sephora Beauty' },
    },
    submission: {
      avg: 18.9,
      slowest: { name: 'DIY Crafts', avatar: 'https://i.pravatar.cc/40?img=11', time: 36.4, campaign: 'Unilever Green' },
      fastest: { name: 'Nura Aisyah', avatar: 'https://i.pravatar.cc/40?img=3', time: 2.8, campaign: 'Sephora Beauty' },
    },
  },
  'Dec 25': {
    agreement: {
      avg: 32.8,
      slowest: { name: 'Hakim Wander', avatar: 'https://i.pravatar.cc/40?img=8', time: 67.4, campaign: 'Grab Food Festival' },
      fastest: { name: 'Maya Ahmad', avatar: 'https://i.pravatar.cc/40?img=1', time: 5.2, campaign: 'Sephora Beauty' },
    },
    firstCampaign: {
      avg: 274,
      slowest: { name: 'Travel Couple', avatar: 'https://i.pravatar.cc/40?img=14', time: 590, campaign: 'Maybank Raya' },
      fastest: { name: 'Chef Tan', avatar: 'https://i.pravatar.cc/40?img=4', time: 30, campaign: 'Grab Food Festival' },
    },
    submission: {
      avg: 16.2,
      slowest: { name: 'Pet Lovers KL', avatar: 'https://i.pravatar.cc/40?img=15', time: 31.5, campaign: 'Lazada Big Sale' },
      fastest: { name: 'Lin Mei Xin', avatar: 'https://i.pravatar.cc/40?img=5', time: 2.4, campaign: 'Samsung Galaxy' },
    },
  },
  'Jan 26': {
    agreement: {
      avg: 24.6,
      slowest: { name: 'Penang Foodie', avatar: 'https://i.pravatar.cc/40?img=10', time: 50.8, campaign: 'Lazada Big Sale' },
      fastest: { name: 'Nura Aisyah', avatar: 'https://i.pravatar.cc/40?img=3', time: 4.2, campaign: 'Sephora Beauty' },
    },
    firstCampaign: {
      avg: 288,
      slowest: { name: 'Nina Fitness', avatar: 'https://i.pravatar.cc/40?img=12', time: 620, campaign: 'Nike Summer Drop' },
      fastest: { name: 'Maya Ahmad', avatar: 'https://i.pravatar.cc/40?img=1', time: 28, campaign: 'Sephora Beauty' },
    },
    submission: {
      avg: 17.5,
      slowest: { name: 'Ali Gaming', avatar: 'https://i.pravatar.cc/40?img=9', time: 33.8, campaign: 'Shopee 11.11' },
      fastest: { name: 'Juan Fitness', avatar: 'https://i.pravatar.cc/40?img=2', time: 2.1, campaign: 'Nike Summer Drop' },
    },
  },
};

// Creator Demographics (static snapshot)
export const MOCK_CREATOR_DEMOGRAPHICS = {
  gender: [
    { label: 'Female', value: 5355, color: '#E45DBF' },
    { label: 'Male', value: 2720, color: '#1340FF' },
    { label: 'Other', value: 425, color: '#919EAB' },
  ],
  ageGroups: [
    { label: '18-25', value: 3570, color: '#919EAB' },
    { label: '26-34', value: 2975, color: '#454F5B' },
    { label: '35-40', value: 1275, color: '#212B36' },
    { label: '40+', value: 680, color: '#0A0A0A' },
  ],
};
