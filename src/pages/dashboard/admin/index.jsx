import { Helmet } from 'react-helmet-async';

import { UserListView } from 'src/sections/admin/view';

// import ManagerPage from 'src/sections/managers/ManagerPage';
// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Admin</title>
      </Helmet>

      <UserListView />
      {/* <ManagerPage /> */}
    </>
  );
}
