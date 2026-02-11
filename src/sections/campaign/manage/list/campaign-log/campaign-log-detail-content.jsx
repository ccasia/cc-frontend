import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import { PDFViewer } from '@react-pdf/renderer';

import Box from '@mui/material/Box';
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
  const [open, setOpen] = useState(true);

  if (journey.length <= 1) return null;

  return (
    <Box sx={{ mx: 2, mb: 1.5 }}>
      {/* Toggle header */}
      <Box
        component="button"
        onClick={() => setOpen(!open)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          gap: 0.75,
          px: 1.25,
          py: 0.875,
          border: '1px solid #E7E7E7',
          borderRadius: open ? '8px 8px 0 0' : 1,
          bgcolor: '#FFFFFF',
          cursor: 'pointer',
          transition: 'all 0.15s',
          '&:hover': { bgcolor: '#F9FAFB' },
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
            px: 1.25,
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

function DetailAmountSection({ amountChange }) {
  return (
    <DetailCard icon="solar:tag-price-bold" iconColor="#FFAB00" headerBg="#FFF8E6" label="Amount Change">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Typography sx={{ fontSize: 14, color: '#FF5630', textDecoration: 'line-through', fontWeight: 500 }}>
          {amountChange.oldAmount}
        </Typography>
        <Iconify icon="eva:arrow-forward-fill" width={16} sx={{ color: '#C7C7CC' }} />
        <Typography sx={{ fontSize: 14, color: '#22C55E', fontWeight: 700 }}>
          {amountChange.newAmount}
        </Typography>
      </Box>
    </DetailCard>
  );
}

DetailAmountSection.propTypes = { amountChange: PropTypes.object.isRequired };

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

export default function CampaignLogDetailContent({ log, allLogs, campaign, photoMap, invoices, invoicesLoading }) {
  const meta = getCategoryMeta(log.category);
  const badge = getPerformerBadge(log.performerRole);
  const context = extractLogContext(log, campaign);

  // Resolve creator name with multiple fallbacks: context → regex → formatted action
  const creatorName =
    context.creator?.name ||
    extractCreatorNameFromLog(log.action) ||
    extractNameFromFormatted(log.formattedAction, log.performedBy);

  const journey = useCreatorJourney(log, allLogs, creatorName);
  const creatorPhoto = creatorName ? (photoMap?.get(creatorName) || context.creator?.photoURL) : null;

  const hasDetailCards = context.campaignInfo || context.editSection || context.invoice || context.amountChange;

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {/* ── Event card ── */}
      <Box sx={{ mx: 2, mt: 2, mb: 1.5, border: '1px solid #E7E7E7', borderRadius: 1.5, overflow: 'hidden', bgcolor: '#FFFFFF' }}>
        {/* Action text — hero section */}
        <Box sx={{ px: 1.75, pt: 1.75, pb: 1.25 }}>
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
            {formatLogTime(log.createdAt)}
          </Typography>
        </Box>

        {/* Divider */}
        <Box sx={{ borderTop: '1px solid #F0F0F0' }} />

        {/* Performed By row */}
        <Box sx={{ px: 1.75, py: 0.75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
        <Box sx={{ borderTop: '1px solid #F0F0F0' }} />

        {/* Action row */}
        <Box sx={{ px: 1.75, py: 0.75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
      </Box>

      {/* ── Creator Journey (collapsible dropdown) ── */}
      {journey.length > 1 && (
        <Box sx={{ pt: 1.5 }}>
          <JourneyDropdown
            creatorName={creatorName}
            creatorPhoto={creatorPhoto}
            journey={journey}
            selectedId={log.id}
            photoMap={photoMap}
          />
        </Box>
      )}

      {/* ── Detail cards ── */}
      {hasDetailCards && (
        <Box sx={{ px: 2, pt: journey.length > 1 ? 0 : 1.5, pb: 2 }}>
          {context.campaignInfo && (
            <DetailCampaignSection info={context.campaignInfo} />
          )}

          {context.editSection && (
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
            <DetailAmountSection amountChange={context.amountChange} />
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
};
