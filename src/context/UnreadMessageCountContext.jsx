/* eslint-disable */ 
import { createContext, useContext, useEffect, useState } from 'react';

import { useTotalUnreadCount } from 'src/api/chat';
import useSocketContext from 'src/socket/hooks/useSocketContext';

const UnreadMessageCountContext = createContext();

export function UnreadMessageCountProvider({ children }) {
  const { unreadCount, isLoading, isError, triggerRefetch } = useTotalUnreadCount(); // Fetch initial unread count
  const { socket } = useSocketContext();
  const [unreadMessageCount, setUnreadMessageCount] = useState(unreadCount);

  useEffect(() => {
    socket?.on('messageCount', (data) => {
      console.log("New message count from WebSocket:", data.count);
      setUnreadMessageCount(data.count);
    });

    return () => {
      socket?.off('messageCount');
    };
  }, [socket]);

  useEffect(() => {
    if (isError) {
      console.error("Failed to load unread message count");
    }
  }, [isError]);

  useEffect(() => {
    if (isLoading) {
      console.log("Loading unread message count...");
    }
  }, [isLoading]);

  return (
    <UnreadMessageCountContext.Provider value={unreadCount}>
      {isLoading ? <div>Loading...</div> : children}
    </UnreadMessageCountContext.Provider>
  );
}

// Custom hook to use the unread message count
export function useUnreadMessageCount() {
  return useContext(UnreadMessageCountContext);
}
