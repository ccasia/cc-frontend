import { Helmet } from 'react-helmet-async';

import Overview from 'src/sections/creator/overview/overview';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Overview</title>
      </Helmet>

      <Overview />
    </>
  );
}
