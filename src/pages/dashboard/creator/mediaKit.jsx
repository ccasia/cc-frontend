import { useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';

import MediaKit from 'src/sections/creator/media-kit-general/mediakit-view';
import MediaKitCreator from 'src/sections/creator/media-kit-creator-view/mediakit-view';

// ----------------------------------------------------------------------

export default function Page() {
  const params = useParams();
  const { id } = params;

  return (
    <>
      <Helmet>
        <title>Media Kit</title>
      </Helmet>
      {id ? <MediaKit id={id} /> : <MediaKitCreator />}
    </>
  );
}
