import { Helmet } from 'react-helmet-async';

import CampaignListView from 'src/sections/campaign/manage/admin/view/campaign-admin-list-view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Manage Campaign</title>
      </Helmet>

      <CampaignListView />
    </>
  );
}
