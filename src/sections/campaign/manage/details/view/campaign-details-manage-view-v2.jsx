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
  DialogTitle,
  DialogActions,
  DialogContent,
  CircularProgress,
  DialogContentText,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import { useGetCampaignById } from 'src/hooks/use-get-campaign-by-id';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import withPermission from 'src/auth/guard/withPermissions';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

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

  const [currentTab, setCurrentTab] = useState('general');

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
<<<<<<< Updated upstream
  const renderTabContent = {
    general: <UpdateGeneralInformation campaign={campaign} campaignMutate={campaignMutate} />,
    objective: <UpdateObjectives campaign={campaign} campaignMutate={campaignMutate} />,
    audience: <UpdateAudience campaign={campaign} campaignMutate={campaignMutate} />,
    logistics: <UpdateLogistics campaign={campaign} campaignMutate={campaignMutate} />,
    finalise: <UpdateFinaliseCampaign campaign={campaign} campaignMutate={campaignMutate} />,
    additional1: <UpdateAdditionalOne campaign={campaign} campaignMutate={campaignMutate} />,
    additional2: <UpdateAdditionalTwo campaign={campaign} campaignMutate={campaignMutate} />,
=======
  const tabContentProps = {
    campaign,
    campaignMutate,
    formId: EDIT_FORM_ID,
    onFormStateChange: setFormState,
>>>>>>> Stashed changes
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
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          {TABS.map((tab) => (
            <Button
              key={tab.value}
              disableRipple
              size="large"
              onClick={() => handleChangeTab(tab.value)}
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
                  width: currentTab === tab.value ? '100%' : '0%',
                  bgcolor: '#1340ff',
                  transition: 'all 0.3s ease-in-out',
                  transform: 'scaleX(1)',
                  transformOrigin: 'left',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                  '&::after': {
                    width: '100%',
                    opacity: currentTab === tab.value ? 1 : 0.5,
                  },
                },
              }}
            >
              {tab.label}
            </Button>
          ))}
        </Stack>
      </Stack>
    </Box>
  );

  return (
<<<<<<< Updated upstream
    <Container maxWidth="lg">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
=======
    <Container
      maxWidth={settings.themeStretch ? false : 'xl'}
      sx={{
        px: { xs: 2, sm: 4 },
        // leave room for the sticky bottom Save bar on mobile
        pb: { xs: 12, sm: 0 },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1 }}
      >
>>>>>>> Stashed changes
        <Button
          color="inherit"
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={20} />}
          onClick={() => router.push(paths.dashboard.campaign.adminCampaignDetail(id))}
          sx={{
            alignSelf: 'flex-start',
            color: '#636366',
            fontSize: { xs: '0.875rem', sm: '1rem' },
          }}
        >
          Back
        </Button>

        {campaign?.status && (
          <Chip
            label={campaign.status.replace(/_/g, ' ')}
            size="medium"
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

      <Box sx={{ mb: { xs: 1 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={{ xs: 1.5, sm: 2 }}
        >
          <Box sx={{ flexGrow: 1, width: { xs: '100%', sm: 'auto' } }}>
            <Typography
              variant="h2"
              fontFamily="fontSecondaryFamily"
              fontWeight="normal"
              sx={{ mb: 0 }}
            >
              Edit Campaign Details
            </Typography>
          </Box>

          <Box sx={{ flexShrink: 0, width: { xs: '100%', sm: 'auto' } }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
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
<<<<<<< Updated upstream
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
        }
        sx={{
          mb: { xs: 3 },
        }}
      />
=======
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
            </Stack>
          </Box>
        </Stack>
      </Box>
>>>>>>> Stashed changes

      {!campaignLoading ? (
        <>
          {renderTabs}
          <Box>{renderTabContent[currentTab]}</Box>
        </>
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
