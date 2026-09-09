import { Helmet } from 'react-helmet-async';

import { CampaignDraftsView } from 'src/sections/campaign/drafts/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Campaign Drafts</title>
      </Helmet>

      <CampaignDraftsView />
    </>
  );
}
