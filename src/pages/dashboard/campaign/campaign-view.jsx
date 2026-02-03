import { Helmet } from 'react-helmet-async';

import { useAuthContext } from 'src/auth/hooks';

import { CampaignListView } from 'src/sections/campaign/discover/creator/view';
import CampaignView from 'src/sections/campaign/discover/admin/view/campaign-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { user } = useAuthContext();
  const isCreator = user?.role === 'creator';

  return (
    <>
      <Helmet>
        <title>{isCreator ? 'Campaign Discovery' : 'Manage Campaign'}</title>
      </Helmet>

      {isCreator ? <CampaignListView /> : <CampaignView />}
    </>
  );
}
