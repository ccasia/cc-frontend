import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import CompanyEditView from 'src/sections/brand/edit/client/view';

export default function Page() {
  const { id } = useParams();
  return (
    <>
      <Helmet>
        <title>Edit Company</title>
      </Helmet>

      <CompanyEditView id={id} />
    </>
  );
}
