import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import CampaignManageCreatorView from 'src/sections/campaign/discover/admin/view/campaign-manage-creator-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { id, creatorId, index } = useParams();

  return (
    <>
      <Helmet>
        <title>Manage Creator</title>
      </Helmet>

      <CampaignManageCreatorView id={creatorId} campaignId={id} index={index} />
    </>
  );
}
