import { useMemo } from 'react';
//  import keyBy from 'lodash/keyBy';
import useSWR, { mutate } from 'swr';

import axios, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const options = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// Use SWR to fetch all threads
export const useGetAllThreads = () => {
  const { data, error, isLoading } = useSWR(endpoints.threads.getAll, fetcher);

  const threadrefetch = () => {
    mutate(endpoints.threads.getAll);
  };
  return {
    threads: data,
    loading: isLoading,
    error,
    threadrefetch,
  };
};

// Use SWR to fetch messages from a specific thread
export const useGetMessagesFromThread = (threadId) => {
  const { data, error, isLoading } = useSWR(
    threadId ? endpoints.threads.getMessage(threadId) : null,
    fetcher
  );

  return {
    message: data,
    loading: isLoading,
    error,
  };
};

// Create a new thread
export const createThread = async (title, description, userIds) => {
  try {
    const response = await axios.post(endpoints.threads.create, { title, description, userIds });
    // mutate(endpoints.threads.getAll);
    return response.data;
  } catch (error) {
    console.error('Error creating thread:', error);
    throw error;
  }
};

// Function to archive a thread
export const archiveThread = async (threadId) => {
  try {
    const response = await axios.put(endpoints.threads.archive(threadId));
    mutate(endpoints.threads.getAll);
    return response.data.archived;
  } catch (error) {
    console.error(`Error archiving thread with ID ${threadId}:`, error);
    throw error;
  }
};

// Function to unarchive a thread
export const unarchiveThread = async (threadId) => {
  try {
    const response = await axios.put(endpoints.threads.unarchive(threadId));
    mutate(endpoints.threads.getAll);
    return response.data.archived;
  } catch (error) {
    console.error(`Error unarchiving thread with ID ${threadId}:`, error);
    throw error;
  }
};

export const useGetThreadById = (threadId) => {
  const { data, error, isLoading } = useSWR(
    threadId ? endpoints.threads.getId(threadId) : null,
    fetcher
  );

  return {
    thread: data,
    loading: isLoading,
    error,
  };
};

// Add a user to an existing thread
export const addUserToThread = async (threadId, userId) => {
  const response = await axios.post(endpoints.threads.addUser, { threadId, userId });
  return response.data;
};

// Send a message in a thread
export const sendMessageInThread = async (threadId, content) => {
  const response = await axios.post(endpoints.threads.sendMessage, { threadId, content });

  mutate(endpoints.threads.getMessage(threadId));
  return response.data;
};

// Function to get unread message count

export const useGetUnreadMessageCount = (threadId) => {
  const { data, error, isLoading } = useSWR(
    threadId ? endpoints.threads.getUnreadCount(threadId) : null,
    fetcher
  );

  return {
    unreadCount: data ? data.unreadCount : 0,
    loading: isLoading,
    error,
  };
};

export const useTotalUnreadCount = () => {
  const { data, error } = useSWR(endpoints.threads.getTotalCount, fetcher, {
    revalidateOnReconnect: true,
    revalidateOnMount: true,
    revalidateOnFocus: true,
    revalidateIfStale: true,
  });

  const triggerRefetch = () => {
    mutate(endpoints.threads.getTotalCount);
  };

  const memoizedValue = useMemo(
    () => ({
      unreadCount: data?.unreadCount ?? 0,
      isLoading: !error && !data,
      isError: error,
      triggerRefetch,
    }),
    [data, error]
  );

  return memoizedValue;
};

// Function to mark messages as seen
export const markMessagesAsSeen = async (threadId, triggerTotalUnreadRefetch) => {
  try {
    const response = await axios.put(endpoints.threads.markAsSeen(threadId));
    mutate(endpoints.threads.getUnreadCount(threadId));

    // Trigger refetch for the total unread count
    if (triggerTotalUnreadRefetch) {
      triggerTotalUnreadRefetch();
    }
    return response.data.message;
  } catch (error) {
    console.error('Error marking messages as seen:', error);
    throw error;
  }
};

export function useGetContacts() {
  const URL = [endpoints.chat, { params: { endpoint: 'contacts' } }];

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      contacts: data?.contacts || [],
      contactsLoading: isLoading,
      contactsError: error,
      contactsValidating: isValidating,
      contactsEmpty: !isLoading && !data?.contacts.length,
    }),
    [data?.contacts, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
