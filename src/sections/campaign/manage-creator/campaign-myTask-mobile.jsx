import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useState, useEffect, useCallback } from 'react';

import { Box, Card, Stack, Container, Typography } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useGetSubmissions } from 'src/hooks/use-get-submission';
import { useGetDeliverables } from 'src/hooks/use-get-deliverables';

import { useAuthContext } from 'src/auth/hooks';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

export const defaultSubmission = [
  {
    name: 'Agreement Submission ✍',
    value: 'Agreement',
    type: 'AGREEMENT_FORM',
    stage: 1,
    route: 'agreement',
  },
  {
    name: 'Draft Submission 📝',
    value: 'First Draft',
    type: 'FIRST_DRAFT',
    stage: 2,
    route: 'first-draft',
  },
  {
    name: '2nd Draft Submission 📝',
    value: 'Final Draft',
    type: 'FINAL_DRAFT',
    stage: 3,
    route: 'final-draft',
  },
  {
    name: 'Posting Link Submission 🔗',
    value: 'Posting',
    type: 'POSTING',
    stage: 4,
    route: 'posting',
  },
];

const CampaignMyTasksMobile = ({ campaign }) => {
  const { user } = useAuthContext();
  const router = useRouter();
  const [viewedStages, setViewedStages] = useState([]);

  const {
    data: submissions,
    isLoading: submissionLoading,
  } = useGetSubmissions(user?.id, campaign?.id);

  const {
    isLoading: deliverableLoading,
  } = useGetDeliverables(user?.id, campaign?.id);

  // Load viewed stages from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`viewedStages-${campaign.id}-${user.id}`);
    if (saved) {
      setViewedStages(JSON.parse(saved));
    }
  }, [campaign.id, user.id]);

  const value = useCallback(
    (name) => submissions?.find((submission) => submission?.submissionType?.type === name),
    [submissions]
  );

  const getDueDate = (name) =>
    submissions?.find((submission) => submission?.submissionType?.type === name)?.dueDate;

  const getVisibleStages = useCallback(() => {
    let stages = [];
    const agreementSubmission = value('AGREEMENT_FORM');
    const firstDraftSubmission = value('FIRST_DRAFT');
    const finalDraftSubmission = value('FINAL_DRAFT');
    const postingSubmission = value('POSTING');

    // Always show Agreement stage (will be last and always Stage 01)
    stages.unshift({ ...defaultSubmission[0] });

    // Show First Draft if Agreement is approved
    if (agreementSubmission?.status === 'APPROVED') {
      stages.unshift({ ...defaultSubmission[1] });
    }

    // Show Final Draft if First Draft is in CHANGES_REQUIRED status
    if (firstDraftSubmission?.status === 'CHANGES_REQUIRED') {
      stages.unshift({ ...defaultSubmission[2] });
    }

    // Show Posting if either First Draft or Final Draft is approved
    if (
      firstDraftSubmission?.status === 'APPROVED' ||
      finalDraftSubmission?.status === 'APPROVED'
    ) {
      stages.unshift({ ...defaultSubmission[3] });
    }

    if (!postingSubmission) {
      stages = stages.filter((stage) => stage.value !== 'Posting');
    }

    // Add sequential stage numbers starting from the bottom
    return stages.map((stage, index) => ({
      ...stage,
      stage: stages.length - index, // This makes the bottom item Stage 01
    }));
  }, [value]);

  const handleStageClick = (stage) => {
    // Mark stage as viewed
    if (!viewedStages.includes(stage.type)) {
      const newViewedStages = [...viewedStages, stage.type];
      setViewedStages(newViewedStages);
      // Save to localStorage
      localStorage.setItem(
        `viewedStages-${campaign.id}-${user.id}`,
        JSON.stringify(newViewedStages)
      );
    }

    // Navigate to the stage page
    const basePath = paths.dashboard.campaign.creator.detail(campaign.id);
    router.push(`${basePath}/${stage.route}`);
  };

  const isNewStage = (stageType) => {
    const stageValue = value(stageType);
    return (
      !viewedStages.includes(stageType) &&
      stageValue?.status !== 'APPROVED' &&
      !(stageType === 'FIRST_DRAFT' && stageValue?.status === 'CHANGES_REQUIRED')
    );
  };

  const getStageIcon = (stageType) => {
    const submission = value(stageType);
    const status = submission?.status;

    if (status === 'APPROVED' || (stageType === 'FIRST_DRAFT' && status === 'CHANGES_REQUIRED')) {
      return <Iconify icon="mingcute:check-circle-fill" sx={{ color: '#fff' }} width={20} />;
    }
    return <Iconify icon="mdi:clock" sx={{ color: '#fff' }} width={20} />;
  };

  const getStageColor = (stageType) => {
    const submission = value(stageType);
    const status = submission?.status;

    if (status === 'APPROVED' || (stageType === 'FIRST_DRAFT' && status === 'CHANGES_REQUIRED')) {
      return '#5abc6f';
    }
    return '#f6c945';
  };

  if (submissionLoading || deliverableLoading) {
    return (
      <Container maxWidth="sm" sx={{ py: 4, textAlign: 'center' }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  const visibleStages = getVisibleStages();

  return (
    <Container maxWidth="sm" sx={{ py: 1 }}>
      <Stack spacing={3}>   
        {/* Stage List */}
        <Stack spacing={2}>
          {visibleStages?.map((item, index) => (
            <Card
              key={index}
              onClick={() => handleStageClick(item)}
              sx={{
                p: 2.5,
                cursor: 'pointer',
                borderRadius: 2,
                bgcolor: 'white',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  bgcolor: '#f5f5f5',
                  borderColor: '#203ff5',
                  transform: 'translateY(-2px)',
                },
                '&:active': {
                  transform: 'translateY(0px)',
                },
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center" width="100%">
                <Label
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: getStageColor(item.type),
                    flexShrink: 0,
                  }}
                >
                  {getStageIcon(item.type)}
                </Label>

                <Box sx={{ flexGrow: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#8e8e93',
                      display: 'block',
                      mb: 0.4,
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                    }}
                  >
                    Stage {String(item.stage).padStart(2, '0')}
                  </Typography>

                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      mb: 0.5, 
                      fontWeight: 600,
                      fontSize: '1rem',
                      lineHeight: 1.3,
                    }}
                  >
                    {item.name}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      color: '#636366',
                      display: 'block',
                      fontSize: '0.8rem',
                      ...((value(item.type)?.status === 'APPROVED' ||
                        (item.type === 'FIRST_DRAFT' &&
                          value(item.type)?.status === 'CHANGES_REQUIRED')) && {
                        textDecoration: 'line-through',
                        color: '#b0b0b0',
                      }),
                    }}
                  >
                    Due: {dayjs(getDueDate(item.type)).format('D MMMM, YYYY')}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {isNewStage(item.type) && (
                    <Label
                      sx={{
                        bgcolor: '#eb4a26',
                        color: 'white',
                        borderRadius: 1,
                        px: 1,
                        py: 0.5,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      NEW
                    </Label>
                  )}
                  <Iconify
                    icon="eva:arrow-ios-forward-fill"
                    sx={{
                      color: '#203ff5',
                      width: 24,
                      height: 24,
                    }}
                  />
                </Box>
              </Stack>
            </Card>
          ))}
        </Stack>

        {/* Help Text */}
        {/* <Box
          sx={{
            p: 2,
            bgcolor: '#f8f9fa',
            borderRadius: 2,
            border: '1px solid #e9ecef',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <Iconify 
              icon="material-symbols:info" 
              sx={{ color: '#6c757d', mt: 0.2, flexShrink: 0 }} 
              width={16}
            />
            <Typography variant="caption" sx={{ color: '#6c757d', lineHeight: 1.4 }}>
              Tap on any stage to view details and submit your work. Complete stages in order to unlock the next steps.
            </Typography>
          </Stack>
        </Box> */}
      </Stack>
    </Container>
  );
};

export default CampaignMyTasksMobile;

CampaignMyTasksMobile.propTypes = {
  campaign: PropTypes.object,
}; 