import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import { useGetCampaignById } from 'src/hooks/use-get-campaign-by-id';

import CampaignDetailView from 'src/sections/campaign/discover/admin/view/campaign-detail-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { id } = useParams();
  const { campaign } = useGetCampaignById(id);

  return (
    <>
      <Helmet>
        <title>{campaign?.name ?? 'Manage Campaign'}</title>
      </Helmet>

      <CampaignDetailView id={id} />
    </>
  );
}
