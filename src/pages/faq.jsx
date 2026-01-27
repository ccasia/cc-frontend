import { Helmet } from 'react-helmet-async';

import { FaqView } from 'src/sections/faq/view';

// ----------------------------------------------------------------------

export default function FaqPage() {
  return (
    <>
      <Helmet>
        <title>FAQ - Cult Creative</title>
      </Helmet>

      <FaqView />
    </>
  );
}

