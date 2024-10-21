import { Helmet } from 'react-helmet-async';

import CreateCampaign from 'src/sections/campaign/create/view';
// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Create Campaign</title>
      </Helmet>

      <CreateCampaign />
    </>
  );
}
