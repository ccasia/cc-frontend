import axiosInstance from 'src/utils/axios';

/**
 * The only calls this feature makes.
 *
 * The browser never sees an Apify token, an actor ID, or a build. It sends a
 * profile link and gets back a status and, when ready, a signed receipt.
 */

const base = (campaignId) => `/api/campaign/v3/${campaignId}/guest-profile-extractions`;

/** A key so a repeated start never becomes a second paid run. */
export function newIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `k-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Is the feature on for this admin? The server decides, not the browser. */
export async function fetchFeatureDecision() {
  const { data } = await axiosInstance.get('/api/campaign/v3/guest-profile-metrics/decision');
  return data;
}

/** Starts a profile extraction for one row. */
export async function startExtraction({ campaignId, clientRowId, profileLink, idempotencyKey }) {
  const { data, status } = await axiosInstance.post(
    base(campaignId),
    { clientRowId, profileLink },
    { headers: { 'Idempotency-Key': idempotencyKey } }
  );
  // 200 means a reusable completed result, 202 means queued work.
  return { ...data, reused: status === 200 };
}

export async function getExtraction(extractionId) {
  const { data } = await axiosInstance.get(
    `/api/campaign/v3/guest-profile-extractions/${extractionId}`
  );
  return data;
}

/** Refresh recovery. Returns only this admin's records on this campaign. */
export async function listResumableExtractions(campaignId) {
  const { data } = await axiosInstance.get(base(campaignId));
  return data.extractions ?? [];
}

export async function saveGuestCreators({ campaignId, guestCreators, idempotencyKey }) {
  const { data } = await axiosInstance.post(
    '/api/campaign/v3/shortlistCreator/guest',
    { campaignId, guestCreators },
    { headers: { 'Idempotency-Key': idempotencyKey } }
  );
  return data;
}
