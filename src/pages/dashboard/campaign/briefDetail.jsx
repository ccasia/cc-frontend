import { Helmet } from 'react-helmet-async';

import CampaignBriefDetailView from 'src/sections/campaign/briefs/brief-detail-view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Campaign Brief</title>
      </Helmet>
      <CampaignBriefDetailView />
    </>
  );
}
