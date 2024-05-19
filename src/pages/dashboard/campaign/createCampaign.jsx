import { Helmet } from 'react-helmet-async';

import CreatorLists from 'src/sections/landing/creator/view';

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
