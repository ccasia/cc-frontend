import { Helmet } from 'react-helmet-async';
import { PDFViewer } from '@react-pdf/renderer';

import { useSearchParams } from 'src/routes/hooks';

import AgreementPreview from 'src/template/agreement-preview';

// ----------------------------------------------------------------------

// Toggle clauses with ?nda=1&seeding=1&surfshark=1
export default function Page() {
  const searchParams = useSearchParams();

  return (
    <>
      <Helmet>
        <title>Template Agreement</title>
      </Helmet>

      <PDFViewer
        style={{
          height: '100vh',
          width: '100vw',
        }}
      >
        <AgreementPreview
          isNdaRequired={searchParams.get('nda') === '1'}
          isSeedingCampaign={searchParams.get('seeding') === '1'}
          isForSurfShark={searchParams.get('surfshark') === '1'}
        />
      </PDFViewer>
    </>
  );
}
