/**
 * Campaign flow helpers — single source of truth on the frontend for
 * "does this campaign have a client" and which submission flow it uses.
 *
 * Prefers the API-computed `campaign.hasClient` (added by getCampaignById);
 * falls back to deriving from includes for endpoints that don't send it
 * (public campaign, demo, list endpoints).
 *
 * See docs/v4-unification-plan.md for the full context.
 */

const isClientAdmin = (ca) => ca?.admin?.user?.role === 'client' || ca?.admin?.role?.name === 'Client';

export function campaignHasClient(campaign) {
  if (!campaign) return false;
  if (typeof campaign.hasClient === 'boolean') return campaign.hasClient;
  // Mirror the backend: client-role campaign admins are the sole attachment signal.
  // Neither CampaignClient rows (stale rows must not flip the flow) nor origin
  // (CLIENT-origin campaigns can exist with no client user attached) are counted.
  return campaign.campaignAdmin?.some(isClientAdmin) ?? false;
}

/**
 * Returns the flow flags UI branching should use:
 * - isV4: campaign uses the v4 submission model (submission tabs, content-based posting links)
 * - hasClient: a client is attached — approval actions route through client review
 */
export function getCampaignFlow(campaign) {
  return {
    isV4: campaign?.submissionVersion === 'v4',
    hasClient: campaignHasClient(campaign),
  };
}
