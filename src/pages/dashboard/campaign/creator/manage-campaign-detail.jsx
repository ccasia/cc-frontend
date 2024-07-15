import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import ManageCampaignDetailView from 'src/sections/campaign/manage-creator/view/manage-campaign-detail-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { id } = useParams();
  return (
    <>
      <Helmet>
        <title>Manage Campaign Detail</title>
      </Helmet>

      <ManageCampaignDetailView id={id} />
    </>
  );
}
