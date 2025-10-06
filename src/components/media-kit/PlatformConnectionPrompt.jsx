import PropTypes from 'prop-types';

import { Box, Stack, alpha, Button, Typography } from '@mui/material';
import { m } from 'framer-motion';

import { useMediaKitResponsive } from 'src/hooks/use-media-kit-responsive';

import Iconify from 'src/components/iconify';

/**
 * Reusable Platform Connection Prompt Component
 * Used for Instagram, TikTok, and other social media platform connection prompts
 */
const PlatformConnectionPrompt = ({
  platform = 'Instagram',
  icon,
  onConnect,
  description,
  buttonColor = '#E1306C',
  buttonHoverColor = '#C13584',
  containerStyle = {},
}) => {
  const { theme } = useMediaKitResponsive();

  const defaultDescriptions = {
    Instagram: 'Connect your Instagram to showcase your top content and analytics.',
    TikTok: 'Connect your TikTok account to showcase your top content and analytics in your media kit.',
  };

  const defaultIcons = {
    Instagram: 'skill-icons:instagram',
    TikTok: 'logos:tiktok-icon',
  };

  const defaultColors = {
    Instagram: { primary: '#E1306C', hover: '#C13584' },
    TikTok: { primary: '#000', hover: '#3D3D3D' },
  };

  const platformIcon = icon || defaultIcons[platform] || defaultIcons.Instagram;
  const platformDescription = description || defaultDescriptions[platform] || defaultDescriptions.Instagram;
  const colors = defaultColors[platform] || defaultColors.Instagram;
  const primaryColor = buttonColor !== '#E1306C' ? buttonColor : colors.primary;
  const hoverColor = buttonHoverColor !== '#C13584' ? buttonHoverColor : colors.hover;

  return (
    <Box
      component={m.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      sx={{
        height: { xs: 450, sm: 500, md: 550 },
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        borderRadius: 2,
        mb: 4,
        bgcolor: alpha(theme.palette.background.neutral, 0.4),
        border: `1px dashed ${alpha(theme.palette.divider, 0.8)}`,
        boxShadow: '0px 0px 15px rgba(0, 0, 0, 0.05)',
        ...containerStyle,
      }}
    >
      <Stack spacing={3} alignItems="center" sx={{ maxWidth: 320, textAlign: 'center', p: 3 }}>
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: 2,
            bgcolor: '#FFFFFF',
            boxShadow: '0px 0px 15px 0px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Iconify 
            icon={platformIcon} 
            width={42} 
            sx={platform === 'Instagram' ? { color: '#E1306C' } : {}} 
          />
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Connect {platform}
        </Typography>

        <Typography sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
          {platformDescription}
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={onConnect}
          sx={{
            borderRadius: 1.5,
            px: 3,
            py: 1.5,
            mt: 2,
            backgroundColor: primaryColor,
            color: '#FFFFFF',
            fontWeight: 600,
            boxShadow: `0 4px 12px ${alpha(primaryColor, 0.3)}`,
            '&:hover': {
              backgroundColor: hoverColor,
              boxShadow: `0 6px 15px ${alpha(primaryColor, 0.4)}`,
            },
          }}
          startIcon={<Iconify icon="mingcute:link-line" width={22} />}
        >
          Connect {platform}
        </Button>
      </Stack>
    </Box>
  );
};

PlatformConnectionPrompt.propTypes = {
  platform: PropTypes.string,
  icon: PropTypes.string,
  onConnect: PropTypes.func.isRequired,
  description: PropTypes.string,
  buttonColor: PropTypes.string,
  buttonHoverColor: PropTypes.string,
  containerStyle: PropTypes.object,
};

export default PlatformConnectionPrompt;