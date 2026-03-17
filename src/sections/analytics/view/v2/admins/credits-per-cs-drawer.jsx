import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';

import { Box, Stack, Avatar, Drawer, Tooltip, IconButton, Typography, ButtonBase } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

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

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function StatTile({ label, value, accent }) {
  return (
    <Box
      sx={{
        flex: 1,
        py: 1,
        px: 1.25,
        bgcolor: accent ? `${accent}0A` : '#F4F6F8',
        borderRadius: '8px',
      }}
    >
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 600,
          color: UI_COLORS.textMuted,
          letterSpacing: 0.2,
          mb: 0.25,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: 18,
          fontWeight: 700,
          color: accent || UI_COLORS.text,
          lineHeight: 1.2,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

StatTile.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  accent: PropTypes.string,
};

export default function CreditsPerCSDrawer({ selectedCS, csAdmins, onClose, onNavigate }) {
  const router = useRouter();
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

  const totalUtilized = selectedCS?.totalCreditsUtilized || 0;
  const remaining = Math.max(total - totalUtilized, 0);

  const [sortByLeastPending, setSortByLeastPending] = useState(true);

  const campaigns = useMemo(() => {
    if (!open || !selectedCS?.campaigns?.length) return [];
    const list = [...selectedCS.campaigns];
    return list.sort((a, b) => {
      const pendingA = a.creditsPending ?? 0;
      const pendingB = b.creditsPending ?? 0;
      return sortByLeastPending ? pendingA - pendingB : pendingB - pendingA;
    });
  }, [open, selectedCS?.campaigns, sortByLeastPending]);

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
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pt: 2.5, px: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar
              src={selectedCS?.csPhoto || undefined}
              alt={selectedCS?.csName}
              sx={{
                width: 48,
                height: 48,
                fontSize: 16,
                fontWeight: 700,
                bgcolor: `${CHART_COLORS.primary}18`,
                color: CHART_COLORS.primary,
                border: `2px solid ${CHART_COLORS.primary}30`,
              }}
            >
              {getInitials(selectedCS?.csName)}
            </Avatar>
            <Box>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                  {selectedCS?.csName}
                </Typography>
                <Box
                  sx={{
                    bgcolor: CHART_COLORS.primary,
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    px: 0.75,
                    py: 0.125,
                    borderRadius: '4px',
                    lineHeight: '16px',
                    letterSpacing: 0.3,
                  }}
                >
                  #{rank}
                </Box>
              </Stack>
              <Typography sx={{ fontSize: 12, color: UI_COLORS.textMuted, mt: 0.125 }}>
                CS Admin
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} sx={{ mt: -1 }}>
            <Iconify icon="eva:close-fill" sx={{ height: 22, width: 22 }} />
          </IconButton>
        </Stack>

        {/* Credit summary tiles */}
        <Stack direction="row" spacing={1} sx={{ mx: 2.5, mt: 2, mb: 1.5 }}>
          <StatTile label="Total Credits" value={total} />
          <StatTile label="Used Credits" value={totalUtilized} />
          <StatTile label="Pending Credits" value={remaining} />
        </Stack>
      </Box>

      {/* ── Scrollable Content ── */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, bgcolor: '#F4F6F8' }}>
        {/* Section 1: Package Distribution */}
        <Box
          sx={{
            bgcolor: '#fff',
            border: '1px solid #E8ECEE',
            borderRadius: '12px',
            p: 1.5,
            mb: 1.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontWeight: 600, color: UI_COLORS.textMuted, fontSize: 12, letterSpacing: 0.5 }}
          >
            Credits By Package
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25, mt: 1.25 }}>
            {PACKAGES.map((pkg) => {
              const val = selectedCS?.[PACKAGE_KEYS[pkg]] || 0;
              const pct = total > 0 ? Math.round((val / total) * 100) : 0;
              return (
                <Box
                  key={pkg}
                  sx={{
                    bgcolor: `${PACKAGE_COLORS[pkg]}10`,
                    border: `1px solid ${PACKAGE_COLORS[pkg]}20`,
                    borderRadius: '10px',
                    p: 1.5,
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: PACKAGE_COLORS[pkg],
                        lineHeight: 1,
                      }}
                    >
                      {pkg}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: PACKAGE_COLORS[pkg],
                        bgcolor: `${PACKAGE_COLORS[pkg]}20`,
                        px: 0.75,
                        py: 0.25,
                        borderRadius: '6px',
                        lineHeight: 1.2,
                      }}
                    >
                      {pct}%
                    </Typography>
                  </Stack>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 800, color: UI_COLORS.text, lineHeight: 1 }}
                  >
                    {val}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Campaigns + Version (combined) */}
        <Box
          sx={{
            bgcolor: '#fff',
            border: '1px solid #E8ECEE',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          {/* Campaign list header + version breakdown */}
          <Box sx={{ px: 2, pt: 2, pb: 1.5, borderBottom: '1px solid #E8ECEE' }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1.5 }}
            >
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: UI_COLORS.textMuted,
                    fontSize: 12,
                    letterSpacing: 0.5,
                  }}
                >
                  Campaigns
                </Typography>
                <Tooltip
                  title={sortByLeastPending ? 'Sort by most pending' : 'Sort by least pending'}
                >
                  <IconButton
                    size="small"
                    onClick={() => setSortByLeastPending((v) => !v)}
                    sx={{
                      p: 0.5,
                      color: UI_COLORS.textMuted,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: '6px',
                      '&:hover': {
                        color: CHART_COLORS.primary,
                        bgcolor: `${CHART_COLORS.primary}08`,
                        borderColor: `${CHART_COLORS.primary}40`,
                      },
                    }}
                  >
                    <Iconify
                      icon={
                        sortByLeastPending ? 'eva:arrow-upward-fill' : 'eva:arrow-downward-fill'
                      }
                      sx={{ width: 16, height: 16 }}
                    />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Typography variant="caption" sx={{ color: UI_COLORS.textMuted }}>
                {campaigns.length} campaigns
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Box
                  sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CHART_COLORS.grey }}
                />
                <Typography variant="body2" sx={{ fontWeight: 600, color: UI_COLORS.text }}>
                  V2
                </Typography>
                <Typography variant="caption" sx={{ color: UI_COLORS.textMuted, fontWeight: 500 }}>
                  {v2} credits
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Typography variant="caption" sx={{ color: UI_COLORS.textMuted, fontWeight: 500 }}>
                  {v4} credits
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
          {campaigns.map((camp, i) => {
            const color = PACKAGE_COLORS[camp.package];
            const used = camp.creditsUtilized ?? 0;
            const pending = camp.creditsPending ?? 0;
            return (
              <ButtonBase
                key={camp.campaignId}
                onClick={() => router.push(paths.dashboard.campaign.details(camp.campaignId))}
                sx={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  px: 2,
                  py: 1.5,
                  ...(i < campaigns.length - 1 && { borderBottom: '1px solid #E8ECEE' }),
                  transition: 'background-color 0.15s',
                  '&:hover': {
                    bgcolor: UI_COLORS.backgroundHover,
                    '& .campaign-chevron': {
                      transform: 'translateX(2px)',
                      opacity: 1,
                    },
                  },
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar
                    src={camp.campaignImage || undefined}
                    alt={camp.name}
                    variant="rounded"
                    sx={{ width: 40, height: 40, flexShrink: 0, borderRadius: '8px' }}
                  />

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: UI_COLORS.text,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {camp.name}
                    </Typography>

                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                      <Stack direction="row" alignItems="baseline" spacing={0.5}>
                        <Typography
                          sx={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: CHART_COLORS.primary,
                            lineHeight: 1,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {used}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: UI_COLORS.textMuted, lineHeight: 1 }}>
                          used
                        </Typography>
                      </Stack>
                      <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: '#919EAB66' }} />
                      <Stack direction="row" alignItems="baseline" spacing={0.5}>
                        <Typography
                          sx={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: CHART_COLORS.warning,
                            lineHeight: 1,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {pending}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: UI_COLORS.textMuted, lineHeight: 1 }}>
                          pending
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>

                  <Stack direction="row" alignItems="center" spacing={0.75} sx={{ flexShrink: 0 }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 700,
                        color,
                        bgcolor: `${color}14`,
                        px: 0.75,
                        py: 0.25,
                        borderRadius: '4px',
                        lineHeight: 1,
                        letterSpacing: 0.3,
                        textTransform: 'uppercase',
                      }}
                    >
                      {camp.package} · {camp.version}
                    </Box>
                    <Iconify
                      icon="eva:chevron-right-fill"
                      className="campaign-chevron"
                      sx={{
                        width: 18,
                        height: 18,
                        color: UI_COLORS.textMuted,
                        opacity: 0.4,
                        transition: 'transform 0.2s ease, opacity 0.2s ease',
                      }}
                    />
                  </Stack>
                </Stack>
              </ButtonBase>
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
