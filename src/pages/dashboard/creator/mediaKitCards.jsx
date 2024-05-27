import { Helmet } from 'react-helmet-async';

import { UserCardsView } from 'src/sections/creator/cards/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Media Kit</title>
      </Helmet>

      <UserCardsView />
    </>
  );
}
