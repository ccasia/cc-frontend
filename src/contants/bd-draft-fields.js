export const BD_DRAFT_REQUIRED_FIELDS = {
  campaign: [{ key: 'productName', label: 'Product / Service Name' }],
  brief: [
    { key: 'industries', label: 'Industry' },
  ],
  requirement: [
    { key: 'gender', label: 'Gender' },
    { key: 'age', label: 'Age Range' },
    { key: 'country', label: 'Country' },
    { key: 'language', label: 'Language' },
    { key: 'creator_persona', label: 'Creator Persona' },
    { key: 'user_persona', label: 'User Persona' },
    { key: 'geographic_focus', label: 'Geographic Focus' },
  ],
};

export const TAB_TO_SECTION = {
  info: ['campaign', 'brief'],
  audience: ['requirement'],
  package: ['package'],
};

const isEmpty = (v) => v == null || v === '' || (Array.isArray(v) && v.length === 0);

const BD_DRAFT_SECTIONS = [
  { section: 'campaign', path: (c) => c, fields: BD_DRAFT_REQUIRED_FIELDS.campaign },
  { section: 'brief', path: (c) => c?.campaignBrief, fields: BD_DRAFT_REQUIRED_FIELDS.brief },
  {
    section: 'requirement',
    path: (c) => c?.campaignRequirement,
    fields: BD_DRAFT_REQUIRED_FIELDS.requirement,
  },
];

function getCompanyFromCampaign(campaign) {
  if (campaign?.brand?.company) return campaign.brand.company;
  if (campaign?.company) return campaign.company;
  return null;
}

function hasActiveSubscription(company) {
  return company?.subscriptions?.some((s) => s.status === 'ACTIVE') ?? false;
}

export function collectMissingBDDraftFields(campaign) {
  const missing = BD_DRAFT_SECTIONS.flatMap(({ section, path, fields }) =>
    fields.filter((f) => isEmpty(path(campaign)?.[f.key])).map((f) => ({ section, ...f }))
  );

  // Package checks: company → active subscription
  if (!campaign?.companyId && !campaign?.brandId) {
    missing.push({ section: 'package', key: 'company', label: 'Company / Brand' });
  } else {
    const company = getCompanyFromCampaign(campaign);
    if (!hasActiveSubscription(company)) {
      missing.push({ section: 'package', key: 'subscription', label: 'Active Package' });
    }
  }

  return missing;
}
