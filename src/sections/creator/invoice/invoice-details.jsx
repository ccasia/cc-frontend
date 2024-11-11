import { pdfjs } from 'react-pdf';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import 'react-pdf/dist/Page/TextLayer.css';
import { enqueueSnackbar } from 'notistack';
import 'react-pdf/dist/Page/AnnotationLayer.css';

import { Box, CircularProgress } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useGetCreatorInvoice } from 'src/api/invoices';

// import InvoicePDF from './invoice-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const InvoiceDetail = ({ invoiceId }) => {
  const router = useRouter();

  const { data, isLoading, error } = useGetCreatorInvoice({ invoiceId });

  useEffect(() => {
    if (!isLoading && !data) {
      enqueueSnackbar(error?.message || "no invoice avalible", { variant: 'error' });
      router.push(paths.dashboard.creator.invoiceCreator);
    }
  }, [data, router, isLoading, error]);

  return (
    <Box>
      {isLoading && (
        <Box
          sx={{
            position: 'relative',
            top: 200,
            textAlign: 'center',
          }}
        >
          <CircularProgress
            thickness={7}
            size={25}
            sx={{
              color: (theme) => theme.palette.common.black,
              strokeLinecap: 'round',
            }}
          />
        </Box>
      )}

      {/* Fix this one later */}

      {/* {!isLoading && data && <ReactPDF />} */}
    </Box>
  );
};

export default InvoiceDetail;

InvoiceDetail.propTypes = {
  invoiceId: PropTypes.string,
};
