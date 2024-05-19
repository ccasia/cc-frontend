import { Helmet } from 'react-helmet-async';

import CreatorLists from 'src/sections/landing/creator/view';

import ManageCampaign from 'src/sections/campaign/manage/view';
// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Manage Campaign</title>
      </Helmet>

      <ManageCampaign />
    </>
  );
}
