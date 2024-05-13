import { Helmet } from 'react-helmet-async';

import CreatorList from 'src/sections/creator/creator-list';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Creators</title>
      </Helmet>

      <CreatorList />
    </>
  );
}
