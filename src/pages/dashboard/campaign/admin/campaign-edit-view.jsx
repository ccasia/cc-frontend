import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import CampaignEditView from 'src/sections/campaign/manage/edit/view/campaign-edit-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { id } = useParams();

  return (
    <>
      <Helmet>
        <title>Campaign Edit</title>
      </Helmet>

      <CampaignEditView id={id} />
    </>
  );
}
