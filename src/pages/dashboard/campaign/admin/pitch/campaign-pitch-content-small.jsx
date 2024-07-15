import { useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';

import CampaignDetailPitchContentSmall from 'src/sections/campaign/discover/admin/campaign-detail-pitch/small-view/campaign-detail.pitch-content.small';

// ----------------------------------------------------------------------

export default function Page() {
  const { pitchId, campaignId } = useParams();
  return (
    <>
      <Helmet>
        <title>Campaign Pitch Detail</title>
      </Helmet>

      <CampaignDetailPitchContentSmall pitchId={pitchId} campaignId={campaignId} />
    </>
  );
}
