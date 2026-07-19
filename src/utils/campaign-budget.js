export const CAMPAIGN_BUDGET_RATE_PER_CREDIT = 300;

export function getCampaignBudget(campaign) {
  if (!campaign) return null;
  if (campaign.submissionVersion !== 'v4') return null;
  if (!campaign.campaignCredits) return null;
  return campaign.campaignCredits * CAMPAIGN_BUDGET_RATE_PER_CREDIT;
}
