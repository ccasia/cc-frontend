import { Helmet } from 'react-helmet-async';

import { UserListView } from 'src/sections/admin/view';

// import ManagerPage from 'src/sections/managers/ManagerPage';
// ----------------------------------------------------------------------

export default function Page() {
  // const { admins, isLoading } = useGetAdminsForSuperadmin();

  return (
    <>
      <Helmet>
        <title>Admin</title>
      </Helmet>
      {/* {isLoading && <LoadingScreen />} */}
      <UserListView />
    </>
  );
}
