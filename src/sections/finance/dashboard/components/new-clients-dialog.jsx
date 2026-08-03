import PropTypes from 'prop-types';
import { format, formatDistanceToNow } from 'date-fns';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

import { useGetNewPackageClients } from 'src/api/finance';

import Iconify from 'src/components/iconify';

import { CARD_BORDER, formatAmount } from '../utils';

// ----------------------------------------------------------------------

const STATUS_COLORS = {
  ACTIVE: '#22C55E',
  EXPIRED: '#FF5630',
};

export default function NewClientsDialog({ open, onClose, count, startDate, endDate, periodLabel }) {
  const { clients, isLoading, error, mutate } = useGetNewPackageClients({
    startDate,
    endDate,
    enabled: open,
  });

  const displayedCount = isLoading || error ? count : clients.length;

  return (
    <Dialog
      fullWidth
      maxWidth="xl"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          maxWidth: 1360,
          height: { xs: '82vh', sm: '88vh' },
          borderRadius: 2.5,
          maxHeight: '88vh',
          bgcolor: 'common.white',
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2} sx={{ px: { xs: 2, sm: 4 }, py: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 1.5,
            bgcolor: '#F0FDF4',
            color: '#16A34A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Iconify icon="mdi:account-plus-outline" width={25} />
        </Box>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
            New Clients
          </Typography>
          <Typography variant="body2" sx={{ color: '#637381', mt: 0.25 }}>
            {displayedCount} linked to packages in this period
          </Typography>
        </Box>

        <IconButton aria-label="Close new clients" onClick={onClose}>
          <Iconify icon="eva:close-fill" width={24} />
        </IconButton>
      </Stack>

      <Divider />

      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: { xs: 2, sm: 4 } }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {!isLoading && error && (
          <Stack alignItems="center" spacing={2} sx={{ py: 8, textAlign: 'center' }}>
            <Typography color="error">Failed to load new clients.</Typography>
            <Button variant="outlined" color="inherit" onClick={() => mutate()}>
              Retry
            </Button>
          </Stack>
        )}

        {!isLoading && !error && clients.length === 0 && (
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={2}
            sx={{ height: 1, minHeight: 360, py: 6, textAlign: 'center' }}
          >
            <Box
              sx={{
                position: 'relative',
                width: 152,
                height: 132,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  width: 128,
                  height: 128,
                  borderRadius: '50%',
                  bgcolor: '#F0FDF4',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  right: 3,
                  top: 17,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  bgcolor: '#16A34A',
                  opacity: 0.16,
                },
              }}
            >
              <Iconify
                icon="solar:users-group-rounded-bold-duotone"
                width={76}
                sx={{ position: 'relative', color: '#16A34A' }}
              />
              <Iconify
                icon="mdi:account-search-outline"
                width={34}
                sx={{
                  position: 'absolute',
                  right: 22,
                  bottom: 10,
                  color: '#16A34A',
                  bgcolor: 'common.white',
                  borderRadius: '50%',
                  p: 0.5,
                  boxShadow: '0 4px 12px rgba(33, 43, 54, 0.12)',
                }}
              />
            </Box>

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                No new client activity
              </Typography>
              <Typography variant="body2" sx={{ color: '#637381', mt: 0.75 }}>
                No clients joined a package{' '}
                <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {periodLabel}
                </Box>
                .
              </Typography>
            </Box>
          </Stack>
        )}

        {!isLoading && !error && clients.length > 0 && (
          <Stack spacing={1.25}>
            {clients.map((client) => (
              <Card
                key={client.companyId}
                variant="outlined"
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  borderColor: CARD_BORDER,
                  borderRadius: 1.5,
                  boxShadow: 'none',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                  <Avatar
                    variant="rounded"
                    src={client.logo || undefined}
                    sx={{ width: 44, height: 44, bgcolor: '#F0FDF4', color: '#16A34A', borderRadius: 1.5 }}
                  >
                    <Iconify icon="mdi:office-building-outline" width={22} />
                  </Avatar>

                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                      {client.companyName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#637381' }}>
                      Linked {formatDistanceToNow(new Date(client.linkedAt), { addSuffix: true })}
                    </Typography>
                  </Box>

                  <Typography variant="body2" sx={{ color: '#637381', flexShrink: 0 }}>
                    {client.packages.length} {client.packages.length === 1 ? 'package' : 'packages'}
                  </Typography>
                </Stack>

                <Stack spacing={1}>
                  {client.packages.map((pkg) => {
                    const statusColor = STATUS_COLORS[pkg.status] || '#637381';

                    return (
                      <Stack
                        key={pkg.subscriptionId}
                        direction={{ xs: 'column', sm: 'row' }}
                        alignItems={{ xs: 'stretch', sm: 'center' }}
                        justifyContent="space-between"
                        spacing={1.5}
                        sx={{ bgcolor: '#F7F8FA', borderRadius: 1.25, px: 1.5, py: 1.25 }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }} noWrap>
                              {pkg.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                px: 1,
                                py: 0.25,
                                color: statusColor,
                                border: `1px solid ${statusColor}`,
                                borderBottom: `3px solid ${statusColor}`,
                                borderRadius: 0.8,
                                bgcolor: 'common.white',
                                fontWeight: 700,
                                lineHeight: 1.3,
                              }}
                            >
                              {pkg.status}
                            </Typography>
                          </Stack>
                          <Typography variant="body2" sx={{ color: '#637381', mt: 0.5 }}>
                            {pkg.credits} credits · expires {format(new Date(pkg.expiredAt), 'd MMM yyyy')}
                          </Typography>
                        </Box>

                        <Typography variant="subtitle1" sx={{ fontWeight: 700, flexShrink: 0 }}>
                          {pkg.currency} {formatAmount(pkg.price)}
                        </Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </Box>
    </Dialog>
  );
}

NewClientsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  count: PropTypes.number.isRequired,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  periodLabel: PropTypes.string.isRequired,
};
