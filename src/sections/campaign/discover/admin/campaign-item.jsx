import dayjs from 'dayjs';
import { useState } from 'react';
import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Box, Card, Chip, Menu, Avatar, MenuItem, Typography, IconButton } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { formatText } from 'src/utils/format-test';

import { useAuthContext } from 'src/auth/hooks';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

import { CampaignLog } from '../../manage/list/CampaignLog';
import ActivateCampaignDialog from './activate-campaign-dialog';
import InitialActivateCampaignDialog from './initial-activate-campaign-dialog';

// ----------------------------------------------------------------------

export default function CampaignItem({ campaign, onView, onEdit, onDelete, status, pitchStatus }) {
  console.log('CampaignItem rendered:', {
    campaignId: campaign?.id,
    campaignStatus: campaign?.status,
    campaignName: campaign?.name,
    hasCampaignAdmin: !!campaign?.campaignAdmin,
    campaignAdminLength: campaign?.campaignAdmin?.length,
  });

  const theme = useTheme();
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();

  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [campaignLogIsOpen, setCampaignLogIsOpen] = useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [initialActivateDialogOpen, setInitialActivateDialogOpen] = useState(false);

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

    const campaignName = campaign?.name || 'Campaign Details';

    // Check if this campaign is already in campaignTabs
    const tabExists = window.campaignTabs.some((tab) => tab.id === campaign.id);

    if (tabExists) {
      // If tab already exists, update the name to ensure it's current
      window.campaignTabs = window.campaignTabs.map((tab) => {
        if (tab.id === campaign.id) {
          return { ...tab, name: campaignName };
        }
        return tab;
      });

      // Save updated tabs to localStorage
      try {
        localStorage.setItem('campaignTabs', JSON.stringify(window.campaignTabs));
      } catch (error) {
        console.error('Error saving campaign tabs to localStorage:', error);
      }
    } else {
      // If tab doesn't exist yet, add it to campaignTabs
      window.campaignTabs.push({
        id: campaign.id,
        name: campaignName,
      });

      // Update status tracking for tabs
      if (typeof window !== 'undefined') {
        if (!window.campaignTabsStatus) {
          window.campaignTabsStatus = {};
        }

        window.campaignTabsStatus[campaign.id] = {
          status: campaign.status,
        };
      }

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

  const onCloseCampaignLog = (event) => {
    if (event) event.stopPropagation();
    setCampaignLogIsOpen(false);
  };

  const handleOpenActivateDialog = (event) => {
    event.stopPropagation();
    setActivateDialogOpen(true);
  };

  const handleCloseActivateDialog = () => {
    setActivateDialogOpen(false);
  };

  const handleCloseInitialActivateDialog = () => {
    setInitialActivateDialogOpen(false);
  };

  // Check user role and permissions
  const isCSL = user?.admin?.role?.name === 'CSL';
  const isSuperAdmin = user?.admin?.mode === 'god';
  const isAdmin = user?.role === 'admin';
  const isCSM =
    user?.admin?.role?.name === 'CSM' || user?.admin?.role?.name === 'Customer Success Manager';

  // For debugging - log the actual user structure
  console.log('User role structure:', {
    userRole: user?.role,
    adminRole: user?.admin?.role?.name,
    adminMode: user?.admin?.mode,
    isAdmin,
    isCSM,
  });

  // Debug user details
  console.log('User details:', {
    userRole: user?.role,
    adminMode: user?.admin?.mode,
    adminRole: user?.admin?.role?.name,
    isCSL,
    isSuperAdmin,
    isAdmin,
    isCSM,
  });

  // Check if user can perform initial activation (CSL or Superadmin)
  const canInitialActivate = isCSL || isSuperAdmin;

  // Check if user can complete activation (CSM/Admin assigned to campaign)
  const isUserAssignedToCampaign = campaign?.campaignAdmin?.some((admin) => {
    const adminIdMatch = admin.adminId === user?.id;
    const adminUserIdMatch = admin.admin?.userId === user?.id;
    const adminUserMatch = admin.admin?.user?.id === user?.id;

    console.log('Checking admin assignment:', {
      adminId: admin.adminId,
      adminUserId: admin.admin?.userId,
      adminUser: admin.admin?.user?.id,
      userId: user?.id,
      adminIdMatch,
      adminUserIdMatch,
      adminUserMatch,
    });

    return adminIdMatch || adminUserIdMatch || adminUserMatch;
  });
  const canCompleteActivation =
    (isCSM || isAdmin) &&
    campaign?.status === 'PENDING_ADMIN_ACTIVATION' &&
    isUserAssignedToCampaign;

  // Debug campaign admin assignment
  console.log('Campaign admin check:', {
    campaignId: campaign?.id,
    campaignStatus: campaign?.status,
    userId: user?.id,
    campaignAdmins: campaign?.campaignAdmin?.map((admin) => ({
      adminId: admin.adminId,
      adminUserId: admin.admin?.userId,
      adminUser: admin.admin?.user?.id,
      role: admin.admin?.role?.name,
      fullAdmin: admin.admin,
    })),
    isUserAssigned: isUserAssignedToCampaign,
    canCompleteActivation,
  });

  const isPendingReview =
    campaign?.status === 'PENDING_CSM_REVIEW' ||
    campaign?.status === 'SCHEDULED' ||
    campaign?.status === 'PENDING_ADMIN_ACTIVATION';

  // Determine if the Activate Campaign button should be disabled
  const isDisabled =
    (isCSL || isSuperAdmin) &&
    campaign?.status === 'PENDING_ADMIN_ACTIVATION' &&
    !isUserAssignedToCampaign;

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
            label={formatText(
              campaign?.status === 'PENDING_CSM_REVIEW' ||
                campaign?.status === 'SCHEDULED' ||
                campaign?.status === 'PENDING_ADMIN_ACTIVATION'
                ? 'PENDING'
                : campaign?.status
            )}
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
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
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

            {/* Activate Campaign - Different behavior based on user role and campaign status */}
            {(() => {
              // Show button for superadmin/CSL to assign admin (initial activation)
              const showForInitialActivation =
                canInitialActivate &&
                (campaign?.status === 'PENDING_CSM_REVIEW' || campaign?.status === 'SCHEDULED');

              // Show button for assigned admin/CSM to complete activation
              const showForCompleteActivation =
                canCompleteActivation && campaign?.status === 'PENDING_ADMIN_ACTIVATION';

              // Show disabled button for superadmin/CSL after admin assignment (waiting for admin to complete)
              const showDisabledForSuperadmin =
                (isCSL || isSuperAdmin) &&
                campaign?.status === 'PENDING_ADMIN_ACTIVATION' &&
                !isUserAssignedToCampaign;

              // TEMPORARY: Always show button for admin/CSM when status is PENDING_ADMIN_ACTIVATION
              const showTemporaryForAdmin =
                (isAdmin || isCSM) && campaign?.status === 'PENDING_ADMIN_ACTIVATION';

              const shouldShow =
                showForInitialActivation ||
                showForCompleteActivation ||
                showDisabledForSuperadmin ||
                showTemporaryForAdmin;

              console.log('Menu condition check:', {
                campaignStatus: campaign?.status,
                canInitialActivate,
                canCompleteActivation,
                showForInitialActivation,
                showForCompleteActivation,
                showDisabledForSuperadmin,
                showTemporaryForAdmin,
                shouldShow,
                isUserAssignedToCampaign,
                userRole: user?.role,
                adminMode: user?.admin?.mode,
                adminRole: user?.admin?.role?.name,
              });

              return shouldShow;
            })() && (
              <MenuItem
                onClick={(event) => {
                  event.stopPropagation();

                  // Don't do anything if disabled
                  if (isDisabled) {
                    return;
                  }

                  alert(
                    `Activate Campaign clicked! User: ${user?.name}, Role: ${
                      user?.role
                    }, Admin Mode: ${user?.admin?.mode}`
                  );

                  console.log('Activate Campaign clicked:', {
                    userRole: user?.role,
                    adminMode: user?.admin?.mode,
                    adminRole: user?.admin?.role?.name,
                    campaignStatus: campaign?.status,
                    canInitialActivate,
                    canCompleteActivation,
                    isCSL,
                    isSuperAdmin,
                    isCSM,
                  });

                  // For superadmin on pending campaigns: use initial activation (admin assignment only)
                  if (
                    canInitialActivate &&
                    (campaign?.status === 'PENDING_CSM_REVIEW' || campaign?.status === 'SCHEDULED')
                  ) {
                    console.log('Opening InitialActivateDialog (admin assignment only)');
                    setInitialActivateDialogOpen(true);
                  } else if (campaign?.status === 'PENDING_ADMIN_ACTIVATION') {
                    // For admin/CSM on PENDING_ADMIN_ACTIVATION: use full activation dialog
                    console.log('Opening ActivateDialog (full setup)');
                    setActivateDialogOpen(true);
                  }
                  handleClose();
                }}
                disabled={isDisabled}
                sx={{
                  borderRadius: 1,
                  backgroundColor: 'white',
                  color: isDisabled ? '#999' : 'black',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  p: 1.5,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  '&:hover': {
                    backgroundColor: isDisabled ? 'white' : '#f5f5f5',
                  },
                  '&.Mui-disabled': {
                    backgroundColor: 'white',
                    color: '#999',
                  },
                }}
              >
                {isDisabled ? 'Waiting for Admin Activation' : 'Activate Campaign'}
              </MenuItem>
            )}
            <MenuItem
              onClick={(event) => {
                event.stopPropagation();
                setCampaignLogIsOpen(true);
                handleClose();
              }}
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
              View Log
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
      {isPendingReview && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            bgcolor: 'rgba(19, 64, 255, 0.1)',
            p: 1,
            display: 'flex',
            justifyContent: 'center',
          }}
        />
      )}

      {campaign?.campaignRequirement?.country && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 1,
            border: 0.5,
            borderRadius: 20,
            display: 'inline-flex',
            borderColor: 'gray',
            boxShadow: '0px 0px 5px 0px #5c5c5c',
          }}
        >
          <Iconify
            icon={`emojione:flag-for-${campaign?.campaignRequirement?.country?.toLowerCase()}`}
            width={40}
          />
        </Box>
      )}

      {false && (
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
      <Box onClick={(e) => e.stopPropagation()}>
        <CampaignLog open={campaignLogIsOpen} campaign={campaign} onClose={onCloseCampaignLog} />
        <ActivateCampaignDialog
          open={activateDialogOpen}
          onClose={handleCloseActivateDialog}
          campaignId={campaign?.id}
          onSuccess={() => {
            // Trigger a revalidation of the campaigns data
            if (window.swrMutate) {
              window.swrMutate();
            }
          }}
        />
        <InitialActivateCampaignDialog
          open={initialActivateDialogOpen}
          onClose={handleCloseInitialActivateDialog}
          campaignId={campaign?.id}
        />
      </Box>
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
