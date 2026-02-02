import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

import { Box, Card, Stack, Collapse, Typography, IconButton, useMediaQuery } from '@mui/material';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

import CampaignPosting from './submissions/campaign-posting';
import LogisticsForm from './submissions/campaign-logistics';
import CampaignAgreement from './submissions/campaign-agreement';
import CampaignFirstDraft from './submissions/campaign-first-draft';
import CampaignFinalDraft from './submissions/campaign-final-draft';

export const defaultSubmission = [
  {
    name: 'Agreement Submission ✍',
    value: 'Agreement',
    type: 'AGREEMENT_FORM',
    stage: 1,
    icon: 'solar:document-text-bold',
  },
  {
    name: 'Product Delivery Info 📦',
    value: 'Product Delivery',
    type: 'PRODUCT_DELIVERY',
    stage: 2,
    icon: 'solar:box-bold',
  },
  {
    name: 'Draft Submission 📝',
    value: 'First Draft',
    type: 'FIRST_DRAFT',
    stage: 2,
    icon: 'solar:video-library-bold',
  },
  {
    name: '2nd Draft Submission 📝',
    value: 'Final Draft',
    type: 'FINAL_DRAFT',
    stage: 3,
    icon: 'solar:video-library-bold',
  },
  {
    name: 'Posting Link Submission 🔗',
    value: 'Posting',
    type: 'POSTING',
    stage: 4,
    icon: 'solar:link-bold',
  },
];

const MobileSubmissionLayout = ({
  campaign,
  submissions,
  value,
  getDependency,
  getVisibleStages,
  getDueDate,
  agreementStatus,
  setCurrentTab,
  deliverablesData,
  viewedStages,
  setViewedStages,
  isNewStage,
  user,
  logistic,
  mutateLogistic,
  onConfirm,
}) => {
  const isMobile = useMediaQuery('(max-width: 900px)');
  const [expandedStage, setExpandedStage] = useState(null);

  const isLogisticsCompleted = !!logistic;

  if (!isMobile) {
    return null; // Only render on mobile
  }

  const handleStageClick = (stageType) => {
    // Toggle expansion
    if (expandedStage === stageType) {
      setExpandedStage(null);
    } else {
      setExpandedStage(stageType);
      
      // Mark as viewed
      if (!viewedStages.includes(stageType)) {
        const newViewedStages = [...viewedStages, stageType];
        setViewedStages(newViewedStages);
        // Save to localStorage
        localStorage.setItem(
          `viewedStages-${campaign.id}-${value('AGREEMENT_FORM')?.userId}`,
          JSON.stringify(newViewedStages)
        );
      }
    }
  };

  const getStageIcon = (stageType, status) => {
    if (
      status === 'APPROVED' ||
      (stageType === 'FIRST_DRAFT' && status === 'CHANGES_REQUIRED') ||
      (stageType === 'PRODUCT_DELIVERY' && isLogisticsCompleted)
    ) {
      return (
        <Label
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#5abc6f',
          }}
        >
          <Iconify icon="mingcute:check-circle-fill" sx={{ color: '#fff' }} width={20} />
        </Label>
      );
    }
    return (
      <Label
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f6c945',
        }}
      >
        <Iconify icon="mdi:clock" sx={{ color: '#fff' }} width={20} />
      </Label>
    );
  };

  const renderSubmissionContent = (stageType) => {
    switch (stageType) {
      case 'AGREEMENT_FORM':
        return (
          <CampaignAgreement
            campaign={campaign}
            timeline={campaign?.campaignTimeline}
            submission={value('AGREEMENT_FORM')}
            getDependency={getDependency}
            agreementStatus={agreementStatus}
          />
        );
      case 'PRODUCT_DELIVERY':
        return (
          <LogisticsForm
            user={user}
            isLogisticsCompleted={isLogisticsCompleted}
            submission={value('AGREEMENT_FORM')}
            onConfirm={onConfirm}
            campaignId={campaign.id}
            onUpdate={async () => {
              await mutateLogistic();
            }}
          />
        );

      case 'FIRST_DRAFT':
        return (
          <CampaignFirstDraft
            campaign={campaign}
            timeline={campaign?.campaignTimeline}
            fullSubmission={submissions}
            submission={value('FIRST_DRAFT')}
            getDependency={getDependency}
            setCurrentTab={setCurrentTab}
            deliverablesData={deliverablesData}
          />
        );
      case 'FINAL_DRAFT':
        return (
          <CampaignFinalDraft
            campaign={campaign}
            timeline={campaign?.campaignTimeline}
            submission={value('FINAL_DRAFT')}
            fullSubmission={submissions}
            getDependency={getDependency}
            setCurrentTab={setCurrentTab}
            deliverablesData={deliverablesData}
          />
        );
      case 'POSTING':
        return (
          <CampaignPosting
            campaign={campaign}
            timeline={campaign?.campaignTimeline}
            submission={value('POSTING')}
            fullSubmission={submissions}
            getDependency={getDependency}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Stack spacing={1} sx={{ width: '100%' }}>
      {getVisibleStages()?.map((stage, index) => (
        <Card
          key={stage.type}
          sx={{
            boxShadow: 'none',
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'visible',
          }}
        >
          {/* Stage Header - Clickable */}
          <Box
            sx={{
              p: 2.5,
              cursor: 'pointer',
              '&:hover': {
                bgcolor: '#f5f5f5',
                borderRadius: 2,
              },
              display: 'flex',
              alignItems: 'center',
            }}
            onClick={() => handleStageClick(stage.type)}
          >
            <Stack direction="row" spacing={2} alignItems="center" width="100%">
              {getStageIcon(stage.type, value(stage.type)?.status)}

              <Box sx={{ flexGrow: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#8e8e93',
                    display: 'block',
                    mb: 0.4,
                    textTransform: 'uppercase',
                    fontWeight: 700,
                  }}
                >
                  Stage {String(stage.stage).padStart(2, '0')}
                </Typography>

                <Typography variant="subtitle1" sx={{ mb: 0.2, fontWeight: 600 }}>
                  {stage.name}
                </Typography>

                <Typography
                  variant="caption"
                  sx={{
                    color: '#636366',
                    display: 'block',
                    ...((value(stage.type)?.status === 'APPROVED' ||
                      (stage.type === 'FIRST_DRAFT' &&
                        value(stage.type)?.status === 'CHANGES_REQUIRED') ||
                      (stage.type === 'PRODUCT_DELIVERY' && isLogisticsCompleted)) && {
                      textDecoration: 'line-through',
                      color: '#b0b0b0',
                    }),
                  }}
                >
                  Due:{' '}
                  {dayjs(
                    stage.type === 'PRODUCT_DELIVERY'
                      ? getDueDate('AGREEMENT_FORM')
                      : getDueDate(stage.type)
                  ).format('D MMMM, YYYY')}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {isNewStage(stage.type) && (
                  <Label
                    sx={{
                      bgcolor: 'transparent',
                      color: '#eb4a26',
                      border: '1px solid #eb4a26',
                      borderBottom: '3px solid #eb4a26',
                      borderRadius: 0.7,
                      px: 0.8,
                      py: 1.5,
                      mr: 1,
                      fontSize: '0.75rem',
                    }}
                  >
                    NEW
                  </Label>
                )}
                
                <IconButton
                  sx={{
                    color: 'text.secondary',
                    transform: expandedStage === stage.type ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease-in-out',
                  }}
                >
                  <Iconify icon="eva:arrow-ios-downward-fill" width={20} />
                </IconButton>
              </Box>
            </Stack>
          </Box>

          {/* Collapsible Content */}
          <Collapse in={expandedStage === stage.type} timeout="auto" unmountOnExit>
            <Box
              sx={{
                borderTop: '1px solid',
                borderColor: 'divider',
                bgcolor: '#fafafa',
                p: { xs: 2, sm: 3 },
                mx: { xs: 1, sm: 2 },
                mb: 2,
                mt: 1,
                borderRadius: 2,
                overflow: 'hidden', // Prevent content from overflowing
                // Override styles for mobile-specific adjustments
                '& .MuiChip-root': {
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                  height: { xs: '24px', sm: '28px' },
                  '& .MuiChip-label': {
                    px: { xs: 0.5, sm: 1 },
                    py: { xs: 0.25, sm: 0.5 },
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    fontWeight: { xs: 600, sm: 650 },
                  },
                },
                // Ensure loading progress bars stay within bounds
                '& .MuiLinearProgress-root': {
                  maxWidth: '100%',
                  overflow: 'hidden',
                },
                // Adjust any containers that might overflow
                '& > *': {
                  maxWidth: '100%',
                  overflow: 'hidden',
                },
                // Hide duplicate titles in mobile dropdown
                '& > div:first-of-type > div:first-of-type': {
                  display: 'none', // Hide the title section
                },
                // Alternative selector for different title structures
                '& h4': {
                  display: 'none',
                },
                // Hide title dividers that appear after titles
                '& > div:first-of-type > div:nth-of-type(2)': {
                  display: 'none',
                },
              }}
            >
              {renderSubmissionContent(stage.type)}
            </Box>
          </Collapse>
        </Card>
      ))}
    </Stack>
  );
};

export default MobileSubmissionLayout;

MobileSubmissionLayout.propTypes = {
  campaign: PropTypes.object.isRequired,
  submissions: PropTypes.array,
  value: PropTypes.func.isRequired,
  getDependency: PropTypes.func.isRequired,
  getVisibleStages: PropTypes.func.isRequired,
  getDueDate: PropTypes.func.isRequired,
  agreementStatus: PropTypes.bool,
  setCurrentTab: PropTypes.func,
  deliverablesData: PropTypes.object,
  viewedStages: PropTypes.array,
  setViewedStages: PropTypes.func,
  isNewStage: PropTypes.func,
  user: PropTypes.object,
  logistic: PropTypes.object,
  mutateLogistic: PropTypes.func,
  onConfirm: PropTypes.func,
};
