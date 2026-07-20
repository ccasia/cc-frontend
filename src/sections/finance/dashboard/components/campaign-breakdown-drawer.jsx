import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Drawer from '@mui/material/Drawer';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { useGetClientCampaignBreakdown } from 'src/api/finance';

import Iconify from 'src/components/iconify';

import { CARD_BORDER, formatAmount } from '../utils';

// ----------------------------------------------------------------------

const prettifyStatus = (status) =>
  (status || '')
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^\w/, (char) => char.toUpperCase());

function CampaignRow({ campaign, currency }) {
  return (
    <Card
      sx={{
        p: 2,
        border: `1px solid ${CARD_BORDER}`,
        borderRadius: 2,
        bgcolor: 'common.white',
        boxShadow: 'none',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
          {campaign.name}
        </Typography>
        <Typography
          component="span"
          sx={{
            px: 1,
            py: 0.25,
            borderRadius: 5,
            fontSize: '0.7rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            color: '#637381',
            bgcolor: '#F7F8FA',
            border: `1px solid ${CARD_BORDER}`,
          }}
        >
          {prettifyStatus(campaign.status)}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={3} sx={{ mt: 1.5 }}>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: '#919EAB', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}
          >
            UGC Credits
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {campaign.creditsUtilized} of {campaign.campaignCredits} utilised
          </Typography>
        </Box>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: '#919EAB', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}
          >
            Invoiced
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {currency} {formatAmount(campaign.invoicedAmount)}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}

CampaignRow.propTypes = {
  campaign: PropTypes.object.isRequired,
  currency: PropTypes.string,
};

// ----------------------------------------------------------------------

export default function CampaignBreakdownDrawer({ client, onClose }) {
  const { campaigns, isLoading } = useGetClientCampaignBreakdown(client?.companyId);

  return (
    <Drawer
      anchor="right"
      open={!!client}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: 1, sm: 480 }, bgcolor: '#F7F8FA' } }}
    >
      {client && (
        <>
          <Box sx={{ p: 3, pb: 2 }}>
            <Stack direction="row" alignItems="flex-start" spacing={1.5}>
              <Avatar
                variant="rounded"
                src={client.logo || undefined}
                sx={{ width: 44, height: 44, bgcolor: '#F1F3F5', color: '#637381', borderRadius: 1.5 }}
              >
                <Iconify icon="mdi:office-building-outline" width={22} />
              </Avatar>

              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }} noWrap>
                  {client.companyName}
                </Typography>
                <Typography variant="body2" sx={{ color: '#637381' }}>
                  Campaign breakdown · {client.packageLabel}
                </Typography>
              </Box>

              <IconButton onClick={onClose} size="small">
                <Iconify icon="eva:close-fill" width={20} />
              </IconButton>
            </Stack>

            <Stack
              direction="row"
              spacing={3}
              sx={{
                mt: 2,
                p: 1.5,
                bgcolor: 'common.white',
                border: `1px solid ${CARD_BORDER}`,
                borderRadius: 1.5,
              }}
            >
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: '#919EAB', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}
                >
                  UGC Credits
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {client.ugc.used} used of {client.ugc.total}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: '#919EAB', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}
                >
                  Creator Budget
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {client.currency} {formatAmount(client.budget.used)} of {client.currency}{' '}
                  {formatAmount(client.budget.cap)}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ px: 3, pb: 3, overflowY: 'auto' }}>
            {isLoading && (
              <Stack spacing={1.5}>
                {[...Array(3)].map((_, index) => (
                  <Skeleton key={index} variant="rounded" height={104} sx={{ borderRadius: 2 }} />
                ))}
              </Stack>
            )}

            {!isLoading && campaigns.length === 0 && (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Iconify icon="mdi:bullhorn-outline" width={40} sx={{ color: '#C4CDD5', mb: 1 }} />
                <Typography variant="subtitle1" sx={{ color: '#637381' }}>
                  No campaigns yet
                </Typography>
              </Box>
            )}

            {!isLoading && campaigns.length > 0 && (
              <Stack spacing={1.5}>
                {campaigns.map((campaign) => (
                  <CampaignRow key={campaign.campaignId} campaign={campaign} currency={client.currency} />
                ))}
              </Stack>
            )}
          </Box>
        </>
      )}
    </Drawer>
  );
}

CampaignBreakdownDrawer.propTypes = {
  client: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};
