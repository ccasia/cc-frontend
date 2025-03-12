import { useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';

// import MediaKit from 'src/sections/creator/media-kit-general/mediakit-view';
import MediaKitCreator from 'src/sections/creator/media-kit/view/mediakit-view';
import MediaKit from 'src/sections/creator/media-kit-public/view/mediakit-view';

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
