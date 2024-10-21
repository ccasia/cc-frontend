import { useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';

import CompanyDetails from 'src/sections/brand/details/view';

export default function Page() {
  const { id } = useParams();

  return (
    <>
      <Helmet>
        <title>Create Brand</title>
      </Helmet>

      <CompanyDetails id={id} />
    </>
  );
}
