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

import { useGetAgreements } from 'src/hooks/use-get-agreeements';

import { formatCurrencyAmount } from 'src/utils/currency';

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
  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1.8);
  const componentRef = useRef();

  const { data: invoiceData, isLoading, error } = useGetCreatorInvoice({ invoiceId });
  const { data: agreementData } = useGetAgreements(invoiceData?.campaign?.id);

  // Enhance invoice data with creator agreement currency
  const data = React.useMemo(() => {
    if (!invoiceData || !agreementData || !Array.isArray(agreementData)) return invoiceData;

    const creatorAgreement = agreementData.find(
      (agreement) =>
        agreement?.user?.id === invoiceData?.invoiceFrom?.id ||
        agreement?.userId === invoiceData?.invoiceFrom?.id
    );

    // Get currency from task field first, then fall back to other sources
    const currencySymbol = invoiceData?.task?.currencySymbol || invoiceData?.currencySymbol;
    const currencyCode = invoiceData?.task?.currency || invoiceData?.currency;
    
    const creatorCurrency =
      currencyCode ||
      creatorAgreement?.user?.shortlisted?.[0]?.currency ||
      creatorAgreement?.currency ||
      invoiceData?.campaign?.subscription?.currency ||
      'MYR';

    return {
      ...invoiceData,
      creatorCurrency,
      currencySymbol,
      campaign: {
        ...invoiceData.campaign,
        subscription: {
          ...invoiceData.campaign?.subscription,
        },
      },
    };
  }, [invoiceData, agreementData]);

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

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 600) {
        // Mobile devices
        setScale(0.5);
      } else if (width < 900) {
        // Tablets
        setScale(1.0);
      } else {
        // Desktop
        setScale(1.8);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleUploadSuccess = ({ numPages: pages }) => {
    setNumPages(pages);
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
          <Stack spacing={1}>
            <Typography
              variant="h3"
              sx={{
                fontFamily: (theme) => theme.typography.fontSecondaryFamily,
                fontWeight: 300,
              }}
            >
              Invoice Details - {data?.invoiceNumber.split('-')[1]}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontFamily: (theme) => theme.typography.fontSecondaryFamily,
                fontWeight: 500,
                color: '#637381',
              }}
            >
              {formatCurrencyAmount(
                data?.amount, 
                data?.creatorCurrency, 
                data?.currencySymbol
              )}
            </Typography>
          </Stack>

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

      <Box
        sx={{
          mt: 2,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          overflow: 'auto',
          maxHeight: { xs: 'calc(100vh - 200px)', sm: 'calc(100vh - 180px)' },
        }}
      >
        <Box
          ref={componentRef}
          sx={{
            width: '100%',
            maxWidth: { xs: '100%', sm: '100%', md: '800px' },
            display: 'flex',
            justifyContent: 'center',
            '& .react-pdf__Document': {
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
            },
            '& .react-pdf__Page': {
              maxWidth: '100%',
              height: 'auto !important',
            },
            '& .react-pdf__Page__canvas': {
              maxWidth: '100% !important',
              height: 'auto !important',
              width: '100% !important',
            },
          }}
        >
          <Document file={pdfBlob} onLoadSuccess={handleUploadSuccess}>
            <Page pageNumber={1} scale={scale} />
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
