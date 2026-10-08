// asd
import { format } from 'date-fns';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import React, { useMemo, useState, useCallback } from 'react';

import { Box, Menu, Stack, Button, MenuItem, Typography, IconButton } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useCampaignPermissions } from 'src/hooks/use-campaign-permissions';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import { setUrl, setOpenCopyDialog } from 'src/store/use-spreadsheet';
import { setPassword, setOpenModal, setPublicUrl } from 'src/store/use-public-url';

import Iconify from 'src/components/iconify';
import CampaignTabs from 'src/components/campaign/CampaignTabs';

const formatDate = (dateString) => {
  if (!dateString) return '';
  return format(new Date(dateString), 'MMMM d, yyyy');
};

const CampaignHeader = ({
  campaign,
  onBack,
  isClient,
  openInitialActivateDialog,
  openActivateDialog,
  handleOpenCampaignLog,
}) => {
  const { user } = useAuthContext();

  const router = useRouter();
  const loading = useBoolean();

  const { isViewOnly } = useCampaignPermissions(campaign, user);

  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const menuOpen = Boolean(menuAnchorEl);

  const isCampaignHasSpreadSheet = campaign?.spreadSheetURL;

  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const isPendingCampaign = useMemo(
    () =>
      campaign?.status === 'PENDING_CSM_REVIEW' || campaign?.status === 'PENDING_ADMIN_ACTIVATION',
    [campaign]
  );

  const canInitialActivate = user?.admin?.role?.name === 'CSL' || user?.admin?.mode === 'god';

  const generateSpreadSheet = useCallback(async () => {
    try {
      loading.onTrue();
      const res = await axiosInstance.post(endpoints.campaign.spreadsheet, {
        campaignId: campaign?.id,
      });
      setUrl(res?.data?.url);
      enqueueSnackbar(res?.data?.message);
      setOpenCopyDialog(true);
      // campaignMutate();
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    } finally {
      loading.onFalse();
    }
  }, [loading, campaign]);

  const generatePublicUrl = useCallback(async () => {
    try {
      loading.onTrue();
      const response = await axiosInstance.post('/api/public/generate', {
        campaignId: campaign?.id,
        expiryInMinutes: 120,
      });

      if (response?.data?.url && response?.data?.password) {
        setPublicUrl(response.data.url);
        setPassword(response.data.password);
        setOpenModal(true);
      } else {
        enqueueSnackbar('Failed to generate public URL', { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('An error occurred while generating the public URL.', { variant: 'error' });
    } finally {
      loading.onFalse();
    }
  }, [campaign?.id, loading]);

  const renderActionButtons = () => {
    const adminRole = user?.admin?.role?.slug || user?.admin?.role?.name;
    const userRole = user?.role;
    const campaignAdmins = campaign?.campaignAdmin || [];

    if (
      userRole === 'admin' &&
      adminRole === 'sales_and_marketing' &&
      !campaignAdmins.some((a) => a.adminId === user?.id)
    )
      return null;

    if (!isClient) {
      // Admin buttons logic...
      if (isPendingCampaign) {
        return (
          <Button
            variant="contained"
            size="small"
            startIcon={<Iconify icon="mdi:rocket-launch" width={20} />}
            onClick={() => {
              if (canInitialActivate && campaign?.status === 'PENDING_CSM_REVIEW') {
                openInitialActivateDialog();
              } else {
                openActivateDialog();
              }
            }}
            disabled={isViewOnly}
            sx={{
              height: 42,
              borderRadius: 1,
              color: 'white',
              backgroundColor: '#1340ff',
              border: '1px solid #1340ff',
              borderBottom: '4px solid #0e2fd6',
              fontWeight: 600,
              fontSize: '0.95rem',
              px: 2,
              whiteSpace: 'nowrap',
              '&:hover': {
                backgroundColor: '#0e2fd6',
              },
              '&.Mui-disabled': {
                cursor: 'not-allowed',
                pointerEvents: 'auto',
              },
            }}
          >
            Activate Campaign
          </Button>
        );
      }

      return (
        <Button
          variant="outlined"
          size="small"
          startIcon={
            <img
              src="/assets/icons/overview/editButton.svg"
              alt="edit"
              style={{
                width: 18,
                height: 18,
                opacity: isViewOnly ? 0.3 : 1,
              }}
            />
          }
          onClick={() =>
            router.push(paths.dashboard.campaign.adminCampaignManageDetail(campaign?.id))
          }
          disabled={isViewOnly}
          sx={{
            height: 42,
            borderRadius: 1,
            color: isViewOnly ? '#9e9e9e' : '#221f20',
            border: '1px solid #e7e7e7',
            borderBottom: '4px solid #e7e7e7',
            fontWeight: 600,
            fontSize: '0.95rem',
            px: 2,
            whiteSpace: 'nowrap',
            opacity: isViewOnly ? 0.6 : 1,
            '&:hover': {
              backgroundColor: 'rgba(34, 31, 32, 0.04)',
              border: '1px solid #231F20',
              borderBottom: '4px solid #231F20',
            },
            '&.Mui-disabled': {
              cursor: 'not-allowed',
              pointerEvents: 'auto',
              color: '#9e9e9e',
              border: '1px solid #e7e7e7',
              borderBottom: '4px solid #e7e7e7',
              backgroundColor: 'transparent',
              '&:hover': {
                backgroundColor: 'transparent',
                border: '1px solid #e7e7e7',
                borderBottom: '4px solid #e7e7e7',
              },
            },
          }}
        >
          Edit Details
        </Button>
      );
    }

    return null;
  };

  return (
    <Stack spacing={1} direction="row" alignItems="center">
      <IconButton
        // color="inherit"
        // startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={20} />}
        onClick={onBack}
        sx={{
          // alignSelf: 'flex-start',
          color: '#636366',
          fontSize: { xs: '0.875rem', sm: '1rem' },
          mb: 1,
        }}
      >
        <Iconify icon="eva:arrow-ios-back-fill" width={20} />
      </IconButton>

      {/* Campaign Tabs */}
      <CampaignTabs filter={campaign?.status?.toLowerCase()} />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        width="100%"
        sx={{ mt: -1 }}
      >
        <Stack direction="row" alignItems="center" spacing={2} width="100%">
          {campaign?.campaignBrief?.images?.[0] && (
            <img
              src={campaign?.campaignBrief.images[0]}
              alt={campaign?.name}
              style={{
                width: '100%',
                maxWidth: 80,
                height: 'auto',
                borderRadius: '12px',
                border: '1px solid #e0e0e0',
                objectFit: 'cover',
              }}
            />
          )}
          <Typography
            variant="h5"
            sx={{
              fontFamily: 'Instrument Serif, serif',
              fontSize: { xs: '1.5rem', sm: '2rem' },
              fontWeight: 550,
            }}
          >
            {campaign?.name || 'Campaign Detail'}
          </Typography>
        </Stack>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={{ xs: 1, sm: 0 }}
          width={{ xs: '100%' }}
          justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
        >
          <Stack
            alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
            spacing={0}
            justifyContent="center"
            sx={{ minHeight: { sm: '76px' } }}
          >
            <Typography
              variant="caption"
              sx={{
                color: '#8e8e93',
                fontWeight: 500,
                fontSize: { xs: '0.75rem', sm: '0.9rem' },
                letterSpacing: '0.5px',
              }}
            >
              CAMPAIGN PERIOD:
            </Typography>
            <Typography
              variant="subtitle2"
              sx={{
                color: '#221f20',
                fontWeight: 500,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                whiteSpace: 'nowrap',
              }}
            >
              {formatDate(campaign?.campaignBrief?.startDate)} -{' '}
              {formatDate(campaign?.campaignBrief?.endDate)}
            </Typography>
          </Stack>

          <Box
            sx={{
              height: '42px',
              width: '1px',
              backgroundColor: '#e7e7e7',
              mx: 2,
              display: { xs: 'none', sm: 'block' },
            }}
          />

          <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            {/* Only show action buttons for non-client users */}
            {renderActionButtons()}

            {!isClient && (
              <Box
                onClick={isViewOnly ? undefined : handleMenuOpen}
                component="button"
                disabled={isViewOnly}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 42,
                  width: 42,
                  borderRadius: 1,
                  color: isViewOnly ? '#9e9e9e' : '#221f20',
                  border: '1px solid #e7e7e7',
                  borderBottom: '4px solid #e7e7e7',
                  padding: 0,
                  backgroundColor: 'transparent',
                  cursor: isViewOnly ? 'not-allowed' : 'pointer',
                  opacity: isViewOnly ? 0.6 : 1,
                  '&:hover': {
                    backgroundColor: isViewOnly ? 'transparent' : 'rgba(34, 31, 32, 0.04)',
                    border: isViewOnly ? '1px solid #e7e7e7' : '1px solid #231F20',
                    borderBottom: isViewOnly ? '4px solid #e7e7e7' : '4px solid #231F20',
                  },
                }}
              >
                <Iconify icon="eva:more-horizontal-fill" width={18} />
              </Box>
              // </>
            )}

            <Menu
              anchorEl={menuAnchorEl}
              open={menuOpen}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  minWidth: 200,
                  boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.1)',
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              {!isCampaignHasSpreadSheet ? (
                <MenuItem
                  onClick={() => {
                    generateSpreadSheet();
                    handleMenuClose();
                  }}
                  disabled={isViewOnly || loading.value}
                  sx={{ py: 1 }}
                >
                  <Iconify icon="lucide:file-spreadsheet" width={16} sx={{ mr: 1.5 }} />
                  Generate Spreadsheet
                </MenuItem>
              ) : (
                <MenuItem
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = campaign?.spreadSheetURL;
                    a.target = '_blank';
                    a.click();
                    handleMenuClose();
                  }}
                  disabled={!campaign?.spreadSheetURL}
                  sx={{ py: 1 }}
                >
                  <Iconify icon="tabler:external-link" width={16} sx={{ mr: 1.5 }} />
                  Google Spreadsheet
                </MenuItem>
              )}
              <MenuItem
                onClick={() => {
                  generatePublicUrl();
                  handleMenuClose();
                }}
                sx={{ py: 1 }}
              >
                <img
                  src="/assets/icons/overview/generateIcon.svg"
                  alt="generate icon"
                  style={{ width: 16, height: 16, marginRight: 12 }}
                />
                Generate URL
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleOpenCampaignLog();
                  handleMenuClose();
                }}
                sx={{ py: 1 }}
              >
                <Iconify icon="material-symbols:note-rounded" width={16} sx={{ mr: 1.5 }} />
                View Log
              </MenuItem>
            </Menu>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default CampaignHeader;

CampaignHeader.propTypes = {
  campaign: PropTypes.object,
  onBack: PropTypes.func,
  isClient: PropTypes.bool,
  openInitialActivateDialog: PropTypes.func,
  openActivateDialog: PropTypes.func,
  handleOpenCampaignLog: PropTypes.func,
};
