import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

import { CC } from './creator-field-tokens';
import EngagementBreakdown, { FORMULA_COPY, describeFormula } from './engagement-breakdown';

/**
 * The engagement rate breakdown, in its own dialog.
 *
 * It replaces a tooltip. Ten rows of numbers with a link on every row is more
 * than a tooltip can hold: it cannot scroll, it closes when the pointer
 * strays, and a keyboard or touch user cannot reach the links at all.
 *
 * Chrome matches Add Non-Platform Creators (grey paper, 20px radius, soft
 * shadow, serif title). The header names the creator and the source; the
 * formula lives in a tooltip beside them. It sits above the scrape modal and closes back to it.
 */

export default function EngagementBreakdownDialog({
  open,
  onClose,
  posts,
  formulaVersion,
  engagementRate,
  followerCount,
  creatorName,
  profileLinks,
}) {
  const { formula } = describeFormula(formulaVersion);
  // Only a known formula names its source; an unknown one stays unnamed. The
  // header shows the platform; the full source sits in the tooltip.
  const source = FORMULA_COPY[formulaVersion]?.title ?? null;
  const isTiktok = Boolean(formulaVersion?.startsWith('tiktok'));
  const platformName = isTiktok ? 'TikTok' : 'Instagram';
  const platform = source ? platformName : null;
  // First candidate on this platform's host, so an Instagram rate never links to TikTok.
  const platformHost = isTiktok ? 'tiktok.com' : 'instagram.com';
  const profileUrl =
    (profileLinks ?? []).find(
      (link) => typeof link === 'string' && /^https?:\/\//i.test(link.trim()) && link.includes(platformHost)
    ) ?? null;
  const platformIcon = isTiktok ? 'mingcute:tiktok-line' : 'mingcute:instagram-line';
  const initials = (creatorName ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      aria-labelledby="engagement-breakdown-title"
      PaperProps={{
        sx: {
          width: 1040,
          // Full screen on phones; a centred card from `sm` up.
          maxWidth: { xs: '100%', sm: 'calc(100% - 32px)' },
          m: { xs: 0, sm: 4 },
          height: { xs: '100%', sm: 'auto' },
          maxHeight: { xs: '100%', sm: 'calc(100% - 64px)' },
          bgcolor: `${CC.paper} !important`,
          backgroundImage: 'none',
          borderRadius: { xs: 0, sm: '20px' },
          boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.15)',
        },
      }}
    >
      <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: CC.paper, overflowY: 'auto' }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          spacing={2}
          sx={{ mb: 2.5 }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
            <Box
              aria-hidden
              sx={{
                width: 48,
                height: 48,
                flexShrink: 0,
                borderRadius: '50%',
                bgcolor: '#FFFFFF',
                border: `1px solid ${CC.light100}`,
                color: CC.onyx,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Instrument Serif, serif',
                fontSize: '20px',
              }}
            >
              {initials || <Iconify icon={platformIcon} width={20} />}
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                id="engagement-breakdown-title"
                component="h2"
                sx={{
                  fontFamily: 'Instrument Serif, serif',
                  fontWeight: 400,
                  fontSize: { xs: '26px', sm: '30px' },
                  lineHeight: { xs: '30px', sm: '34px' },
                  color: CC.onyx,
                }}
              >
                Engagement rate
              </Typography>

              <Stack
                direction="row"
                alignItems="center"
                columnGap={1}
                rowGap={0.25}
                sx={{ mt: '2px', flexWrap: 'wrap', fontSize: '13px', lineHeight: '20px', color: CC.grey50 }}
              >
                {creatorName && (
                  <Box component="span" sx={{ fontWeight: 500, color: CC.onyx }}>
                    {creatorName}
                  </Box>
                )}
                {creatorName && platform && (
                  <Box component="span" aria-hidden sx={{ color: CC.grey25 }}>
                    ·
                  </Box>
                )}
                {platform && (
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.5}
                    {...(profileUrl
                      ? {
                          component: 'a',
                          href: profileUrl,
                          target: '_blank',
                          rel: 'noopener noreferrer',
                          'aria-label': `${platform} profile`,
                        }
                      : { component: 'span' })}
                    sx={{
                      color: 'inherit',
                      textDecoration: 'none',
                      ...(profileUrl && {
                        borderRadius: '4px',
                        transition: 'color 0.15s',
                        '&:hover': { color: CC.blue500 },
                        '&:focus-visible': { outline: `2px solid ${CC.blue500}`, outlineOffset: 2 },
                      }),
                    }}
                  >
                    <Iconify icon={platformIcon} width={14} />
                    <span>{platform}</span>
                    {profileUrl && <Iconify icon="lucide:arrow-up-right" width={12} />}
                  </Stack>
                )}
                <Tooltip
                  arrow
                  enterDelay={0}
                  leaveDelay={0}
                  // Touch opens on a tap, not MUI's default long press.
                  enterTouchDelay={0}
                  leaveTouchDelay={4000}
                  describeChild
                  placement="bottom"
                  title={
                    <Box sx={{ py: 0.25, maxWidth: 280 }}>
                      {source && (
                        <Typography sx={{ fontSize: '12px', lineHeight: '16px', fontWeight: 600 }}>
                          {source}
                        </Typography>
                      )}
                      <Typography
                        sx={{ mt: source ? '4px' : 0, fontSize: '12px', lineHeight: '16px', opacity: 0.8 }}
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
                      p: 0,
                      color: CC.grey25,
                      '&:hover': { color: CC.blue500, bgcolor: 'transparent' },
                    }}
                  >
                    <Iconify icon="eva:info-outline" width={16} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          </Stack>

          <IconButton
            aria-label="Close"
            onClick={onClose}
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: '10px',
              bgcolor: '#FFFFFF',
              border: `1px solid ${CC.light100}`,
              color: CC.grey50,
              '&:hover': { bgcolor: CC.light25, color: CC.onyx },
            }}
          >
            <Iconify icon="mingcute:close-line" width={18} />
          </IconButton>
        </Stack>

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
  /** Candidate profile links, best first. The first on the rate's platform is linked. */
  profileLinks: PropTypes.arrayOf(PropTypes.string),
};
