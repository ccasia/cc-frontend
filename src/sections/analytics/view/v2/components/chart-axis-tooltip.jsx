import { Paper, Stack, Typography } from '@mui/material';
import { useAxisTooltip } from '@mui/x-charts/ChartsTooltip';

export default function ChartAxisTooltip() {
  const tooltipData = useAxisTooltip();

  if (!tooltipData) return null;

  const { axisFormattedValue, axisValue, seriesItems } = tooltipData;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: 1,
        minWidth: 120,
        boxShadow: '0 4px 16px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.05)',
        border: '1px solid #E8ECEE',
        pointerEvents: 'none',
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.75 }}>
        {axisFormattedValue ?? axisValue}
      </Typography>
      {seriesItems.map((s) => (
        <Stack key={s.seriesId} direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.25 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color, display: 'inline-block', flexShrink: 0 }} />
          <Typography variant="caption" sx={{ color: '#444' }}>
            {s.label}{' '}
            <Typography component="span" variant="caption" sx={{ fontWeight: 700, color: '#111' }}>
              {s.formattedValue}
            </Typography>
          </Typography>
        </Stack>
      ))}
    </Paper>
  );
}
