import PropTypes from 'prop-types';
import { pdf } from '@react-pdf/renderer';
import 'react-pdf/dist/Page/TextLayer.css';
import { enqueueSnackbar } from 'notistack';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { useReactToPrint } from 'react-to-print';
import { Page, pdfjs, Document } from 'react-pdf';
import React, { useRef, useState, useEffect } from 'react';

import { Box, Stack, Button, Typography, CircularProgress, Divider, Dialog, Tooltip } from '@mui/material';

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
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
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
    <Box paddingX={{ xs: 1, sm: 2 }}>
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

      {!isLoading && (
        <>
          <Box
            sx={{
              mb: 2.5,
              mt: 2,
              border: '1px solid #e7e7e7',
              borderRadius: 1,
              p: { xs: 1.5, sm: 2 },
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: { xs: 1.5, sm: 2 },
              bgcolor: 'background.paper',
            }}
          >
            {/* Left side with back button and title */}
            <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 1.5 }}>
              <Button
                size="small"
                startIcon={<Iconify icon="ic:round-arrow-back-ios-new" />}
                sx={{
                  color: 'rgba(99, 99, 102, 1)',
                  minWidth: 'auto',
                  px: { xs: 0.75, sm: 1 },
                  py: { xs: 0.25, sm: 0.5 },
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  borderRadius: 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(99, 99, 102, 0.08)',
                    transform: 'translateX(-2px)',
                  },
                }}
                onClick={() => router.back()}
              >
                Back
              </Button>
              <Box
                sx={{
                  width: '1px',
                  height: { xs: '20px', sm: '24px' },
                  bgcolor: '#e7e7e7',
                  mx: { xs: 0.25, sm: 0.5 },
                }}
              />
              <Typography
                sx={{
                  fontFamily: (theme) => theme.typography.fontSecondaryFamily,
                  fontWeight: 500,
                  color: 'text.primary',
                  fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                  lineHeight: 1.2,
                }}
              >
                Invoice Detail - INV-{data?.invoiceNumber.split('-')[1]}
              </Typography>
            </Stack>

            {/* Right side with action buttons */}
            <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 1.5 }}>
              <Button
                startIcon={<Iconify icon="material-symbols:print-outline" />}
                sx={{
                  px: { xs: 1.5, sm: 2 },
                  py: { xs: 0.75, sm: 1 },
                  minHeight: { xs: '32px', sm: '38px' },
                  height: { xs: '32px', sm: '38px' },
                  minWidth: 'fit-content',
                  color: '#666666',
                  bgcolor: '#f5f5f5',
                  fontSize: { xs: '0.85rem', sm: '0.95rem' },
                  fontWeight: 600,
                  borderRadius: 0.75,
                  textTransform: 'none',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  border: '1px solid #e0e0e0',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '1px',
                    left: '1px',
                    right: '1px',
                    bottom: '1px',
                    borderRadius: 0.75,
                    backgroundColor: 'transparent',
                    transition: 'background-color 0.2s ease',
                    zIndex: -1,
                  },
                  '&:hover::before': {
                    backgroundColor: 'rgba(102, 102, 102, 0.08)',
                  },
                  '&:hover': {
                    bgcolor: '#eeeeee',
                    color: '#555555',
                    transform: 'scale(0.98)',
                    borderColor: '#d0d0d0',
                  },
                  '&:focus': {
                    outline: 'none',
                  },
                }}
                onClick={handlePrint}
              >
                Print
              </Button>
              <Button
                startIcon={<Iconify icon="solar:eye-bold" />}
                sx={{
                  px: { xs: 1.5, sm: 2 },
                  py: { xs: 0.75, sm: 1 },
                  minHeight: { xs: '32px', sm: '38px' },
                  height: { xs: '32px', sm: '38px' },
                  minWidth: 'fit-content',
                  color: '#666666',
                  bgcolor: '#f5f5f5',
                  fontSize: { xs: '0.85rem', sm: '0.95rem' },
                  fontWeight: 600,
                  borderRadius: 0.75,
                  textTransform: 'none',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  border: '1px solid #e0e0e0',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '1px',
                    left: '1px',
                    right: '1px',
                    bottom: '1px',
                    borderRadius: 0.75,
                    backgroundColor: 'transparent',
                    transition: 'background-color 0.2s ease',
                    zIndex: -1,
                  },
                  '&:hover::before': {
                    backgroundColor: 'rgba(102, 102, 102, 0.08)',
                  },
                  '&:hover': {
                    bgcolor: '#eeeeee',
                    color: '#555555',
                    transform: 'scale(0.98)',
                    borderColor: '#d0d0d0',
                  },
                  '&:focus': {
                    outline: 'none',
                  },
                }}
                onClick={() => setPdfModalOpen(true)}
              >
                View PDF
              </Button>
              <Button
                startIcon={<Iconify icon="material-symbols:download" />}
                sx={{
                  px: { xs: 1.5, sm: 2 },
                  py: { xs: 0.75, sm: 1 },
                  minHeight: { xs: '32px', sm: '38px' },
                  height: { xs: '32px', sm: '38px' },
                  minWidth: 'fit-content',
                  color: '#ffffff',
                  bgcolor: '#1340ff',
                  fontSize: { xs: '0.85rem', sm: '0.95rem' },
                  fontWeight: 600,
                  borderRadius: 0.75,
                  textTransform: 'none',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '1px',
                    left: '1px',
                    right: '1px',
                    bottom: '1px',
                    borderRadius: 0.75,
                    backgroundColor: 'transparent',
                    transition: 'background-color 0.2s ease',
                    zIndex: -1,
                  },
                  '&:hover::before': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  '&:hover': {
                    bgcolor: '#1340ff',
                    color: '#ffffff',
                    transform: 'scale(0.98)',
                  },
                  '&:focus': {
                    outline: 'none',
                  },
                }}
                onClick={() => handleDownload()}
              >
                Download PDF
              </Button>
            </Stack>
          </Box>

          {/* Divider */}
          {/* <Divider sx={{ mb: 0.5, borderColor: '#e7e7e7' }} /> */}
        </>
      )}

      {/* PDF Viewer Section */}
      <Box
        sx={{
          border: '1px solid #e7e7e7',
          borderRadius: 1,
          bgcolor: 'background.paper',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: { xs: '60vh', sm: '70vh', md: '75vh' },
            overflow: 'auto',
            bgcolor: '#f8f9fa',
            position: 'relative',
            pt: { xs: 1.5, sm: 2 },
            px: { xs: 1.5, sm: 2 },
            pb: { xs: 0.75, sm: 1 },
          }}
        >
          <Box
            ref={componentRef}
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              '& .react-pdf__Document': {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              },
              '& .react-pdf__Page': {
                maxWidth: '100% !important',
                height: 'auto !important',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                marginBottom: '10px',
              },
              '& .react-pdf__Page__canvas': {
                maxWidth: '100% !important',
                height: 'auto !important',
              },
            }}
          >
            <Document 
              file={pdfBlob} 
              onLoadSuccess={handleUploadSuccess}
              loading={
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '200px',
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
              }
            >
              <Page 
                pageNumber={1} 
                width={Math.min(window.innerWidth * 0.9, window.innerWidth > 1000 ? 1000 : 700)}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          </Box>
        </Box>
      </Box>

      {/* PDF Modal */}
      <Dialog
        open={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        fullScreen
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            overflow: 'hidden',
            position: 'relative',
          },
        }}
        sx={{
          zIndex: 9999,
          '& .MuiDialog-container': {
            alignItems: 'center',
            justifyContent: 'center',
          },
          '& .MuiDialog-paper': {
            m: 0,
            width: '100%',
            height: '100%',
          },
        }}
      >
        {/* Header Info - Top Left */}
        <Box
          sx={{
            position: 'fixed',
            top: { xs: 10, md: 20 },
            left: { xs: 10, md: 20 },
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1, md: 1.5 },
            borderRadius: '8px',
            p: { xs: 1.5, md: 2 },
            height: { xs: '56px', md: '64px' },
            minWidth: { xs: '200px', md: '240px' },
          }}
        >
          <Box
            sx={{
              width: { xs: 36, md: 40 },
              height: { xs: 36, md: 40 },
              borderRadius: 1,
              bgcolor: '#1340ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify
              icon="solar:document-bold"
              sx={{
                color: 'white',
                width: { xs: 18, md: 20 },
                height: { xs: 18, md: 20 },
              }}
            />
          </Box>
          <Stack spacing={0.5}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: '#e7e7e7',
                fontSize: { xs: '13px', md: '14px' },
                lineHeight: 1.3,
              }}
            >
              Invoice - INV-{data?.invoiceNumber?.split('-')[1] || 'Unknown'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#85868E',
                fontSize: { xs: '11px', md: '12px' },
                lineHeight: 1.3,
              }}
            >
              PDF Preview
            </Typography>
          </Stack>
        </Box>

        {/* Action Buttons - Top Right */}
        <Stack
          direction="row"
          spacing={{ xs: 0.5, md: 1 }}
          sx={{
            position: 'fixed',
            top: { xs: 10, md: 20 },
            right: { xs: 10, md: 20 },
            zIndex: 10000,
          }}
        >
          {/* Download Button */}
          <Tooltip 
            title="Download PDF" 
            arrow 
            placement="bottom"
            PopperProps={{
              sx: {
                zIndex: 10001,
              },
            }}
            slotProps={{
              tooltip: {
                sx: {
                  bgcolor: 'rgba(0, 0, 0, 0.9)',
                  color: 'white',
                  fontSize: { xs: '11px', md: '12px' },
                  fontWeight: 500,
                },
              },
              arrow: {
                sx: {
                  color: 'rgba(0, 0, 0, 0.9)',
                },
              },
            }}
          >
            <Button
              onClick={handleDownload}
              sx={{
                minWidth: { xs: '40px', md: '44px' },
                width: { xs: '40px', md: '44px' },
                height: { xs: '40px', md: '44px' },
                p: 0,
                bgcolor: 'transparent',
                color: '#ffffff',
                border: '1px solid #28292C',
                borderRadius: '8px',
                fontWeight: 650,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: { xs: '3px', md: '4px' },
                  left: { xs: '3px', md: '4px' },
                  right: { xs: '3px', md: '4px' },
                  bottom: { xs: '3px', md: '4px' },
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  transition: 'background-color 0.2s ease',
                  zIndex: -1,
                },
                '&:hover::before': {
                  backgroundColor: '#5A5A5C',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                },
              }}
            >
              <Iconify icon="eva:download-fill" width={{ xs: 16, md: 18 }} />
            </Button>
          </Tooltip>

          {/* Close Button */}
          <Tooltip 
            title="Close" 
            arrow 
            placement="bottom"
            PopperProps={{
              sx: {
                zIndex: 10001,
              },
            }}
            slotProps={{
              tooltip: {
                sx: {
                  bgcolor: 'rgba(0, 0, 0, 0.9)',
                  color: 'white',
                  fontSize: { xs: '11px', md: '12px' },
                  fontWeight: 500,
                },
              },
              arrow: {
                sx: {
                  color: 'rgba(0, 0, 0, 0.9)',
                },
              },
            }}
          >
            <Button
              onClick={() => setPdfModalOpen(false)}
              sx={{
                minWidth: { xs: '40px', md: '44px' },
                width: { xs: '40px', md: '44px' },
                height: { xs: '40px', md: '44px' },
                p: 0,
                color: '#ffffff',
                border: '1px solid #28292C',
                borderRadius: '8px',
                fontWeight: 650,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: { xs: '3px', md: '4px' },
                  left: { xs: '3px', md: '4px' },
                  right: { xs: '3px', md: '4px' },
                  bottom: { xs: '3px', md: '4px' },
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  transition: 'background-color 0.2s ease',
                  zIndex: -1,
                },
                '&:hover::before': {
                  backgroundColor: '#5A5A5C',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                },
              }}
            >
              <Iconify icon="eva:close-fill" width={{ xs: 20, md: 22 }} />
            </Button>
          </Tooltip>
        </Stack>

        {/* PDF Content */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100vh',
            position: 'fixed',
            top: 0,
            left: 0,
            pt: { xs: '80px', md: '100px' },
            pb: { xs: 2, md: 3 },
            px: { xs: 2, md: 4 },
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              width: '90%',
              height: 'calc(100vh - 120px)',
              maxWidth: '1000px',
              bgcolor: 'transparent',
              borderRadius: 2,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              '&::-webkit-scrollbar': {
                width: { xs: '4px', md: '6px' },
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#5A5A5C',
                borderRadius: '3px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: '#6A6A6C',
              },
            }}
          >
            {!pdfBlob ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#e7e7e7',
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 2,
                    border: '2px dashed #5A5A5C',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                  }}
                >
                  <Iconify
                    icon="solar:document-text-bold"
                    sx={{
                      color: '#85868E',
                      width: 32,
                      height: 32,
                    }}
                  />
                </Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: '#e7e7e7',
                    fontWeight: 600,
                    mb: 1,
                  }}
                >
                  No PDF Available
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#85868E',
                    textAlign: 'center',
                    maxWidth: 300,
                  }}
                >
                  The PDF document is not available for preview.
                </Typography>
              </Box>
            ) : (
              <Document
                file={pdfBlob}
                onLoadSuccess={handleUploadSuccess}
                loading={
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center', 
                      height: '100%',
                      gap: 2,
                    }}
                  >
                    <CircularProgress 
                      size={32} 
                      sx={{ 
                        color: '#ffffff',
                      }} 
                    />
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#e7e7e7',
                        fontWeight: 500,
                      }}
                    >
                      Loading PDF...
                    </Typography>
                  </Box>
                }
              >
                <Stack spacing={3} sx={{ py: 2, alignItems: 'center' }}>
                  <Box
                    sx={{
                      bgcolor: '#ffffff',
                      borderRadius: 1,
                      overflow: 'hidden',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                      border: '1px solid #28292C',
                    }}
                  >
                    <Page
                      pageNumber={1}
                      renderAnnotationLayer={false}
                      renderTextLayer={false}
                      width={Math.min(window.innerWidth * 0.8, window.innerWidth > 1000 ? 800 : 600)}
                      scale={1}
                    />
                  </Box>
                </Stack>
              </Document>
            )}
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
};

export default InvoiceDetail;

InvoiceDetail.propTypes = {
  invoiceId: PropTypes.string,
};
