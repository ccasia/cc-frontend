import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import React, { useState } from 'react';

import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import {
  Box,
  Card,
  Chip,
  Menu,
  Dialog,
  Avatar,
  Divider,
  Tooltip,
  MenuItem,
  Typography,
  IconButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import { formatText } from 'src/utils/format-test';

import { countries } from 'src/assets/data';
import { useAuthContext } from 'src/auth/hooks';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';

import CreateCampaignFormV2 from 'src/sections/campaign/create/form-v2';

import { CampaignLog } from '../../manage/list/CampaignLog';
import InitialActivateCampaignDialog from './initial-activate-campaign-dialog';
import { alpha } from '@mui/system';

// ----------------------------------------------------------------------

export default function CampaignItem({
  index,
  campaign,
  onView,
  onEdit,
  onDelete,
  status,
  pitchStatus,
  showAdmins = false,
}) {
  const theme = useTheme();
  const smDown = useResponsive('down', 'sm');
  const { user } = useAuthContext();

  const isCopy = useBoolean();

  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [campaignLogIsOpen, setCampaignLogIsOpen] = useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [initialActivateDialogOpen, setInitialActivateDialogOpen] = useState(false);
  const currentIndex = localStorage.getItem('lastOpenedIndex');

  // Handle menu open
  const handleClick = (event) => {
    event.preventDefault();
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
      // If tab exists, close/remove it
      window.campaignTabs = window.campaignTabs.filter((tab) => tab.id !== campaign.id);

      // Remove from status tracking
      if (window.campaignTabsStatus && window.campaignTabsStatus[campaign.id]) {
        delete window.campaignTabsStatus[campaign.id];
      }

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

  // Check if user can perform initial activation (CSL or Superadmin)
  const canInitialActivate = isCSL || isSuperAdmin;

  // Check if user can complete activation (CSM/Admin assigned to campaign)
  const isUserAssignedToCampaign = campaign?.campaignAdmin?.some((admin) => {
    const adminIdMatch = admin.adminId === user?.id;
    const adminUserIdMatch = admin.admin?.userId === user?.id;
    const adminUserMatch = admin.admin?.user?.id === user?.id;

    return adminIdMatch || adminUserIdMatch || adminUserMatch;
  });

  const canCompleteActivation =
    (isCSM || isAdmin) &&
    campaign?.status === 'PENDING_ADMIN_ACTIVATION' &&
    isUserAssignedToCampaign;

  // Determine if the Activate Campaign button should be disabled
  const isDisabled =
    (isCSL || isSuperAdmin) &&
    campaign?.status === 'PENDING_ADMIN_ACTIVATION' &&
    !isUserAssignedToCampaign;

  // Superadmin/CSL see the item disabled while waiting on the assigned admin; admin/CSM always see it on PENDING_ADMIN_ACTIVATION (temporary).
  const showActivate =
    (canInitialActivate && campaign?.status === 'PENDING_CSM_REVIEW') ||
    (canCompleteActivation && campaign?.status === 'PENDING_ADMIN_ACTIVATION') ||
    isDisabled ||
    ((isAdmin || isCSM) && campaign?.status === 'PENDING_ADMIN_ACTIVATION');

  const menuItemSx = {
    gap: 1.5,
    minHeight: 40,
    px: 1.25,
    borderRadius: '10px',
    fontSize: 14,
    fontWeight: 500,
    color: '#1d1d1f',
    '&:hover, &.Mui-focusVisible': { bgcolor: '#f4f4f5' },
  };

  const menuIconSx = { flexShrink: 0, color: '#3a3a3c' };

  const handleCopyLink = async () => {
    const url = `${import.meta.env.VITE_BASE_URL}/campaign?campaign=${campaign.id}`;

    try {
      await navigator.clipboard.writeText(url);
      isCopy.onTrue();
    } catch (error) {
      toast.error('Failed to copy link');
    } finally {
      await new Promise((resolve) => setTimeout(() => resolve(), 3000));
      isCopy.onFalse();
    }
  };

  const renderImages = (
    <Box sx={{ position: 'relative', height: 180, overflow: 'hidden' }}>
      {campaign?.campaignBrief?.images?.[0] ? (
        <Image
          alt={campaign?.name}
          src={campaign?.campaignBrief?.images?.[0]}
          sx={{
            height: '100%',
            width: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
      ) : (
        <Box
          sx={{
            height: '100%',
            width: '100%',
            display: 'flex',
            rotate: '45deg',
            scale: 3,
          }}
        >
          {Array.from({ length: 60 }).map((_, i) => (
            <Box
              sx={{
                bgcolor: i % 2 === 0 ? 'white' : theme.palette.grey[100],
                height: 1,
                width: 8,
              }}
            />
          ))}
        </Box>
      )}
      {status && (
        <Box
          sx={{
            position: 'absolute',
            top: 20,
            left: 20,
            display: 'flex',
            gap: 1,
          }}
        >
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
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ fontWeight: 800 }} variant="subtitle2">
                  {formatText(
                    campaign?.status === 'PENDING_CSM_REVIEW' ||
                      campaign?.status === 'PENDING_ADMIN_ACTIVATION'
                      ? 'PENDING'
                      : campaign?.status
                  )}
                </Typography>
                {(campaign?.campaignRequirement?.countries?.length > 0 ||
                  campaign?.campaignRequirement?.country) && (
                  <>
                    <Divider
                      orientation="vertical"
                      flexItem
                      sx={{ bgcolor: 'black', height: 14 }}
                      variant="middle"
                    />
                    {campaign?.campaignRequirement?.countries?.length > 0 ? (
                      <Tooltip
                        title={
                          <Stack direction="column" spacing={0.5}>
                            {campaign.campaignRequirement.countries.map((countryName, idx) => (
                              <Stack key={idx} direction="row" spacing={1} alignItems="center">
                                <Iconify
                                  icon={`emojione:flag-for-${countryName?.toLowerCase()}`}
                                  width={15}
                                />
                                <Typography variant="caption">{countryName}</Typography>
                              </Stack>
                            ))}
                          </Stack>
                        }
                        followCursor
                        slotProps={{
                          tooltip: {
                            sx: {
                              borderRadius: 0.4,
                            },
                          },
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          {campaign.campaignRequirement.countries.map((countryName, idx) => {
                            const countryCode =
                              countries.find((item) =>
                                item.label.toLowerCase().includes(countryName?.toLowerCase())
                              )?.code || countryName.substring(0, 2).toUpperCase();

                            return (
                              <React.Fragment key={idx}>
                                {idx > 0 && (
                                  <Divider
                                    orientation="vertical"
                                    flexItem
                                    sx={{ bgcolor: 'black', height: 14 }}
                                    variant="middle"
                                  />
                                )}
                                <Typography sx={{ fontWeight: 800 }} variant="subtitle2">
                                  {countryCode}
                                </Typography>
                              </React.Fragment>
                            );
                          })}
                        </Stack>
                      </Tooltip>
                    ) : (
                      campaign?.campaignRequirement?.country && (
                        <Tooltip
                          title={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Iconify
                                icon={`emojione:flag-for-${campaign?.campaignRequirement?.country?.toLowerCase()}`}
                                width={15}
                              />
                              <Typography variant="caption">
                                {
                                  countries.find((item) =>
                                    item.label
                                      .toLowerCase()
                                      .includes(
                                        campaign?.campaignRequirement?.country?.toLowerCase()
                                      )
                                  ).label
                                }
                              </Typography>
                            </Stack>
                          }
                          followCursor
                          slotProps={{
                            tooltip: {
                              sx: {
                                borderRadius: 0.4,
                              },
                            },
                          }}
                        >
                          <Typography sx={{ fontWeight: 800 }} variant="subtitle2">
                            {
                              countries.find((item) =>
                                item.label
                                  .toLowerCase()
                                  .includes(campaign?.campaignRequirement?.country?.toLowerCase())
                              ).code
                            }
                          </Typography>
                        </Tooltip>
                      )
                    )}
                  </>
                )}
              </Stack>
            }
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
    <Box sx={{ position: 'relative', px: 2, pt: 2 }}>
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

        {/* Calendar row - with menu button when admins are NOT shown */}
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

          {/* Show menu button when admins are NOT shown */}
          {(!showAdmins || !campaign?.campaignAdmin?.length) && (
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
          )}
        </Stack>

        {/* Show managing admins - only in "All" tab - with menu button */}
        {showAdmins &&
          campaign?.campaignAdmin?.length > 0 &&
          (() => {
            // Helper to check if an admin is a Client (not CSM staff)
            const isClientAdmin = (ca) => {
              const roleName = ca.admin?.role?.name;
              const userRole = ca.admin?.user?.role;
              // Client admins have role.name === 'Client' OR user.role === 'client'
              return roleName === 'Client' || userRole === 'client';
            };

            // Helper to check if an admin is a CSM
            const isCSMAdmin = (ca) => {
              const roleName = ca.admin?.role?.name;
              return roleName === 'CSM' || roleName === 'Customer Success Manager';
            };

            // First, filter to only CSM admins (exclude Client admins entirely)
            const csmAdmins = campaign.campaignAdmin.filter((ca) => {
              if (!ca.admin?.user) return false;
              return isCSMAdmin(ca) && !isClientAdmin(ca);
            });

            // If no CSM admins, fall back to any non-client admin
            const nonClientAdmins = campaign.campaignAdmin.filter((ca) => {
              if (!ca.admin?.user) return false;
              return !isClientAdmin(ca);
            });

            const admins = csmAdmins.length > 0 ? csmAdmins : nonClientAdmins;
            if (admins.length === 0) return null;

            const mainAdmin = admins[0];
            const additionalCount = admins.length - 1;

            return (
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar
                    src={mainAdmin?.admin?.user?.photoURL}
                    alt={mainAdmin?.admin?.user?.name}
                    sx={{ width: 20, height: 20, fontSize: '0.625rem' }}
                  >
                    {mainAdmin?.admin?.user?.name?.charAt(0)}
                  </Avatar>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#8e8e93',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  >
                    {mainAdmin?.admin?.user?.name}
                    {additionalCount > 0 && ` +${additionalCount}`}
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
              </Stack>
            );
          })()}

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          onClick={handleClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          MenuListProps={{ sx: { p: 0 } }}
          slotProps={{
            paper: {
              sx: {
                width: 200,
                mt: -1,
                p: 0.75,
                borderRadius: '16px',
                bgcolor: '#fff',
                border: '1px solid',
                borderColor: alpha('#000', 0.06),
                boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 16px 40px -12px rgba(0,0,0,0.16)',
              },
            },
          }}
        >
          <MenuItem
            component={RouterLink}
            href={paths.dashboard.campaign.adminCampaignDetail(campaign.id)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleClose()}
            sx={menuItemSx}
          >
            <Iconify icon="solar:arrow-right-up-linear" width={18} sx={menuIconSx} />
            Open in new tab
          </MenuItem>

          <MenuItem
            onClick={(event) => {
              event.stopPropagation();
              handleCopyLink();
            }}
            sx={menuItemSx}
          >
            {isCopy.value ? (
              <Iconify
                icon="solar:check-circle-linear"
                width={18}
                sx={{ ...menuIconSx, color: 'success.main' }}
              />
            ) : (
              <Iconify icon="solar:link-minimalistic-2-linear" width={18} sx={menuIconSx} />
            )}
            {isCopy.value ? 'Link copied' : 'Copy link'}
          </MenuItem>

          <MenuItem
            onClick={(event) => {
              event.stopPropagation();
              setCampaignLogIsOpen(true);
              handleClose();
            }}
            sx={menuItemSx}
          >
            <Iconify icon="solar:document-text-linear" width={18} sx={menuIconSx} />
            View log
          </MenuItem>

          {showActivate && (
            <Divider sx={{ mx: -0.75, my: 0.75, borderColor: alpha('#000', 0.06) }} />
          )}

          {showActivate && (
            <MenuItem
              onClick={(event) => {
                event.stopPropagation();

                if (isDisabled) {
                  return;
                }

                alert(
                  `Activate Campaign clicked! User: ${user?.name}, Role: ${
                    user?.role
                  }, Admin Mode: ${user?.admin?.mode}`
                );

                // Superadmin on a pending campaign only assigns an admin; the assigned admin runs the full setup.
                if (canInitialActivate && campaign?.status === 'PENDING_CSM_REVIEW') {
                  console.log('Opening InitialActivateDialog (admin assignment only)');
                  setInitialActivateDialogOpen(true);
                } else if (campaign?.status === 'PENDING_ADMIN_ACTIVATION') {
                  console.log('Opening ActivateDialog (full setup)');
                  setActivateDialogOpen(true);
                }
                handleClose();
              }}
              disabled={isDisabled}
              sx={{
                ...menuItemSx,
                '&.Mui-disabled': { opacity: 1, color: '#8e8e93' },
              }}
            >
              <Iconify icon="solar:bolt-linear" width={18} sx={menuIconSx} />
              Activate campaign
              {isDisabled && (
                <Box
                  component="span"
                  sx={{
                    ml: 'auto',
                    px: 0.75,
                    height: 22,
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: '6px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#1340ff',
                    bgcolor: alpha('#1340ff', 0.08),
                    border: '1px solid',
                    borderColor: alpha('#1340ff', 0.2),
                  }}
                >
                  Awaiting admin
                </Box>
              )}
            </MenuItem>
          )}
        </Menu>
      </Stack>
    </Box>
  );

  return (
    <Card
      component={RouterLink}
      href={paths.dashboard.campaign.adminCampaignDetail(campaign?.id)}
      onClick={() => {
        localStorage.setItem('lastOpenedIndex', String(index));
        localStorage.removeItem('lastScrollPosition');
      }}
      sx={{
        overflow: 'hidden',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'all 0.3s',
        bgcolor: 'background.default',
        borderRadius: '15px',
        border: '1.2px solid',
        borderColor: Number(currentIndex) === index ? '#1340ff' : theme.palette.divider,
        position: 'relative',
        pb: 1.5,
        mb: -0.5,
        maxHeight: 370,
        '&:hover': {
          borderColor: '#1340ff',
          transform: 'translateY(-2px)',
        },
      }}
    >
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
      <Box
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <CampaignLog open={campaignLogIsOpen} campaign={campaign} onClose={onCloseCampaignLog} />
        <Dialog
          fullWidth
          fullScreen
          PaperProps={{
            sx: {
              bgcolor: theme.palette.background.paper,
              borderRadius: 2,
              p: 4,
              m: 2,
              height: '97vh',
              overflow: 'hidden',
              ...(smDown && {
                height: 1,
                m: 0,
              }),
            },
          }}
          scroll="paper"
          open={activateDialogOpen}
        >
          {activateDialogOpen && (
            <CreateCampaignFormV2
              mode="activate"
              campaignId={campaign?.id}
              onClose={handleCloseActivateDialog}
              onSuccess={() => {
                // Trigger a revalidation of the campaigns data
                if (window.swrMutate) {
                  window.swrMutate();
                }
              }}
            />
          )}
        </Dialog>
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
  index: PropTypes.number,
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
  onView: PropTypes.func,
  campaign: PropTypes.object,
  status: PropTypes.bool,
  pitchStatus: PropTypes.string,
  showAdmins: PropTypes.bool,
};
