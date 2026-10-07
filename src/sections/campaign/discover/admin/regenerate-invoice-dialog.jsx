import PropTypes from 'prop-types';

import { LoadingButton } from '@mui/lab';
import { Box, Stack, Button, Dialog, Divider, Typography, IconButton } from '@mui/material';

import { formatReceiptAmount } from 'src/hooks/use-get-reimbursements';

import Iconify from 'src/components/iconify';

import {
  FONTS,
  COLORS,
  DIALOG_PAPER_SX,
  DANGER_BUTTON_SX,
  DIALOG_TITLE_PROPS,
  SECONDARY_BUTTON_SX,
} from 'src/sections/campaign/reimbursement/reimbursement-styles';

// ----------------------------------------------------------------------
// Warning shown when "Receipt required" is turned on while the round's invoice is still a
// draft — confirming deletes that draft. Same visual language as the reimbursement modals.

export default function RegenerateInvoiceDialog({ warning, creatorName, loading, onClose, onConfirm }) {
  const open = Boolean(warning);

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: DIALOG_PAPER_SX }}
    >
      {warning && (
        <Box position="relative">
          <IconButton
            sx={{ position: 'absolute', top: 20, right: 10, zIndex: 10 }}
            onClick={onClose}
            disabled={loading}
          >
            <Iconify icon="ci:close-md" width={20} />
          </IconButton>

          <Box sx={{ padding: '15px 30px', pr: 7 }}>
            <Typography {...DIALOG_TITLE_PROPS} lineHeight={1.15}>
              Regenerate Draft Invoice?
            </Typography>
            {creatorName && (
              <Typography sx={{ mt: 0.25, fontFamily: FONTS.body, fontSize: 13, color: COLORS.textMuted }}>
                Requiring receipts for {creatorName}
              </Typography>
            )}
          </Box>

          <Divider />

          <Stack spacing={2} sx={{ padding: '20px 30px' }}>
            {/* The invoice that will be deleted, as receipt-style rows */}
            <Box>
              {[
                { label: 'Invoice', value: warning.invoiceNumber },
                { label: 'Amount', value: formatReceiptAmount(warning.amount, warning.currency) },
              ].map((row) => (
                <Stack
                  key={row.label}
                  direction="row"
                  justifyContent="space-between"
                  sx={{ py: 1, borderBottom: `1px dashed ${COLORS.divider}` }}
                >
                  <Typography sx={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textMuted }}>
                    {row.label}
                  </Typography>
                  <Typography sx={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, color: COLORS.ink }}>
                    {row.value}
                  </Typography>
                </Stack>
              ))}
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1 }}>
                <Typography sx={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textMuted }}>Status</Typography>
                <Typography
                  variant="caption"
                  sx={{
                    px: 1,
                    py: 0.25,
                    fontWeight: 600,
                    borderRadius: 0.8,
                    bgcolor: COLORS.white,
                    color: COLORS.textSecondary,
                    border: `1px solid ${COLORS.idle}`,
                    borderBottom: `3px solid ${COLORS.idle}`,
                  }}
                >
                  DRAFT
                </Typography>
              </Stack>
            </Box>

            <Typography sx={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.label, lineHeight: 1.55 }}>
              This draft will be <strong>deleted</strong>. Once the creator&apos;s receipts are all
              approved, a new invoice is generated with the fee and the reimbursements.
            </Typography>

            {warning.wasEdited && (
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  px: 1.5,
                  py: 1.25,
                  borderRadius: 1,
                  bgcolor: COLORS.noteBg,
                  border: `1px solid ${COLORS.noteBorder}`,
                }}
              >
                <Iconify
                  icon="solar:danger-triangle-linear"
                  width={18}
                  sx={{ color: COLORS.noteIcon, flexShrink: 0, mt: '1px' }}
                />
                <Typography sx={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.noteText, lineHeight: 1.5 }}>
                  This draft was edited after it was generated. The new invoice starts again from the
                  agreement amount ({formatReceiptAmount(warning.agreementAmount, warning.currency)}),
                  so those edits will be lost.
                </Typography>
              </Stack>
            )}
          </Stack>

          <Divider />

          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ px: '30px', py: 2.5 }}>
            <Button onClick={onClose} disabled={loading} sx={SECONDARY_BUTTON_SX}>
              Cancel
            </Button>
            <LoadingButton loading={loading} onClick={onConfirm} sx={DANGER_BUTTON_SX}>
              Delete Draft & Require Receipts
            </LoadingButton>
          </Stack>
        </Box>
      )}
    </Dialog>
  );
}

RegenerateInvoiceDialog.propTypes = {
  // { invoiceNumber, amount, agreementAmount, currency, wasEdited } from the 409 response
  warning: PropTypes.object,
  creatorName: PropTypes.string,
  loading: PropTypes.bool,
  onClose: PropTypes.func,
  onConfirm: PropTypes.func,
};
