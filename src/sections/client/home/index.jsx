import { useAuthContext } from 'src/auth/hooks';

import ClientHomeView from './client-home-view';
import ClientDashboard from '../dashboard-client';

// The home endpoint is client-only; admins who open this route keep the old dashboard.
export default function ClientHomeRoute() {
  const { user } = useAuthContext();
  return user?.role === 'client' ? <ClientHomeView /> : <ClientDashboard />;
}
