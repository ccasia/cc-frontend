import { Helmet } from 'react-helmet-async';

import CreatorInbox from 'src/sections/creator/inbox/view/page';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Creator Inbox</title>
      </Helmet>

      <CreatorInbox />  
    </>
  );
}
