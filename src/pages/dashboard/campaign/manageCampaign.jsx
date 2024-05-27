import { Helmet } from 'react-helmet-async';

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
