import { useContext } from 'react';
import { Helmet } from 'react-helmet-async';

import { AuthLayoutContext } from 'src/layouts/auth/general';

import { JwtRegisterView } from 'src/sections/auth/jwt';
import { ModernRegisterView } from 'src/sections/auth-demo/modern';

// ----------------------------------------------------------------------

export default function RegisterPage() {
  const option = useContext(AuthLayoutContext);
  return (
    <>
      <Helmet>
        <title> Jwt: Register</title>
      </Helmet>

      {option === 'admin' ? <JwtRegisterView /> : <ModernRegisterView />}
    </>
  );
}
