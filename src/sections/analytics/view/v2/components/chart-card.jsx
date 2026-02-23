import PropTypes from 'prop-types';

import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, Card, Stack, Tooltip, Typography } from '@mui/material';

import { AnalyticsTooltip } from 'src/sections/analytics/view/components/creators/analytics-tooltips';

const colors = {
  primary: '#000000',
  secondary: '#333333',
  border: '#E8ECEE',
  background: '#FFFFFF',
};

export default function ChartCard({ title, icon: Icon, subtitle, children, tooltipKey, height, headerRight }) {
  return (
    <Card
      sx={{
        border: `1px solid ${colors.border}`,
        borderRadius: 2,
        bgcolor: colors.background,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        overflow: 'visible',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, pt: 3, pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          {Icon && <Icon sx={{ fontSize: 18, color: '#919EAB', mr: 0.5 }} />}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1.05rem', color: colors.secondary }}>
            {title}
          </Typography>
        {subtitle && (
          <Tooltip
            title={subtitle}
            arrow
            placement="top"
            slotProps={{
              tooltip: {
                sx: {
                  bgcolor: '#1C252E',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  maxWidth: 240,
                  px: 1.5,
                  py: 1,
                  borderRadius: 1,
                },
              },
              arrow: { sx: { color: '#1C252E' } },
            }}
          >
            <HelpOutlineIcon
              sx={{
                fontSize: 16,
                color: '#919EAB',
                cursor: 'help',
                transition: 'color 0.2s',
                '&:hover': { color: colors.secondary },
              }}
            />
          </Tooltip>
        )}
        {tooltipKey && (
          <AnalyticsTooltip tooltipKey={tooltipKey}>
            <InfoOutlinedIcon sx={{ fontSize: 16, color: colors.secondary, cursor: 'help' }} />
          </AnalyticsTooltip>
        )}
        </Stack>
        {headerRight}
      </Stack>

      <Box sx={{ px: 1, pb: 1, pt: 0.5, flex: 1, minHeight: height || 'auto', display: 'flex', flexDirection: 'column' }}>
        {children}
      </Box>
    </Card>
  );
}

ChartCard.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  subtitle: PropTypes.string,
  children: PropTypes.node.isRequired,
  tooltipKey: PropTypes.string,
  height: PropTypes.number,
  headerRight: PropTypes.node,
};
