import PropTypes from 'prop-types';

import { Box, Stack, Avatar, Drawer, IconButton, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

import { UI_COLORS, CHART_COLORS } from '../chart-config';

const PACKAGE_COLORS = {
  Basic: CHART_COLORS.primary,
  Essential: CHART_COLORS.secondary,
  Pro: CHART_COLORS.success,
  Custom: CHART_COLORS.warning,
};

const PACKAGES = ['Basic', 'Essential', 'Pro', 'Custom'];
const PACKAGE_KEYS = { Basic: 'basic', Essential: 'essential', Pro: 'pro', Custom: 'custom' };

export default function CreditsPerCSDrawer({ selectedCS, csAdmins, onClose, onNavigate }) {
  const open = !!selectedCS;

  const currentIndex = open ? csAdmins.findIndex((c) => c.csName === selectedCS.csName) : -1;
  const rank = currentIndex + 1;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < csAdmins.length - 1;
  const handlePrev = () => hasPrev && onNavigate(csAdmins[currentIndex - 1]);
  const handleNext = () => hasNext && onNavigate(csAdmins[currentIndex + 1]);

  const total = open
    ? selectedCS.basic + selectedCS.essential + selectedCS.pro + selectedCS.custom
    : 0;

  const campaigns = open ? [...selectedCS.campaigns].sort((a, b) => b.credits - a.credits) : [];

  const v2 = selectedCS?.v2Credits || 0;
  const v4 = selectedCS?.v4Credits || 0;
  const versionTotal = v2 + v4 || 1;

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
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ pt: 2, px: 2.5 }}
        >
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {selectedCS?.csName}
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
            <Typography variant="body2" sx={{ color: UI_COLORS.textMuted, mt: 0.25 }}>
              {total} total credits
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Iconify icon="eva:close-fill" sx={{ height: 24, width: 24 }} />
          </IconButton>
        </Stack>

        {/* Stacked distribution bar — visual summary right in the header */}
        <Stack
          direction="row"
          sx={{ mx: 2.5, mt: 1.5, mb: 2, height: 8, borderRadius: 1, overflow: 'hidden' }}
        >
          {total > 0 &&
            PACKAGES.map((pkg) => {
              const val = selectedCS?.[PACKAGE_KEYS[pkg]] || 0;
              if (val === 0) return null;
              return (
                <Box
                  key={pkg}
                  sx={{
                    height: '100%',
                    width: `${(val / total) * 100}%`,
                    bgcolor: PACKAGE_COLORS[pkg],
                    transition: 'width 0.3s ease',
                  }}
                />
              );
            })}
        </Stack>
      </Box>

      {/* ── Scrollable Content ── */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2.5, py: 2.5, bgcolor: '#F4F6F8' }}>
        {/* Section 1: Package Distribution */}
        <Box
          sx={{ bgcolor: '#fff', border: '1px solid #E8ECEE', borderRadius: '12px', p: 2, mb: 2 }}
        >
          <Typography
            variant="caption"
            sx={{ fontWeight: 600, color: UI_COLORS.textMuted, fontSize: 12, letterSpacing: 0.5 }}
          >
            Credits By Package
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25, mt: 1.5 }}>
            {PACKAGES.map((pkg) => {
              const val = selectedCS?.[PACKAGE_KEYS[pkg]] || 0;
              const pct = total > 0 ? Math.round((val / total) * 100) : 0;
              return (
                <Box
                  key={pkg}
                  sx={{
                    bgcolor: PACKAGE_COLORS[pkg],
                    borderRadius: '10px',
                    px: 2,
                    py: 1.5,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.8)',
                      lineHeight: 1,
                    }}
                  >
                    {pkg}
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 800, color: '#fff', lineHeight: 1.3, mt: 0.5 }}
                  >
                    {val}
                  </Typography>
                  <Typography
                    sx={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}
                  >
                    {pct}%
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Section 2: V2 vs V4 */}
        <Box
          sx={{ bgcolor: '#fff', border: '1px solid #E8ECEE', borderRadius: '12px', p: 2, mb: 2 }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: UI_COLORS.textMuted,
              fontSize: 12,
              letterSpacing: 0.5,
              mb: 1.5,
              display: 'block',
            }}
          >
            Campaign Version
          </Typography>

          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CHART_COLORS.grey }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: UI_COLORS.text }}>
                V2
              </Typography>
              <Typography variant="caption" sx={{ color: UI_COLORS.textMuted }}>
                {v2} ({Math.round((v2 / versionTotal) * 100)}%)
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Typography variant="caption" sx={{ color: UI_COLORS.textMuted }}>
                {v4} ({Math.round((v4 / versionTotal) * 100)}%)
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: UI_COLORS.text }}>
                V4
              </Typography>
              <Box
                sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CHART_COLORS.primary }}
              />
            </Stack>
          </Stack>
          <Stack direction="row" sx={{ height: 10, borderRadius: 1, overflow: 'hidden' }}>
            <Box
              sx={{
                height: '100%',
                width: `${(v2 / versionTotal) * 100}%`,
                bgcolor: CHART_COLORS.grey,
                transition: 'width 0.3s ease',
              }}
            />
            <Box
              sx={{
                height: '100%',
                width: `${(v4 / versionTotal) * 100}%`,
                bgcolor: CHART_COLORS.primary,
                transition: 'width 0.3s ease',
              }}
            />
          </Stack>
        </Box>

        {/* Section 3: Campaign Breakdown */}
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
              Campaigns
            </Typography>
            <Typography variant="caption" sx={{ color: UI_COLORS.textMuted }}>
              {campaigns.length} campaigns
            </Typography>
          </Stack>
          {campaigns.map((camp, i) => {
            const pct = total > 0 ? Math.round((camp.credits / total) * 100) : 0;
            const color = PACKAGE_COLORS[camp.package];
            return (
              <Box
                key={camp.name}
                sx={{
                  px: 2,
                  py: 1.5,
                  borderLeft: `3px solid ${color}`,
                  ...(i < campaigns.length - 1 && { borderBottom: '1px solid #E8ECEE' }),
                  transition: 'background-color 0.15s',
                  '&:hover': { bgcolor: UI_COLORS.backgroundHover },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  {/* Campaign image */}
                  <Avatar
                    src={`https://picsum.photos/seed/${encodeURIComponent(camp.name)}/80`}
                    variant="rounded"
                    sx={{ width: 40, height: 40, flexShrink: 0, borderRadius: '8px' }}
                  />

                  {/* Name + bar + meta */}
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
                        {camp.name}
                      </Typography>
                      <Box
                        sx={{
                          flexShrink: 0,
                          bgcolor: `${color}14`,
                          color,
                          fontSize: 12,
                          fontWeight: 700,
                          px: 1,
                          py: 0.25,
                          borderRadius: '6px',
                          lineHeight: '20px',
                        }}
                      >
                        {camp.credits} credits
                      </Box>
                    </Stack>

                    {/* Progress bar */}
                    <Box
                      sx={{
                        mt: 0.75,
                        height: 6,
                        borderRadius: '3px',
                        bgcolor: '#F0F2F4',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${pct}%`,
                          minWidth: pct > 0 ? 4 : 0,
                          bgcolor: color,
                          borderRadius: '3px',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </Box>

                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mt: 0.5 }}
                    >
                      <Typography sx={{ fontSize: 11, color: UI_COLORS.textMuted }}>
                        {camp.package} · {camp.version}
                      </Typography>
                      <Typography
                        sx={{ fontSize: 11, fontWeight: 600, color: UI_COLORS.textMuted }}
                      >
                        {pct}%
                      </Typography>
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
            #{rank} of {csAdmins.length} CS admins
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

CreditsPerCSDrawer.propTypes = {
  selectedCS: PropTypes.object,
  csAdmins: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
};
