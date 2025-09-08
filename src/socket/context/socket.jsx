import PropTypes from 'prop-types';
import { io } from 'socket.io-client';
import { useMemo, useState, useEffect, createContext } from 'react';

import { useAuthContext } from 'src/auth/hooks';

export const SocketContext = createContext();

const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState();
  const [online, setOnline] = useState();
  // const [onlineUsers, setOnlineUsers] = useState(null);
  const { user } = useAuthContext();

  useEffect(() => {
    const socketConnection = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
      path: '/socket.io/',
    });

    socketConnection.on('connect', () => {
      setSocket(socketConnection);
      setOnline(true);

      if (user?.id) {
        socketConnection.emit('register', user.id);
        socketConnection.emit('online-user');
      }
    });

    // expose helpers for campaign room subscription
    socketConnection.joinCampaign = (campaignId) => {
      if (campaignId) socketConnection.emit('join-campaign', campaignId);
    };
    socketConnection.leaveCampaign = (campaignId) => {
      if (campaignId) socketConnection.emit('leave-campaign', campaignId);
    };

    // socketConnection.emit('register', user?.id);

    socketConnection.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setOnline(false);
    });

    socketConnection.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      socketConnection.emit('online-user');
      setOnline(false);
    });

    return () => {
      socketConnection.disconnect();
      setOnline(false);
    };
  }, [user]);

  const memoizedValue = useMemo(
    () => ({
      isOnline: online,
      socket,
    }),
    [online, socket]
  );

  return <SocketContext.Provider value={memoizedValue}>{children}</SocketContext.Provider>;
};

SocketProvider.propTypes = {
  children: PropTypes.node,
};

export default SocketProvider;
