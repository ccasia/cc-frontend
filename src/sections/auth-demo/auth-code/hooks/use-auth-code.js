import { useContext } from 'react';

import { AuthCodeProvider } from '../auth-code-layout';

const useAuthCodeContext = () => {
  const context = useContext(AuthCodeProvider);
  if (!context) throw new Error('useAuthCodeContext must be used inside AuthCodeProvider');
  return context;
};

export default useAuthCodeContext;
