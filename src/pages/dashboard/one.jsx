import { Helmet } from 'react-helmet-async';

import OneView from 'src/sections/creator/form/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Dashboard</title>
      </Helmet>

      <OneView />
    </>
  );
}
