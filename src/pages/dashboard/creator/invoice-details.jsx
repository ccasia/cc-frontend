import { useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';

import InvoiceDetail from 'src/sections/creator/invoice/invoice-detail';

// ----------------------------------------------------------------------

export default function Page() {
  const params = useParams();
  // const { creatorId, campaignId } = params;
  const { invoiceId } = params;

  return (
    <>
      <Helmet>
        <title>Invoice Creator</title>
      </Helmet>

      <InvoiceDetail invoiceId={invoiceId} />
    </>
  );
}
