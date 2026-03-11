import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import { PDFViewer } from '@react-pdf/renderer';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import useGetInvoiceById from 'src/hooks/use-get-invoice';

import Iconify from 'src/components/iconify';

import InvoicePDF from 'src/sections/invoice/invoice-pdf';

import { renderActionParts } from './campaign-log-render-utils';
import { formatLogTime, getCategoryMeta, getPerformerBadge } from './campaign-log-utils';
import { extractLogContext, extractCreatorNameFromLog } from './campaign-log-detail-utils';

// ---------------------------------------------------------------------------
// Extract creator name from formatted action by parsing quoted names
// and excluding the performer (admin). Used as a last-resort fallback.
// ---------------------------------------------------------------------------

function extractNameFromFormatted(formattedAction, performedBy) {
  if (!formattedAction) return null;
  const names = [];
  const regex = /"([^"]+)"/g;
  let m = regex.exec(formattedAction);
  while (m) {
    names.push(m[1]);
    m = regex.exec(formattedAction);
  }
  // Exclude performer — the remaining name(s) are the subject creator
  const performerClean = performedBy?.replace(/^"|"$/g, '').trim()?.toLowerCase();
  const candidates = names.filter((n) => n.toLowerCase() !== performerClean);
  return candidates.length > 0 ? candidates[0] : null;
}

// ---------------------------------------------------------------------------
// Build creator journey — all logs mentioning the same creator, newest first
// Uses the resolved creator name (with multiple fallbacks) to find related logs
// ---------------------------------------------------------------------------

function useCreatorJourney(log, allLogs, resolvedName) {
  return useMemo(() => {
    if (!log || !allLogs?.length || !resolvedName) return [];

    const lower = resolvedName.toLowerCase();
    const quotedName = `"${resolvedName}"`;

    return allLogs
      .filter((l) => {
        // Match by raw message regex
        const name = extractCreatorNameFromLog(l.action);
        if (name && name.toLowerCase() === lower) return true;
        // Fallback: match by quoted name in formatted action
        if (l.formattedAction?.includes(quotedName)) return true;
        return false;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // newest first
  }, [log, allLogs, resolvedName]);
}

// Strip [action:KEY], [outreach:STATUS] tokens + quotes for plain-text display
function stripTokens(text) {
  return text
    .replace(/\[action:(\w+)]/g, (_, key) => key.replace(/_/g, ' '))
    .replace(/\[outreach:(\w+)]/g, (_, key) => key.replace(/_/g, ' '))
    .replace(/"/g, '');
}

// ---------------------------------------------------------------------------
// JourneyDropdown — collapsible creator journey, newest-first
// ---------------------------------------------------------------------------

function JourneyDropdown({ creatorName, creatorPhoto, journey, selectedId, photoMap }) {
  const [open, setOpen] = useState(false);

  if (journey.length <= 1) return null;

  return (
    <Box>
      {/* Toggle header */}
      <Box
        component="button"
        onClick={() => setOpen(!open)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          gap: 0.75,
          px: 1,
          py: 0.75,
          border: '1px solid #E7E7E7',
          borderRadius: open ? '8px 8px 0 0' : 1,
          bgcolor: '#FAFBFC',
          cursor: 'pointer',
          transition: 'all 0.15s',
          '&:hover': { bgcolor: '#F4F4F5' },
        }}
      >
        <Avatar
          src={creatorPhoto}
          alt={creatorName}
          sx={{ width: 20, height: 20, fontSize: 9, fontWeight: 700 }}
        >
          {creatorName?.charAt(0)?.toUpperCase()}
        </Avatar>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#221F20', flex: 1, textAlign: 'left' }}>
          {creatorName}
        </Typography>
        <Typography sx={{ fontSize: 11, color: '#8e8e93', mr: 0.25 }}>
          {journey.length} events
        </Typography>
        <Iconify
          icon="eva:chevron-down-fill"
          width={16}
          sx={{
            color: '#8e8e93',
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </Box>

      {/* Collapsible timeline */}
      <Collapse in={open}>
        <Box
          sx={{
            border: '1px solid #E7E7E7',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            bgcolor: '#FFFFFF',
            px: 1,
            py: 1,
          }}
        >
          {journey.map((entry, idx) => {
            const isLast = idx === journey.length - 1;
            const meta = getCategoryMeta(entry.category);
            const isSelected = entry.id === selectedId;

            return (
              <Box
                key={entry.id}
                sx={{
                  display: 'flex',
                  minHeight: 36,
                  ...(isSelected && {
                    bgcolor: '#F5F7FF',
                    borderRadius: 1,
                    mx: -0.5,
                    px: 0.5,
                  }),
                }}
              >
                {/* Dot + line column */}
                <Box
                  sx={{
                    width: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flexShrink: 0,
                    position: 'relative',
                  }}
                >
                  {!isLast && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 9,
                        bottom: 0,
                        width: '1.5px',
                        bgcolor: '#E7E7E7',
                      }}
                    />
                  )}
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      flexShrink: 0,
                      mt: '5px',
                      zIndex: 1,
                      ...(isSelected
                        ? { bgcolor: meta.color, border: 'none' }
                        : { bgcolor: '#FFFFFF', border: `2px solid ${meta.color}` }),
                    }}
                  />
                </Box>

                {/* Event text */}
                <Box sx={{ flex: 1, minWidth: 0, pb: isLast ? 0 : 0.75, ml: 0.75 }}>
                  <Typography
                    sx={{
                      fontSize: 12,
                      lineHeight: 1.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      ...(isSelected
                        ? { fontWeight: 600, color: '#221F20' }
                        : { color: '#636366' }),
                    }}
                    title={stripTokens(entry.formattedSummary)}
                  >
                    {stripTokens(entry.formattedSummary)}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: '#AEAEB2' }}>
                    {formatLogTime(entry.createdAt)}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Collapse>
    </Box>
  );
}

JourneyDropdown.propTypes = {
  creatorName: PropTypes.string.isRequired,
  creatorPhoto: PropTypes.string,
  journey: PropTypes.array.isRequired,
  selectedId: PropTypes.string,
  photoMap: PropTypes.instanceOf(Map),
};

// ---------------------------------------------------------------------------
// DetailCard — for invoice / campaign / amount context
// ---------------------------------------------------------------------------

function DetailCard({ icon, iconColor, headerBg, label, children }) {
  return (
    <Box
      sx={{
        bgcolor: '#FFFFFF',
        borderRadius: 1.5,
        border: '1px solid #F0F0F0',
        overflow: 'hidden',
        mb: 1,
      }}
    >
      <Box
        sx={{
          bgcolor: headerBg || '#F4F4F5',
          px: 1.5,
          py: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 0.625,
        }}
      >
        <Iconify icon={icon} width={13} sx={{ color: iconColor || '#8e8e93' }} />
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            color: iconColor || '#8e8e93',
            textTransform: 'uppercase',
            letterSpacing: 0.3,
          }}
        >
          {label}
        </Typography>
      </Box>
      <Box sx={{ px: 1.5, py: 1.25 }}>{children}</Box>
    </Box>
  );
}

DetailCard.propTypes = {
  icon: PropTypes.string.isRequired,
  iconColor: PropTypes.string,
  headerBg: PropTypes.string,
  label: PropTypes.string.isRequired,
  children: PropTypes.node,
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InvoiceActionButton({ isLoading, matchedInvoice, onViewPdf }) {
  if (isLoading) {
    return (
      <Typography sx={{ fontSize: 12, mt: 0.75, color: '#8e8e93' }}>Loading invoice...</Typography>
    );
  }

  if (!matchedInvoice) return null;

  return (
    <Box
      component="button"
      onClick={onViewPdf}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.75,
        width: '100%',
        mt: 1,
        py: 0.625,
        border: '1px dashed #E7E7E7',
        borderRadius: 1,
        bgcolor: 'transparent',
        color: '#636366',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s',
        '&:hover': { borderColor: '#8E33FF', color: '#8E33FF', bgcolor: '#FAFAFE' },
      }}
    >
      <Iconify icon="solar:eye-bold" width={15} />
      View Invoice
    </Box>
  );
}

InvoiceActionButton.propTypes = {
  isLoading: PropTypes.bool,
  matchedInvoice: PropTypes.object,
  onViewPdf: PropTypes.func,
};

function DetailInvoiceSection({ invoice, invoices, invoicesLoading }) {
  const [pdfOpen, setPdfOpen] = useState(false);

  const targetNum = invoice?.invoiceNumber?.trim()?.toUpperCase();
  const matchedInvoice = invoices?.find(
    (inv) => inv.invoiceNumber?.trim()?.toUpperCase() === targetNum
  );
  const isLoading = invoicesLoading && !matchedInvoice;

  const { invoice: fullInvoice, isLoading: fullInvoiceLoading } = useGetInvoiceById(
    pdfOpen && matchedInvoice?.id ? matchedInvoice.id : null
  );

  return (
    <>
      <DetailCard icon="solar:bill-list-bold" iconColor="#8E33FF" headerBg="#F3E8FF" label="Invoice">
        {invoice?.invoiceNumber && (
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#221F20', mb: 0.25 }}>
            #{invoice.invoiceNumber}
          </Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
          {matchedInvoice?.amount != null && (
            <Typography sx={{ fontSize: 13, color: '#636366' }}>
              {matchedInvoice.currency || 'MYR'} {matchedInvoice.amount}
            </Typography>
          )}
          {matchedInvoice?.status && (
            <>
              {matchedInvoice?.amount != null && (
                <Typography component="span" sx={{ fontSize: 12, color: '#C7C7CC' }}>{'\u00B7'}</Typography>
              )}
              <StatusBadge label={matchedInvoice.status} />
            </>
          )}
        </Box>
        <InvoiceActionButton
          isLoading={isLoading}
          matchedInvoice={matchedInvoice}
          onViewPdf={() => setPdfOpen(true)}
        />
      </DetailCard>

      <Dialog
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { bgcolor: '#F4F4F4', borderRadius: 2, height: '90vh', overflow: 'hidden' },
        }}
      >
        <IconButton
          onClick={() => setPdfOpen(false)}
          sx={{ position: 'absolute', right: 12, top: 12, color: '#636366', zIndex: 1 }}
        >
          <Iconify icon="eva:close-fill" width={22} />
        </IconButton>
        <Box sx={{ height: 1, pt: 6, pb: 2, px: 2 }}>
          {pdfOpen && fullInvoiceLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography sx={{ color: '#8e8e93' }}>Loading invoice...</Typography>
            </Box>
          )}
          {pdfOpen && fullInvoice && (
            <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
              <InvoicePDF invoice={fullInvoice} currentStatus={fullInvoice.status} />
            </PDFViewer>
          )}
        </Box>
      </Dialog>
    </>
  );
}

DetailInvoiceSection.propTypes = {
  invoice: PropTypes.object,
  invoices: PropTypes.array,
  invoicesLoading: PropTypes.bool,
};

// ---------------------------------------------------------------------------

function DetailCampaignSection({ info }) {
  return (
    <DetailCard icon="solar:flag-bold" iconColor="#1340FF" headerBg="#EBF0FF" label="Campaign">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {info.image ? (
          <Box
            component="img"
            src={info.image}
            alt={info.name}
            sx={{ width: 30, height: 30, borderRadius: 0.75, objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <Avatar
            variant="rounded"
            sx={{ width: 30, height: 30, bgcolor: '#F4F4F5', color: '#636366', fontWeight: 700, fontSize: 12, borderRadius: 0.75 }}
          >
            {info.name?.charAt(0)?.toUpperCase() || 'C'}
          </Avatar>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#221F20' }} noWrap>
            {info.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
            {info.brandName && (
              <Typography sx={{ fontSize: 12, color: '#8e8e93' }} noWrap>
                {info.brandName}
              </Typography>
            )}
            {info.status && (
              <>
                {info.brandName && (
                  <Typography component="span" sx={{ fontSize: 12, color: '#C7C7CC' }}>{'\u00B7'}</Typography>
                )}
                <StatusBadge label={info.status.replace(/_/g, ' ')} />
              </>
            )}
          </Box>
        </Box>
      </Box>
    </DetailCard>
  );
}

DetailCampaignSection.propTypes = { info: PropTypes.object.isRequired };

// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Format a change value for display
// ---------------------------------------------------------------------------

function formatChangeValue(val) {
  if (val === null || val === undefined) return '\u2014'; // em-dash
  if (Array.isArray(val)) return val.join(', ') || '\u2014';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  return String(val);
}

// ---------------------------------------------------------------------------

function DetailChangesSection({ changes, sectionName }) {
  return (
    <DetailCard icon="solar:pen-bold" iconColor="#1340FF" headerBg="#EBF0FF" label={sectionName || 'Changes'}>
      {changes.map((change, idx) => (
        <Box
          key={idx}
          sx={{
            ...(idx < changes.length - 1 && {
              mb: 1.25,
              pb: 1.25,
              borderBottom: '1px dashed #E7E7E7',
            }),
          }}
        >
          {/* Field name */}
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#221F20', mb: 0.75 }}>
            {change.label}
          </Typography>

          {/* Before row */}
          <Box sx={{ display: 'flex', gap: 0.75, mb: 0.5 }}>
            <Typography sx={{ fontSize: 11, color: '#AEAEB2', width: 40, flexShrink: 0, pt: '1px' }}>
              From
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#FF5630', wordBreak: 'break-all', lineHeight: 1.5, flex: 1 }}>
              {formatChangeValue(change.old)}
            </Typography>
          </Box>

          {/* After row */}
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            <Typography sx={{ fontSize: 11, color: '#AEAEB2', width: 40, flexShrink: 0, pt: '1px' }}>
              To
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#22C55E', fontWeight: 600, wordBreak: 'break-all', lineHeight: 1.5, flex: 1 }}>
              {formatChangeValue(change.new)}
            </Typography>
          </Box>
        </Box>
      ))}
    </DetailCard>
  );
}

DetailChangesSection.propTypes = {
  changes: PropTypes.array.isRequired,
  sectionName: PropTypes.string,
};

// ---------------------------------------------------------------------------

function DetailAmountSection({ amountChange, invoices, invoicesLoading }) {
  const [pdfOpen, setPdfOpen] = useState(false);

  const targetNum = amountChange.invoiceNumber?.trim()?.toUpperCase();
  const matchedInvoice = targetNum
    ? invoices?.find((inv) => inv.invoiceNumber?.trim()?.toUpperCase() === targetNum)
    : null;
  const isLoading = invoicesLoading && !matchedInvoice;

  const { invoice: fullInvoice, isLoading: fullInvoiceLoading } = useGetInvoiceById(
    pdfOpen && matchedInvoice?.id ? matchedInvoice.id : null
  );

  return (
    <>
      <DetailCard icon="solar:tag-price-bold" iconColor="#FFAB00" headerBg="#FFF8E6" label="Amount Change">
        <Stack spacing={1.25}>
          {amountChange.invoiceNumber && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Iconify icon="iconamoon:invoice-light" width={14} sx={{ color: '#8e8e93' }} />
              <Typography sx={{ fontSize: 12, color: '#8e8e93', fontWeight: 600 }}>
                {amountChange.invoiceNumber}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 1.5 }}>
            {/* From */}
            <Box sx={{ flex: 1, bgcolor: '#FFF', borderRadius: 1, px: 1.25, py: 1 }}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.25 }}>
                From
              </Typography>
              <Typography sx={{ fontSize: 15, color: '#FF5630', fontWeight: 600 }}>
                {amountChange.oldAmount}
              </Typography>
            </Box>

            {/* Arrow */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Iconify icon="eva:arrow-forward-fill" width={16} sx={{ color: '#C7C7CC' }} />
            </Box>

            {/* To */}
            <Box sx={{ flex: 1, bgcolor: '#FFF', borderRadius: 1, px: 1.25, py: 1 }}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.25 }}>
                To
              </Typography>
              <Typography sx={{ fontSize: 15, color: '#22C55E', fontWeight: 700 }}>
                {amountChange.newAmount}
              </Typography>
            </Box>
          </Box>

          {amountChange.invoiceNumber && !isLoading && matchedInvoice && (
            <Box
              component="button"
              onClick={() => setPdfOpen(true)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.75,
                width: '100%',
                mt: 0.25,
                py: 0.625,
                border: '1px dashed #E7E7E7',
                borderRadius: 1,
                bgcolor: 'transparent',
                color: '#636366',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                '&:hover': { borderColor: '#636366', color: '#221F20', bgcolor: '#F4F4F5' },
              }}
            >
              <Iconify icon="solar:eye-bold" width={15} />
              View Invoice
            </Box>
          )}
        </Stack>
      </DetailCard>

      <Dialog
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { bgcolor: '#F4F4F4', borderRadius: 2, height: '90vh', overflow: 'hidden' },
        }}
      >
        <IconButton
          onClick={() => setPdfOpen(false)}
          sx={{ position: 'absolute', right: 12, top: 12, color: '#636366', zIndex: 1 }}
        >
          <Iconify icon="eva:close-fill" width={22} />
        </IconButton>
        <Box sx={{ height: 1, pt: 6, pb: 2, px: 2 }}>
          {pdfOpen && fullInvoiceLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography sx={{ color: '#8e8e93' }}>Loading invoice...</Typography>
            </Box>
          )}
          {pdfOpen && fullInvoice && (
            <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
              <InvoicePDF invoice={fullInvoice} currentStatus={fullInvoice.status} />
            </PDFViewer>
          )}
        </Box>
      </Dialog>
    </>
  );
}

DetailAmountSection.propTypes = {
  amountChange: PropTypes.object.isRequired,
  invoices: PropTypes.array,
  invoicesLoading: PropTypes.bool,
};

// ---------------------------------------------------------------------------

function DetailRow({ label, value, icon }) {
  if (!value) return null;
  return (
    <Box sx={{ display: 'flex', gap: 0.75, mb: 0.75 }}>
      {icon && <Iconify icon={icon} width={14} sx={{ color: '#8e8e93', mt: '2px', flexShrink: 0 }} />}
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 11, color: '#AEAEB2', fontWeight: 600, mb: '1px' }}>{label}</Typography>
        <Typography sx={{ fontSize: 12, color: '#221F20', wordBreak: 'break-word', lineHeight: 1.5 }}>{value}</Typography>
      </Box>
    </Box>
  );
}

DetailRow.propTypes = { label: PropTypes.string, value: PropTypes.node, icon: PropTypes.string };

function TrackingLinkRow({ href }) {
  if (!href) return null;
  return (
    <Box sx={{ display: 'flex', gap: 0.75, mb: 0.75 }}>
      <Iconify icon="solar:link-bold" width={14} sx={{ color: '#8e8e93', mt: '2px', flexShrink: 0 }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 11, color: '#AEAEB2', fontWeight: 600, mb: '1px' }}>Tracking Link</Typography>
        <Typography
          component="a"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ fontSize: 12, color: '#1340FF', wordBreak: 'break-all', lineHeight: 1.5, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          {href}
        </Typography>
      </Box>
    </Box>
  );
}

TrackingLinkRow.propTypes = { href: PropTypes.string };

function DetailLogisticsSection({ logistic, isLoading, action, rawAction, metadata }) {
  if (isLoading) {
    return (
      <DetailCard icon="solar:box-bold" iconColor="#00B8D9" headerBg="#E6F9FD" label="Shipping Details">
        <Typography sx={{ fontSize: 12, color: '#8e8e93' }}>Loading logistics...</Typography>
      </DetailCard>
    );
  }

  const delivery = logistic?.deliveryDetails;

  // Simple status confirmations — no detail card needed (unless reservation with outlet)
  const noDetailActions = new Set(['retry', 'status_change']);
  const suppressDetail = (action === 'received' || action === 'completed') && !metadata?.outlet;
  // New-format reservation edits are rendered via DetailChangesSection instead
  const hasChangesDiff = action === 'reservation_details_updated' && Array.isArray(metadata?.changes);
  if (noDetailActions.has(action) || suppressDetail || hasChangesDiff) return null;

  // Card label based on action
  const CARD_LABELS = {
    assigned: 'Assignment Details',
    shipped: 'Shipping Details',
    creator_info: 'Creator Details',
    creator_details_updated: 'Creator Details',
    date_change: 'Delivery Date Change',
    details_updated: 'Updated Details',
    issue: 'Issue Reported',
    resolved: 'Issue Resolved',
    received: 'Check-in Details',
    completed: 'Visit Details',
    reservation_details_updated: 'Updated Reservation Details',
    reservation_submitted: 'Reservation Details',
    reservation: 'Reservation Details',
    admin_schedule: 'Reservation Details',
    admin_reschedule: 'Rescheduled Reservation',
  };
  const cardLabel = CARD_LABELS[action] || 'Shipping Details';

  // For assigned action, need items from metadata
  const hasMetadataItems = metadata?.assignedItems?.length > 0;

  // Guard: nothing to show
  if (!logistic && !metadata && action !== 'date_change') return null;

  const isIssue = action === 'issue';
  const isResolved = action === 'resolved';
  let cardIcon = 'solar:box-bold';
  let cardIconColor = '#00B8D9';
  let cardHeaderBg = '#E6F9FD';
  if (isIssue) { cardIcon = 'solar:danger-triangle-bold'; cardIconColor = '#FF5630'; cardHeaderBg = '#FFF2EE'; }
  if (isResolved) { cardIcon = 'solar:check-circle-bold'; cardIconColor = '#22C55E'; cardHeaderBg = '#E8FAF0'; }

  return (
    <DetailCard icon={cardIcon} iconColor={cardIconColor} headerBg={cardHeaderBg} label={cardLabel}>
      {/* ── assigned ── */}
      {action === 'assigned' && hasMetadataItems && (
        <Box sx={{ display: 'flex', gap: 0.75, mb: 0.75 }}>
          <Iconify icon="solar:box-minimalistic-bold" width={14} sx={{ color: '#8e8e93', mt: '2px', flexShrink: 0 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 11, color: '#AEAEB2', fontWeight: 600, mb: '2px' }}>Assigned Items</Typography>
            {metadata.assignedItems.map((item, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                <Typography sx={{ fontSize: 12, color: '#221F20', fontWeight: 500 }}>
                  {item.name}
                </Typography>
                <Typography sx={{ fontSize: 11, color: '#8e8e93' }}>
                  x{item.quantity}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* ── shipped ── */}
      {action === 'shipped' && (() => {
        const address = metadata?.address || delivery?.address;
        const trackingLink = metadata?.trackingLink || delivery?.trackingLink;
        const expectedDate = metadata?.expectedDeliveryDate || delivery?.expectedDeliveryDate;
        const status = metadata?.status;
        return (
          <>
            {status && (
              <Box sx={{ display: 'flex', gap: 0.75, mb: 0.75 }}>
                <Iconify icon="solar:delivery-bold" width={14} sx={{ color: '#8e8e93', mt: '2px', flexShrink: 0 }} />
                <Box>
                  <Typography sx={{ fontSize: 11, color: '#AEAEB2', fontWeight: 600, mb: '3px' }}>Status</Typography>
                  <StatusBadge label={status.toLowerCase()} />
                </Box>
              </Box>
            )}
            {address && <DetailRow label="Address" icon="solar:map-point-bold" value={address} />}
            <TrackingLinkRow href={trackingLink} />
            {expectedDate && (
              <DetailRow
                label="Expected Delivery"
                icon="solar:calendar-bold"
                value={new Date(expectedDate).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
              />
            )}
          </>
        );
      })()}

      {/* ── creator_info ── */}
      {action === 'creator_info' && (() => {
        const address = metadata?.address || delivery?.address;
        const dietary = metadata?.dietaryRestrictions || delivery?.dietaryRestrictions;
        return (
          <>
            {address && <DetailRow label="Address" icon="solar:map-point-bold" value={address} />}
            {dietary && <DetailRow label="Dietary Restrictions" icon="solar:info-circle-bold" value={dietary} />}
          </>
        );
      })()}

      {/* ── date_change ── */}
      {action === 'date_change' && (() => {
        // Try metadata first, fallback to parsing rawAction
        const oldDate = metadata?.oldDate;
        const newDate = metadata?.newDate;
        if (oldDate && newDate) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Iconify icon="solar:calendar-bold" width={14} sx={{ color: '#8e8e93', flexShrink: 0 }} />
              <Typography sx={{ fontSize: 13, color: '#FF5630', textDecoration: 'line-through', fontWeight: 500 }}>
                {oldDate}
              </Typography>
              <Iconify icon="eva:arrow-forward-fill" width={16} sx={{ color: '#C7C7CC' }} />
              <Typography sx={{ fontSize: 13, color: '#22C55E', fontWeight: 700 }}>
                {newDate}
              </Typography>
            </Box>
          );
        }
        // Fallback: parse from rawAction for old logs
        if (!rawAction) return null;
        const dm = rawAction.match(/changed from (.+?) to (.+)$/i);
        if (!dm) return null;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Iconify icon="solar:calendar-bold" width={14} sx={{ color: '#8e8e93', flexShrink: 0 }} />
            <Typography sx={{ fontSize: 13, color: '#FF5630', textDecoration: 'line-through', fontWeight: 500 }}>
              {dm[1]}
            </Typography>
            <Iconify icon="eva:arrow-forward-fill" width={16} sx={{ color: '#C7C7CC' }} />
            <Typography sx={{ fontSize: 13, color: '#22C55E', fontWeight: 700 }}>
              {dm[2]}
            </Typography>
          </Box>
        );
      })()}

      {/* ── details_updated ── */}
      {action === 'details_updated' && (() => {
        const address = metadata?.address || delivery?.address;
        const trackingLink = metadata?.trackingLink || delivery?.trackingLink;
        const expectedDate = metadata?.expectedDeliveryDate || delivery?.expectedDeliveryDate;
        if (!address && !trackingLink && !expectedDate) return null;
        return (
          <>
            {address && <DetailRow label="Address" icon="solar:map-point-bold" value={address} />}
            <TrackingLinkRow href={trackingLink} />
            {expectedDate && (
              <DetailRow
                label="Expected Delivery"
                icon="solar:calendar-bold"
                value={new Date(expectedDate).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
              />
            )}
          </>
        );
      })()}

      {/* ── issue ── */}
      {action === 'issue' && (() => {
        const reason = metadata?.reason;
        const products = metadata?.products;
        const issueOutlet = metadata?.outlet;
        if (!reason && !products && !issueOutlet) return null;
        return (
          <>
            {issueOutlet && <DetailRow label="Outlet" icon="solar:shop-bold" value={issueOutlet} />}
            {products?.length > 0 && (
              <DetailRow label="Product" icon="solar:box-minimalistic-bold" value={products.join(', ')} />
            )}
            {reason && <DetailRow label="Reason" icon="solar:document-text-bold" value={reason} />}
          </>
        );
      })()}

      {/* ── resolved ── */}
      {action === 'resolved' && (() => {
        const resolvedOutlet = metadata?.outlet;
        const reason = metadata?.reason;
        return (
          <>
            {resolvedOutlet && <DetailRow label="Outlet" icon="solar:shop-bold" value={resolvedOutlet} />}
            {reason && <DetailRow label="Reason" icon="solar:document-text-bold" value={reason} />}
            <Box sx={{ display: 'flex', gap: 0.75, mt: reason || resolvedOutlet ? 0.75 : 0 }}>
              <Iconify icon="solar:check-circle-bold" width={14} sx={{ color: '#22C55E', mt: '2px', flexShrink: 0 }} />
              <Box>
                <Typography sx={{ fontSize: 11, color: '#AEAEB2', fontWeight: 600, mb: '3px' }}>Action</Typography>
                <StatusBadge label="Mark As Resolved" />
              </Box>
            </Box>
          </>
        );
      })()}

      {/* ── reservation_details_updated (legacy flat metadata only — new logs use DetailChangesSection) ── */}
      {action === 'reservation_details_updated' && !Array.isArray(metadata?.changes) && (() => {
        const rdOutlet = metadata?.outlet;
        const picName = metadata?.picName;
        const picContact = metadata?.picContact;
        const budget = metadata?.budget;
        const promoCode = metadata?.promoCode;
        const clientRemarks = metadata?.clientRemarks;
        if (!rdOutlet && !picName && !picContact && !budget && !promoCode && !clientRemarks) return null;
        return (
          <>
            {rdOutlet && <DetailRow label="Outlet" icon="solar:shop-bold" value={rdOutlet} />}
            {picName && <DetailRow label="PIC Name" icon="solar:user-bold" value={picName} />}
            {picContact && <DetailRow label="PIC Contact" icon="solar:phone-bold" value={picContact} />}
            {budget && <DetailRow label="Budget" icon="solar:tag-price-bold" value={String(budget)} />}
            {promoCode && <DetailRow label="Promo Code" icon="solar:ticket-bold" value={promoCode} />}
            {clientRemarks && <DetailRow label="Client Remarks" icon="solar:chat-round-dots-bold" value={clientRemarks} />}
          </>
        );
      })()}

      {/* ── reservation_submitted ── */}
      {action === 'reservation_submitted' && (() => {
        const outlet = metadata?.outlet;
        const pax = metadata?.pax;
        const remarks = metadata?.remarks;
        const slots = metadata?.selectedSlots;
        if (!outlet && !pax && !remarks && !slots?.length) return null;
        const utcOpts = { timeZone: 'UTC' };
        const fmtSlot = (t) => new Date(t).toLocaleString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', ...utcOpts });
        const fmtTime = (t) => new Date(t).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', ...utcOpts });
        return (
          <>
            {outlet && <DetailRow label="Outlet" icon="solar:shop-bold" value={outlet} />}
            {pax && <DetailRow label="Pax" icon="solar:users-group-rounded-bold" value={String(pax)} />}
            {slots?.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.75, mb: 0.75 }}>
                <Iconify icon="solar:clock-circle-bold" width={14} sx={{ color: '#8e8e93', mt: '2px', flexShrink: 0 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 11, color: '#AEAEB2', fontWeight: 600, mb: '2px' }}>
                    {slots.length === 1 ? 'Selected Slot' : 'Proposed Slots'}
                  </Typography>
                  {slots.map((slot, idx) => (
                    <Typography key={idx} sx={{ fontSize: 12, color: '#221F20', lineHeight: 1.6 }}>
                      {fmtSlot(slot.start)} – {fmtTime(slot.end)}
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}
            {remarks && <DetailRow label="Remarks" icon="solar:chat-round-dots-bold" value={remarks} />}
          </>
        );
      })()}

      {/* ── received (reservation check-in) ── */}
      {action === 'received' && (() => {
        const recOutlet = metadata?.outlet;
        if (!recOutlet) return null;
        return <DetailRow label="Outlet" icon="solar:shop-bold" value={recOutlet} />;
      })()}

      {/* ── completed (reservation visit) ── */}
      {action === 'completed' && (() => {
        const compOutlet = metadata?.outlet;
        if (!compOutlet) return null;
        return <DetailRow label="Outlet" icon="solar:shop-bold" value={compOutlet} />;
      })()}

      {/* ── creator_details_updated ── */}
      {action === 'creator_details_updated' && (() => {
        const address = metadata?.address;
        const phoneNumber = metadata?.phoneNumber;
        const dietary = metadata?.dietaryRestrictions;
        if (!address && !phoneNumber && !dietary) return null;
        return (
          <>
            {address && <DetailRow label="Address" icon="solar:map-point-bold" value={address} />}
            {phoneNumber && <DetailRow label="Phone Number" icon="solar:phone-bold" value={phoneNumber} />}
            {dietary && <DetailRow label="Dietary Restrictions" icon="solar:info-circle-bold" value={dietary} />}
          </>
        );
      })()}

      {/* ── reservation (scheduleReservation) ── */}
      {action === 'reservation' && (() => {
        const resOutlet = metadata?.outlet;
        const startTime = metadata?.startTime;
        const endTime = metadata?.endTime;
        const picName = metadata?.picName;
        const picContact = metadata?.picContact;
        if (!resOutlet && !startTime && !picName) return null;
        const fmt = (t) => new Date(t).toLocaleString('en-MY', {
          day: 'numeric', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        });
        return (
          <>
            {resOutlet && <DetailRow label="Outlet" icon="solar:shop-bold" value={resOutlet} />}
            {startTime && endTime && (
              <DetailRow label="Confirmed Slot" icon="solar:clock-circle-bold"
                value={`${fmt(startTime)} – ${new Date(endTime).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}`}
              />
            )}
            {picName && <DetailRow label="PIC Name" icon="solar:user-bold" value={picName} />}
            {picContact && <DetailRow label="PIC Contact" icon="solar:phone-bold" value={picContact} />}
          </>
        );
      })()}

      {/* ── admin_schedule / admin_reschedule ── */}
      {(action === 'admin_schedule' || action === 'admin_reschedule') && (() => {
        const startTime = metadata?.startTime;
        const endTime = metadata?.endTime;
        const schedOutlet = metadata?.outlet;
        if (!startTime && !endTime && !schedOutlet) return null;
        const fmt = (t) => new Date(t).toLocaleString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        return (
          <>
            {schedOutlet && <DetailRow label="Outlet" icon="solar:shop-bold" value={schedOutlet} />}
            {startTime && <DetailRow label="Start Time" icon="solar:clock-circle-bold" value={fmt(startTime)} />}
            {endTime && <DetailRow label="End Time" icon="solar:clock-circle-bold" value={fmt(endTime)} />}
          </>
        );
      })()}
    </DetailCard>
  );
}

DetailLogisticsSection.propTypes = { logistic: PropTypes.object, isLoading: PropTypes.bool, action: PropTypes.string, rawAction: PropTypes.string, metadata: PropTypes.object };

// ---------------------------------------------------------------------------

function StatusBadge({ label }) {
  const STATUS_COLORS = {
    active: '#22C55E',
    completed: '#1340FF',
    paused: '#FFAB00',
    draft: '#8e8e93',
    approved: '#22C55E',
    paid: '#22C55E',
    pending: '#FFAB00',
    rejected: '#FF5630',
    'mark as resolved': '#22C55E',
  };

  const color = STATUS_COLORS[label?.toLowerCase()] || '#8e8e93';

  return (
    <Box
      component="span"
      sx={{
        px: 0.75,
        py: '2px',
        borderRadius: 0.5,
        bgcolor: `${color}14`,
        color,
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'capitalize',
        lineHeight: 1.4,
      }}
    >
      {label}
    </Box>
  );
}

StatusBadge.propTypes = { label: PropTypes.string };

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CampaignLogDetailContent({ log, allLogs, campaign, photoMap, invoices, invoicesLoading, logistics, logisticsLoading }) {
  const meta = getCategoryMeta(log.category);
  const badge = getPerformerBadge(log.performerRole);
  const context = extractLogContext(log, campaign);

  // Resolve creator name with multiple fallbacks: context → regex → formatted action
  const creatorName =
    context.creator?.name ||
    extractCreatorNameFromLog(log.action) ||
    extractNameFromFormatted(log.formattedAction, log.performedBy);

  // Find matching logistic for this creator
  const matchedLogistic = useMemo(() => {
    if (!context.isLogistics || !logistics?.length || !creatorName) return null;
    const lower = creatorName.toLowerCase();
    return logistics.find((l) => l.creator?.name?.toLowerCase() === lower) || null;
  }, [context.isLogistics, logistics, creatorName]);

  const journey = useCreatorJourney(log, allLogs, creatorName);
  const creatorPhoto = creatorName ? (photoMap?.get(creatorName) || context.creator?.photoURL) : null;

  const hasDetailCards = context.campaignInfo || context.editSection || context.changes?.length > 0 || context.invoice || context.amountChange || context.isLogistics;

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {/* ── Event card ── */}
      <Box sx={{ mx: 2, mt: 2, mb: 1 }}>
        <DetailCard icon="solar:clipboard-text-bold" iconColor="#1340FF" headerBg="#EBF0FF" label="Log">
          {/* Action text — hero section */}
          <Box sx={{ mb: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '5px',
                fontSize: 15,
                fontWeight: 500,
                color: '#221F20',
                lineHeight: 1.8,
                mb: 0.5,
              }}
            >
              {renderActionParts(log.formattedSummary, photoMap, 28)}
            </Box>

            <Typography sx={{ fontSize: 12, color: '#8e8e93' }}>
              {formatLogTime(log.createdAt, { detailed: true })}
            </Typography>
          </Box>

          {/* Divider */}
          <Box sx={{ borderTop: '1px solid #F0F0F0', mx: -1.5 }} />

          {/* Performed By row */}
          <Box sx={{ py: 0.75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#8e8e93', flexShrink: 0 }}>
              Performed By
            </Typography>
            <Avatar
              src={photoMap?.get(log.performedBy)}
              alt={log.performedBy}
              sx={{ width: 20, height: 20, fontSize: 9, fontWeight: 700, ml: 0.25 }}
            >
              {log.performedBy?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#221F20' }} noWrap>
              {log.performedBy}
            </Typography>
            {badge && (
              <Box
                component="span"
                sx={{
                  px: 0.5,
                  py: '1px',
                  borderRadius: 0.5,
                  bgcolor: badge.bg,
                  color: badge.color,
                  fontSize: 9,
                  fontWeight: 700,
                  lineHeight: 1.3,
                  flexShrink: 0,
                }}
              >
                {badge.label}
              </Box>
            )}
          </Box>

          {/* Divider */}
          <Box sx={{ borderTop: '1px solid #F0F0F0', mx: -1.5 }} />

          {/* Action row */}
          <Box sx={{ pt: 0.75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#8e8e93', flexShrink: 0 }}>
              Action
            </Typography>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                px: 0.625,
                py: '2px',
                borderRadius: 0.5,
                bgcolor: meta.bg,
                ml: 0.25,
              }}
            >
              <Iconify icon={meta.icon} width={13} sx={{ color: meta.color }} />
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: meta.color }}>
                {log.category}
              </Typography>
            </Box>
          </Box>
        </DetailCard>
      </Box>

      {/* ── Creator Journey (collapsible dropdown) ── */}
      {journey.length > 1 && (
        <Box sx={{ mx: 2, mb: 1 }}>
          <DetailCard icon="solar:history-bold" iconColor="#1340FF" headerBg="#EBF0FF" label="Timeline">
            <JourneyDropdown
              creatorName={creatorName}
              creatorPhoto={creatorPhoto}
              journey={journey}
              selectedId={log.id}
              photoMap={photoMap}
            />
          </DetailCard>
        </Box>
      )}

      {/* ── Detail cards ── */}
      {hasDetailCards && (
        <Box sx={{ px: 2, pb: 2 }}>
          {context.campaignInfo && (
            <DetailCampaignSection info={context.campaignInfo} />
          )}

          {context.changes?.length > 0 && (
            <DetailChangesSection changes={context.changes} sectionName={context.editSection} />
          )}

          {!(context.changes?.length > 0) && context.editSection && (
            <DetailCard icon="solar:pen-bold" iconColor="#1340FF" headerBg="#EBF0FF" label="Section Edited">
              <Typography sx={{ fontSize: 13, color: '#221F20', fontWeight: 500 }}>
                {context.editSection}
              </Typography>
            </DetailCard>
          )}

          {context.invoice && (
            <DetailInvoiceSection invoice={context.invoice} invoices={invoices} invoicesLoading={invoicesLoading} />
          )}

          {context.amountChange && (
            <DetailAmountSection amountChange={context.amountChange} invoices={invoices} invoicesLoading={invoicesLoading} />
          )}

          {context.isLogistics && (
            <DetailLogisticsSection logistic={matchedLogistic} isLoading={logisticsLoading && !matchedLogistic} action={context.logisticsAction} rawAction={log.action} metadata={log.metadata} />
          )}
        </Box>
      )}
    </Box>
  );
}

CampaignLogDetailContent.propTypes = {
  log: PropTypes.object.isRequired,
  allLogs: PropTypes.array,
  campaign: PropTypes.object,
  photoMap: PropTypes.instanceOf(Map),
  invoices: PropTypes.array,
  invoicesLoading: PropTypes.bool,
  logistics: PropTypes.array,
  logisticsLoading: PropTypes.bool,
};
