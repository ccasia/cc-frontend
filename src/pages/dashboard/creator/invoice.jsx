import { Helmet } from 'react-helmet-async';

import CreatorInvoice from 'src/sections/creator/invoice/view/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Invoice Creator</title>
      </Helmet>

      <CreatorInvoice />
    </>
  );
}
