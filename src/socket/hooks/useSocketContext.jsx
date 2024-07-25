import { useContext } from 'react';

import { SocketContext } from '../context/socket';

const useSocketContext = () => {
  const value = useContext(SocketContext);

  return value;
};

export default useSocketContext;
