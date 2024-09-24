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
    //  const socketConnection = io({transports:['polling'],reconnect:true,path:'/api/socket.io'});
    const socketConnection = io({
      reconnection: true,
    });

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
