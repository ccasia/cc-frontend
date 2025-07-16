import { Helmet } from 'react-helmet-async';

import ClientRegister from 'src/sections/auth-demo/client-register';

// ----------------------------------------------------------------------

export default function ClientRegisterPage() {
  return (
    <>
      <Helmet>
        <title> Cult Creative: Client Register</title>
      </Helmet>

      <ClientRegister />
    </>
  );
}