import { Helmet } from 'react-helmet-async';

import MediaKit from 'src/sections/creator/media-kit/mediakit-view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Media Kit</title>
      </Helmet>

      <MediaKit />
    </>
  );
}
