import { Helmet } from 'react-helmet-async';

import ManageBrand from 'src/sections/brand/manage/view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Manage Brand</title>
      </Helmet>

      <ManageBrand />
    </>
  );
}
