import { Helmet } from 'react-helmet-async';

import CampaignSetting from 'src/sections/campaign/settings/view';
// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Settings</title>
      </Helmet>

      <CampaignSetting />
    </>
  );
}
