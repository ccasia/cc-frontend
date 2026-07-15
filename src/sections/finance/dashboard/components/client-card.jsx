import PropTypes from 'prop-types';
import { format, formatDistanceToNow, differenceInCalendarDays } from 'date-fns';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import Iconify from 'src/components/iconify';

import { CARD_BORDER, formatAmount, maxUtilisation, utilisationColor } from '../utils';

// ----------------------------------------------------------------------

function ProgressRow({ label, pct, usedLabel, totalLabel }) {
  const color = utilisationColor(pct);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography
          variant="caption"
          sx={{ color: '#637381', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}
        >
          {label}
        </Typography>
        <Typography variant="subtitle2" sx={{ color: pct === null ? '#919EAB' : color, fontWeight: 700 }}>
          {pct === null ? '—' : `${pct}%`}
        </Typography>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={pct === null ? 0 : Math.min(pct, 100)}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: '#F1F3F5',
          '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: color },
        }}
      />

      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
        <Typography variant="body2" sx={{ color: 'text.primary' }}>
          {usedLabel}
        </Typography>
        <Typography variant="body2" sx={{ color: '#637381' }}>
          {totalLabel}
        </Typography>
      </Stack>
    </Box>
  );
}

ProgressRow.propTypes = {
  label: PropTypes.string.isRequired,
  pct: PropTypes.number,
  usedLabel: PropTypes.string.isRequired,
  totalLabel: PropTypes.string.isRequired,
};

// ----------------------------------------------------------------------

export default function ClientCard({ client, onViewBreakdown }) {
  const expiresAt = new Date(client.expiresAt);
  const isExpired = expiresAt < new Date();
  const expiringSoon = !isExpired && differenceInCalendarDays(expiresAt, new Date()) < 14;

  const maxPct = maxUtilisation(client);
  const usageColor = utilisationColor(maxPct);

  let accentColor = CARD_BORDER;
  if (isExpired || maxPct >= 90) accentColor = '#FF5630';
  else if (maxPct >= 75) accentColor = '#FFAB00';

  const chipAlert = isExpired || expiringSoon;

  return (
    <Card
      sx={{
        p: 2.5,
        pl: 3,
        height: '100%',
        border: `1px solid ${CARD_BORDER}`,
        borderRadius: 2,
        bgcolor: 'common.white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          bgcolor: accentColor,
        },
      }}
    >
      <Stack direction="row" alignItems="flex-start" spacing={1.5}>
        <Avatar
          variant="rounded"
          src={client.logo || undefined}
          sx={{ width: 44, height: 44, bgcolor: '#F1F3F5', color: '#637381', borderRadius: 1.5 }}
        >
          <Iconify icon="mdi:office-building-outline" width={22} />
        </Avatar>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
            {client.companyName}
          </Typography>
          <Typography variant="body2" sx={{ color: '#637381' }} noWrap>
            {client.packageLabel} · expires {format(expiresAt, 'd MMM yyyy')} · {client.currency}
          </Typography>
        </Box>

        <Typography
          component="span"
          sx={{
            px: 1.25,
            py: 0.4,
            borderRadius: 5,
            fontSize: '0.75rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            color: chipAlert ? '#B71D18' : '#637381',
            bgcolor: chipAlert ? '#FFF0EE' : '#F7F8FA',
            border: `1px solid ${chipAlert ? '#F7C6C0' : CARD_BORDER}`,
          }}
        >
          {formatDistanceToNow(expiresAt, { addSuffix: true })}
        </Typography>
      </Stack>

      <Stack spacing={2} sx={{ mt: 2.5 }}>
        <ProgressRow
          label="UGC Credits"
          pct={client.ugc.pct}
          usedLabel={`${client.ugc.used} used`}
          totalLabel={`of ${client.ugc.total}`}
        />
        <ProgressRow
          label="Creator Budget"
          pct={client.budget.pct}
          usedLabel={`${client.currency} ${formatAmount(client.budget.used)} used`}
          totalLabel={`of ${client.currency} ${formatAmount(client.budget.cap)}`}
        />
      </Stack>

      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 'auto', pt: 2.5 }}>
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          onClick={() => onViewBreakdown(client)}
          endIcon={<Iconify icon="eva:diagonal-arrow-right-up-fill" width={16} />}
          sx={{
            color: 'text.primary',
            border: '1px solid #E7E7E7',
            borderRadius: 0.8,
            boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
            bgcolor: 'common.white',
            fontWeight: 600,
            minHeight: 38,
            px: 1.75,
            pt: 0.5,
            pb: 1,
            lineHeight: 1.25,
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s ease, border-color 0.15s ease',
            '& .MuiButton-endIcon': {
              display: 'flex',
              alignItems: 'center',
              ml: 1,
              mr: 0,
            },
            '& .MuiButton-endIcon svg': { display: 'block' },
            '&:hover': {
              color: 'text.primary',
              border: `1px solid ${usageColor}`,
              boxShadow: `0px -3px 0px 0px ${usageColor} inset`,
              bgcolor: 'common.white',
            },
          }}
        >
          View campaign breakdown
        </Button>
      </Stack>
    </Card>
  );
}

ClientCard.propTypes = {
  client: PropTypes.object.isRequired,
  onViewBreakdown: PropTypes.func.isRequired,
};
