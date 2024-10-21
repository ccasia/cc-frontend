import { Helmet } from 'react-helmet-async';

import AdminForm from 'src/sections/admin/admin-form';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Admin Form</title>
      </Helmet>

      <AdminForm />
    </>
  );
}
