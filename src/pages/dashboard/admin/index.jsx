import { Helmet } from 'react-helmet-async';

import { useGetAdminsForSuperadmin } from 'src/hooks/use-get-admins-for-superadmin';

import { UserListView } from 'src/sections/admin/view';

// import ManagerPage from 'src/sections/managers/ManagerPage';
// ----------------------------------------------------------------------

export default function Page() {
  const { admins } = useGetAdminsForSuperadmin();

  return (
    <>
      <Helmet>
        <title>Admin</title>
      </Helmet>
      {admins && <UserListView admins={admins} />}
    </>
  );
}
