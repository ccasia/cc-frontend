import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

// Published releases — pass enabled=false to defer fetching (e.g. until drawer opens)
export const useGetReleaseNotes = (enabled = true) => {
  const { data, isLoading, mutate } = useSWR(enabled ? endpoints.releaseNotes.root : null, fetcher);

  return useMemo(
    () => ({ releases: data?.data || [], isLoading, mutate }),
    [data, isLoading, mutate]
  );
};

// Latest published release the current admin hasn't seen, or null
export const useGetUnseenReleaseNote = () => {
  const { data, isLoading, mutate } = useSWR(endpoints.releaseNotes.unseen, fetcher);

  return useMemo(
    () => ({ releaseNote: data?.data || null, isLoading, mutate }),
    [data, isLoading, mutate]
  );
};

// All releases incl. drafts (superadmin). No focus revalidation so edits in progress aren't disrupted.
export const useGetManageReleaseNotes = () => {
  const { data, isLoading, mutate } = useSWR(endpoints.releaseNotes.manage, fetcher, {
    revalidateOnFocus: false,
  });

  return useMemo(
    () => ({ releases: data?.data || [], isLoading, mutate }),
    [data, isLoading, mutate]
  );
};
