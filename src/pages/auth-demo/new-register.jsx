import { Helmet } from 'react-helmet-async';

import Register from 'src/sections/auth-demo/register';

// ----------------------------------------------------------------------

export default function ModernLoginPage() {
  return (
    <>
      <Helmet>
        <title> Cult Creative: Register</title>
      </Helmet>

      <Register />
    </>
  );
}
