import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { DEMO_CAMPAIGN_ID, demoCampaignCard } from 'src/_mock/_demo-campaign';

import Image from 'src/components/image';

// ----------------------------------------------------------------------
// Demo campaign card shown to demo clients. Mirrors the visual of
// `campaign/discover/admin/campaign-item.jsx`. Data comes from the editable
// mock file (`src/_mock/_demo-campaign.js`); clicking opens the full mock
// campaign detail view.

const DEMO_CAMPAIGN = demoCampaignCard;

export default function DemoCampaignCard() {
  const router = useRouter();

  return (
    <Card
      onClick={() => router.push(paths.dashboard.demoCampaigns.details(DEMO_CAMPAIGN_ID))}
      sx={{
        overflow: 'hidden',
        cursor: 'pointer',
        bgcolor: 'background.default',
        borderRadius: '12px',
        border: '1px solid #EBEBEB',
        boxShadow: 'none',
        pb: 1.5,
        transition: 'border-color 0.15s ease',
        '&:hover': {
          borderColor: '#1340ff',
        },
      }}
    >
      <Box sx={{ position: 'relative', height: 143, overflow: 'hidden' }}>
        <Image
          alt={DEMO_CAMPAIGN.name}
          src={DEMO_CAMPAIGN.image}
          sx={{ height: '100%', width: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
        <Box sx={{ position: 'absolute', top: 16, left: 16 }}>
          <Chip
            icon={
              <img
                src="/assets/icons/overview/GreenIndicator.svg"
                alt="Active"
                style={{ width: 8, height: 8, marginLeft: '8px' }}
              />
            }
            label={
              <Typography sx={{ fontWeight: 600, fontSize: '0.75rem' }} variant="subtitle2">
                ACTIVE
              </Typography>
            }
            sx={{
              backgroundColor: 'common.white',
              color: '#48484A',
              borderRadius: '6px',
              height: '31px',
              border: '1px solid #EBEBEB',
              borderBottom: '3px solid #E7E7E7',
              '& .MuiChip-label': { padding: '0 8px' },
              '& .MuiChip-icon': { marginRight: '-4px' },
              '&:hover': { backgroundColor: 'common.white' },
            }}
          />
        </Box>
      </Box>

      <Box sx={{ position: 'relative', px: 2, pt: 2 }}>
        <Avatar
          src={DEMO_CAMPAIGN.logo}
          alt={DEMO_CAMPAIGN.company}
          sx={{
            width: 52,
            height: 52,
            border: '2px solid #ebebeb',
            borderRadius: '50%',
            position: 'absolute',
            top: -40,
            left: 17,
            bgcolor: '#231F20',
          }}
        />

        <Box sx={{ mt: 0.5 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 650,
              mb: -0.1,
              pb: 0.2,
              mt: 0.8,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {DEMO_CAMPAIGN.name}
          </Typography>
          <Typography
            variant="body2"
            sx={{ mb: 2, color: '#8e8e93', fontSize: '0.95rem', fontWeight: 550 }}
          >
            {DEMO_CAMPAIGN.company}
          </Typography>
        </Box>

        <Stack spacing={0.5}>
          <Stack direction="row" alignItems="center" spacing={1.2}>
            <img
              src="/assets/icons/overview/IndustriesTag.svg"
              alt="Industries"
              style={{ width: 20, height: 20 }}
            />
            <Typography
              variant="body2"
              sx={{ color: '#8e8e93', fontSize: '0.875rem', fontWeight: 500 }}
            >
              {DEMO_CAMPAIGN.industry}
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1.2}>
            <img
              src="/assets/icons/overview/SmallCalendar.svg"
              alt="Calendar"
              style={{ width: 20, height: 20 }}
            />
            <Typography
              variant="caption"
              sx={{ color: '#8e8e93', fontSize: '0.875rem', fontWeight: 500 }}
            >
              {DEMO_CAMPAIGN.dateRange}
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </Card>
  );
}
