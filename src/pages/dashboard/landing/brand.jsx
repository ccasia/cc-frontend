import { Helmet } from 'react-helmet-async';

import BrandList from 'src/sections/landing/brand/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Brand Lists</title>
      </Helmet>

      <BrandList />
    </>
  );
}
