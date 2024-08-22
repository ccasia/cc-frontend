import { Helmet } from 'react-helmet-async';

import FinanceDiscover from 'src/sections/finance/discover';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Finance Discover</title>
      </Helmet>

      <FinanceDiscover />
    </>
  );
}
