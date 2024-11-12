import React from 'react';
import { useParams } from 'react-router-dom';

import useGetInvoiceById from 'src/hooks/use-get-invoice';

import { InvoiceDetailsView } from 'src/sections/invoice/view';

function InvoicePage() {
  const { id } = useParams();

  const { invoice, isLoading } = useGetInvoiceById(id);

  if (isLoading) {
    return <div>Loading...</div>;
  }
  return <InvoiceDetailsView invoice={invoice} />;
}

export default InvoicePage;
