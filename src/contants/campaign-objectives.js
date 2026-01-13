// Primary Campaign Objectives Options (for campaignObjectives field)
export const primaryObjectivesList = [
  'Awareness',
  'Performance',
];

// Secondary Campaign Objectives Options, dependent on primary objective
export const secondaryObjectivesByPrimary = {
  Awareness: [
    'Brand Awareness (Introduce brands to new audiences)',
    'Product Launch (Generate buzz for new product/service)',
    'Education (Educate audiences about product category)',
    'Community Building (Foster a loyal community around the brand’s values or lifestyle)',
  ],
  Performance: [
    'Drive Website Traffic (Send audiences to your site)',
    'Generate Sales/Conversions (Drive purchases with promo codes/link)',
    'Content Creation (Build library of reusable content assets)',
    'Lead Generation (Collect sign ups/emails/registrations)',
  ],
};

// Boost/Promote Content Options
export const boostContentOptions = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

// Primary KPI Options
export const primaryKPIOptions = [
  'Website Traffic',
  'Click-throughs',
  'Lead Generation',
  'Inquiries',
];
