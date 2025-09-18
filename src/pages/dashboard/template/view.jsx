import { Helmet } from 'react-helmet-async';
import { PDFViewer } from '@react-pdf/renderer';

import AgreementTemplate from 'src/template/agreement';

// ----------------------------------------------------------------------

export default function Page() {
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
        <AgreementTemplate />
      </PDFViewer>
    </>
  );
}
