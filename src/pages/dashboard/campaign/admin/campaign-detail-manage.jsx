import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import CampaignDetailsManageViewV2 from 'src/sections/campaign/manage/details/view/campaign-details-manage-view-v2';

// ----------------------------------------------------------------------

export default function Page() {
  const { id } = useParams();

  return (
    <>
      <Helmet>
        <title>Campaign Detail</title>
      </Helmet>

      <CampaignDetailsManageViewV2 id={id} />
    </>
  );
}
