import { Helmet } from 'react-helmet-async';

import SocialMedia from 'src/sections/admin/social/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Social Media Data</title>
      </Helmet>

      <SocialMedia />
    </>
  );
}
