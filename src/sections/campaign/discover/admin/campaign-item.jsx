import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import { preload, useSWRConfig } from 'swr';
import React, { memo, lazy, useRef, useState, Suspense } from 'react';

import Stack from '@mui/material/Stack';
import { alpha, useTheme } from '@mui/material/styles';
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
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { formatText } from 'src/utils/format-test';
import { fetcher, endpoints } from 'src/utils/axios';

import { countries } from 'src/assets/data';
import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { markPageEnter } from 'src/components/page-enter';
import BrandLogoAvatar from 'src/components/brand-logo-avatar';

import { dialogEnterSx } from 'src/sections/campaign/create/components/motion';

import CampaignBanner from './components/campaign-banner';

const CreateCampaignFormV2 = lazy(() => import('src/sections/campaign/create/form-v2'));
const InitialActivateCampaignDialog = lazy(() => import('./initial-activate-campaign-dialog'));
const CampaignLog = lazy(() =>
  import('../../manage/list/CampaignLog').then((module) => ({ default: module.CampaignLog }))
);

// ----------------------------------------------------------------------

const loadDetailPage = () => import('src/pages/dashboard/campaign/admin/campaign-details');

// Hovering a card loads the detail page code and the campaign, so opening it is near instant.
const prefetchCampaign = (id, cache) => {
  loadDetailPage();
  const key = id && endpoints.campaign.getCampaignById(id);
  if (key && !cache.get(key)?.data) preload(key, fetcher);
};

const HOVER_INTENT_MS = 100;

const NO_IMAGE_SX = {
  height: 1,
  backgroundImage: 'repeating-linear-gradient(45deg, #FFFFFF 0 8px, var(--stripe-color) 8px 16px)',
};

const MENU_BUTTON_SX = {
  ml: 1,
  p: 0.5,
  transition: 'background-color 150ms ease, transform 160ms cubic-bezier(0.23, 1, 0.32, 1)',
  '@media (hover: hover) and (pointer: fine)': {
    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
  },
  '@media (prefers-reduced-motion: no-preference)': {
    '&:active': { transform: 'scale(0.92)' },
  },
};

const countryCache = new Map();
// A name that is not in the list returns null instead of crashing the card.
const findCountry = (name) => {
  const key = name?.toLowerCase();
  if (!key) return null;
  if (!countryCache.has(key)) {
    countryCache.set(key, countries.find((item) => item.label.toLowerCase().includes(key)) ?? null);
  }
  return countryCache.get(key);
};

function CampaignItem({
  campaign,
  onView,
  onEdit,
  onDelete,
  status,
  pitchStatus,
  showAdmins = false,
  highlighted = false,
  onHighlightEnd,
}) {
  const theme = useTheme();
  const { user } = useAuthContext();
  const { cache } = useSWRConfig();
  const hoverTimer = useRef(null);

  const isCopy = useBoolean();

  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [campaignLogIsOpen, setCampaignLogIsOpen] = useState(false);
  const [logMounted, setLogMounted] = useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [initialActivateDialogOpen, setInitialActivateDialogOpen] = useState(false);
  const [initialActivateMounted, setInitialActivateMounted] = useState(false);

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

  const onCloseCampaignLog = (event) => {
    if (event) event.stopPropagation();
    setCampaignLogIsOpen(false);
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
        <CampaignBanner alt={campaign?.name} src={campaign?.campaignBrief?.images?.[0]} />
      ) : (
        <Box sx={{ ...NO_IMAGE_SX, '--stripe-color': theme.palette.grey[100] }} />
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
                              findCountry(countryName)?.code ||
                              countryName?.substring(0, 2).toUpperCase();

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
                                {findCountry(campaign.campaignRequirement.country)?.label ??
                                  campaign.campaignRequirement.country}
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
                            {findCountry(campaign.campaignRequirement.country)?.code ??
                              campaign.campaignRequirement.country}
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
      <BrandLogoAvatar
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
              aria-label="Campaign actions"
              onClick={handleClick}
              sx={MENU_BUTTON_SX}
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
                  aria-label="Campaign actions"
                  onClick={handleClick}
                  sx={MENU_BUTTON_SX}
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
              setLogMounted(true);
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

                // Superadmin on a pending campaign only assigns an admin; the assigned admin runs the full setup.
                if (canInitialActivate && campaign?.status === 'PENDING_CSM_REVIEW') {
                  setInitialActivateMounted(true);
                  setInitialActivateDialogOpen(true);
                } else if (campaign?.status === 'PENDING_ADMIN_ACTIVATION') {
                  // For admin/CSM on PENDING_ADMIN_ACTIVATION: use full activation dialog
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
      onPointerEnter={() => {
        hoverTimer.current = setTimeout(
          () => prefetchCampaign(campaign?.id, cache),
          HOVER_INTENT_MS
        );
      }}
      onPointerLeave={() => clearTimeout(hoverTimer.current)}
      onFocus={() => prefetchCampaign(campaign?.id, cache)}
      onClick={() => {
        markPageEnter('forward', 'list');
        localStorage.setItem('lastOpenedCampaignId', String(campaign?.id));
        localStorage.removeItem('lastScrollPosition');
      }}
      onAnimationEnd={(event) => {
        if (event.animationName === 'lastOpenedFade') onHighlightEnd?.();
      }}
      sx={{
        overflow: 'hidden',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'border-color 200ms ease, transform 160ms cubic-bezier(0.23, 1, 0.32, 1)',
        bgcolor: 'background.default',
        borderRadius: '15px',
        border: '1.2px solid',
        borderColor: theme.palette.divider,
        // The campaign the user just came back from: blue for a moment, then fades
        ...(highlighted && {
          '@keyframes lastOpenedFade': {
            from: { borderColor: '#1340ff' },
            to: { borderColor: theme.palette.divider },
          },
          animation: 'lastOpenedFade 600ms ease 1600ms backwards',
        }),
        position: 'relative',
        pb: 1.5,
        mb: -0.5,
        maxHeight: 370,
        // Pressing the card (not its menu button) sinks it slightly before navigating.
        '@media (prefers-reduced-motion: no-preference)': {
          '&:active:not(:has(button:active))': { transform: 'scale(0.99)' },
        },
        '@media (hover: hover) and (pointer: fine)': {
          '&:hover': { borderColor: '#1340ff' },
        },
        '@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)': {
          '&:hover': { transform: 'translateY(-2px)' },
          '&:active:not(:has(button:active))': { transform: 'translateY(0) scale(0.99)' },
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
        {logMounted && (
          <Suspense fallback={null}>
            <CampaignLog
              open={campaignLogIsOpen}
              campaign={campaign}
              onClose={onCloseCampaignLog}
            />
          </Suspense>
        )}
        <Dialog
          fullWidth
          fullScreen
          PaperProps={{
            sx: {
              bgcolor: theme.palette.background.paper,
              borderRadius: 2,
              p: 4,
              ...dialogEnterSx,
              overflow: 'hidden',
              height: { xs: 1, sm: '97vh' },
              m: { xs: 0, sm: 2 },
            },
          }}
          scroll="paper"
          open={activateDialogOpen}
        >
          {activateDialogOpen && (
            <Suspense fallback={null}>
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
            </Suspense>
          )}
        </Dialog>
        {initialActivateMounted && (
          <Suspense fallback={null}>
            <InitialActivateCampaignDialog
              open={initialActivateDialogOpen}
              onClose={handleCloseInitialActivateDialog}
              campaignId={campaign?.id}
            />
          </Suspense>
        )}
      </Box>
    </Card>
  );
}

CampaignItem.propTypes = {
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
  onView: PropTypes.func,
  campaign: PropTypes.object,
  status: PropTypes.string,
  pitchStatus: PropTypes.string,
  showAdmins: PropTypes.bool,
  highlighted: PropTypes.bool,
  onHighlightEnd: PropTypes.func,
};

export default memo(CampaignItem);
