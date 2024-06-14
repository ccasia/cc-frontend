import { Helmet } from 'react-helmet-async';

import CampaignListView from 'src/sections/campaign/discover/view/campaign-list-view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Discover Campaign</title>
      </Helmet>

      <CampaignListView />
    </>
  );
}
