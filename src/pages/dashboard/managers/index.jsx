import { Helmet } from 'react-helmet-async';

import Profile from 'src/sections/profile/view';
import ManagerPage from 'src/sections/managers/ManagerPage';
// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title>managers</title>
      </Helmet>

      <ManagerPage />
    </>
  );
}
