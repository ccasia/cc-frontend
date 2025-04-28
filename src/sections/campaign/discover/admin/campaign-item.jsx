import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { useState } from 'react';

import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import { Box, Card, Chip, Avatar, Typography, IconButton, Menu, MenuItem } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import Iconify from 'src/components/iconify';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { formatText } from 'src/utils/format-test';

import { useAuthContext } from 'src/auth/hooks';

import Image from 'src/components/image';

// ----------------------------------------------------------------------

// store open campaign tabs in localStorage
if (typeof window !== 'undefined') {
  if (!window.campaignTabs) {
    // load from localStorage
    try {
      const storedTabs = localStorage.getItem('campaignTabs');
      window.campaignTabs = storedTabs ? JSON.parse(storedTabs) : [];
    } catch (error) {
      console.error('Error loading campaign tabs from localStorage:', error);
      window.campaignTabs = [];
    }
  }
}

export default function CampaignItem({ campaign, onView, onEdit, onDelete, status, pitchStatus }) {
  const theme = useTheme();
  const { user } = useAuthContext();
  const router = useRouter();
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  
  // Handle menu open
  const handleClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  
  // Handle menu close
  const handleClose = (event) => {
    if (event) event.stopPropagation();
    setAnchorEl(null);
  };
  
  // Handle open in new tab
  const handleOpenInNewTab = (event) => {
    event.stopPropagation();
    
    // Check if this campaign is already in campaignTabs
    const tabExists = window.campaignTabs.some(tab => tab.id === campaign.id);
    
    if (tabExists) {
      // If tab already exists, navigate to it
      router.push(paths.dashboard.campaign.adminCampaignDetail(campaign.id));
    } else {
      // If tab doesn't exist yet, it will be added to campaignTabs without navigating
      window.campaignTabs.push({
        id: campaign.id,
        name: campaign.name || 'Campaign Details'
      });
      
      // Save to localStorage
      try {
        localStorage.setItem('campaignTabs', JSON.stringify(window.campaignTabs));
      } catch (error) {
        console.error('Error saving campaign tabs to localStorage:', error);
      }
    }
    
    // Navigate to the campaign detail page - commented out for now in case CC wants this feature
    // router.push(paths.dashboard.campaign.adminCampaignDetail(campaign.id));
    
    handleClose();
  };

  const renderImages = (
    <Box sx={{ position: 'relative', height: 180, overflow: 'hidden' }}>
      <Image
        alt={campaign?.name}
        src={campaign?.campaignBrief?.images[0]}
        sx={{
          height: '100%',
          width: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
        }}
      />
      {status && (
        <Box sx={{ position: 'absolute', top: 20, left: 20, display: 'flex', gap: 1 }}>
          <Chip
            icon={
              campaign?.status?.toLowerCase() === 'active' ? (
                <img
                  src="/assets/icons/overview/GreenIndicator.svg"
                  alt="Active"
                  style={{
                    width: 8,
                    height: 8,
                    marginLeft: '8px',
                  }}
                />
              ) : null
            }
            label={formatText(campaign?.status)}
            sx={{
              backgroundColor: theme.palette.common.white,
              color: '#48484a',
              fontWeight: 600,
              fontSize: '0.875rem',
              borderRadius: '5px',
              height: '32px',
              border: '1.2px solid #e7e7e7',
              borderBottom: '3px solid #e7e7e7',
              '& .MuiChip-label': {
                padding: '0 8px',
              },
              '& .MuiChip-icon': {
                marginRight: '-4px',
              },
              '&:hover': {
                backgroundColor: theme.palette.common.white,
              },
            }}
          />
        </Box>
      )}
    </Box>
  );

  const renderTexts = (
    <Box sx={{ position: 'relative', pt: 2, px: 3, pb: 2.5 }}>
      <Avatar
        src={campaign?.brand?.logo || campaign?.company?.logo}
        alt={campaign?.brand?.name || campaign?.company?.name}
        sx={{
          width: 56,
          height: 56,
          border: '2px solid #ebebeb',
          borderRadius: '50%',
          position: 'absolute',
          top: -40,
          left: 17,
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
          {campaign?.name}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            mb: 2,
            color: '#8e8e93',
            fontSize: '0.95rem',
            fontWeight: 550,
          }}
        >
          {campaign?.brand?.name || campaign?.company?.name}
        </Typography>
      </Box>

      <Stack spacing={0.5}>
        <Stack direction="row" alignItems="center" spacing={1.2}>
          <img
            src="/assets/icons/overview/IndustriesTag.svg"
            alt="Industries"
            style={{
              width: 20,
              height: 20,
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: '#8e8e93',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {campaign?.campaignBrief?.industries}
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.2}>
            <img
              src="/assets/icons/overview/SmallCalendar.svg"
              alt="Calendar"
              style={{
                width: 20,
                height: 20,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: '#8e8e93',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              {`${dayjs(campaign?.campaignBrief?.startDate).format('D MMM YYYY')} - ${dayjs(
                campaign?.campaignBrief?.endDate
              ).format('D MMM YYYY')}`}
            </Typography>
          </Stack>
          
          <IconButton 
            size="small" 
            onClick={handleClick}
            sx={{ 
              ml: 1,
              p: 0.5,
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
            }}
          >
            <MoreHorizIcon fontSize="small" />
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            onClick={handleClose}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            slotProps={{
              paper: {
                sx: {
                  backgroundColor: 'white',
                  backgroundImage: 'none',
                  boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e7e7e7',
                  borderBottom: '2px solid #e7e7e7',
                  borderRadius: 1,
                  mt: -1,
                  width: 200,
                  overflow: 'visible',
                },
              },
            }}
            MenuListProps={{
              sx: {
                backgroundColor: 'white',
                p: 0.5,
              },
            }}
          >
            <MenuItem 
              onClick={handleOpenInNewTab}
              sx={{
                borderRadius: 1,
                backgroundColor: 'white',
                color: 'black',
                fontWeight: 600,
                fontSize: '0.95rem',
                p: 1.5,
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              Open in New Tab
            </MenuItem>
          </Menu>
        </Stack>
      </Stack>
    </Box>
  );

  return (
    <Card
      onClick={() => {
        router.push(paths.dashboard.campaign.adminCampaignDetail(campaign?.id));
      }}
      sx={{
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s',
        bgcolor: 'background.default',
        borderRadius: '15px',
        border: '1.2px solid',
        borderColor: theme.palette.divider,
        position: 'relative',
        mb: -0.5,
        height: 345,
        '&:hover': {
          borderColor: '#1340ff',
          transform: 'translateY(-2px)',
        },
      }}
    >
      {campaign?.isKWSPCampaign && (
        <Box
          mt={4}
          sx={{
            border: '1.5px solid #0062CD',
            borderBottom: '4px solid #0062CD',
            borderRadius: 1,
            p: 0.5,
            px: 1,
            mb: 1,
            position: 'absolute',
            right: 15,
            top: '38%',
            zIndex: 10000,
            bgcolor: 'white',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: '#0062CD',
              fontWeight: 600,
            }}
          >
            Partnered with KWSP i-Saraan{' '}
          </Typography>
        </Box>
      )}
      {renderImages}
      {renderTexts}
    </Card>
  );
}

CampaignItem.propTypes = {
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
  onView: PropTypes.func,
  campaign: PropTypes.object,
  status: PropTypes.bool,
  pitchStatus: PropTypes.string,
};
