import { Helmet } from 'react-helmet-async';

import { Roles } from 'src/sections/roles';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Roles</title>
      </Helmet>

      <Roles />
    </>
  );
}
