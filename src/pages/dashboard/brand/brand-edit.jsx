import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import BrandEditView from 'src/sections/brand/edit/brand/view';

export default function Page() {
  const { id } = useParams();
  return (
    <>
      <Helmet>
        <title>Edit Brand</title>
      </Helmet>

      <BrandEditView id={id} />
    </>
  );
}
