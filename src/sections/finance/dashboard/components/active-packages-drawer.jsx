import { format } from 'date-fns';
import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import LinearProgress from '@mui/material/LinearProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import Iconify from 'src/components/iconify';

import { CARD_BORDER, formatAmount, utilisationColor } from '../utils';

// ----------------------------------------------------------------------

const MARKET_LABELS = { MYR: 'Malaysia', SGD: 'Singapore' };

function PackageCard({ pkg }) {
  const pct = pkg.totalCredits > 0 ? Math.round((pkg.creditsUsed / pkg.totalCredits) * 100) : null;
  const left = Math.max(pkg.totalCredits - pkg.creditsUsed, 0);
  const color = utilisationColor(pct);

  return (
    <Card
      sx={{
        p: 2.5,
        pl: 3,
        border: `1px solid ${CARD_BORDER}`,
        borderRadius: 2,
        bgcolor: 'common.white',
        boxShadow: 'none',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          bgcolor: pct === null ? CARD_BORDER : color,
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
        <Avatar
          variant="rounded"
          src={pkg.logo || undefined}
          sx={{ width: 40, height: 40, bgcolor: '#F1F3F5', color: '#637381', borderRadius: 1.5 }}
        >
          <Iconify icon="mdi:office-building-outline" width={20} />
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
            {pkg.companyName}
          </Typography>
          <Typography variant="body2" sx={{ color: '#637381' }}>
            Valid until {format(new Date(pkg.expiredAt), 'd MMM yyyy')}
          </Typography>
        </Box>
      </Stack>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ bgcolor: '#F7F8FA', borderRadius: 1.5, px: 1.5, py: 1, mb: 2 }}
      >
        <Typography
          variant="caption"
          sx={{ color: '#637381', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}
        >
          Package amount
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {pkg.currency} {formatAmount(pkg.packagePrice)}
        </Typography>
      </Stack>

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography
          variant="caption"
          sx={{ color: '#637381', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}
        >
          UGC Credits
        </Typography>
        <Typography variant="subtitle2" sx={{ color: pct === null ? '#919EAB' : color, fontWeight: 700 }}>
          {pct === null ? '—' : `${pct}% used`}
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
          {pkg.creditsUsed} of {pkg.totalCredits} utilised
        </Typography>
        <Typography variant="body2" sx={{ color: '#637381' }}>
          {left} left
        </Typography>
      </Stack>
    </Card>
  );
}

PackageCard.propTypes = {
  pkg: PropTypes.object.isRequired,
};

// ----------------------------------------------------------------------

export default function ActivePackagesDrawer({ open, onClose, packages }) {
  const [market, setMarket] = useState('MYR');
  const [tab, setTab] = useState('all');

  const marketPackages = useMemo(
    () => packages.filter((pkg) => pkg.currency === market),
    [packages, market]
  );

  const tabOptions = useMemo(() => {
    const counts = new Map();
    marketPackages.forEach((pkg) => {
      counts.set(pkg.packageLabel, (counts.get(pkg.packageLabel) || 0) + 1);
    });
    return [...counts.entries()].map(([label, count]) => ({ label, count }));
  }, [marketPackages]);

  const activeTab = tab !== 'all' && tabOptions.some((option) => option.label === tab) ? tab : 'all';

  const visible = useMemo(
    () => (activeTab === 'all' ? marketPackages : marketPackages.filter((pkg) => pkg.packageLabel === activeTab)),
    [marketPackages, activeTab]
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: 1, sm: 480 }, bgcolor: '#F7F8FA' } }}
    >
      <Box sx={{ p: 3, pb: 0 }}>
        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1.5,
              bgcolor: '#FFF7E0',
              color: '#B76E00',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Iconify icon="mdi:package-variant-closed" width={24} />
          </Box>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
              Active packages
            </Typography>
            <Typography variant="body2" sx={{ color: '#637381' }}>
              {marketPackages.length} active · {MARKET_LABELS[market]}
            </Typography>
          </Box>

          <IconButton onClick={onClose} size="small">
            <Iconify icon="eva:close-fill" width={20} />
          </IconButton>
        </Stack>

        <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1.5} sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ color: '#637381' }}>
            Market
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={market}
            onChange={(event, value) => value && setMarket(value)}
            sx={{
              bgcolor: 'common.white',
              borderRadius: 1.5,
              p: 0.25,
              '& .MuiToggleButton-root': {
                border: 0,
                borderRadius: '10px !important',
                px: 2,
                py: 0.5,
                fontWeight: 600,
                color: '#637381',
                '&.Mui-selected': { bgcolor: '#FFF7E0', color: '#B76E00' },
              },
            }}
          >
            <ToggleButton value="MYR">MYR</ToggleButton>
            <ToggleButton value="SGD">SGD</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Tabs
          value={activeTab}
          onChange={(event, value) => setTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mt: 1 }}
        >
          <Tab value="all" label={`All (${marketPackages.length})`} />
          {tabOptions.map((option) => (
            <Tab key={option.label} value={option.label} label={`${option.label} (${option.count})`} />
          ))}
        </Tabs>

        <Divider />
      </Box>

      <Box sx={{ p: 3, pt: 2.5, overflowY: 'auto' }}>
        {visible.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Iconify icon="mdi:package-variant" width={40} sx={{ color: '#C4CDD5', mb: 1 }} />
            <Typography variant="subtitle1" sx={{ color: '#637381' }}>
              No active packages in {MARKET_LABELS[market]}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {visible.map((pkg) => (
              <PackageCard key={pkg.subscriptionId} pkg={pkg} />
            ))}
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}

ActivePackagesDrawer.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  packages: PropTypes.array.isRequired,
};
