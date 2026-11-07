import React from 'react';
import { useParams } from 'react-router-dom';

import useGetInvoiceById from 'src/hooks/use-get-invoice';

import { InvoiceDetailsView } from 'src/sections/invoice/view';
import InvoiceDetailsSkeleton from 'src/sections/invoice/components/invoice-details-skeleton';

function InvoicePage() {
  const { id } = useParams();

  const { invoice, isLoading } = useGetInvoiceById(id);

  if (isLoading) {
    return <InvoiceDetailsSkeleton />;
  }
  return <InvoiceDetailsView invoice={invoice} />;
}

export default InvoicePage;
