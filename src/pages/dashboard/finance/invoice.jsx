import { Helmet } from 'react-helmet-async';

import CampaignPage from 'src/sections/finance/manage/campaign-page';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Campaign Invoice</title>
      </Helmet>

      <CampaignPage />
    </>
  );
}
