import { Helmet } from 'react-helmet-async';

import DemoCampaignsView from 'src/sections/demo-campaigns/view/demo-campaigns-view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Campaigns</title>
      </Helmet>

      <DemoCampaignsView />
    </>
  );
}
