import { useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';

import BrandDetails from 'src/sections/brand/details/brand/brand-details';

export default function Page() {
  const { id } = useParams();

  return (
    <>
      <Helmet>
        <title>Brand details</title>
      </Helmet>

      <BrandDetails id={id} />
    </>
  );
}
