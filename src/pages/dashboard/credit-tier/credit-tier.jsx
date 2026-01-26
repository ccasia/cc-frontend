import { Helmet } from 'react-helmet-async';

import CreditTierView from 'src/sections/credit-tier/view/credit-tier-view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Credit Tiers</title>
      </Helmet>

      <CreditTierView />
    </>
  );
}
