import { Helmet } from 'react-helmet-async';

import CreateInvoice from 'src/sections/finance/manage/create-invoice';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Create Invoice</title>
      </Helmet>
      <CreateInvoice />
    </>
  );
}
