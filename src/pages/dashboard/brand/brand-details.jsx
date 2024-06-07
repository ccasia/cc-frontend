import { useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';

import JobDetailsView from 'src/sections/brand/details/job-details-view';

export default function Page() {
  const { id } = useParams();

  return (
    <>
      <Helmet>
        <title>Create Brand</title>
      </Helmet>

      <JobDetailsView id={id} />
    </>
  );
}
