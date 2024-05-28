import { Helmet } from 'react-helmet-async';

import DiscoverBrand from 'src/sections/brand/discover/view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Discover Brand</title>
      </Helmet>

      <DiscoverBrand />
    </>
  );
}
