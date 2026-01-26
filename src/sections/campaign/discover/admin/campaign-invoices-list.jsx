import useGetInvoicesByCampId from 'src/hooks/use-get-invoices-by-campId';

import InvoiceListView from 'src/sections/invoice/view/invoice-list-view';

// eslint-disable-next-line react/prop-types
function CampaignInvoicesList({ campId, isDisabled = false }) {
  const data = useGetInvoicesByCampId(campId);

  return <InvoiceListView invoices={data} campId={campId} isDisabled={isDisabled} />;
}

export default CampaignInvoicesList;
