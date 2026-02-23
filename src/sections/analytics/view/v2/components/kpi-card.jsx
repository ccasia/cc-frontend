import PropTypes from 'prop-types';

import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Box, Card, Stack, Typography } from '@mui/material';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';

import { AnalyticsTooltip } from 'src/sections/analytics/view/components/creators/analytics-tooltips';

const colors = {
  success: '#10B981',
  error: '#EF4444',
  secondary: '#666666',
  border: '#E8ECEE',
  background: '#FFFFFF',
};

export default function KpiCard({ title, value, subtitle, trend, trendLabel, color, tooltipKey, sparklineData, sparklineColor, headerExtra }) {
  const trendColor = trend >= 0 ? colors.success : colors.error;
  const trendBg = trend >= 0 ? '#ECFDF5' : '#FEF2F2';
  const TrendIcon = trend >= 0 ? ArrowDropUpIcon : ArrowDropDownIcon;

  const content = (
    <Card
      sx={{
        p: 3,
        border: `1px solid ${colors.border}`,
        borderRadius: 2,
        bgcolor: colors.background,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        height: '100%',
      }}
    >
      {/* Title row */}
      <Typography variant="body2" sx={{ color: colors.secondary, mb: 1, fontSize: '0.8rem' }}>
        {title}
      </Typography>

      {/* Value + sparkline row */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            color: color || 'text.primary',
            lineHeight: 1.2,
            fontSize: { xs: '1.75rem', sm: '2rem' },
          }}
        >
          {value}
        </Typography>

        {sparklineData && sparklineData.length > 1 && (
          <Box sx={{ width: 80, height: 36, flexShrink: 0 }}>
            <SparkLineChart
              data={sparklineData}
              height={36}
              curve="natural"
              area
              showTooltip
              showHighlight
              color={sparklineColor || '#1340FF'}
              sx={{
                '& .MuiAreaElement-root': { opacity: 0.15 },
              }}
            />
          </Box>
        )}
      </Stack>

      {/* Trend row */}
      {trend !== undefined && trend !== null && (
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.75 }}>
          <Stack
            direction="row"
            alignItems="center"
            sx={{ bgcolor: trendBg, borderRadius: 0.75, px: 0.5, py: 0.25 }}
          >
            <TrendIcon sx={{ fontSize: 18, color: trendColor, ml: -0.25 }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: trendColor, fontSize: '0.7rem', mr: 0.25 }}>
              {trend > 0 ? '+' : ''}{trend}%
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ color: '#919EAB', fontSize: '0.7rem' }}>
            {trendLabel || 'vs last month'}
          </Typography>
        </Stack>
      )}

      {/* Extra content (e.g. star rating) */}
      {headerExtra}

      {/* Subtitle */}
      {subtitle && (
        <Typography variant="caption" sx={{ color: colors.secondary, mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
          {subtitle}
        </Typography>
      )}
    </Card>
  );

  if (tooltipKey) {
    return (
      <AnalyticsTooltip tooltipKey={tooltipKey}>
        <Box sx={{ height: '100%' }}>{content}</Box>
      </AnalyticsTooltip>
    );
  }

  return content;
}

KpiCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtitle: PropTypes.string,
  trend: PropTypes.number,
  color: PropTypes.string,
  tooltipKey: PropTypes.string,
  trendLabel: PropTypes.string,
  sparklineData: PropTypes.arrayOf(PropTypes.number),
  sparklineColor: PropTypes.string,
  headerExtra: PropTypes.node,
};
