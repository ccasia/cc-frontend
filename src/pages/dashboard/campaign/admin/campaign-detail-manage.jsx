import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import CampaignDetailManageView from 'src/sections/campaign/manage/details/view/campaign-details-manage-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { id } = useParams();

  return (
    <>
      <Helmet>
        <title>Campaign Detail</title>
      </Helmet>

      <CampaignDetailManageView id={id} />
    </>
  );
}
