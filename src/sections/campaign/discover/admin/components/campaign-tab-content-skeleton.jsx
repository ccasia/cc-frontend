import { Fragment } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

const STATS = [
  { label: 'CREATOR PITCHES', icon: 'light_bulb', color: '#203ff5', width: 32, px: 3 },
  { label: 'SHORTLISTED CREATORS', icon: 'shortlisted_creators', color: '#eb4a26', width: 24, px: 0 },
  { label: 'PENDING AGREEMENTS', icon: 'pending_agreements', color: '#f7c945', width: 28, px: 0 },
  { label: 'INVOICES', icon: 'invoices', color: '#2e6c56', width: 20, px: 3 },
];

const CREDIT_ROWS = [
  { label: 'Campaign Credits', width: 112 },
  { label: 'Credits Utilized', width: 96 },
  { label: 'Credits Pending', width: 104 },
];

const PITCH_NAMES = ['42%', '30%', '54%'];
const CREATOR_NAMES = ['36%', '50%', '28%'];
const CHIP_WIDTHS = [104, 112, 76];

const boxStyle = {
  border: '1px solid #e0e0e0',
  borderRadius: 2,
  p: 3,
  mt: -1,
  mb: 1,
  width: '100%',
};

const headerStyle = {
  borderBottom: '1px solid #e0e0e0',
  mx: -3,
  mb: 1,
  mt: -1.5,
  pb: 1.5,
  px: 1.8,
  display: 'flex',
  alignItems: 'center',
  gap: 1,
};

const headerLabelSx = { color: '#221f20', fontWeight: 600, fontSize: '0.8rem' };

const rowLabelSx = { fontSize: '16px', fontWeight: 600, color: '#636366' };

function Panel({ icon, label, withCount, children }) {
  return (
    <Box sx={boxStyle}>
      <Box sx={headerStyle}>
        {icon}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
          <Typography variant="body2" sx={headerLabelSx}>
            {label}
          </Typography>
          {withCount && <Skeleton width={24} height={14} />}
        </Stack>
      </Box>
      {children}
    </Box>
  );
}

Panel.propTypes = {
  icon: PropTypes.node,
  label: PropTypes.string,
  withCount: PropTypes.bool,
  children: PropTypes.node,
};

function PersonRows({ names, buttonWidth, buttonHeight }) {
  return (
    <Stack spacing={[1]}>
      {names.map((width, index) => (
        <Stack
          key={width}
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{
            pt: 2,
            pb: index !== names.length - 1 ? 2 : 1,
            borderBottom: index !== names.length - 1 ? '1px solid #e7e7e7' : 'none',
          }}
        >
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width={width} height={14} />
          </Box>
          <Skeleton width={buttonWidth} height={buttonHeight} />
        </Stack>
      ))}
    </Stack>
  );
}

PersonRows.propTypes = {
  names: PropTypes.arrayOf(PropTypes.string),
  buttonWidth: PropTypes.number,
  buttonHeight: PropTypes.number,
};

const imgIcon = (name) => (
  <Box component="img" src={`/assets/icons/overview/${name}.svg`} sx={{ width: 20, height: 20 }} />
);

export default function CampaignTabContentSkeleton() {
  return (
    <Grid container spacing={{ xs: 1, sm: 2 }} aria-busy="true" aria-label="Loading">
      {STATS.map((stat) => (
        <Grid key={stat.label} item xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, px: stat.px, boxShadow: 'none', bgcolor: 'transparent', mb: { xs: 1, sm: 2 } }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  width: { xs: 40, sm: 52 },
                  height: { xs: 40, sm: 52 },
                  minWidth: { xs: 40, sm: 52 },
                  display: 'flex',
                  alignSelf: 'self-start',
                  borderRadius: '50%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: stat.color,
                }}
              >
                <Box
                  component="img"
                  src={`/assets/icons/overview/${stat.icon}.svg`}
                  sx={{ width: { xs: 24, sm: 32 }, height: { xs: 24, sm: 32 } }}
                />
              </Box>
              <Stack>
                <Typography variant="subtitle2" sx={{ color: '#8E8E93' }}>
                  {stat.label}
                </Typography>
                <Skeleton width={stat.width} height={24} sx={{ my: '6px' }} />
              </Stack>
            </Stack>
          </Card>
        </Grid>
      ))}

      <Grid container spacing={{ xs: 1, sm: 2 }}>
        <Grid item xs={12} md={6}>
          <Grid container direction="column" spacing={2}>
            <Grid item>
              <Panel icon={imgIcon('lightBulb')} label="CREDITS TRACKING">
                <Stack spacing={1.5}>
                  {CREDIT_ROWS.map((row, index) => {
                    const isFirst = index === 0;
                    const isLast = index === CREDIT_ROWS.length - 1;
                    return (
                      <Fragment key={row.label}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography sx={{ ...rowLabelSx, mt: isFirst ? 1 : 0, mb: isLast ? -1 : 0 }}>
                            {row.label}
                          </Typography>
                          <Skeleton
                            width={row.width}
                            height={16}
                            sx={{ mt: isFirst ? 1 : 0, mb: isLast ? -1 : 0 }}
                          />
                        </Stack>
                        {!isLast && <Divider />}
                      </Fragment>
                    );
                  })}
                </Stack>
              </Panel>
            </Grid>
            <Grid item>
              <Panel icon={imgIcon('lightBulb')} label="CREATOR PITCHES" withCount>
                <PersonRows names={PITCH_NAMES} buttonWidth={100} buttonHeight={42} />
              </Panel>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} md={6}>
          <Grid container direction="column" spacing={2}>
            <Grid item>
              <Panel
                icon={
                  <Iconify icon="mdi:cube-outline" sx={{ color: '#203ff5', width: 18, height: 18 }} />
                }
                label="DELIVERABLES"
              >
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 2, mb: -0.4 }}>
                  {CHIP_WIDTHS.map((width) => (
                    <Skeleton key={width} width={width} height={36} />
                  ))}
                </Box>
              </Panel>
            </Grid>
            <Grid item>
              <Panel icon={imgIcon('group2People')} label="SHORTLISTED CREATORS" withCount>
                <PersonRows names={CREATOR_NAMES} buttonWidth={150} buttonHeight={38} />
              </Panel>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}

const LIST_ROWS = [
  [0.22, 0.3, 0.14],
  [0.18, 0.24, 0.1],
  [0.26, 0.34, 0.16],
  [0.2, 0.28, 0.12],
  [0.16, 0.22, 0.1],
];

export function CampaignTabListSkeleton() {
  return (
    <Stack spacing={2.5} aria-busy="true" aria-label="Loading">
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Skeleton sx={{ width: 300, maxWidth: 0.5, height: 44 }} />
        <Skeleton sx={{ width: 120, height: 34, borderRadius: 100 }} />
        <Skeleton sx={{ width: 140, height: 34, borderRadius: 100 }} />
      </Stack>

      <Stack divider={<Divider flexItem />}>
        {LIST_ROWS.map(([name, meta, chip], i) => (
          <Stack key={i} direction="row" spacing={2} alignItems="center" sx={{ py: 1.75 }}>
            <Skeleton variant="circular" sx={{ width: 40, height: 40, flexShrink: 0 }} />
            <Stack spacing={1} sx={{ flex: 1 }}>
              <Skeleton sx={{ width: name, height: 14 }} />
              <Skeleton sx={{ width: meta, height: 12 }} />
            </Stack>
            <Skeleton sx={{ width: chip, minWidth: 80, height: 31 }} />
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
