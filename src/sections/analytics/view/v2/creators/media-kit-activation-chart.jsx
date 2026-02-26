import { useMemo } from 'react';

import { PieChart } from '@mui/x-charts/PieChart';
import DevicesIcon from '@mui/icons-material/Devices';
import { Box, Chip, Stack, SvgIcon, useTheme, Typography, useMediaQuery, CircularProgress } from '@mui/material';

import useGetMediaKitActivation from 'src/hooks/use-get-media-kit-activation';

import { CHART_COLORS } from '../chart-config';
import ChartCard from '../components/chart-card';
import { useDateFilter, useFilterLabel } from '../date-filter-context';

function TikTokIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M16.6 5.82s.51.5 0 0A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6c0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64c0 3.33 2.76 5.7 5.69 5.7c3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48" />
    </SvgIcon>
  );
}

function InstagramIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3" />
    </SvgIcon>
  );
}

const IG_COLOR = '#E1306C';

const PLATFORM_COLORS = {
  TikTok: { connected: '#000000', notConnected: '#E0E0E0' },
  Instagram: { connected: IG_COLOR, notConnected: '#FCE4EC' },
};

const PLATFORM_ICONS = {
  TikTok: <TikTokIcon sx={{ fontSize: 28, color: '#000' }} />,
  Instagram: <InstagramIcon sx={{ fontSize: 28, color: IG_COLOR }} />,
};

export default function MediaKitActivationChart() {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const donutSize = isSmall ? 140 : 180;
  const innerR = isSmall ? 30 : 40;
  const outerR = isSmall ? 55 : 70;

  const { startDate, endDate } = useDateFilter();
  const chipLabel = useFilterLabel();

  const hookOptions = useMemo(() => {
    if (startDate && endDate) return { startDate, endDate };
    return {};
  }, [startDate, endDate]);

  const { platforms, uniqueConnected, isLoading } = useGetMediaKitActivation(hookOptions);

  const { totalConnected, totalUsers, overallRate } = useMemo(() => {
    const tc = uniqueConnected;
    const tu = platforms.length > 0 ? platforms[0].total : 0;
    const rate = tu > 0 ? Math.round((tc / tu) * 1000) / 10 : 0;
    return { totalConnected: tc, totalUsers: tu, overallRate: rate };
  }, [platforms, uniqueConnected]);

  const headerRight = (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Chip label={chipLabel} size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: 11, height: 22, color: '#919EAB', borderColor: '#E8ECEE' }} />
      {!isLoading && (
        <>
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1 }}>
            {overallRate}%
          </Typography>
          <Typography variant="caption" sx={{ color: '#919EAB', fontWeight: 500 }}>
            {totalConnected.toLocaleString()} / {totalUsers.toLocaleString()}
          </Typography>
        </>
      )}
    </Stack>
  );

  return (
    <ChartCard title="Media Kit Activation" icon={DevicesIcon} subtitle="Users who connected media kit divided by total active users" headerRight={headerRight}>
      {isLoading ? (
        <Stack alignItems="center" justifyContent="center" sx={{ flex: 1, minHeight: 200 }}>
          <CircularProgress size={32} />
        </Stack>
      ) : (
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="center" alignItems="center" spacing={4} sx={{ flex: 1, mt: 1 }}>
          {platforms.map((d) => {
            const colors = PLATFORM_COLORS[d.platform] || { connected: CHART_COLORS.primary, notConnected: '#eee' };
            const notConnected = d.total - d.connected;

            // Ensure the connected slice is always visible (min 5% of visual)
            const MIN_VISUAL = 0.05;
            const realRatio = d.total > 0 ? d.connected / d.total : 0;
            const visualConnected = d.connected > 0 && realRatio < MIN_VISUAL ? d.total * MIN_VISUAL : d.connected;
            const visualNotConnected = d.total > 0 ? d.total - visualConnected : 0;

            return (
              <Box key={d.platform} sx={{ textAlign: 'center' }}>
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <PieChart
                    series={[{
                      data: [
                        { id: 'connected', value: visualConnected, label: 'Connected', color: colors.connected, realValue: d.connected },
                        { id: 'not-connected', value: visualNotConnected, label: 'Not Connected', color: colors.notConnected, realValue: notConnected },
                      ],
                      innerRadius: innerR,
                      outerRadius: outerR,
                      paddingAngle: 2,
                      cornerRadius: 3,
                      valueFormatter: (item) => `${item.realValue.toLocaleString()} users`,
                    }]}
                    width={donutSize}
                    height={donutSize}
                    margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    hideLegend
                  />
                  {/* Center icon */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    {PLATFORM_ICONS[d.platform]}
                  </Box>
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 0.5, color: colors.connected }}>
                  {d.platform}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: colors.connected }}>
                  {d.rate}%
                </Typography>
                <Typography variant="caption" sx={{ color: '#919EAB' }}>
                  {d.connected.toLocaleString()} / {d.total.toLocaleString()}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      )}
    </ChartCard>
  );
}
