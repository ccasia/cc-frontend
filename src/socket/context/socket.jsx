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

    const socketConnection = io('https://cultcreative.famin.cloud', {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

//     const socketConnection = io({
//       transports: ['websocket', 'polling'],
//       reconnection: true,
//       path: '/socket.io/'
//     });;


    socketConnection.on('connect', () => {
      console.log('Connected');
      setSocket(socketConnection);
      setOnline(true);

      if (user?.id) {
        socketConnection.emit('register', user.id);
      }
    });

    // socketConnection.emit('register', user?.id);

    socketConnection.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setOnline(false);
    });

    socketConnection.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
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