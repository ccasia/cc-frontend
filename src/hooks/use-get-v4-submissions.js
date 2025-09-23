import useSWR from 'swr';

import axiosInstance, { endpoints, fetcher } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const useGetV4Submissions = (campaignId, userId) => {
  const URL = `${endpoints.submission.v4.getSubmissions}?campaignId=${campaignId}${userId ? `&userId=${userId}` : ''}`;
  
  const { data, isLoading, error, mutate } = useSWR(
    campaignId ? URL : null,
    fetcher,
    {
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const memoizedValue = {
    submissions: data?.submissions || [],
    grouped: data?.grouped || {},
    total: data?.total || 0,
    submissionsLoading: isLoading,
    submissionsError: error,
    submissionsMutate: mutate,
  };

  return memoizedValue;
};

// Create V4 submissions for creator
export const createV4Submissions = async (data) => {
  const response = await axiosInstance.post(endpoints.submission.v4.create, data);
  return response.data;
};

// Submit content for V4 submission
export const submitV4Content = async (data) => {
  const response = await axiosInstance.post(endpoints.submission.v4.submitContent, data);
  return response.data;
};

// Approve/Reject V4 submission
export const approveV4Submission = async (data) => {
  const response = await axiosInstance.post(endpoints.submission.v4.approve, data);
  return response.data;
};

// Update posting link
export const updateV4PostingLink = async (data) => {
  const response = await axiosInstance.put(endpoints.submission.v4.postingLink, data);
  return response.data;
};

// Get single V4 submission
export const getV4SubmissionById = async (submissionId) => {
  const response = await axiosInstance.get(`${endpoints.submission.v4.getById}/${submissionId}`);
  return response.data;
};