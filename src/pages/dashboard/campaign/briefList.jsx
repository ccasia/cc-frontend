import { Helmet } from 'react-helmet-async';

import CampaignBriefListView from 'src/sections/campaign/briefs/brief-list-view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Campaign Brief</title>
      </Helmet>
      <CampaignBriefListView />
    </>
  );
}
