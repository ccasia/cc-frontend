import { Helmet } from 'react-helmet-async';

import CreatorSelection from 'src/sections/finance/manage/creatorSelection';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Creator Selection | Campaign Manager</title>
      </Helmet>
      <CreatorSelection />
    </>
  );
}
