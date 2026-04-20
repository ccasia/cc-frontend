import { Helmet } from 'react-helmet-async';

import DraftCampaignListView from 'src/sections/campaign/drafts/draft-list-view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Draft Briefs</title>
      </Helmet>

      <DraftCampaignListView />
    </>
  );
}
