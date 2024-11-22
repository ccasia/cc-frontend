import React, { useMemo, useState } from 'react';

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import { Box, Stack, Button, Container, Typography, CircularProgress } from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import useGetCampaigns from 'src/hooks/use-get-campaigns';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import EmptyContent from 'src/components/empty-content/empty-content';

import CampaignLists from '../campaign-list';

const defaultFilters = {
  status: '',
  brands: [],
};

const CampaignView = () => {
  const settings = useSettingsContext();
  const { campaigns, isLoading } = useGetCampaigns();
  const [filter, setFilter] = useState('active');
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const router = useRouter();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNewCampaign = () => {
    router.push('/dashboard/campaign/create');
    handleClose();
  };

  const activeCampaigns = useMemo(
    () => campaigns?.filter((campaign) => campaign?.status === 'ACTIVE') || [],
    [campaigns]
  );
  const completedCampaigns = useMemo(
    () => campaigns?.filter((campaign) => campaign?.status === 'COMPLETED') || [],
    [campaigns]
  );

  const activeCount = activeCampaigns.length;
  const completedCount = completedCampaigns.length;

  const dataFiltered = useMemo(() => {
    if (filter === 'active') {
      return activeCampaigns;
    }
    return completedCampaigns;
  }, [filter, activeCampaigns, completedCampaigns]);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
      <Box>
        <Typography variant="h2" sx={{ mb: 4, fontFamily: theme.typography.fontSecondaryFamily }}>
          Manage Campaigns ✨
        </Typography>
      </Box>

      <Box sx={{ mb: 2.5 }}>
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            position: 'relative',
            width: '100%',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '1px',
              bgcolor: 'divider',
            },
          }}
        >
          <Stack
            direction="row"
            spacing={0.5}
            sx={{
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            <Button
              disableRipple
              size="large"
              onClick={() => setFilter('active')}
              sx={{
                px: 0.5,
                py: 0.5,
                pb: 1,
                minWidth: 'fit-content',
                color: filter === 'active' ? '#221f20' : '#8e8e93',
                position: 'relative',
                fontSize: '1.05rem',
                fontWeight: 650,
                transition: 'transform 0.1s ease-in-out',
                '&:focus': {
                  outline: 'none',
                  bgcolor: 'transparent',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                  bgcolor: 'transparent',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  width: filter === 'active' ? '100%' : '0%',
                  bgcolor: '#1340ff',
                  transition: 'all 0.3s ease-in-out',
                  transform: 'scaleX(1)',
                  transformOrigin: 'left',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                  '&::after': {
                    width: '100%',
                    opacity: filter === 'active' ? 1 : 0.5,
                  },
                },
              }}
            >
              Active ({activeCount})
            </Button>
            <Button
              disableRipple
              size="large"
              onClick={() => setFilter('completed')}
              sx={{
                px: 1,
                py: 0.5,
                pb: 1,
                ml: 2,
                minWidth: 'fit-content',
                color: filter === 'completed' ? '#221f20' : '#8e8e93',
                position: 'relative',
                fontSize: '1.05rem',
                fontWeight: 650,
                transition: 'transform 0.1s ease-in-out',
                '&:focus': {
                  outline: 'none',
                  bgcolor: 'transparent',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                  bgcolor: 'transparent',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  width: filter === 'completed' ? '100%' : '0%',
                  bgcolor: '#1340ff',
                  transition: 'all 0.3s ease-in-out',
                  transform: 'scaleX(1)',
                  transformOrigin: 'left',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                  '&::after': {
                    width: '100%',
                    opacity: filter === 'completed' ? 1 : 0.5,
                  },
                },
              }}
            >
              Completed ({completedCount})
            </Button>
          </Stack>
          <Button
            onClick={handleClick}
            endIcon={<Iconify icon="eva:chevron-down-fill" width={20} height={20} />}
            sx={{
              bgcolor: '#203ff5',
              color: 'white',
              borderBottom: '3px solid #102387',
              borderRadius: '8px',
              px: 2.5,
              py: 1,
              position: 'absolute',
              right: 0,
              top: -3,
              minWidth: '150px',
              fontSize: '0.9rem',
              '&:hover': {
                bgcolor: '#203ff5',
                opacity: 0.9,
              },
            }}
          >
            New Campaign
          </Button>
        </Stack>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            width: 200,
            bgcolor: 'white',
            border: '1px solid #e7e7e7',
            borderBottom: '2px solid #e7e7e7',
            borderRadius: 1,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1.5,
              borderRadius: 1,
              color: '#000000',
              fontWeight: 600,
              fontSize: '0.95rem',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            },
          },
        }}
      >
        <MenuItem onClick={handleNewCampaign}>
          <Iconify icon="ph:sparkle-fill" width={20} height={20} sx={{ mr: 2 }} />
          New Campaign
        </MenuItem>
        {/* <MenuItem onClick={handleClose}>
          <Iconify icon="mdi:note-text" width={20} height={20} sx={{ mr: 2 }} />
          Drafts
        </MenuItem> */}
      </Menu>

      {isLoading && (
        <Box sx={{ position: 'relative', top: 200, textAlign: 'center' }}>
          <CircularProgress
            thickness={7}
            size={25}
            sx={{
              color: theme.palette.common.black,
              strokeLinecap: 'round',
            }}
          />
        </Box>
      )}

      {!isLoading &&
        (dataFiltered?.length > 0 ? (
          <CampaignLists campaigns={dataFiltered} />
        ) : (
          <EmptyContent
            title={`No ${filter === 'active' ? 'active' : 'completed'} campaigns available`}
          />
        ))}
    </Container>
  );
};

export default CampaignView;
