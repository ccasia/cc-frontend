import React, { useEffect } from 'react';

import { useSearchParams } from 'src/routes/hooks';

const InvoiceCallback = () => {
  const searchParams = useSearchParams();

  useEffect(() => {
    // const queryParameters = new URLSearchParams(window.location.search);
    console.log(searchParams.get('code'));

    // if (code) {
    //   console.log('Authorization code:', code);
    //   // You can now process the code or send it to the back-end
    // } else {
    //   console.log('No code found in query parameters');
    // }
  }, [searchParams]);

  return <div>Processing the dashboard callback...</div>;
};

export default InvoiceCallback;
