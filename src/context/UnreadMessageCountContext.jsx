/* eslint-disable */
import { createContext, useContext, useEffect, useState } from 'react';

import { useTotalUnreadCount } from 'src/api/chat';
import useSocketContext from 'src/socket/hooks/useSocketContext';

const UnreadMessageCountContext = createContext();

export function UnreadMessageCountProvider({ children }) {
  const { unreadCount } = useTotalUnreadCount();
  const { socket } = useSocketContext();
  const [unreadMessageCount, setUnreadMessageCount] = useState(unreadCount);

  useEffect(() => {
    socket?.on('messageCount', (data) => {
      setUnreadMessageCount(data.count);
    });

    return () => {
      socket?.off('messageCount');
    };
  }, [socket]);

  // useEffect(() => {
  //   if (isError) {
  //     console.error('Failed to load unread message count');
  //   }
  // }, [isError]);

  useEffect(() => {
    setUnreadMessageCount(unreadCount);
  }, [unreadCount]);

  return (
    <UnreadMessageCountContext.Provider value={unreadMessageCount}>
      {children}
    </UnreadMessageCountContext.Provider>
  );
}

// Custom hook to use the unread message count
export function useUnreadMessageCount() {
  return useContext(UnreadMessageCountContext);
}
