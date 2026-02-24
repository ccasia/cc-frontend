import PropTypes from 'prop-types';

import { Box, Stack, Avatar, Drawer, Tooltip, IconButton, Typography } from '@mui/material';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import Iconify from 'src/components/iconify';

import { UI_COLORS, CHART_COLORS } from '../chart-config';

export default function CreatorEarningsDrawer({ selectedCreator, creators, onClose, onNavigate }) {
  const open = !!selectedCreator;
  const router = useRouter();

  const currentIndex = open ? creators.findIndex((c) => c.userId === selectedCreator.userId) : -1;
  const rank = currentIndex + 1;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < creators.length - 1;
  const handlePrev = () => hasPrev && onNavigate(creators[currentIndex - 1]);
  const handleNext = () => hasNext && onNavigate(creators[currentIndex + 1]);

  // Sort campaigns by earnings descending
  const campaigns = open
    ? [...selectedCreator.campaigns].sort((a, b) => b.earnings - a.earnings)
    : [];

  const totalEarnings = selectedCreator?.totalEarnings || 0;
  const avgPerCampaign = campaigns.length > 0 ? Math.round(totalEarnings / campaigns.length) : 0;
  const topCampaignEarnings = campaigns[0]?.earnings || 0;

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
      onClose={onClose}
      anchor="right"
      slotProps={{ backdrop: { invisible: true } }}
      PaperProps={{
        sx: {
          width: { xs: 1, sm: 540 },
          borderTopLeftRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-12px 0 40px -4px rgba(145, 158, 171, 0.24)',
          borderLeft: '1px solid #919EAB3D',
        },
      }}
    >
      {/* ── Sticky Header ── */}
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
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pt: 2.5, px: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
            <Avatar
              src={selectedCreator?.photoUrl}
              alt={selectedCreator?.name}
              sx={{ width: 48, height: 48, flexShrink: 0 }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.2 }}>
                {selectedCreator?.name}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.5 }}>
                <Box
                  sx={{
                    bgcolor: `${CHART_COLORS.primary}14`,
                    color: CHART_COLORS.primary,
                    fontSize: 12,
                    fontWeight: 700,
                    px: 1,
                    py: 0.375,
                    borderRadius: '6px',
                    lineHeight: '18px',
                  }}
                >
                  Rank #{rank}
                </Box>
                {selectedCreator?.creditTier && (
                  <Box
                    sx={{
                      bgcolor: '#F0F2F4',
                      color: UI_COLORS.textSecondary,
                      fontSize: 12,
                      fontWeight: 700,
                      px: 1,
                      py: 0.375,
                      borderRadius: '6px',
                      lineHeight: '18px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {selectedCreator.creditTier}
                  </Box>
                )}
              </Stack>
            </Box>
          </Stack>
          <IconButton onClick={onClose}>
            <Iconify icon="eva:close-fill" sx={{ height: 24, width: 24 }} />
          </IconButton>
        </Stack>

        {/* Stats Row */}
        <Stack
          direction="row"
          sx={{
            mt: 1.5,
            mx: 2.5,
            mb: 2,
            borderRadius: '10px',
            border: '1px solid #E8ECEE',
            overflow: 'hidden',
          }}
        >
          {[
            { value: `RM ${fmtCompact(totalEarnings)}`, label: 'Total Earned' },
            { value: campaigns.length, label: 'Campaigns' },
            { value: `RM ${fmtCompact(avgPerCampaign)}`, label: 'Avg / Campaign' },
            { value: `RM ${fmtCompact(topCampaignEarnings)}`, label: 'Highest', color: CHART_COLORS.success },
          ].map((stat, idx) => (
            <Box key={stat.label} sx={{ display: 'contents' }}>
              {idx > 0 && <Box sx={{ width: '1px', my: 1.5, bgcolor: '#E8ECEE' }} />}
              <Box sx={{ flex: 1, px: 1.25, py: 2.25, textAlign: 'center', minWidth: 0 }}>
                <Typography sx={{ fontSize: '1.0625rem', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', color: stat.color || '#1A1A2E', whiteSpace: 'nowrap' }}>
                  {stat.value}
                </Typography>
                <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: '#919EAB', textTransform: 'uppercase', letterSpacing: '0.05em', mt: 0.75, whiteSpace: 'nowrap' }}>
                  {stat.label}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* ── Scrollable Content ── */}
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
            sx={{ px: 2, pt: 2, pb: 1.5 }}
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

            return (
              <Box
                key={camp.campaignId}
                sx={{
                  px: 2,
                  py: 1.5,
                  ...(i < campaigns.length - 1 && { borderBottom: '1px solid #E8ECEE' }),
                  transition: 'background-color 0.15s',
                  '&:hover': { bgcolor: UI_COLORS.backgroundHover },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  {/* Campaign image */}
                  <Avatar
                    src={camp.campaignImage}
                    variant="rounded"
                    sx={{
                      width: 44,
                      height: 44,
                      flexShrink: 0,
                      borderRadius: '10px',
                      bgcolor: '#F0F2F4',
                      fontSize: 16,
                      fontWeight: 700,
                      color: UI_COLORS.textMuted,
                    }}
                  >
                    {camp.campaignName?.charAt(0)?.toUpperCase()}
                  </Avatar>

                  {/* Name + details */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: UI_COLORS.text,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        {camp.campaignName}
                      </Typography>
                      <Typography
                        sx={{
                          flexShrink: 0,
                          fontSize: 13,
                          fontWeight: 700,
                          color: UI_COLORS.text,
                        }}
                      >
                        RM {camp.earnings.toLocaleString()}
                      </Typography>
                    </Stack>

                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.5 }}>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
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
                              ml: 0.5,
                            }}
                          >
                            {camp.invoiceCount} invoices
                          </Typography>
                        )}
                      </Stack>

                      {/* Invoice icon */}
                      {invoiceId && (
                        <Tooltip title="View invoice" arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(paths.dashboard.finance.invoiceDetail(invoiceId));
                            }}
                            sx={{
                              width: 28,
                              height: 28,
                              color: UI_COLORS.textMuted,
                              '&:hover': { color: CHART_COLORS.primary, bgcolor: `${CHART_COLORS.primary}14` },
                            }}
                          >
                            <Iconify icon="solar:document-text-bold" width={16} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* ── Sticky Footer ── */}
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
