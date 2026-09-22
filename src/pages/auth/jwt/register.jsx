import { Helmet } from 'react-helmet-async';

// import { AuthLayoutContext } from 'src/layouts/auth/general';


// ----------------------------------------------------------------------

export default function RegisterPage() {
  // const option = useContext(AuthLayoutContext);
  return (
    <>
      <Helmet>
        <title> Jwt: Register</title>
      </Helmet>

      {/* {option === 'admin' ? <JwtRegisterView /> : <ModernRegisterView />} */}
    </>
  );
}
