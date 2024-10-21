import { Helmet } from 'react-helmet-async';

import ManageCampaignView from 'src/sections/campaign/manage-creator/view/manage-campaign-view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Manage Campaign</title>
      </Helmet>

      <ManageCampaignView />
    </>
  );
}
