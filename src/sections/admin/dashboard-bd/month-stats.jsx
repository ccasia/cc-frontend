import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { formatMoney, formatMoneyShort } from './pipeline-utils';

// ----------------------------------------------------------------------

const SECTION_LABEL_SX = {
  fontFamily: "'Inter Display', Inter, sans-serif",
  fontSize: '0.72rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#9ca3af',
};

const SERIF = { fontFamily: '"Instrument Serif", serif', fontWeight: 400, lineHeight: 1 };

const firstNameTitled = (name) => {
  const first = (name || '').trim().split(/\s+/)[0] || '';
  return first ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : '';
};

const emptyBucket = { wonCount: 0, wonAmount: 0, lostCount: 0, lostAmount: 0, winRate: null };

function StatBlock({ figure, label, faded }) {
  return (
    <Box sx={{ flex: 1 }}>
      <Typography sx={{ ...SERIF, fontSize: { xs: '2rem', sm: '2.6rem' }, color: faded ? '#c4c4c8' : '#111827' }}>
        {figure}
      </Typography>
      <Typography sx={{ fontSize: '0.85rem', color: '#6b7280', mt: 1 }}>{label}</Typography>
    </Box>
  );
}

StatBlock.propTypes = {
  figure: PropTypes.node,
  label: PropTypes.node,
  faded: PropTypes.bool,
};

// ----------------------------------------------------------------------

export default function MonthStats({ data, currency, currentUserId }) {
  const me = data?.me?.[currency] || emptyBucket;
  const members = data?.team?.members || [];
  const totals = data?.team?.totals?.[currency] || { wonCount: 0, wonAmount: 0 };

  const winRateDisplay = me.winRate == null ? '—' : `${Math.round(me.winRate * 100)}%`;

  // Order members by won amount desc, then pin the current user to the top.
  const ranked = [...members]
    .map((m) => ({ ...m, bucket: m[currency] || emptyBucket }))
    .sort((a, b) => b.bucket.wonAmount - a.bucket.wonAmount);
  const meIndex = ranked.findIndex((m) => m.userId === currentUserId);
  if (meIndex > 0) {
    const [meMember] = ranked.splice(meIndex, 1);
    ranked.unshift(meMember);
  }

  const maxAmount = ranked.reduce((max, m) => Math.max(max, m.bucket.wonAmount), 0) || 1;

  return (
    <Card sx={{ borderRadius: 3, border: '1px solid #ececec', boxShadow: 'none', p: { xs: 2.5, md: 4 } }}>
      <Grid container spacing={4}>
        {/* LEFT — Your Month */}
        <Grid item xs={12} md={6}>
          <Typography sx={{ ...SECTION_LABEL_SX, mb: 3 }}>Your Month</Typography>
          <Stack direction="row" spacing={2} divider={<Divider orientation="vertical" flexItem />}>
            <StatBlock figure={formatMoney(me.wonAmount, currency)} label={`Won · ${me.wonCount}`} />
            <StatBlock figure={formatMoney(me.lostAmount, currency)} label={`Lost · ${me.lostCount}`} faded />
            <StatBlock figure={winRateDisplay} label="Win rate" />
          </Stack>
        </Grid>

        {/* RIGHT — Team */}
        <Grid item xs={12} md={6}>
          <Typography sx={{ ...SECTION_LABEL_SX, mb: 3 }}>
            Team · {members.length} {members.length === 1 ? 'person' : 'people'}
          </Typography>

          <Stack spacing={2}>
            {ranked.map((m) => {
              const isMe = m.userId === currentUserId;
              const pct = Math.max(4, Math.round((m.bucket.wonAmount / maxAmount) * 100));
              return (
                <Stack key={m.userId} direction="row" alignItems="center" spacing={1.5}>
                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: isMe ? '#1340FF' : '#e5e7eb', color: isMe ? '#fff' : '#6b7280' }}>
                    {(m.name || '?').charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ width: 120, flexShrink: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      <Typography
                        sx={{ fontSize: '0.85rem', fontWeight: isMe ? 700 : 500, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {firstNameTitled(m.name)}
                      </Typography>
                      {isMe && (
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#1340FF', letterSpacing: '0.05em' }}>
                          YOU
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                  <Box sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: '#f0f0f0' }}>
                    <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 3, bgcolor: isMe ? '#1340FF' : '#d1d5db' }} />
                  </Box>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', width: 64, textAlign: 'right', flexShrink: 0 }}>
                    {formatMoneyShort(m.bucket.wonAmount, currency)}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>

          <Divider sx={{ my: 2.5 }} />
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>Team won this month</Typography>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>
              {formatMoney(totals.wonAmount, currency)} · {totals.wonCount} deals
            </Typography>
          </Stack>
        </Grid>
      </Grid>
    </Card>
  );
}

MonthStats.propTypes = {
  data: PropTypes.object,
  currency: PropTypes.string,
  currentUserId: PropTypes.string,
};
