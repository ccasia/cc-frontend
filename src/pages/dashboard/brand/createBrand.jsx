import { Helmet } from 'react-helmet-async';

import CreateBrand from 'src/sections/brand/create/view';

export default function Page() {
  // const {
  //   permission: { brand },
  // } = useAuthContext();

  // if (!brand?.permissions.includes('create')) {
  //   return <h1>You dont have access to this page</h1>;
  // }

  return (
    <>
      <Helmet>
        <title>Create Client</title>
      </Helmet>

      <CreateBrand />
    </>
  );
}
