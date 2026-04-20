import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { SnackbarProvider } from 'src/components/snackbar';
import BDBriefForm from 'src/sections/public-access/bd-brief-form';

export default function BDBriefPage() {
  const { token } = useParams();

  return (
    <SnackbarProvider>
      <Helmet>
        <title>Content Strategy Intake | Cult Creative</title>
      </Helmet>
      <BDBriefForm token={token} />
    </SnackbarProvider>
  );
}
