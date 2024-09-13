import { useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';


import MediaKitCreator from 'src/sections/creator/media-kit-creator-view/mediakit-view';
import { cleanDigitSectionValue } from '@mui/x-date-pickers/internals/hooks/useField/useField.utils';
import MediaKit from 'src/sections/creator/media-kit-general/mediakit-view';

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
