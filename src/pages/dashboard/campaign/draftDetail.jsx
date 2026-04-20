import { Helmet } from 'react-helmet-async';

import DraftCampaignDetailView from 'src/sections/campaign/drafts/draft-detail-view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Draft Campaign</title>
      </Helmet>

      <DraftCampaignDetailView />
    </>
  );
}
