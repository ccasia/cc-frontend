import { Helmet } from 'react-helmet-async';

import CreatorLists from 'src/sections/landing/creator/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Creator Lists</title>
      </Helmet>

      <CreatorLists />
    </>
  );
}
