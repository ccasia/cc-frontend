import { useState } from 'react';
import PropTypes from 'prop-types';
import { PDFViewer } from '@react-pdf/renderer';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import useGetInvoiceById from 'src/hooks/use-get-invoice';

import Iconify from 'src/components/iconify';

import InvoicePDF from 'src/sections/invoice/invoice-pdf';

import { extractLogContext } from './campaign-log-detail-utils';
import { formatLogTime, getCategoryMeta, getPerformerBadge } from './campaign-log-utils';

// ---------------------------------------------------------------------------
// Label style
// ---------------------------------------------------------------------------

const LABEL_SX = {
  variant: 'caption',
  fontSize: 11,
  fontWeight: 700,
  color: '#8e8e93',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  mb: 0.5,
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DetailRow({ label, children }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography sx={LABEL_SX}>{label}</Typography>
      {children}
    </Box>
  );
}

DetailRow.propTypes = { label: PropTypes.string.isRequired, children: PropTypes.node };

// ---------------------------------------------------------------------------

function DetailCreatorSection({ creator, photoMap }) {
  const photoURL = photoMap?.get(creator.name) || creator.photoURL;

  return (
    <>
      <Divider sx={{ borderStyle: 'dashed', my: 2 }} />
      <DetailRow label="Creator">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            src={photoURL}
            alt={creator.name}
            sx={{ width: 40, height: 40, fontSize: 16, fontWeight: 700 }}
          >
            {creator.name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#221F20' }}>
              {creator.name}
            </Typography>
            {(creator.ugcVideos != null || creator.creditPerVideo != null) && (
              <Typography variant="caption" sx={{ color: '#8e8e93' }}>
                {creator.ugcVideos != null && `${creator.ugcVideos} UGC videos`}
                {creator.ugcVideos != null && creator.creditPerVideo != null && ' \u00B7 '}
                {creator.creditPerVideo != null && `${creator.creditPerVideo} credits`}
              </Typography>
            )}
          </Box>
        </Box>
      </DetailRow>
    </>
  );
}

DetailCreatorSection.propTypes = {
  creator: PropTypes.object.isRequired,
  photoMap: PropTypes.instanceOf(Map),
};

// ---------------------------------------------------------------------------

function DetailCampaignSection({ info }) {
  return (
    <>
      <Divider sx={{ borderStyle: 'dashed', my: 2 }} />
      <DetailRow label="Campaign">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {info.image ? (
            <Box
              component="img"
              src={info.image}
              alt={info.name}
              sx={{ width: 48, height: 48, borderRadius: 1, objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <Avatar variant="rounded" sx={{ width: 48, height: 48, bgcolor: '#e7e7e7', color: '#636366', fontWeight: 700, fontSize: 18, borderRadius: 1 }}>
              {info.name?.charAt(0)?.toUpperCase() || 'C'}
            </Avatar>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#221F20' }} noWrap>
              {info.name}
            </Typography>
            {info.brandName && (
              <Typography variant="caption" sx={{ color: '#8e8e93', display: 'block' }} noWrap>
                {info.brandName}
              </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25, flexWrap: 'wrap' }}>
              {info.status && (
                <StatusBadge label={info.status.replace(/_/g, ' ')} />
              )}
              {info.submissionVersion && (
                <Typography variant="caption" sx={{ color: '#8e8e93' }}>
                  {'\u00B7'} {info.submissionVersion}
                </Typography>
              )}
              <Typography variant="caption" sx={{ color: '#8e8e93' }}>
                {'\u00B7'} {info.shortlistedCount} creators
              </Typography>
            </Box>
          </Box>
        </Box>
      </DetailRow>
    </>
  );
}

DetailCampaignSection.propTypes = { info: PropTypes.object.isRequired };

// ---------------------------------------------------------------------------

function InvoiceActionButton({ isLoading, matchedInvoice, onViewPdf }) {
  if (isLoading) {
    return (
      <Typography variant="caption" sx={{ mt: 1, color: '#8e8e93' }}>
        Loading invoice details...
      </Typography>
    );
  }

  if (!matchedInvoice) return null;

  return (
    <Button
      size="small"
      variant="outlined"
      onClick={onViewPdf}
      startIcon={<Iconify icon="solar:eye-bold" width={16} />}
      sx={{
        mt: 1,
        borderColor: '#8E33FF',
        color: '#8E33FF',
        fontWeight: 600,
        fontSize: 13,
        '&:hover': { borderColor: '#7928CA', bgcolor: '#F3E8FF' },
      }}
    >
      View Invoice
    </Button>
  );
}

InvoiceActionButton.propTypes = {
  isLoading: PropTypes.bool,
  matchedInvoice: PropTypes.object,
  onViewPdf: PropTypes.func,
};

function DetailInvoiceSection({ invoice, invoices, invoicesLoading }) {
  const [pdfOpen, setPdfOpen] = useState(false);

  // Robust matching: trim + case-insensitive
  const targetNum = invoice?.invoiceNumber?.trim()?.toUpperCase();
  const matchedInvoice = invoices?.find(
    (inv) => inv.invoiceNumber?.trim()?.toUpperCase() === targetNum
  );
  const isLoading = invoicesLoading && !matchedInvoice;

  // Fetch the full invoice (with campaign relation) for PDF rendering
  const { invoice: fullInvoice, isLoading: fullInvoiceLoading } = useGetInvoiceById(
    pdfOpen && matchedInvoice?.id ? matchedInvoice.id : null
  );

  return (
    <>
      <Divider sx={{ borderStyle: 'dashed', my: 2 }} />
      <DetailRow label="Invoice">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {invoice?.invoiceNumber && (
            <Typography sx={{ fontSize: 14, color: '#221F20' }}>
              Invoice #: <strong>{invoice.invoiceNumber}</strong>
            </Typography>
          )}
          {matchedInvoice?.amount != null && (
            <Typography sx={{ fontSize: 14, color: '#221F20' }}>
              Amount: <strong>{matchedInvoice.currency || 'RM'} {matchedInvoice.amount}</strong>
            </Typography>
          )}
          {matchedInvoice?.status && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography sx={{ fontSize: 14, color: '#221F20' }}>Status:</Typography>
              <StatusBadge label={matchedInvoice.status} />
            </Box>
          )}
          <InvoiceActionButton
            isLoading={isLoading}
            matchedInvoice={matchedInvoice}
            onViewPdf={() => setPdfOpen(true)}
          />
        </Box>
      </DetailRow>

      {/* Invoice PDF modal */}
      <Dialog
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#F4F4F4',
            borderRadius: 2,
            height: '90vh',
            overflow: 'hidden',
          },
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

function DetailAmountSection({ amountChange }) {
  return (
    <>
      <Divider sx={{ borderStyle: 'dashed', my: 2 }} />
      <DetailRow label="Amount Change">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: 14, color: '#FF5630', textDecoration: 'line-through' }}>
            {amountChange.oldAmount}
          </Typography>
          <Iconify icon="eva:arrow-forward-fill" width={16} sx={{ color: '#8e8e93' }} />
          <Typography sx={{ fontSize: 14, color: '#22C55E', fontWeight: 600 }}>
            {amountChange.newAmount}
          </Typography>
        </Box>
      </DetailRow>
    </>
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

export default function CampaignLogDetailContent({ log, campaign, photoMap, invoices, invoicesLoading }) {
  const meta = getCategoryMeta(log.category);
  const badge = getPerformerBadge(log.performerRole);
  const context = extractLogContext(log, campaign);

  const fullDate = new Date(log.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Box sx={{ p: 3 }}>
      {/* Category header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: meta.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Iconify icon={meta.icon} width={18} sx={{ color: meta.color }} />
        </Box>
        <Typography sx={{ fontSize: 16, fontWeight: 600, color: meta.color }}>
          {log.category}
        </Typography>
      </Box>

      {/* Date & time */}
      <DetailRow label="Date & Time">
        <Typography sx={{ fontSize: 14, color: '#221F20' }}>
          {fullDate} at {formatLogTime(log.createdAt)}
        </Typography>
      </DetailRow>

      {/* Performed by */}
      <DetailRow label="Performed By">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            src={photoMap?.get(log.performedBy)}
            alt={log.performedBy}
            sx={{ width: 28, height: 28, fontSize: 12, fontWeight: 700 }}
          >
            {log.performedBy?.charAt(0)?.toUpperCase()}
          </Avatar>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#221F20' }}>
            {log.performedBy}
          </Typography>
          {badge && (
            <Box
              component="span"
              sx={{
                px: 0.75,
                py: '2px',
                borderRadius: 0.5,
                bgcolor: badge.bg,
                color: badge.color,
                fontSize: 11,
                fontWeight: 700,
                lineHeight: 1.4,
              }}
            >
              {badge.label}
            </Box>
          )}
        </Box>
      </DetailRow>

      {/* Action */}
      <DetailRow label="Action">
        <Typography sx={{ fontSize: 14, color: '#221F20', lineHeight: 1.5 }}>
          {log.action}
        </Typography>
      </DetailRow>

      {/* Contextual sections */}
      {context.creator && (
        <DetailCreatorSection creator={context.creator} photoMap={photoMap} />
      )}

      {context.campaignInfo && (
        <DetailCampaignSection info={context.campaignInfo} />
      )}

      {context.editSection && (
        <>
          <Divider sx={{ borderStyle: 'dashed', my: 2 }} />
          <DetailRow label="Section Edited">
            <Typography sx={{ fontSize: 14, color: '#221F20', fontWeight: 500 }}>
              {context.editSection}
            </Typography>
          </DetailRow>
        </>
      )}

      {context.invoice && (
        <DetailInvoiceSection invoice={context.invoice} invoices={invoices} invoicesLoading={invoicesLoading} />
      )}

      {context.amountChange && (
        <DetailAmountSection amountChange={context.amountChange} />
      )}
    </Box>
  );
}

CampaignLogDetailContent.propTypes = {
  log: PropTypes.object.isRequired,
  campaign: PropTypes.object,
  photoMap: PropTypes.instanceOf(Map),
  invoices: PropTypes.array,
  invoicesLoading: PropTypes.bool,
};
