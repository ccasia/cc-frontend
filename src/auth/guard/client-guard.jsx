import { Navigate } from 'react-router-dom';

import { useAuthContext } from '../hooks/use-auth-context';

export default function ClientGuard({ children }) {
  const { user } = useAuthContext();

  if (user?.role !== 'client') {
    return <Navigate to="/403" replace />;
  }

  return children;
}