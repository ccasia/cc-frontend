import PropTypes from 'prop-types';

import { Box, Stack, Avatar, Drawer, IconButton, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

import { UI_COLORS, CHART_COLORS } from '../chart-config';

export default function CreatorEarningsDrawer({ selectedCreator, creators, onClose, onNavigate }) {
  const open = !!selectedCreator;

  const currentIndex = open ? creators.findIndex((c) => c.name === selectedCreator.name) : -1;
  const rank = currentIndex + 1;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < creators.length - 1;
  const handlePrev = () => hasPrev && onNavigate(creators[currentIndex - 1]);
  const handleNext = () => hasNext && onNavigate(creators[currentIndex + 1]);

  // Sort campaigns by earnings descending + find max for proportional bars
  const campaigns = open
    ? [...selectedCreator.campaigns].sort((a, b) => b.earnings - a.earnings)
    : [];
  const maxCampaignEarnings = campaigns[0]?.earnings || 1;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      slotProps={{ backdrop: { invisible: true } }}
      PaperProps={{
        sx: {
          width: { xs: 1, sm: 480 },
          borderTopLeftRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-12px 0 40px -4px rgba(145, 158, 171, 0.24)',
          borderLeft: '1px solid #919EAB3D',
        },
      }}
    >
      {/* Sticky Header */}
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
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pt: 2, px: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar
              src={selectedCreator?.avatar}
              alt={selectedCreator?.name}
              sx={{ width: 48, height: 48 }}
            />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {selectedCreator?.name}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2" sx={{ color: UI_COLORS.textMuted }}>
                  Total Earnings: <strong style={{ color: UI_COLORS.text }}>RM {selectedCreator?.total?.toLocaleString()}</strong>
                </Typography>
                <Box
                  sx={{
                    bgcolor: CHART_COLORS.primary,
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    px: 1,
                    py: 0.25,
                    borderRadius: 0.75,
                    lineHeight: '18px',
                  }}
                >
                  #{rank}
                </Box>
              </Stack>
            </Box>
          </Stack>
          <IconButton onClick={onClose}>
            <Iconify icon="eva:close-fill" sx={{ height: 24, width: 24 }} />
          </IconButton>
        </Stack>
        <Box sx={{ pb: 2 }} />
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: UI_COLORS.textSecondary }}>
          Campaign Breakdown
        </Typography>

        <Stack spacing={2}>
          {campaigns.map((camp) => {
            const pct = selectedCreator.total > 0 ? Math.round((camp.earnings / selectedCreator.total) * 100) : 0;

            return (
              <Box
                key={camp.campaign}
                sx={{
                  border: '1px solid #E8ECEE',
                  borderRadius: '12px',
                  px: 2,
                  py: 1.5,
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" sx={{ fontWeight: 500, color: UI_COLORS.text }}>
                    {camp.campaign}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: UI_COLORS.text }}>
                    RM {camp.earnings.toLocaleString()}
                  </Typography>
                </Stack>

                {/* Proportional bar */}
                <Box sx={{ mt: 1, height: 8, bgcolor: UI_COLORS.barBg, borderRadius: 1, overflow: 'hidden' }}>
                  <Box
                    sx={{
                      height: '100%',
                      width: `${(camp.earnings / maxCampaignEarnings) * 100}%`,
                      bgcolor: CHART_COLORS.primary,
                      borderRadius: 1,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </Box>

                <Typography variant="caption" sx={{ color: UI_COLORS.textMuted, mt: 0.5, display: 'block' }}>
                  {pct}%
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </Box>

      {/* Sticky Footer — prev/next navigation */}
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
    </Drawer>
  );
}

CreatorEarningsDrawer.propTypes = {
  selectedCreator: PropTypes.object,
  creators: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
};
