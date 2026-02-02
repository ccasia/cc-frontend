import PropTypes from 'prop-types';

import {
  Box,
  Modal,
  Button,
  Avatar,
  useTheme,
  Typography,
  IconButton,
} from '@mui/material';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const MediaKitPopup = ({ open, onClose, userId }) => {
  const theme = useTheme();
  
  const handleConnect = () => {
    // Redirect to the social tab in the creator profile where they can connect their media kit
    window.location.href = '/dashboard/user/profile/socials';
    onClose();
  };

  const handleClose = () => {
    // When closing the popup, set a flag that will prevent it from showing again
    // during the current session only
    sessionStorage.setItem('mediaKitPopupShown', 'true');
    onClose();
  };

  return (
    <Modal 
      open={open} 
      onClose={handleClose}
      aria-labelledby="media-kit-popup-title"
      aria-describedby="media-kit-popup-description"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 496 },
          maxWidth: 496,
          bgcolor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.1)',
          p: { xs: 3, sm: 4 },
        }}
      >
        <IconButton
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
          }}
          onClick={handleClose}
        >
          <Iconify icon="eva:close-fill" />
        </IconButton>

        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Avatar
            alt="Media Kit"
            sx={{
              width: 100,
              height: 100,
              margin: '0 auto 24px',
              background: 'linear-gradient(0deg, #8A5AFE, #8A5AFE)',
              boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
              fontSize: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            👀
          </Avatar>

          <Typography 
            id="media-kit-popup-title" 
            sx={{ 
              mb: 1,
              fontFamily: 'Instrument Serif',
              fontWeight: 400,
              fontSize: '36px',
              lineHeight: '40px',
              letterSpacing: '0%',
              textAlign: 'center',
              color: '#231F20',
              maxWidth: '440px',
              mx: 'auto'
            }}
          >
            Hold up! Don&apos;t leave us guessing
          </Typography>
          
          <Typography 
            id="media-kit-popup-description" 
            variant="body1"
            sx={{ 
              mb: 3,
              mt: 1,
              px: { xs: 1, sm: 3 },
              fontFamily: theme.typography.fontFamily,
              color: '#636366',
              textAlign: 'center',
              maxWidth: '440px',
              mx: 'auto',
              lineHeight: 1.5
            }}
          >
            Before you shoot your shot, link your socials to your Media Kit so we can vet your stats and see if your profile is a match!
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', px: { xs: 0, sm: 0 }, width: '100%' }}>
          <Button
            onClick={handleConnect}
            sx={{
              width: { xs: '100%', sm: 480 },
              height: 44,
              borderRadius: '8px',
              padding: '10px 16px 13px 16px',
              backgroundColor: '#3A3A3C',
              boxShadow: '0px -3px 0px 0px #00000073 inset',
              gap: '6px',
              fontFamily: theme.typography.fontFamily,
              fontWeight: 500,
              fontSize: '16px',
              textTransform: 'none',
              color: '#FFFFFF',
              '&:hover': {
                backgroundColor: '#2A2A2C',
              },
            }}
          >
            Connect My Media Kit
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

MediaKitPopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  userId: PropTypes.string.isRequired,
};

export default MediaKitPopup;
