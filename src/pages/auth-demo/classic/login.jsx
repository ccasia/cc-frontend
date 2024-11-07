import { useContext } from 'react';
import { Helmet } from 'react-helmet-async';

import { AuthLayoutContext } from 'src/layouts/auth/general';

import { ModernLoginView } from 'src/sections/auth-demo/modern';
import { ClassicLoginView } from 'src/sections/auth-demo/classic';

// ----------------------------------------------------------------------

export default function LoginPage() {
  const option = useContext(AuthLayoutContext);

  return (
    <>
      <Helmet>
        <title>Auth Classic: Login</title>
      </Helmet>

      {option === 'admin' ? <ClassicLoginView /> : <ModernLoginView />}
    </>
  );
}
