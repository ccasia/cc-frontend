import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

const PRICING_URL = 'https://cultcreativeasia.com/for-brands#pricing';

export default function PricingBanner() {
  const theme = useTheme();

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems="center"
      spacing={{ xs: 3, sm: '56px' }}
      sx={{
        width: '100%',
        p: '16px 24px',
        borderRadius: '20px',
        background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), #48484A',
        boxShadow: '0px 4px 4px rgba(142, 142, 147, 0.25)',
      }}
    >
      <Stack spacing={1} sx={{ flexGrow: 1 }}>
        <Typography
          sx={{
            fontFamily: theme.typography.fontSecondaryFamily,
            fontWeight: 400,
            fontSize: 32,
            lineHeight: '36px',
            color: '#FFFFFF',
          }}
        >
          Pricing that fits your brand
        </Typography>
        <Typography
          sx={{ fontWeight: 400, fontSize: 16, lineHeight: '20px', color: '#E7E7E7' }}
        >
          Explore the full breakdown of what&apos;s included in each plan and pick the one that
          matches your goals. Then book a call with our team to get started.
        </Typography>
      </Stack>

      <Button
        href={PRICING_URL}
        target="_blank"
        rel="noopener noreferrer"
        disableRipple
        sx={{
          flexShrink: 0,
          p: '10px 16px 13px',
          bgcolor: '#FFFFFF',
          color: '#1340FF',
          fontWeight: 600,
          fontSize: 16,
          lineHeight: '20px',
          textTransform: 'none',
          border: '1px solid #E8E8E8',
          boxShadow: 'inset 0px -3px 0px #E7E7E7',
          borderRadius: '8px',
          transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            bgcolor: '#F5F5F5',
            borderColor: '#E0E0E0',
            boxShadow: 'inset 0px -3px 0px #DEDEDE',
          },
        }}
      >
        View Pricing
      </Button>
    </Stack>
  );
}
