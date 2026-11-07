import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useTheme } from '@emotion/react';
import { enqueueSnackbar } from 'notistack';
import { useMemo, useState, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Chip,
  Stack,
  Button,
  Dialog,
  Container,
  Typography,
  IconButton,
  DialogTitle,
  DialogActions,
  DialogContent,
  CircularProgress,
  DialogContentText,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import { useGetCampaignById } from 'src/hooks/use-get-campaign-by-id';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import withPermission from 'src/auth/guard/withPermissions';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import PageEnter, { markPageEnter } from 'src/components/page-enter';

import CampaignTabIndicator from 'src/sections/campaign/discover/admin/components/campaign-tab-indicator';

import UpdateAudience from '../UpdateAudience';
import UpdateLogistics from '../UpdateLogistics';
import UpdateObjectives from '../UpdateObjectives';
import UpdateAdditionalOne from '../UpdateAdditionalOne';
import UpdateAdditionalTwo from '../UpdateAdditionalTwo';
import UpdateFinaliseCampaign from '../UpdateFinaliseCampaign';
import UpdateGeneralInformation from '../UpdateGeneralInformation';

// Shared id for the active tab's form so the header Save button can submit it
const EDIT_FORM_ID = 'campaign-edit-form';

// Tab configuration
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

const TABS = [
  { label: 'General Information', value: 'general' },
  { label: 'Campaign Objectives', value: 'objective' },
  { label: 'Target Audience', value: 'audience' },
  { label: 'Logistics', value: 'logistics' },
  { label: 'Finalise', value: 'finalise' },
  { label: 'Additional Fields 1', value: 'additional1' },
  { label: 'Additional Fields 2', value: 'additional2' },
];

const CampaignDetailManageViewV2 = ({ id }) => {
  const router = useRouter();
  const settings = useSettingsContext();
  const { campaign, campaignLoading, mutate: campaignMutate } = useGetCampaignById(id);
  const { user } = useAuthContext();
  const theme = useTheme();
  const lgUp = useResponsive('up', 'lg');
  const smUp = useResponsive('up', 'sm');

  const modalConfirm = useBoolean();
  const loadingButton = useBoolean();
  const isClosing = useBoolean();
  const isGenerating = useBoolean();

  const campaignStartDate = useMemo(
    () => !campaignLoading && campaign?.campaignBrief?.startDate,
    [campaign, campaignLoading]
  );

  // ?tab=<value> opens a specific tab (e.g. the no-client shortlist guard links to Finalise)
  const searchParams = useSearchParams();
  const [currentTab, setCurrentTab] = useState(() => {
    const requestedTab = searchParams.get('tab');
    return TABS.some((tab) => tab.value === requestedTab) ? requestedTab : 'general';
  });

  // Form state of the active tab, reported up so the header Save button can drive it
  const [formState, setFormState] = useState({ isDirty: false, isSubmitting: false });

  const currentTabLabel = TABS.find((tab) => tab.value === currentTab)?.label ?? '';

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );

  const handleChangeTab = useCallback((newValue) => {
    setCurrentTab(newValue);
    setFormState({ isDirty: false, isSubmitting: false });
  }, []);

  const handleBackNavigation = () => {
    markPageEnter('back');
    const historyIndex = window.history.state?.idx;
    if (typeof historyIndex === 'number' && historyIndex > 0) {
      router.back();
      return;
    }
    router.push(paths.dashboard.campaign.adminCampaignDetail(id));
  };

  const handleChangeStatus = async (status) => {
    if (status === 'active' && dayjs(campaign?.campaignBrief?.endDate).isBefore(dayjs, 'date')) {
      enqueueSnackbar('You cannot publish a campaign that is already end.', {
        variant: 'error',
      });
      return;
    }
    try {
      loadingButton.onTrue();
      const res = await axiosInstance.patch(endpoints.campaign.changeStatus(campaign?.id), {
        status,
      });

      if (res?.data?.status === 'ACTIVE') {
        enqueueSnackbar('Campaign is now live!');
      } else if (res?.data?.status === 'SCHEDULED') {
        enqueueSnackbar('Campaign is scheduled!');
      } else {
        enqueueSnackbar('Campaign is paused');
      }

      mutate(endpoints.campaign.getCampaignById(id), (currentData) => {
        const newCampaign = {
          ...currentData,
          status: res?.status,
        };
        return {
          ...currentData,
          newCampaign,
        };
      });

      loadingButton.onFalse();
    } catch (error) {
      enqueueSnackbar('Failed to change status', {
        variant: 'error',
      });
      loadingButton.onFalse();
    }
  };

  const closeCampaign = async () => {
    isClosing.onTrue();
    try {
      const res = await axiosInstance.patch(endpoints.campaign.closeCampaign(id));
      enqueueSnackbar(res?.data?.message);

      mutate(endpoints.campaign.getCampaignById(id), (currentData) => {
        const newCampaign = {
          ...currentData,
          status: 'past',
        };
        return {
          ...currentData,
          newCampaign,
        };
      });
      modalConfirm.onFalse();
    } catch (error) {
      enqueueSnackbar('Error to close campaign', {
        variant: 'error',
      });
    } finally {
      isClosing.onFalse();
    }
  };

  // Confirmation Modal
  const confirmationModal = (
    <Dialog open={modalConfirm.value} onClose={modalConfirm.onFalse}>
      <DialogTitle>Confirm end campaign</DialogTitle>
      <DialogContent>
        <DialogContentText>Are you sure you want to end the campaign?</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={modalConfirm.onFalse} sx={{ borderRadius: 0.5 }}>
          Cancel
        </Button>
        <LoadingButton
          onClick={closeCampaign}
          variant="contained"
          sx={{ borderRadius: 0.5 }}
          loading={isClosing.value}
        >
          Confirm
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );

  // Tab content mapping
  const tabContentProps = {
    campaign,
    campaignMutate,
    formId: EDIT_FORM_ID,
    onFormStateChange: setFormState,
  };

  const renderTabContent = {
    general: <UpdateGeneralInformation {...tabContentProps} />,
    objective: <UpdateObjectives {...tabContentProps} />,
    audience: <UpdateAudience {...tabContentProps} />,
    logistics: <UpdateLogistics {...tabContentProps} />,
    finalise: <UpdateFinaliseCampaign {...tabContentProps} />,
    additional1: <UpdateAdditionalOne {...tabContentProps} />,
    additional2: <UpdateAdditionalTwo {...tabContentProps} />,
  };

  // Primary Save action — rendered inline in the header on desktop, in a sticky bottom bar on mobile
  const saveButton = (
    <LoadingButton
      type="submit"
      form={EDIT_FORM_ID}
      variant="contained"
      size="large"
      loading={formState.isSubmitting}
      disabled={!formState.isDirty || isDisabled}
      sx={{
        bgcolor: '#1340ff',
        boxShadow: '0px -3px 0px 0px rgba(0,0,0,0.45) inset',
        '&:hover': {
          bgcolor: '#1340ff',
          boxShadow: '0px -3px 0px 0px rgba(0,0,0,0.45) inset',
        },
        '&:disabled': {
          bgcolor: 'rgba(19, 64, 255, 0.3)',
          color: '#fff',
          boxShadow: '0px -3px 0px 0px inset rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      Save {currentTabLabel}
    </LoadingButton>
  );

  const renderTabs = (
    <Box sx={{ mb: 2.5 }} overflow="hidden">
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          position: 'relative',
          width: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'none',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
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
          justifyContent="space-between"
          sx={{
            position: 'relative',
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          {TABS.map((tab) => (
            <Button
              key={tab.value}
              disableRipple
              size="large"
              onClick={() => handleChangeTab(tab.value)}
              data-tab-active={currentTab === tab.value}
              sx={{
                px: 0,
                py: 0.5,
                pb: 1,
                minWidth: !lgUp && 'fit-content',
                color: currentTab === tab.value ? '#221f20' : '#8e8e93',
                position: 'relative',
                fontSize: { xs: '0.9rem', sm: '1.05rem' },
                fontWeight: 650,
                whiteSpace: 'nowrap',
                mr: { xs: 2, sm: 3 },
                transition: `transform 160ms ${EASE_OUT}, color 150ms ease`,
                '&:focus': {
                  outline: 'none',
                  bgcolor: 'transparent',
                },
                '&:active': {
                  transform: 'scale(0.97)',
                  bgcolor: 'transparent',
                },
                // The active underline is the shared CampaignTabIndicator; this is only a hover preview.
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  bgcolor: '#1340ff',
                  transform: 'scaleX(0)',
                  transformOrigin: 'left',
                  opacity: 0,
                  transition: `transform 200ms ${EASE_OUT}, opacity 150ms ease`,
                },
                '&:hover': { bgcolor: 'transparent' },
                // Touch screens fire a hover on tap, so only real pointers preview the underline.
                '@media (hover: hover) and (pointer: fine)': {
                  '&:hover::after': currentTab !== tab.value && {
                    transform: 'scaleX(1)',
                    opacity: 0.5,
                  },
                },
                '@media (prefers-reduced-motion: reduce)': {
                  '&, &::after': { transition: 'opacity 150ms ease' },
                },
              }}
            >
              {tab.label}
            </Button>
          ))}
          <CampaignTabIndicator activeKey={currentTab} />
        </Stack>
      </Stack>
    </Box>
  );

  return (
    <Container
      maxWidth={settings.themeStretch ? false : 'xl'}
      sx={{
        px: { xs: 2, sm: 4 },
        // leave room for the sticky bottom Save bar on mobile
        pb: { xs: 12, sm: 0 },
      }}
    >
      <Box sx={{ mb: { xs: 1, sm: '17px' } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={{ xs: 1.5, sm: 2 }}
          // Same size as the campaign page header, so moving between the two does not jump.
          sx={{ minHeight: { sm: 76 }, mt: -1 }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ flexGrow: 1, width: { xs: '100%', sm: 'auto' } }}
          >
            <IconButton
              aria-label="Back"
              onClick={handleBackNavigation}
              sx={{ color: '#636366', fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              <Iconify icon="eva:arrow-ios-back-fill" width={20} />
            </IconButton>
            <Typography
              variant="h5"
              sx={{
                fontFamily: 'Instrument Serif, serif',
                fontSize: { xs: '1.5rem', sm: '2rem' },
                fontWeight: 550,
              }}
            >
              Edit Campaign Details
            </Typography>
            {campaign?.status && (
              <Chip
                label={campaign.status.replace(/_/g, ' ')}
                size="small"
                variant="outlined"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  textTransform: 'capitalize',
                  ...(campaign.status === 'ACTIVE' && {
                    bgcolor: '#E8F5E9',
                    color: '#2E7D32',
                  }),
                  ...(campaign.status === 'PAUSED' && {
                    bgcolor: '#FFF3E0',
                    color: '#E65100',
                  }),
                  ...(campaign.status === 'SCHEDULED' && {
                    bgcolor: '#E3F2FD',
                    color: '#1565C0',
                  }),
                  ...(campaign.status === 'DRAFT' && {
                    bgcolor: '#F5F5F5',
                    color: '#616161',
                  }),
                  ...((campaign.status === 'COMPLETED' || campaign.status === 'CLOSED') && {
                    bgcolor: '#ECEFF1',
                    color: '#546E7A',
                  }),
                }}
              />
            )}
          </Stack>

          <Box sx={{ flexShrink: 0, width: { xs: '100%', sm: 'auto' } }}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
              sx={{ '& .MuiButton-root': { height: 42, fontSize: '0.95rem' } }}
            >
              {smUp && saveButton}
              {campaign && campaign?.status === 'ACTIVE' && (
                <LoadingButton
                  variant="contained"
                  size="large"
                  onClick={() => handleChangeStatus('PAUSED')}
                  loading={loadingButton.value}
                  disabled={isDisabled}
                  sx={{
                    bgcolor: '#3A3A3C',
                    boxShadow: '0px -3px 0px 0px #00000073 inset',
                    '&:hover': {
                      bgcolor: '#3A3A3C',
                      boxShadow: '0px -3px 0px 0px #00000073 inset',
                    },
                  }}
                >
                  Pause
                </LoadingButton>
              )}
              {campaign?.status === 'ACTIVE' && (
                <LoadingButton
                  variant="contained"
                  onClick={modalConfirm.onTrue}
                  size="large"
                  disabled={isDisabled}
                  sx={{
                    bgcolor: '#D4321C',
                    boxShadow: '0px -3px 0px 0px #00000073 inset',
                    '&:hover': {
                      bgcolor: '#D4321C',
                      boxShadow: '0px -3px 0px 0px #00000073 inset',
                    },
                  }}
                >
                  End Campaign
                </LoadingButton>
              )}
              {campaign?.status === 'SCHEDULED' &&
                dayjs().isSame(dayjs(campaign?.campaignBrief?.startDate), 'date') && (
                  <LoadingButton
                    variant="contained"
                    color="success"
                    onClick={() => handleChangeStatus('ACTIVE')}
                    size="large"
                    disabled={isDisabled}
                  >
                    Start Campaign
                  </LoadingButton>
                )}
              {campaign &&
                (campaign?.status === 'PAUSED' ||
                  (campaign?.status === 'DRAFT' &&
                    dayjs(campaignStartDate).isSame(dayjs(), 'D'))) && (
                  <LoadingButton
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={() => handleChangeStatus('ACTIVE')}
                    loading={loadingButton.value}
                    disabled={isDisabled}
                    sx={{
                      bgcolor: 'primary',
                      boxShadow: '0px -3px 0px 0px #00000073 inset',
                      '&:hover': {
                        bgcolor: 'primary',
                        boxShadow: '0px -3px 0px 0px #00000073 inset',
                      },
                    }}
                  >
                    Publish
                  </LoadingButton>
                )}
              {campaign?.status === 'COMPLETED' && (
                <LoadingButton
                  variant="contained"
                  color="success"
                  onClick={() => handleChangeStatus('ACTIVE')}
                  size="large"
                  disabled={isDisabled}
                >
                  Reactivate
                </LoadingButton>
              )}
              {campaign?.status === 'COMPLETED' && (
                <LoadingButton
                  variant="outlined"
                  loading={isGenerating.value}
                  sx={{ border: 1.5, borderColor: 'success.main', color: 'success.main' }}
                  onClick={async () => {
                    if (campaign?.summaryUrl) {
                      window.open(campaign.summaryUrl, '_blank', 'noopener,noreferrer');
                    } else {
                      isGenerating.onTrue();
                      try {
                        await axiosInstance.post(`/api/campaign/export/master-list/${campaign.id}`);
                        mutate(endpoints.campaign.getCampaignById(campaign.id));
                      } finally {
                        isGenerating.onFalse();
                      }
                    }
                  }}
                >
                  Campaign Master List
                </LoadingButton>
              )}
            </Stack>
          </Box>
        </Stack>
      </Box>

      {!campaignLoading ? (
        <PageEnter>
          {renderTabs}
          <Box>{renderTabContent[currentTab]}</Box>
        </PageEnter>
      ) : (
        <Box
          sx={{
            position: 'relative',
            top: 200,
            textAlign: 'center',
          }}
        >
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

      {!smUp && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar,
            p: 2,
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
            boxShadow: '0px -4px 12px rgba(0,0,0,0.06)',
            '& > *': { width: '100%' },
          }}
        >
          {saveButton}
        </Box>
      )}

      {confirmationModal}
    </Container>
  );
};

export default withPermission(['view:campaign'], CampaignDetailManageViewV2);

CampaignDetailManageViewV2.propTypes = {
  id: PropTypes.string,
};
