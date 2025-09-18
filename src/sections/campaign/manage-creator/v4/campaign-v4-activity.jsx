import useSWR from 'swr';
import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';

import { 
  Box, 
  Grid, 
  Card, 
  Stack, 
  Chip, 
  Button, 
  Typography, 
  LinearProgress,
  CircularProgress
} from '@mui/material';

import { fetcher, endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

import V4VideoSubmission from './submissions/v4-video-submission';
import V4PhotoSubmission from './submissions/v4-photo-submission';
import V4RawFootageSubmission from './submissions/v4-raw-footage-submission';

// Status color mapping for v4 with client feedback support
const getStatusColor = (status) => {
  switch (status) {
    case 'IN_PROGRESS':
      return 'info';
    case 'PENDING_REVIEW':
      return 'warning';
    case 'APPROVED':
    case 'CLIENT_APPROVED':
    case 'POSTED':
      return 'success';
    case 'CHANGES_REQUIRED':
    case 'REJECTED':
      return 'error';
    case 'SENT_TO_CLIENT':
      return 'secondary';
    case 'CLIENT_FEEDBACK':
      return 'warning';
    default:
      return 'default';
  }
};

// Creator-friendly status labels with client feedback states
const getCreatorStatusLabel = (status) => {
  switch (status) {
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'PENDING_REVIEW':
      return 'Admin Review';
    case 'APPROVED':
      return 'Approved';
    case 'CLIENT_APPROVED':
      return 'Approved';
    case 'POSTED':
      return 'Posted';
    case 'CHANGES_REQUIRED':
      return 'Changes Required';
    case 'REJECTED':
      return 'Changes Required';
    case 'SENT_TO_CLIENT':
      return 'Client Review';
    case 'CLIENT_FEEDBACK':
      return 'Client Review';
    default:
      return status;
  }
};

const CampaignV4Activity = ({ campaign }) => {
  const [activeSubmission, setActiveSubmission] = useState(null);
  
  // Fetch creator's v4 submissions
  const { data: submissionsData, error, mutate } = useSWR(
    campaign?.id ? `${endpoints.submission.creator.v4.getMyV4Submissions}?campaignId=${campaign?.id}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );

  // Fetch campaign overview
  const { data: overviewData } = useSWR(
    campaign?.id ? `${endpoints.submission.creator.v4.getMyCampaignOverview}?campaignId=${campaign?.id}` : null,
    fetcher
  );

  useEffect(() => {
    // Auto-select first incomplete submission
    if (submissionsData?.grouped && !activeSubmission) {
      const incomplete = [
        ...submissionsData.grouped.videos,
        ...submissionsData.grouped.photos,
        ...submissionsData.grouped.rawFootage
      ].find(s => !['APPROVED', 'CLIENT_APPROVED'].includes(s.status));
      
      if (incomplete) {
        setActiveSubmission(incomplete);
      }
    }
  }, [submissionsData, activeSubmission]);

  if (error) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="error">Failed to load submissions</Typography>
        <Button onClick={() => mutate()} startIcon={<Iconify icon="eva:refresh-fill" />}>
          Retry
        </Button>
      </Box>
    );
  }

  if (!submissionsData) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  const { grouped, progress, total, completed } = submissionsData;

  // Check if creator's agreement has been approved
  const isAgreementApproved = overviewData?.isAgreementApproved;
  
  // If agreement hasn't been approved, show pending message
  if (!isAgreementApproved && overviewData?.agreementStatus) {
    return (
      <Box>
        {/* Campaign Progress Header */}
        <Card sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12}>
              <Stack spacing={2} alignItems="center" textAlign="center">
                <Iconify icon="eva:clock-outline" width={64} sx={{ color: 'warning.main' }} />
                <Typography variant="h6">Agreement Under Review</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
                  Your agreement is currently being reviewed by our team. You'll be able to start working on your submissions once your agreement has been approved.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Status: {overviewData.agreementStatus?.replace('_', ' ').toUpperCase()}
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      {/* Campaign Progress Header */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography variant="h6">{campaign?.name}</Typography>
                <Chip 
                  label={progress === 100 ? 'Complete' : 'In Progress'} 
                  color={progress === 100 ? 'success' : 'info'} 
                  size="small" 
                />
              </Stack>
              
              <Box>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Overall Progress
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {completed}/{total} submissions completed
                  </Typography>
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Stack>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Stack spacing={1}>
              <Typography variant="caption" color="text.secondary">
                Quick Stats
              </Typography>
              <Stack direction="row" spacing={2}>
                <Stack alignItems="center">
                  <Typography variant="h6" color="success.main">
                    {grouped?.videos?.filter(v => ['APPROVED', 'CLIENT_APPROVED'].includes(v.status))?.length || 0}
                  </Typography>
                  <Typography variant="caption">Videos Done</Typography>
                </Stack>
                <Stack alignItems="center">
                  <Typography variant="h6" color="warning.main">
                    {grouped?.videos?.filter(v => ['PENDING_REVIEW', 'SENT_TO_CLIENT'].includes(v.status))?.length || 0}
                  </Typography>
                  <Typography variant="caption">In Review</Typography>
                </Stack>
                <Stack alignItems="center">
                  <Typography variant="h6" color="error.main">
                    {grouped?.videos?.filter(v => ['CHANGES_REQUIRED', 'REJECTED'].includes(v.status))?.length || 0}
                  </Typography>
                  <Typography variant="caption">Need Changes</Typography>
                </Stack>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      <Grid container spacing={3}>
        {/* Submissions List */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, height: 'fit-content' }}>
            <Typography variant="h6" gutterBottom>
              My Submissions
            </Typography>
            
            <Stack spacing={1}>
              {/* Video Submissions */}
              {grouped?.videos?.map((video, index) => (
                <Button
                  key={video.id}
                  variant={activeSubmission?.id === video.id ? 'contained' : 'outlined'}
                  onClick={() => setActiveSubmission(video)}
                  sx={{ 
                    justifyContent: 'flex-start', 
                    textAlign: 'left',
                    p: 2
                  }}
                  fullWidth
                >
                  <Stack direction="row" alignItems="center" spacing={2} width="100%">
                    <Iconify icon="eva:video-fill" />
                    <Box flex={1}>
                      <Typography variant="body2" fontWeight="bold">
                        Video {video.contentOrder || index + 1}
                      </Typography>
                    </Box>
                    <Chip 
                      label={getCreatorStatusLabel(video.status)} 
                      color={getStatusColor(video.status)} 
                      size="small" 
                    />
                  </Stack>
                </Button>
              ))}

              {/* Photo Submissions */}
              {grouped?.photos?.map((photo) => (
                <Button
                  key={photo.id}
                  variant={activeSubmission?.id === photo.id ? 'contained' : 'outlined'}
                  onClick={() => setActiveSubmission(photo)}
                  sx={{ 
                    justifyContent: 'flex-start', 
                    textAlign: 'left',
                    p: 2
                  }}
                  fullWidth
                >
                  <Stack direction="row" alignItems="center" spacing={2} width="100%">
                    <Iconify icon="eva:image-fill" />
                    <Box flex={1}>
                      <Typography variant="body2" fontWeight="bold">
                        Photos
                      </Typography>
                    </Box>
                    <Chip 
                      label={getCreatorStatusLabel(photo.status)} 
                      color={getStatusColor(photo.status)} 
                      size="small" 
                    />
                  </Stack>
                </Button>
              ))}

              {/* Raw Footage Submissions */}
              {grouped?.rawFootage?.map((rawFootage) => (
                <Button
                  key={rawFootage.id}
                  variant={activeSubmission?.id === rawFootage.id ? 'contained' : 'outlined'}
                  onClick={() => setActiveSubmission(rawFootage)}
                  sx={{ 
                    justifyContent: 'flex-start', 
                    textAlign: 'left',
                    p: 2
                  }}
                  fullWidth
                >
                  <Stack direction="row" alignItems="center" spacing={2} width="100%">
                    <Iconify icon="eva:film-fill" />
                    <Box flex={1}>
                      <Typography variant="body2" fontWeight="bold">
                        Raw Footage
                      </Typography>
                    </Box>
                    <Chip 
                      label={getCreatorStatusLabel(rawFootage.status)} 
                      color={getStatusColor(rawFootage.status)} 
                      size="small" 
                    />
                  </Stack>
                </Button>
              ))}
            </Stack>
          </Card>
        </Grid>

        {/* Active Submission Detail */}
        <Grid item xs={12} md={8}>
          {activeSubmission ? (
            <Card sx={{ p: 3 }}>
              {activeSubmission.submissionType?.type === 'VIDEO' && (
                <V4VideoSubmission 
                  submission={activeSubmission}
                  onUpdate={() => mutate()}
                />
              )}
              
              {activeSubmission.submissionType?.type === 'PHOTO' && (
                <V4PhotoSubmission 
                  submission={activeSubmission}
                  onUpdate={() => mutate()}
                />
              )}
              
              {activeSubmission.submissionType?.type === 'RAW_FOOTAGE' && (
                <V4RawFootageSubmission 
                  submission={activeSubmission}
                  onUpdate={() => mutate()}
                />
              )}
            </Card>
          ) : (
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <Stack spacing={2} alignItems="center">
                <Iconify icon="eva:checkmark-circle-2-fill" width={64} sx={{ color: 'success.main' }} />
                <Typography variant="h6">Processing Agreement</Typography>
              </Stack>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

CampaignV4Activity.propTypes = {
  campaign: PropTypes.object.isRequired,
};

export default CampaignV4Activity;