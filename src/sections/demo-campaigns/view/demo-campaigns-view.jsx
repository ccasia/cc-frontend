import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { useSettingsContext } from 'src/components/settings';

import PricingBanner from '../pricing-banner';
import DemoCampaignCard from '../demo-campaign-card';
import YourCampaignsTable from '../your-campaigns-table';

const SECTION_TITLE_SX = {
  fontSize: 24,
  fontWeight: 600,
  lineHeight: '29px',
  color: '#231F20',
};

export default function DemoCampaignsView() {
  const settings = useSettingsContext();
  const theme = useTheme();

  return (
    <Container
      maxWidth={settings.themeStretch ? false : 'xl'}
      sx={{
        px: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 5 }}
      >
        <Box>
          <Typography
            variant="h2"
            sx={{
              mb: 0.2,
              mt: { lg: 2, xs: 2, sm: 2 },
              fontFamily: theme.typography.fontSecondaryFamily,
              fontWeight: 'normal',
            }}
          >
            Check out and Create Campaigns 📢
          </Typography>

          <Typography
            variant="body1"
            sx={{ fontFamily: theme.typography.fontFamily, color: '#636366' }}
          >
            Take a look at how your campaign could look like with our demo campaign! Draft your own
            whenever you want to!
          </Typography>
        </Box>

        <Button
          disableRipple
          sx={{
            flexShrink: 0,
            minWidth: 160,
            p: '10px 16px 13px',
            bgcolor: '#1340FF',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: 16,
            lineHeight: '20px',
            textTransform: 'none',
            boxShadow: 'inset 0px -3px 0px rgba(0, 0, 0, 0.45)',
            borderRadius: '8px',
            transition: 'background-color 0.2s ease',
            '&:hover': {
              bgcolor: '#0F33CC',
              boxShadow: 'inset 0px -3px 0px rgba(0, 0, 0, 0.45)',
            },
          }}
        >
          Create Campaign
        </Button>
      </Stack>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={{ xs: 4, md: '35px' }}
        alignItems="flex-start"
        sx={{ mt: 2 }}
      >
        {/* Left: Demo Campaign */}
        <Stack spacing={2} sx={{ width: { xs: '100%', md: 288 }, flexShrink: 0 }}>
          <Typography sx={SECTION_TITLE_SX}>Demo Campaign</Typography>
          <DemoCampaignCard />
        </Stack>

        {/* Right: Your Campaigns */}
        <Stack spacing={2} sx={{ flexGrow: 1, width: '100%' }}>
          <Typography sx={SECTION_TITLE_SX}>Your Campaigns</Typography>
          <Box sx={{ width: '100%' }}>
            <YourCampaignsTable />
          </Box>
        </Stack>
      </Stack>

      <Box sx={{ mt: 5, mb: 3 }}>
        <PricingBanner />
      </Box>
    </Container>
  );
}
