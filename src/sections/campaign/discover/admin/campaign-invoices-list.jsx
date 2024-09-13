import InvoiceListView from 'src/sections/invoice/view/invoice-list-view';

import useGetInvoicesByCampId from 'src/hooks/use-get-invoices-by-campId';

function CampaignInvoicesList({ campId }) {
  const data = useGetInvoicesByCampId(campId);

  return <InvoiceListView invoices={data} campId={campId} />;
}

export default CampaignInvoicesList;
