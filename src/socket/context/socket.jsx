import PropTypes from 'prop-types';
import { io } from 'socket.io-client';
import { useMemo, useState, useEffect, createContext } from 'react';

import { useAuthContext } from 'src/auth/hooks';

export const SocketContext = createContext();

const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState();
  const [online, setOnline] = useState();
  const { user } = useAuthContext();

  useEffect(() => {
    // I used this for my connection - Zawad

    const socketConnection = io({
      transports: ['polling'],
      reconnect: true,
      // path: '/socket.io/',
    });
    // const socketConnection = io({
    //   reconnectionAttempts: 10, // Try to reconnect 10 times
    //   reconnectionDelay: 1000, // Wait 1 second before the first attempt
    //   reconnectionDelayMax: 5000, // Wait up to 5 seconds for additional attempts
    //   timeout: 20000,
    // });

    socketConnection.on('connect', () => {
      console.log('Connected');
      setSocket(socketConnection);
      setOnline(true);
    });

    socketConnection.emit('register', user?.id);

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
