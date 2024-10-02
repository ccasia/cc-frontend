import { Helmet } from 'react-helmet-async';

import { useGetAdminsForSuperadmin } from 'src/hooks/use-get-admins-for-superadmin';

import { LoadingScreen } from 'src/components/loading-screen';

import { UserListView } from 'src/sections/admin/view';

// import ManagerPage from 'src/sections/managers/ManagerPage';
// ----------------------------------------------------------------------

export default function Page() {
  const { admins, isLoading } = useGetAdminsForSuperadmin();

  return (
    <>
      <Helmet>
        <title>Admin</title>
      </Helmet>
      {isLoading && <LoadingScreen />}
      {!isLoading && admins.length && <UserListView admins={admins} />}
    </>
  );
}
