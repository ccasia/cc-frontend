import { Helmet } from 'react-helmet-async';

import ClientBriefView from 'src/sections/public-access/client-brief-view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Campaign Brief</title>
      </Helmet>
      <ClientBriefView />
    </>
  );
}
