import useSWR from 'swr';
import { useMemo } from 'react';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// The backend admin routes wrap responses as { success, data }.
const unwrap = (payload) => payload?.data ?? payload;

// Multipart is only used when an image is attached; the rest of the payload
// rides along as a JSON blob in `data` (the house convention).
const toFormData = (payload, artwork) => {
  const formData = new FormData();
  formData.append('data', JSON.stringify(payload));
  if (artwork) formData.append('artwork', artwork);
  return formData;
};

const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

/**
 * Find Cipta is a one-time event, so there is no list and no id to pass around —
 * the backend resolves (and on first use creates) the single hunt.
 */
export const useGetCurrentHunt = () => {
  const { data, isLoading, error, mutate } = useSWR(endpoints.treasureHunt.current, fetcher, {
    revalidateOnFocus: false,
  });

  return useMemo(
    () => ({ hunt: unwrap(data) ?? null, isLoading, error, mutate }),
    [data, isLoading, error, mutate]
  );
};

export const useGetTreasureHuntDashboard = (id) => {
  const { data, isLoading, error, mutate } = useSWR(
    id ? endpoints.treasureHunt.dashboard(id) : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  return useMemo(
    () => ({ dashboard: unwrap(data) ?? null, isLoading, error, mutate }),
    [data, isLoading, error, mutate]
  );
};

export const useGetTreasureHuntParticipants = (
  id,
  {
    page = 0,
    rowsPerPage = 25,
    search = '',
    locationId = '',
    source = '',
    sortBy = 'claimedAt',
    sortOrder = 'desc',
  } = {}
) => {
  const query = new URLSearchParams({
    skip: String(page * rowsPerPage),
    take: String(rowsPerPage),
    sortBy,
    sortOrder,
    ...(search ? { search } : {}),
    ...(locationId ? { locationId } : {}),
    ...(source ? { source } : {}),
  }).toString();

  const { data, isLoading, error, mutate } = useSWR(
    id ? `${endpoints.treasureHunt.participants(id)}?${query}` : null,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  );

  return useMemo(
    () => ({
      participants: unwrap(data) ?? { rows: [], total: 0, enabledLocationCount: 0 },
      isLoading,
      error,
      mutate,
    }),
    [data, isLoading, error, mutate]
  );
};

// Resolves a short-lived signed URL for one claim's scan photo. Each call is
// audit-logged server-side, so it is deliberately per-view rather than batched
// into the participants list.
export const fetchCaptureUrl = async (claimId) => {
  const res = await axiosInstance.get(endpoints.treasureHunt.captureUrl(claimId));
  return unwrap(res.data)?.url;
};

export const updateTreasureHunt = async (id, payload, artwork) => {
  const res = artwork
    ? await axiosInstance.patch(
        endpoints.treasureHunt.update(id),
        toFormData(payload, artwork),
        MULTIPART
      )
    : await axiosInstance.patch(endpoints.treasureHunt.update(id), payload);
  return unwrap(res.data);
};

export const addTreasureHuntLocation = async (id, payload, artwork) => {
  const res = await axiosInstance.post(
    endpoints.treasureHunt.locations(id),
    toFormData(payload, artwork),
    MULTIPART
  );
  return unwrap(res.data);
};

export const updateTreasureHuntLocation = async (id, locationId, payload, artwork) => {
  const res = artwork
    ? await axiosInstance.patch(
        endpoints.treasureHunt.location(id, locationId),
        toFormData(payload, artwork),
        MULTIPART
      )
    : await axiosInstance.patch(endpoints.treasureHunt.location(id, locationId), payload);
  return unwrap(res.data);
};

export const deleteTreasureHuntLocation = async (id, locationId) => {
  const res = await axiosInstance.delete(endpoints.treasureHunt.location(id, locationId));
  return unwrap(res.data);
};

export const reorderTreasureHuntLocations = async (id, orderedIds) => {
  const res = await axiosInstance.post(endpoints.treasureHunt.reorderLocations(id), { orderedIds });
  return unwrap(res.data);
};

export const publishLocationQr = async (id, locationId) => {
  const res = await axiosInstance.post(endpoints.treasureHunt.publishQr(id, locationId));
  return res.data;
};

export const syncLocationAnalytics = async (id, locationId) => {
  const res = await axiosInstance.post(endpoints.treasureHunt.syncAnalytics(id, locationId));
  return res.data;
};

export const publishTreasureHunt = async (id, feature = true) => {
  const res = await axiosInstance.post(endpoints.treasureHunt.publish(id), { feature });
  return unwrap(res.data);
};

export const pauseTreasureHunt = async (id) => {
  const res = await axiosInstance.post(endpoints.treasureHunt.pause(id));
  return unwrap(res.data);
};

export const resumeTreasureHunt = async (id) => {
  const res = await axiosInstance.post(endpoints.treasureHunt.resume(id));
  return unwrap(res.data);
};

export const reactivateTreasureHunt = async (id) => {
  const res = await axiosInstance.post(endpoints.treasureHunt.reactivate(id));
  return unwrap(res.data);
};

export const archiveTreasureHunt = async (id) => {
  const res = await axiosInstance.post(endpoints.treasureHunt.archive(id));
  return unwrap(res.data);
};

// The CSV route is JWT-guarded, so a plain browser link would 401. Fetch it
// through the authenticated axios instance and trigger a client-side download.
export const downloadParticipantsCsv = async (id, filename) => {
  const res = await axiosInstance.get(endpoints.treasureHunt.exportCsv(id), {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename ?? 'find-cipta-participants.csv');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
