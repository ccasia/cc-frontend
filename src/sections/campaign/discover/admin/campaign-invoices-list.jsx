import useGetInvoicesByCampId from 'src/hooks/use-get-invoices-by-campId';

import InvoiceListView from 'src/sections/invoice/view/invoice-list-view';

// eslint-disable-next-line react/prop-types
function CampaignInvoicesList({ campId }) {
  const data = useGetInvoicesByCampId(campId);

  return <InvoiceListView invoices={data} campId={campId} />;
}

export default CampaignInvoicesList;
