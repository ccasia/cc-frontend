import { useMemo } from 'react';
import keyBy from 'lodash/keyBy';
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
  
  mutate(endpoints.threads.getAll);
  return {
    threads: data,
    loading: isLoading,
    error,
  };
};

// Use SWR to fetch messages from a specific thread
export const useGetMessagesFromThread = (threadId) => {
  const { data, error, isLoading } = useSWR(threadId ? endpoints.threads.getMessage(threadId) : null, fetcher);
  
  return {
    messages: data,
    loading: isLoading,
    error,
  };
};

// Create a new thread
export const createThread = async (title, description, userIds) => {
  //  const response = await axios.post(endpoints.threads.create, { title, description, userIds });
  //  return response.data;
  try {
    const response = await axios.post(endpoints.threads.create, { title, description, userIds });
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
    return response.data.archived; 
  } catch (error) {
    console.error(`Error unarchiving thread with ID ${threadId}:`, error);
    throw error;
  }
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

export function useGetConversations() {
  const URL = [endpoints.chat, { params: { endpoint: 'conversations' } }];

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher, options);

  const memoizedValue = useMemo(() => {
    const byId = keyBy(data?.conversations, 'id') || {};
    const allIds = Object.keys(byId) || [];

    return {
      conversations: {
        byId,
        allIds,
      },
      conversationsLoading: isLoading,
      conversationsError: error,
      conversationsValidating: isValidating,
      conversationsEmpty: !isLoading && !allIds.length,
    };
  }, [data?.conversations, error, isLoading, isValidating]);

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetConversation(conversationId) {
  const URL = conversationId
    ? [endpoints.chat, { params: { conversationId, endpoint: 'conversation' } }]
    : '';

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      conversation: data?.conversation,
      conversationLoading: isLoading,
      conversationError: error,
      conversationValidating: isValidating,
    }),
    [data?.conversation, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export async function sendMessage(conversationId, messageData) {
  const CONVERSATIONS_URL = [endpoints.chat, { params: { endpoint: 'conversations' } }];

  const CONVERSATION_URL = [
    endpoints.chat,
    {
      params: { conversationId, endpoint: 'conversation' },
    },
  ];

  /**
   * Work on server
   */
  // const data = { conversationId, messageData };
  // await axios.put(endpoints.chat, data);

  /**
   * Work in local
   */
  mutate(
    CONVERSATION_URL,
    (currentData) => {
      const { conversation: currentConversation } = currentData;

      const conversation = {
        ...currentConversation,
        messages: [...currentConversation.messages, messageData],
      };

      return {
        conversation,
      };
    },
    false
  );

  /**
   * Work in local
   */
  mutate(
    CONVERSATIONS_URL,
    (currentData) => {
      const { conversations: currentConversations } = currentData;

      const conversations = currentConversations.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              messages: [...conversation.messages, messageData],
            }
          : conversation
      );

      return {
        conversations,
      };
    },
    false
  );
}

// ----------------------------------------------------------------------

export async function createConversation(conversationData) {
  const URL = [endpoints.chat, { params: { endpoint: 'conversations' } }];

  /**
   * Work on server
   */
  const data = { conversationData };
  const res = await axios.post(endpoints.chat, data);

  /**
   * Work in local
   */
  mutate(
    URL,
    (currentData) => {
      const conversations = [...currentData.conversations, conversationData];
      return {
        ...currentData,
        conversations,
      };
    },
    false
  );

  return res.data;
}

// ----------------------------------------------------------------------

export async function clickConversation(conversationId) {
  const URL = endpoints.chat;

  /**
   * Work on server
   */
  // await axios.get(URL, { params: { conversationId, endpoint: 'mark-as-seen' } });

  /**
   * Work in local
   */
  mutate(
    [
      URL,
      {
        params: { endpoint: 'conversations' },
      },
    ],
    (currentData) => {
      const conversations = currentData.conversations.map((conversation) =>
        conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation
      );

      return {
        ...currentData,
        conversations,
      };
    },
    false
  );
}
