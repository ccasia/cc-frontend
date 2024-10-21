import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import ManageRoles from 'src/sections/roles/role-manage';

// ----------------------------------------------------------------------

export default function Page() {
  const { id } = useParams();
  return (
    <>
      <Helmet>
        <title>Manage Role</title>
      </Helmet>

      <ManageRoles id={id} />
    </>
  );
}
