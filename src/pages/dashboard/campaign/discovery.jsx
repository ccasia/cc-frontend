import { Helmet } from 'react-helmet-async';

import DiscoverCampaign from 'src/sections/campaign/discover/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Discover Campaign</title>
      </Helmet>

      <DiscoverCampaign />
    </>
  );
}
