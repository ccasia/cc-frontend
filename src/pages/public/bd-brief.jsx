import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { SnackbarProvider } from 'src/components/snackbar';

import PublicBriefSubmit from 'src/sections/public-access/public-brief-submit';

export default function BDBriefPage() {
  const { token } = useParams();

  return (
    <SnackbarProvider>
      <Helmet>
        <title>Campaign Brief | Cult Creative</title>
      </Helmet>
      <PublicBriefSubmit token={token} />
    </SnackbarProvider>
  );
}
