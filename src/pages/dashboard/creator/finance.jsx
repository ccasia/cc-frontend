import { Helmet } from 'react-helmet-async';

import Finance from 'src/sections/creator/finance/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Finance Creator</title>
      </Helmet>

      <Finance />
    </>
  );
}
