import { Helmet } from 'react-helmet-async';

import MyTasks from 'src/sections/admin/tasks/view/page';

// import ManagerPage from 'src/sections/managers/ManagerPage';
// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title>My Tasks</title>
      </Helmet>

      <MyTasks />
    </>
  );
}
