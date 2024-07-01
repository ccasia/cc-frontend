import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import CampaignDetailsPitchCreator from 'src/sections/campaign/discover/admin/view/campaign-detail-pitch-creator-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { id } = useParams();

  return (
    <>
      <Helmet>
        <title>Campaign Detail</title>
      </Helmet>

      <CampaignDetailsPitchCreator id={id} />
    </>
  );
}
