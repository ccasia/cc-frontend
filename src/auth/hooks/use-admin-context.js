import { useContext } from 'react';

import { adminContext } from '../admin/admin-guard';

// ----------------------------------------------------------------------

export const useAdminContext = () => {
  const context = useContext(adminContext);

  if (!context) throw new Error('useAuthContext context must be use inside AuthProvider');

  return context;
};
