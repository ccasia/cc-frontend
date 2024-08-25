import { Helmet } from 'react-helmet-async';

import InvoicePage from 'src/sections/finance/manage/invoice-page';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Invoice Details </title>
      </Helmet>
      <InvoicePage />
    </>
  );
}
