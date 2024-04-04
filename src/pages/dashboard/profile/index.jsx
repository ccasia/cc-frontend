import { Helmet } from 'react-helmet-async';

import Profile from 'src/sections/profile/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Profile</title>
      </Helmet>

      <Profile />
    </>
  );
}
