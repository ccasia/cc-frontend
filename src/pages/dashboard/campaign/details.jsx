import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import CampaignDetailView from 'src/sections/campaign/discover/admin/view/campaign-detail-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { id } = useParams();

  return (
    <>
      <Helmet>
        <title>Campaign Details</title>
      </Helmet>

      <CampaignDetailView id={id} />
    </>
  );
}
