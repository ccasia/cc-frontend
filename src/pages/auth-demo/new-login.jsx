import { Helmet } from 'react-helmet-async';

import Login from 'src/sections/auth-demo/login';

// ----------------------------------------------------------------------

export default function ModernLoginPage() {
  return (
    <>
      <Helmet>
        <title> Cult Creative: Login</title>
      </Helmet>

      <Login />
    </>
  );
}
