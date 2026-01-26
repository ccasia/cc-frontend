import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useTheme } from '@emotion/react';
import { enqueueSnackbar } from 'notistack';
import { useMemo, useState, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Button,
  Dialog,
  Container,
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
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import UpdateAudience from '../UpdateAudience';
import UpdateLogistics from '../UpdateLogistics';
import UpdateObjectives from '../UpdateObjectives';
import UpdateAdditionalOne from '../UpdateAdditionalOne';
import UpdateAdditionalTwo from '../UpdateAdditionalTwo';
import UpdateFinaliseCampaign from '../UpdateFinaliseCampaign';
import UpdateGeneralInformation from '../UpdateGeneralInformation';

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
  const { campaign, campaignLoading, mutate: campaignMutate } = useGetCampaignById(id);
  const { user } = useAuthContext();
  const theme = useTheme();
  const lgUp = useResponsive('up', 'lg');

  const modalConfirm = useBoolean();
  const loadingButton = useBoolean();

  const campaignStartDate = useMemo(
    () => !campaignLoading && campaign?.campaignBrief?.startDate,
    [campaign, campaignLoading]
  );

  const [currentTab, setCurrentTab] = useState('general');

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );

  const handleChangeTab = useCallback((newValue) => {
    setCurrentTab(newValue);
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
        <Button onClick={modalConfirm.onFalse}>Cancel</Button>
        <Button onClick={closeCampaign} variant="contained">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Tab content mapping
  const renderTabContent = {
    general: <UpdateGeneralInformation campaign={campaign} campaignMutate={campaignMutate} />,
    objective: <UpdateObjectives campaign={campaign} campaignMutate={campaignMutate} />,
    audience: <UpdateAudience campaign={campaign} campaignMutate={campaignMutate} />,
    logistics: <UpdateLogistics campaign={campaign} campaignMutate={campaignMutate} />,
    finalise: <UpdateFinaliseCampaign campaign={campaign} campaignMutate={campaignMutate} />,
    additional1: <UpdateAdditionalOne campaign={campaign} campaignMutate={campaignMutate} />,
    additional2: <UpdateAdditionalTwo campaign={campaign} campaignMutate={campaignMutate} />
  };

  console.log('Campaign object: ', campaign)

  // Render Tabs - styled like campaign-detail-view.jsx
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
    <Container maxWidth="lg">
      <Button
        color="inherit"
        startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={20} />}
        onClick={() => router.push(paths.dashboard.campaign.adminCampaignDetail(id))}
        sx={{
          alignSelf: 'flex-start',
          color: '#636366',
          fontSize: { xs: '0.875rem', sm: '1rem' },
          mb: 1,
        }}
      >
        Back
      </Button>
      <CustomBreadcrumbs
        heading="Edit Campaign"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          {
            name: 'Campaign',
            href: paths.dashboard.campaign.manage,
          },
          { name: 'Edit' },
          { name: campaign?.name },
        ]}
        action={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
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
          </Stack>
        }
        sx={{
          mb: { xs: 3 },
        }}
      />

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

      {confirmationModal}
    </Container>
  );
};

export default withPermission(['view:campaign'], CampaignDetailManageViewV2);

CampaignDetailManageViewV2.propTypes = {
  id: PropTypes.string,
};
