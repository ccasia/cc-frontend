import React from 'react';
import PropTypes from 'prop-types';

import { Box, Modal, Button, Avatar, Typography, IconButton } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import Iconify from 'src/components/iconify';

const ShortlistingPopup = ({ open, onClose, campaignData }) => {
  const router = useRouter();

  const handleViewCampaign = () => {
    if (campaignData?.campaignId) {
      router.push(paths.dashboard.campaign.creator.detail(campaignData.campaignId));
    }
    onClose();
  };

  const handleViewAllCampaigns = () => {
    router.push(paths.dashboard.campaign.creator.manage);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: { xs: '90%', sm: 400 },
          maxWidth: 400,
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: 24,
          p: 4,
          textAlign: 'center',
        }}
      >
        {/* Close button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'text.secondary',
          }}
        >
          <Iconify icon="mingcute:close-line" width={20} />
        </IconButton>

        {/* Purple Circle with Dancing Emoji */}
        <Box sx={{ mb: 3 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              margin: '0 auto',
              bgcolor: '#8A5AFE',
              mb: 2,
              fontSize: '2rem',
            }}
          >
            💃
          </Avatar>
        </Box>

        {/* Congratulations Text - Black */}
        <Typography
          variant="h4"
          sx={{
            mb: 1,
            fontWeight: 700,
            color: '#000000', // Black color
            fontFamily: (theme) => theme.typography.fontSecondaryFamily,
            fontSize: { xs: '2rem', sm: '2.25rem' },
          }}
        >
          Congratulations
        </Typography>

        {/* Shortlisted Text - Gray */}
        <Typography
          variant="h6"
          sx={{
            mb: 4,
            fontWeight: 400,
            color: '#666666', // Gray color
          }}
        >
          You&apos;ve been shortlisted for a campaign!
        </Typography>

        {/* Go to Campaign Button - Dark Gray */}
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleViewCampaign}
          disabled={!campaignData?.campaignId}
          sx={{
            bgcolor: '#424242', // Dark gray color
            color: 'white',
            '&:hover': {
              bgcolor: '#303030', // Darker gray on hover
            },
            fontWeight: 600,
            py: 1.5,
            px: 6,
          }}
        >
          Go to Campaign
        </Button>
      </Box>
    </Modal>
  );
};

ShortlistingPopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  campaignData: PropTypes.shape({
    campaignId: PropTypes.string,
    campaignName: PropTypes.string,
  }),
};

export default ShortlistingPopup;
