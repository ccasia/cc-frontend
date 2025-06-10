import PropTypes from 'prop-types';
import { pdf } from '@react-pdf/renderer';
import 'react-pdf/dist/Page/TextLayer.css';
import { enqueueSnackbar } from 'notistack';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { useReactToPrint } from 'react-to-print';
import { Page, pdfjs, Document } from 'react-pdf';
import React, { useRef, useState, useEffect } from 'react';

import { Box, Stack, Button, Typography, CircularProgress } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useGetCreatorInvoice } from 'src/api/invoices';

import Iconify from 'src/components/iconify';

import InvoicePDF from './invoice-pdf';

// import InvoicePDF from './invoice-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const InvoiceDetail = ({ invoiceId }) => {
  const router = useRouter();
  const [pdfBlob, setPdfBlob] = useState(null);
  const componentRef = useRef();

  const { data, isLoading, error } = useGetCreatorInvoice({ invoiceId });

  useEffect(() => {
    if (!isLoading && !data) {
      enqueueSnackbar(error?.message || 'no invoice avalible', { variant: 'error' });
      router.push(paths.dashboard.creator.invoiceCreator);
    }
  }, [data, router, isLoading, error]);

  const handleDownload = async () => {
    try {
      const blob = await pdf(<InvoicePDF data={data} />).toBlob();

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${invoiceId}.pdf`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    const generateBlob = async () => {
      const blob = await pdf(<InvoicePDF data={data} />).toBlob();
      setPdfBlob(blob);
    };

    generateBlob();
  }, [data]);

  const handleUploadSuccess = ({ numPages }) => {
    console.log(numPages);
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  return (
    <Box paddingX={2}>
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

      <Button
        size="small"
        startIcon={<Iconify icon="ic:round-arrow-back-ios-new" />}
        sx={{
          color: 'rgba(99, 99, 102, 1)',
        }}
        onClick={() => router.back()}
      >
        Back
      </Button>

      {!isLoading && (
        <Box
          sx={{
            mt: 2,
            mx: 2,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { sm: 'center' },
            gap: 2,
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
              fontWeight: 300,
            }}
          >
            Invoice Details - {data?.invoiceNumber.split('-')[1]}
          </Typography>

          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="material-symbols:print-outline" />}
              size="small"
              sx={{
                px: 2,
                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
              }}
              fullWidth
              onClick={handlePrint}
            >
              Print
            </Button>
            <Button
              size="small"
              startIcon={<Iconify icon="material-symbols:download" />}
              sx={{
                bgcolor: '#1340FF',
                color: (theme) => '#F4F4F4',
                px: 2,
                boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
                '&:hover': {
                  bgcolor: 'navy',
                },
              }}
              fullWidth
              onClick={() => handleDownload()}
            >
              Download
            </Button>
          </Stack>
        </Box>
      )}

      {/* Fix this one later */}
      <Box
        sx={{
          textAlign: 'center',
          height: 1000,
          overflow: 'hidden',
          // overflowX: 'auto',
        }}
      >
        <Box
          ref={componentRef}
          sx={{
            display: 'inline-flex',
          }}
        >
          <Document file={pdfBlob} onLoadSuccess={handleUploadSuccess}>
            <Page pageNumber={1} scale={1.8} />
          </Document>
        </Box>
      </Box>
    </Box>
  );
};

export default InvoiceDetail;

InvoiceDetail.propTypes = {
  invoiceId: PropTypes.string,
};
