import PropTypes from 'prop-types';
import { alpha } from '@mui/material/styles';

import { Box, Stack, Skeleton, ButtonBase, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

import { useClientCampaignOverview } from './api';
import { tabularNums } from './parts';
import { BLUE, percent, timeline, statusLabel } from './stages';

// Light blue for credits on agreements not yet signed.
const PENDING_BLUE = alpha(BLUE, 0.3);

export default function ClientCampaignHeader({ campaignId, onBack, tabs }) {
  const { data } = useClientCampaignOverview(campaignId);
  const campaign = data?.campaign;
  const credits = data?.credits;
  const time = timeline(campaign);

  const total = credits?.total || 0;
  const used = credits?.used || 0;
  const contractPending = data?.shortlist?.contractPending || 0;
  // Pending is drawn inside "used": creditsUtilized already counts agreements that are sent but unsigned.
  const signed = Math.max(0, used - contractPending);

  return (
    <Box sx={{ pt: 2.5, mb: 3.5 }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        sx={{ fontSize: 13, color: 'text.secondary' }}
      >
        <ButtonBase
          onClick={onBack}
          sx={{ gap: 0.5, fontSize: 13, color: 'text.secondary', borderRadius: 0.5 }}
        >
          <Iconify icon="eva:arrow-ios-back-fill" width={14} />
          Campaigns
        </ButtonBase>
        <span>/</span>
        <Typography noWrap sx={{ fontSize: 13, color: 'text.primary', minWidth: 0 }}>
          {campaign?.name}
        </Typography>
      </Stack>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        gap={2.5}
        sx={{ mt: 2, mb: 2.5 }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              flex: 'none',
              borderRadius: 1.5,
              bgcolor: 'grey.200',
              backgroundImage: campaign?.keyArt ? `url(${campaign.keyArt})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1.25} flexWrap="wrap">
              <Typography
                component="h1"
                sx={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.2 }}
              >
                {campaign?.name ?? <Skeleton width={240} />}
              </Typography>
              {campaign?.status && (
                <Box
                  component="span"
                  sx={{
                    px: 1.25,
                    py: 0.25,
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 500,
                    bgcolor: alpha(BLUE, 0.08),
                    color: BLUE,
                  }}
                >
                  {statusLabel(campaign.status)}
                </Box>
              )}
            </Stack>
            {campaign?.objective && (
              <Typography sx={{ mt: 0.5, fontSize: 13, color: 'text.secondary' }}>
                Objective ·{' '}
                <Box component="span" sx={{ color: 'text.primary', fontWeight: 500 }}>
                  {campaign.objective}
                </Box>
              </Typography>
            )}
          </Box>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'auto minmax(120px, 1fr) auto', sm: 'auto 220px auto' },
            columnGap: 1.5,
            rowGap: 1,
            alignItems: 'center',
            fontSize: 12,
            width: { xs: 1, md: 'auto' },
            ...tabularNums,
          }}
        >
          <Box sx={{ color: 'text.secondary' }}>Timeline</Box>
          <MeterBar parts={[{ value: time?.progress || 0, color: 'text.primary' }]} />
          <Box>{time ? `Day ${time.day} of ${time.totalDays}` : '—'}</Box>

          <Box sx={{ color: 'text.secondary' }}>UGC credits</Box>
          <MeterBar
            label={`${used} of ${total} credits used, ${contractPending} pending signature`}
            parts={[
              { value: percent(signed, total), color: BLUE },
              { value: percent(Math.min(contractPending, used), total), color: PENDING_BLUE },
            ]}
          />
          <Box>
            {used}/{total} used
          </Box>
        </Box>
      </Stack>

      {tabs}
    </Box>
  );
}

ClientCampaignHeader.propTypes = {
  campaignId: PropTypes.string,
  onBack: PropTypes.func.isRequired,
  tabs: PropTypes.node,
};

function MeterBar({ parts, label }) {
  return (
    <Stack
      direction="row"
      role={label ? 'img' : undefined}
      aria-label={label}
      sx={{ height: 4, borderRadius: 2, overflow: 'hidden', bgcolor: 'grey.200' }}
    >
      {parts.map((part, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <Box key={i} sx={{ width: `${part.value}%`, bgcolor: part.color }} />
      ))}
    </Stack>
  );
}

MeterBar.propTypes = {
  parts: PropTypes.array.isRequired,
  label: PropTypes.string,
};
