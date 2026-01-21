import PropTypes from 'prop-types';
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { Box, Stack, Button, Typography } from '@mui/material';

// import Image from 'src/components/image';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useAuthContext } from 'src/auth/hooks';
import { useBoolean } from 'src/hooks/use-boolean';
import { useGetCreatorLogistic } from 'src/hooks/use-get-creator-logistic';

// HIDE: logistics
import CampaignLogisticsView from 'src/sections/logistics/creator-logistics-view';
import ConfirmReservationModal from 'src/sections/logistics/dialogs/confirm-reservation-modal';

import CampaignInfo from './campaign-info';
import CampaignMyTasks from './campaign-myTask';
import CampaignV4Activity from './v4/campaign-v4-activity';

const CampaignDetailItem = ({ campaign, mutate }) => {
  const router = useRouter();
  const { user } = useAuthContext();
  const location = useLocation();

  const { logistic: myLogistic, mutate: mutateLogistic } = useGetCreatorLogistic(campaign?.id);

  const [currentTab, setCurrentTab] = useState(() => {
    if (location.state?.tab) {
      return location.state.tab;
    }
    // Default to appropriate tab based on submission version
    return campaign?.submissionVersion === 'v4' ? 'tasks-v4' : 'tasks';
  });
  const showReservationModal = useBoolean();

  const isCampaignDone = campaign?.shortlisted?.find(
    (item) => item.userId === user?.id
  )?.isCampaignDone;

  const invoiceId = campaign?.invoice?.find((invoice) => invoice?.creatorId === user?.id)?.id;
  const isReservation = campaign?.logisticsType === 'RESERVATION';
  const needsAction = isReservation && myLogistic && myLogistic.status === 'NOT_STARTED';
  const hasLogistics =
    !!myLogistic || campaign?.logistics?.some((item) => item.creatorId === user?.id);

  const openLogisticTab = () => {
    setCurrentTab('logistics');
  };

  // Handle cases where campaign data loads after component mount
  useEffect(() => {
    if (!location.state?.tab && campaign?.submissionVersion) {
      const defaultTab = campaign.submissionVersion === 'v4' ? 'tasks-v4' : 'tasks';
      setCurrentTab(defaultTab);
    }
  }, [campaign?.submissionVersion, location.state?.tab]);

  useEffect(() => {
    if (!myLogistic?.id) return;

    const hasDismissed = localStorage.getItem(`dismissed-res-${myLogistic?.id}`);

    if (currentTab === 'logistics') {
      if (!hasDismissed) {
        localStorage.setItem(`dismissed-res-${myLogistic?.id}`, 'true');
      }
      showReservationModal.onFalse();
    } else if (needsAction && !hasDismissed) {
      showReservationModal.onTrue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsAction, showReservationModal, currentTab, myLogistic?.id]);

  const handleGoToLogistics = () => {
    localStorage.setItem(`dismissed-res-${myLogistic?.id}`, 'true');
    setCurrentTab('logistics');
    showReservationModal.onFalse();
  };

  const handleDismiss = () => {
    localStorage.setItem(`dismissed-res-${myLogistic?.id}`, 'true');
    showReservationModal.onFalse();
  };

  return (
    <Stack gap={2} sx={{ overflowX: 'hidden', width: '100%' }}>
      <Stack gap={2}>
        <Box
          sx={{
            overflowX: 'auto',
            overflowY: 'hidden',
            mt: 2,
            '&::-webkit-scrollbar': { display: 'none' }, // Hide scrollbar on webkit browsers
            scrollbarWidth: 'none', // Hide scrollbar on Firefox
          }}
        >
          <Stack
            direction="row"
            spacing={2.5}
            sx={{
              minWidth: 'max-content', // Ensure tabs don't wrap
              px: 2, // Add padding to prevent edge cutoff
            }}
          >
            {[
              ...(campaign?.submissionVersion === 'v4'
                ? [{ value: 'tasks-v4', label: 'Submissions' }]
                : [{ value: 'tasks', label: 'Activity' }]),
              { value: 'info', label: 'Campaign Details' },
              // HIDE: logistics from creator
              ...(hasLogistics ? [{ value: 'logistics', label: 'Logistics' }] : []),
            ].map((tab) => (
              <Button
                key={tab.value}
                disableRipple
                size="large"
                onClick={() => setCurrentTab(tab.value)}
                sx={{
                  px: 0.5,
                  py: 0.5,
                  pb: 1,
                  minWidth: 'fit-content',
                  color: currentTab === tab.value ? '#221f20' : '#8e8e93',
                  position: 'relative',
                  fontSize: '1.05rem',
                  fontWeight: 650,
                  '&:hover': {
                    bgcolor: 'transparent',
                    '&::after': {
                      width: '100%',
                      opacity: currentTab === tab.value ? 1 : 0.5,
                    },
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    bgcolor: '#1340ff',
                    width: currentTab === tab.value ? '100%' : '0%',
                    transition: 'all 0.3s ease-in-out',
                  },
                }}
              >
                {tab.label}
              </Button>
            ))}
          </Stack>
        </Box>
        {/* Horizontal Line */}
        <Box
          sx={{
            width: '100%',
            height: '1px',
            bgcolor: 'divider',
            mt: -2.2,
          }}
        />

        {isCampaignDone && (
          <Box
            bgcolor="#DAF5E4"
            p={1}
            borderRadius={1}
            display="flex"
            flex={1}
            justifyContent="center"
            px={{ xs: 3 }}
          >
            <Typography color="#308862" textAlign="center" fontSize={14} fontWeight={700}>
              🎉 Congratulations, you&apos;ve completed the campaign! Your{' '}
              <Link
                to={paths.dashboard.creator.invoiceDetail(invoiceId)}
                style={{ color: '#308862', textDecoration: 'underline' }}
              >
                invoice
              </Link>{' '}
              is now being processed.
            </Typography>
          </Box>
        )}
        <ConfirmReservationModal
          open={showReservationModal.value}
          onClose={handleDismiss}
          onConfirm={handleGoToLogistics}
        />
        <Box mt={3} sx={{ overflowX: 'hidden', width: '100%' }}>
          {currentTab === 'tasks' && (
            <CampaignMyTasks
              campaign={campaign}
              openLogisticTab={openLogisticTab}
              setCurrentTab={setCurrentTab}
            />
          )}
          {currentTab === 'tasks-v4' && (
            <CampaignV4Activity
              campaign={campaign}
              mutateLogistic={mutateLogistic}
              logistic={myLogistic}
            />
          )}
          {currentTab === 'info' && <CampaignInfo campaign={campaign} />}
          {/* {currentTab === 'admin' && <CampaignAdmin campaign={campaign} />} */}
          {/* HIDE: logistics */}
          {currentTab === 'logistics' && <CampaignLogisticsView campaign={campaign} />}
          {/* {currentTab === 'logistics' && <CampaignLogistics campaign={campaign} />} */}
        </Box>
      </Stack>
    </Stack>
  );
};

export default CampaignDetailItem;

CampaignDetailItem.propTypes = {
  campaign: PropTypes.object,
  mutate: PropTypes.func,
};
