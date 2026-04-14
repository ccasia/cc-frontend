import PropTypes from 'prop-types';
import { pdf } from '@react-pdf/renderer';
import { Page, pdfjs, Document } from 'react-pdf';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

import { Box, Stack, Avatar, Button, Drawer, IconButton, Typography, CircularProgress } from '@mui/material';

import { useGetAgreements } from 'src/hooks/use-get-agreeements';

import { formatCurrencyAmount } from 'src/utils/currency';

import { useGetCreatorInvoice } from 'src/api/invoices';

import Iconify from 'src/components/iconify';
import Label from 'src/components/label';

import InvoicePDF from 'src/sections/creator/invoice/invoice-pdf';

import { UI_COLORS, CHART_COLORS } from '../chart-config';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// ---------------------------------------------------------------------------
// InvoicePreview — renders a PDF preview of a single invoice inside the drawer
// ---------------------------------------------------------------------------

function InvoicePreview({ invoiceId }) {
  const [pdfBlob, setPdfBlob] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const componentRef = useRef();

  const { data: invoiceData, isLoading, error } = useGetCreatorInvoice({ invoiceId });
  const { data: agreementData } = useGetAgreements(invoiceData?.campaign?.id);

  const enrichedData = useMemo(() => {
    if (!invoiceData) return null;
    if (!agreementData || !Array.isArray(agreementData)) return invoiceData;

    const creatorAgreement = agreementData.find(
      (a) =>
        a?.user?.id === invoiceData?.invoiceFrom?.id ||
        a?.userId === invoiceData?.invoiceFrom?.id
    );

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
        subscription: { ...invoiceData.campaign?.subscription },
      },
    };
  }, [invoiceData, agreementData]);

  useEffect(() => {
    const generateBlob = async () => {
      const blob = await pdf(<InvoicePDF data={enrichedData} />).toBlob();
      setPdfBlob(blob);
    };

    if (enrichedData) {
      generateBlob();
    }
  }, [enrichedData]);

  const handleDownload = useCallback(async () => {
    if (!enrichedData) return;
    try {
      const blob = await pdf(<InvoicePDF data={enrichedData} />).toBlob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${enrichedData.invoiceNumber || invoiceId}.pdf`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('PDF download failed:', err);
    }
  }, [enrichedData, invoiceId]);

  if (isLoading || !enrichedData) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ flex: 1, py: 8 }}>
        <CircularProgress size={28} thickness={5} sx={{ color: '#333' }} />
        <Typography variant="body2" sx={{ mt: 2, color: UI_COLORS.textMuted }}>
          Loading invoice...
        </Typography>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ flex: 1, py: 8 }}>
        <Iconify icon="solar:danger-triangle-bold" width={32} sx={{ color: UI_COLORS.textMuted, mb: 1 }} />
        <Typography variant="body2" sx={{ color: UI_COLORS.textMuted }}>
          Failed to load invoice
        </Typography>
      </Stack>
    );
  }

  const statusColor =
    (enrichedData.status === 'paid' && 'success') ||
    (enrichedData.status === 'approved' && 'success') ||
    (enrichedData.status === 'pending' && 'warning') ||
    (enrichedData.status === 'pending_approval' && 'warning') ||
    (enrichedData.status === 'pending_payment' && 'warning') ||
    (enrichedData.status === 'rejected' && 'error') ||
    (enrichedData.status === 'draft' && 'default') ||
    'default';

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Invoice info bar */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid #E8ECEE', flexShrink: 0 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
            {enrichedData.invoiceNumber}
          </Typography>
          <Label variant="soft" color={statusColor} sx={{ textTransform: 'capitalize' }}>
            {enrichedData.status?.replace(/_/g, ' ')}
          </Label>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrencyAmount(enrichedData.amount, enrichedData.creatorCurrency, enrichedData.currencySymbol)}
          </Typography>
        </Stack>
      </Stack>

      {/* Action buttons */}
      <Stack direction="row" spacing={1} sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid #E8ECEE', flexShrink: 0 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Iconify icon="solar:download-minimalistic-bold" width={16} />}
          onClick={handleDownload}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 12,
            borderColor: '#E8ECEE',
            color: '#333',
            '&:hover': { borderColor: '#C4CDD5', bgcolor: '#F9FAFB' },
          }}
        >
          Download PDF
        </Button>
      </Stack>

      {/* PDF preview */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          bgcolor: '#F4F6F8',
          display: 'flex',
          justifyContent: 'center',
          p: 2.5,
        }}
      >
        <Box
          ref={componentRef}
          sx={{
            width: '100%',
            maxWidth: 800,
            display: 'flex',
            justifyContent: 'center',
            '& .react-pdf__Document': { width: '100%', display: 'flex', justifyContent: 'center' },
            '& .react-pdf__Page': { maxWidth: '100%', height: 'auto !important' },
            '& .react-pdf__Page__canvas': { maxWidth: '100% !important', height: 'auto !important', width: '100% !important' },
          }}
        >
          <Document file={pdfBlob} onLoadSuccess={({ numPages: pages }) => setNumPages(pages)}>
            <Page pageNumber={1} scale={1.1} />
          </Document>
        </Box>
      </Box>
    </Box>
  );
}

InvoicePreview.propTypes = {
  invoiceId: PropTypes.string.isRequired,
};

// ---------------------------------------------------------------------------
// CreatorEarningsDrawer — main drawer component
// ---------------------------------------------------------------------------

export default function CreatorEarningsDrawer({ selectedCreator, creators, onClose, onNavigate }) {
  const open = !!selectedCreator;
  const [activeInvoiceId, setActiveInvoiceId] = useState(null);
  const showingInvoice = !!activeInvoiceId;

  const currentIndex = open ? creators.findIndex((c) => c.userId === selectedCreator.userId) : -1;
  const rank = currentIndex + 1;

  // Reset invoice view when creator changes or drawer closes
  useEffect(() => {
    setActiveInvoiceId(null);
  }, [selectedCreator?.userId]);

  const handleClose = useCallback(() => {
    setActiveInvoiceId(null);
    onClose();
  }, [onClose]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < creators.length - 1;
  const handlePrev = () => { setActiveInvoiceId(null); if (hasPrev) onNavigate(creators[currentIndex - 1]); };
  const handleNext = () => { setActiveInvoiceId(null); if (hasNext) onNavigate(creators[currentIndex + 1]); };

  // Sort campaigns by earnings descending
  const campaigns = open
    ? [...selectedCreator.campaigns].sort((a, b) => b.earnings - a.earnings)
    : [];

  const totalEarnings = selectedCreator?.totalEarnings || 0;
  const avgPerCampaign = campaigns.length > 0 ? Math.round(totalEarnings / campaigns.length) : 0;
  const topCampaignEarnings = campaigns[0]?.earnings || 0;
  const lowestCampaignEarnings =
    campaigns.length > 0 ? campaigns[campaigns.length - 1]?.earnings || 0 : 0;

  const fmtCompact = (num) => {
    if (num >= 100000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      anchor="right"
      slotProps={{ backdrop: { invisible: true } }}
      PaperProps={{
        sx: {
          width: { xs: 1, sm: showingInvoice ? 800 : 540 },
          transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          borderTopLeftRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-12px 0 40px -4px rgba(145, 158, 171, 0.24)',
          borderLeft: '1px solid #919EAB3D',
        },
      }}
    >
      {showingInvoice ? (
        <>
          {/* ── Invoice View: Header ── */}
          <Box
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 1,
              bgcolor: 'background.paper',
              borderBottom: '1px solid',
              borderColor: 'divider',
              flexShrink: 0,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1.5, py: 1.5 }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <IconButton onClick={() => setActiveInvoiceId(null)} size="small">
                  <Iconify icon="eva:arrow-back-fill" width={20} />
                </IconButton>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Invoice Details
                </Typography>
              </Stack>
              <IconButton onClick={handleClose} size="small">
                <Iconify icon="eva:close-fill" sx={{ height: 22, width: 22 }} />
              </IconButton>
            </Stack>
          </Box>

          {/* ── Invoice View: Content ── */}
          <InvoicePreview invoiceId={activeInvoiceId} />
        </>
      ) : (
        <>
          {/* ── Campaign View: Sticky Header — rank by avatar, tier under name ── */}
          <Box
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 1,
              bgcolor: 'background.paper',
              borderBottom: '1px solid',
              borderColor: 'divider',
              flexShrink: 0,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pt: 2, px: 2.5, pb: 1.5 }}>
              {/* Left: avatar + #rank, then name with tier below */}
              <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <Box
                    sx={{
                      bgcolor: `${CHART_COLORS.primary}14`,
                      color: CHART_COLORS.primary,
                      fontSize: 12,
                      fontWeight: 700,
                      minWidth: 28,
                      height: 28,
                      borderRadius: '7px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                    }}
                  >
                    #{rank}
                  </Box>
                  <Avatar
                    src={selectedCreator?.photoUrl}
                    alt={selectedCreator?.name}
                    sx={{ width: 40, height: 40, flexShrink: 0 }}
                  />
                </Stack>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, lineHeight: 1.25 }}>
                    {selectedCreator?.name}
                  </Typography>
                  {selectedCreator?.creditTier && (
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: UI_COLORS.textMuted,
                        mt: 0.25,
                        lineHeight: 1.25,
                      }}
                    >
                      {selectedCreator.creditTier}
                    </Typography>
                  )}
                </Box>
              </Stack>

              {/* Right: total earned + close */}
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Stack alignItems="flex-end">
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: UI_COLORS.textMuted,
                      letterSpacing: '0.02em',
                      lineHeight: 1.2,
                    }}
                  >
                    Total Earned
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1.2,
                      color: UI_COLORS.text,
                    }}
                  >
                    RM {fmtCompact(totalEarnings)}
                  </Typography>
                </Stack>
                <IconButton onClick={handleClose} size="small" sx={{ ml: 0.25 }}>
                  <Iconify icon="eva:close-fill" sx={{ height: 22, width: 22 }} />
                </IconButton>
              </Stack>
            </Stack>

            {/* Supporting: campaign stats — three distinct metrics, refined strip */}
            <Box
              sx={{
                px: 2.5,
                pb: 2,
              }}
            >
              <Stack
                direction="row"
                alignItems="stretch"
                sx={{
                  bgcolor: 'rgba(0,0,0,0.02)',
                  borderRadius: '8px',
                  border: '1px solid rgba(0,0,0,0.04)',
                  overflow: 'hidden',
                }}
              >
                {campaigns.length > 0 && (
                  <>
                    <Box
                      sx={{
                        flex: 1,
                        py: 1.25,
                        px: 1.5,
                        textAlign: 'center',
                        borderRight: '1px solid rgba(0,0,0,0.06)',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: UI_COLORS.textMuted,
                          letterSpacing: '0.02em',
                          lineHeight: 1.2,
                          display: 'block',
                        }}
                      >
                        Avg
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 14,
                          fontWeight: 700,
                          fontVariantNumeric: 'tabular-nums',
                          color: UI_COLORS.text,
                          lineHeight: 1.25,
                          mt: 0.25,
                        }}
                      >
                        RM {fmtCompact(avgPerCampaign)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        flex: 1,
                        py: 1.25,
                        px: 1.5,
                        textAlign: 'center',
                        borderRight: '1px solid rgba(0,0,0,0.06)',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: CHART_COLORS.success,
                          letterSpacing: '0.02em',
                          lineHeight: 1.2,
                          display: 'block',
                        }}
                      >
                        Highest
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 14,
                          fontWeight: 700,
                          fontVariantNumeric: 'tabular-nums',
                          color: CHART_COLORS.success,
                          lineHeight: 1.25,
                          mt: 0.25,
                        }}
                      >
                        RM {fmtCompact(topCampaignEarnings)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        flex: 1,
                        py: 1.25,
                        px: 1.5,
                        textAlign: 'center',
                        '&:last-of-type': { borderRight: 'none' },
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: CHART_COLORS.error,
                          letterSpacing: '0.02em',
                          lineHeight: 1.2,
                          display: 'block',
                        }}
                      >
                        Lowest
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 14,
                          fontWeight: 700,
                          fontVariantNumeric: 'tabular-nums',
                          color: CHART_COLORS.error,
                          lineHeight: 1.25,
                          mt: 0.25,
                        }}
                      >
                        RM {fmtCompact(lowestCampaignEarnings)}
                      </Typography>
                    </Box>
                  </>
                )}
              </Stack>
            </Box>
          </Box>

          {/* ── Campaign View: Scrollable Content ── */}
          <Box sx={{ flex: 1, overflow: 'auto', px: 2.5, py: 2.5, bgcolor: '#F4F6F8' }}>
            <Box
              sx={{
                bgcolor: '#fff',
                border: '1px solid #E8ECEE',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ px: 2, pt: 2, pb: 1.5, borderBottom: '1px solid #F0F2F4' }}
              >
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: UI_COLORS.textMuted, fontSize: 12, letterSpacing: 0.5 }}
                >
                  Campaign Breakdown
                </Typography>
                <Typography variant="caption" sx={{ color: UI_COLORS.textMuted }}>
                  {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
                </Typography>
              </Stack>

              {campaigns.map((camp, i) => {
                const paidDate = formatDate(camp.latestPaidAt);
                const invoiceId = camp.invoiceIds?.[0];
                const isClickable = !!invoiceId;

                return (
                  <Box
                    key={camp.campaignId}
                    onClick={isClickable ? () => setActiveInvoiceId(invoiceId) : undefined}
                    sx={{
                      px: 2,
                      py: 1.5,
                      ...(i < campaigns.length - 1 && { borderBottom: '1px solid #F0F2F4' }),
                      transition: 'background-color 0.15s',
                      ...(isClickable && {
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: UI_COLORS.backgroundHover,
                          '& .earnings-amount': { transform: 'translateY(-100%)', opacity: 0 },
                          '& .earnings-view': { transform: 'translateY(0)', opacity: 1 },
                        },
                      }),
                      ...(!isClickable && {
                        '&:hover': { bgcolor: UI_COLORS.backgroundHover },
                      }),
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Avatar
                        src={camp.campaignImage}
                        variant="rounded"
                        sx={{
                          width: 40,
                          height: 40,
                          flexShrink: 0,
                          borderRadius: '10px',
                          bgcolor: '#F0F2F4',
                          fontSize: 15,
                          fontWeight: 700,
                          color: UI_COLORS.textMuted,
                        }}
                      >
                        {camp.campaignName?.charAt(0)?.toUpperCase()}
                      </Avatar>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          title={camp.campaignName}
                          sx={{
                            fontWeight: 600,
                            fontSize: 13,
                            color: UI_COLORS.text,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {camp.campaignName}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.25 }}>
                          {camp.brandName && (
                            <Typography sx={{ fontSize: 11, color: UI_COLORS.textMuted }}>
                              {camp.brandName}
                            </Typography>
                          )}
                          {camp.brandName && paidDate && (
                            <Typography sx={{ fontSize: 11, color: UI_COLORS.textMuted }}>·</Typography>
                          )}
                          {paidDate && (
                            <Typography sx={{ fontSize: 11, color: UI_COLORS.textMuted }}>
                              Paid {paidDate}
                            </Typography>
                          )}
                          {camp.invoiceCount > 1 && (
                            <Typography
                              sx={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: CHART_COLORS.primary,
                                bgcolor: `${CHART_COLORS.primary}14`,
                                px: 0.75,
                                py: 0.125,
                                borderRadius: '4px',
                                ml: 0.25,
                              }}
                            >
                              {camp.invoiceCount} invoices
                            </Typography>
                          )}
                        </Stack>
                      </Box>

                      <Box
                        sx={{
                          flexShrink: 0,
                          position: 'relative',
                          height: 20,
                          overflow: 'hidden',
                          textAlign: 'right',
                          ...(isClickable && { minWidth: 100 }),
                        }}
                      >
                        <Typography
                          className="earnings-amount"
                          sx={{
                            fontWeight: 700,
                            fontSize: 13,
                            color: UI_COLORS.text,
                            fontVariantNumeric: 'tabular-nums',
                            whiteSpace: 'nowrap',
                            lineHeight: '20px',
                            transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        >
                          RM {camp.earnings.toLocaleString()}
                        </Typography>
                        {isClickable && (
                          <Stack
                            className="earnings-view"
                            direction="row"
                            alignItems="center"
                            justifyContent="flex-end"
                            spacing={0.5}
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              height: 20,
                              transform: 'translateY(100%)',
                              opacity: 0,
                              transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                          >
                            <Iconify
                              icon="solar:document-text-bold"
                              width={14}
                              sx={{ color: CHART_COLORS.primary, flexShrink: 0 }}
                            />
                            <Typography
                              sx={{
                                fontWeight: 700,
                                fontSize: 13,
                                color: CHART_COLORS.primary,
                                whiteSpace: 'nowrap',
                                lineHeight: '20px',
                              }}
                            >
                              View Invoice
                            </Typography>
                          </Stack>
                        )}
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* ── Campaign View: Sticky Footer ── */}
          <Box
            sx={{
              position: 'sticky',
              bottom: 0,
              px: 3,
              py: 1.5,
              borderTop: '1px solid',
              borderColor: 'divider',
              flexShrink: 0,
              bgcolor: 'background.paper',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <IconButton
                onClick={handlePrev}
                disabled={!hasPrev}
                sx={{
                  border: '1px solid',
                  borderColor: hasPrev ? '#E7E7E7' : 'action.disabledBackground',
                  borderRadius: 1,
                }}
              >
                <Iconify icon="eva:arrow-back-fill" width={18} />
              </IconButton>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                #{rank} of {creators.length} creators
              </Typography>
              <IconButton
                onClick={handleNext}
                disabled={!hasNext}
                sx={{
                  border: '1px solid',
                  borderColor: hasNext ? '#E7E7E7' : 'action.disabledBackground',
                  borderRadius: 1,
                }}
              >
                <Iconify icon="eva:arrow-forward-fill" width={18} />
              </IconButton>
            </Stack>
          </Box>
        </>
      )}
    </Drawer>
  );
}

CreatorEarningsDrawer.propTypes = {
  selectedCreator: PropTypes.object,
  creators: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
};
