import { Paper, Stack, Typography } from '@mui/material';
import { useItemTooltip } from '@mui/x-charts/ChartsTooltip';

export default function ChartItemTooltip() {
  const tooltipData = useItemTooltip();

  if (!tooltipData) return null;

  const { color, label, formattedValue } = tooltipData;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: 1,
        minWidth: 140,
        boxShadow: '0 4px 16px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.05)',
        border: '1px solid #E8ECEE',
        pointerEvents: 'none',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} />
          <Typography variant="caption" sx={{ color: '#666' }}>{label}</Typography>
        </Stack>
        <Typography variant="caption" sx={{ fontWeight: 700 }}>{formattedValue}</Typography>
      </Stack>
    </Paper>
  );
}
