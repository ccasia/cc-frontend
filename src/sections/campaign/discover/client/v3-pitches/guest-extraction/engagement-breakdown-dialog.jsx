import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

import { CC } from './creator-field-tokens';
import EngagementBreakdown, { describeFormula } from './engagement-breakdown';

/**
 * The engagement rate breakdown, in its own dialog.
 *
 * It replaces a tooltip. Ten rows of numbers with a link on every row is more
 * than a tooltip can hold: it cannot scroll, it closes when the pointer
 * strays, and a keyboard or touch user cannot reach the links at all.
 *
 * Chrome matches Add Non-Platform Creators (grey paper, 20px radius, soft
 * shadow, serif title). Source and formula live in a tooltip beside the
 * heading. It sits above the scrape modal and closes back to it.
 */

export default function EngagementBreakdownDialog({
  open,
  onClose,
  posts,
  formulaVersion,
  engagementRate,
  followerCount,
  creatorName,
}) {
  const { title, formula } = describeFormula(formulaVersion);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      aria-labelledby="engagement-breakdown-title"
      PaperProps={{
        sx: {
          width: 800,
          maxWidth: 'calc(100% - 32px)',
          bgcolor: `${CC.paper} !important`,
          backgroundImage: 'none',
          borderRadius: '20px',
          boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.15)',
        },
      }}
    >
      <Box sx={{ p: 3, bgcolor: CC.paper }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={3}>
          <Box sx={{ minWidth: 0, pr: 1 }}>
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: '4px' }}>
              <Typography
                id="engagement-breakdown-title"
                component="h2"
                sx={{
                  fontFamily: 'Instrument Serif, serif',
                  fontWeight: 400,
                  fontSize: { xs: '28px', sm: '36px' },
                  lineHeight: '40px',
                  color: CC.onyx,
                }}
              >
                Engagement rate
              </Typography>
              <Tooltip
                arrow
                enterDelay={0}
                leaveDelay={0}
                describeChild
                placement="right"
                title={
                  <Box sx={{ py: 0.25, maxWidth: 280 }}>
                    <Typography sx={{ fontSize: '12px', lineHeight: '16px', fontWeight: 600 }}>
                      {title}
                    </Typography>
                    <Typography
                      sx={{ mt: '4px', fontSize: '12px', lineHeight: '16px', opacity: 0.8 }}
                    >
                      {formula}
                    </Typography>
                  </Box>
                }
              >
                <IconButton
                  aria-label="Source and formula"
                  size="small"
                  sx={{
                    p: 0.25,
                    color: CC.grey25,
                    '&:hover': { color: CC.blue500, bgcolor: 'transparent' },
                  }}
                >
                  <Iconify icon="eva:info-outline" width={18} />
                </IconButton>
              </Tooltip>
            </Stack>
            {creatorName && (
              <Typography
                sx={{
                  display: 'inline-block',
                  fontSize: '12px',
                  lineHeight: '16px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  color: CC.grey50,
                  textTransform: 'uppercase',
                }}
              >
                {creatorName}
              </Typography>
            )}
          </Box>

          <IconButton
            aria-label="Close"
            onClick={onClose}
            sx={{ p: 0, color: CC.grey50, flexShrink: 0 }}
          >
            <Iconify icon="mdi:close" width={24} />
          </IconButton>
        </Stack>

        <Divider sx={{ my: 2, borderColor: CC.light100 }} />

        <EngagementBreakdown
          posts={posts}
          formulaVersion={formulaVersion}
          engagementRate={engagementRate}
          followerCount={followerCount}
        />
      </Box>
    </Dialog>
  );
}

EngagementBreakdownDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  posts: PropTypes.array,
  formulaVersion: PropTypes.string,
  engagementRate: PropTypes.string,
  followerCount: PropTypes.number,
  /** Shown under the heading, so the dialog says whose rate this is. */
  creatorName: PropTypes.string,
};
