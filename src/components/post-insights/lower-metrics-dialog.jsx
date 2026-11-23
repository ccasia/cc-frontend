import PropTypes from 'prop-types';

import { LoadingButton } from '@mui/lab';
import { Box, Stack, Dialog, Typography } from '@mui/material';

import {
  DIALOG_PAPER_SX,
  PRIMARY_ACTION_SX,
  SECONDARY_ACTION_SX,
} from 'src/components/campaign/action-button-styles';

import Iconify from 'src/components/iconify';

import useMetricsReview, { formatCount, lowerMetrics } from './use-metrics-review';
import NewNumber, { NUMBER_FONT_SX } from './new-number';

const CELL_SX = { fontSize: 14, lineHeight: '20px' };
const NUMBER_SX = { ...NUMBER_FONT_SX, fontSize: 22, lineHeight: '26px' };
const HEAD_SX = {
  fontSize: 12,
  lineHeight: '16px',
  fontWeight: 600,
  color: '#8E8E93',
  borderBottom: '1px solid #F1F1F1',
  alignSelf: 'stretch',
};

// Opens right after an admin's upload when some screenshot numbers are lower than the post's.
// Closing it without a choice leaves the notice on the creator's row.
export default function LowerMetricsDialog({ open, campaignId, insightId, pending, onClose }) {
  const { decide, isPending, approving, dismissing } = useMetricsReview(
    campaignId,
    insightId,
    onClose
  );
  const rows = lowerMetrics(pending);

  return (
    <Dialog
      open={open && rows.length > 0}
      onClose={isPending ? undefined : onClose}
      aria-labelledby="lower-metrics-title"
      aria-describedby="lower-metrics-description"
      PaperProps={{ sx: DIALOG_PAPER_SX }}
    >
      <Stack spacing={3} sx={{ width: '100%' }}>
        <Stack spacing={2} alignItems="center">
          <Box
            aria-hidden
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: 80,
              height: 80,
              bgcolor: '#FFAB00',
              borderRadius: '500px',
              fontSize: 36,
              lineHeight: '40px',
            }}
          >
            ⚠️
          </Box>

          <Stack spacing={0.5} sx={{ width: '100%' }}>
            <Typography
              id="lower-metrics-title"
              component="h2"
              sx={{
                fontFamily: 'Instrument Serif, serif',
                fontWeight: 400,
                fontSize: 36,
                lineHeight: '40px',
                textAlign: 'center',
                color: '#231F20',
              }}
            >
              Lower Numbers Found
            </Typography>
            <Typography
              id="lower-metrics-description"
              sx={{
                fontFamily: 'InterDisplay',
                fontSize: 16,
                lineHeight: '20px',
                textAlign: 'center',
                color: '#636366',
              }}
            >
              These screenshot numbers are lower than what the post has now. The other numbers were
              already updated.
            </Typography>
          </Stack>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto auto',
            alignItems: 'center',
            px: 1.25,
            pb: 0.5,
            borderRadius: '12px',
            bgcolor: '#FFFFFF',
            border: '1px solid #E7E7E7',
            '& > *': { py: 1, px: 0.75 },
          }}
        >
          <Typography sx={HEAD_SX}>Metric</Typography>
          <Typography sx={{ ...HEAD_SX, textAlign: 'right' }}>Now</Typography>
          <Box sx={HEAD_SX} />
          <Typography sx={{ ...HEAD_SX, textAlign: 'right' }}>Screenshot</Typography>
          {rows.map(({ key, label, value, current }) => [
            <Typography key={`${key}-label`} sx={{ ...CELL_SX, fontWeight: 600, color: '#231F20' }}>
              {label}
            </Typography>,
            <Typography
              key={`${key}-current`}
              sx={{ ...NUMBER_SX, textAlign: 'right', color: '#636366' }}
            >
              {formatCount(current)}
            </Typography>,
            <Box key={`${key}-arrow`} sx={{ display: 'flex', color: '#AEAEB2' }}>
              <Iconify icon="eva:arrow-forward-fill" width={16} />
            </Box>,
            <Box
              key={`${key}-value`}
              sx={{ ...CELL_SX, display: 'flex', justifyContent: 'flex-end' }}
            >
              <NewNumber value={value} current={current} sx={NUMBER_SX} />
            </Box>,
          ])}
        </Box>

        <Stack spacing={1} sx={{ width: '100%' }}>
          <LoadingButton
            fullWidth
            loading={approving}
            disabled={isPending}
            onClick={() => decide(true)}
            sx={PRIMARY_ACTION_SX}
          >
            Use Screenshot Numbers
          </LoadingButton>
          <LoadingButton
            fullWidth
            loading={dismissing}
            disabled={isPending}
            onClick={() => decide(false)}
            sx={SECONDARY_ACTION_SX}
          >
            Keep Current Numbers
          </LoadingButton>
        </Stack>
      </Stack>
    </Dialog>
  );
}

LowerMetricsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  campaignId: PropTypes.string.isRequired,
  insightId: PropTypes.string,
  pending: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};
