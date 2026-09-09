/**
 * What to call a draft in the UI.
 *
 * The backend derives `draft.name` from the same `payload.campaignName` and
 * falls back to its own "Untitled draft" placeholder, so reading `name` here
 * would shadow this fallback with the server's wording. Go to the payload.
 */
const getDraftName = (draft) => draft?.payload?.campaignName?.trim() || 'Untitled Campaign';

export default getDraftName;
