import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';

import {
  Box,
  Card,
  Chip,
  Stack,
  Avatar,
  Button,
  Dialog,
  Divider,
  TextField,
  Typography,
  IconButton,
  DialogTitle,
  DialogActions,
  DialogContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import { useGetV4Submissions } from 'src/hooks/use-get-v4-submissions';

import V4VideoSubmission from './submissions/v4/video-submission';
import V4PhotoSubmission from './submissions/v4/photo-submission';
import V4RawFootageSubmission from './submissions/v4/raw-footage-submission';

// ----------------------------------------------------------------------

export default function CampaignCreatorSubmissionsV4({ campaign }) {
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Get V4 submissions for selected creator
  const { 
    submissions, 
    grouped, 
    submissionsLoading,
    submissionsMutate 
  } = useGetV4Submissions(campaign?.id, selectedCreator?.userId);

  const handleSelectCreator = useCallback((creator) => {
    setSelectedCreator(creator);
  }, []);

  // Calculate expected submissions for a creator based on campaign requirements
  // Only shows content submissions (VIDEO, PHOTO, RAW_FOOTAGE) - Agreement is handled in separate tab
  const getExpectedSubmissions = useCallback((creator) => {
    const expectedSubmissions = [];
    
    // Add video submissions based on ugcVideos count
    const ugcVideos = creator.ugcVideos || 0;
    for (let i = 1; i <= ugcVideos; i++) {
      expectedSubmissions.push({ type: 'VIDEO', label: `Video ${i}`, order: i });
    }
    
    // Add photo submission if required
    if (campaign?.photos) {
      expectedSubmissions.push({ type: 'PHOTO', label: 'Photos' });
    }
    
    // Add raw footage submission if required (single submission, multiple uploads like photos)
    if (campaign?.rawFootage) {
      expectedSubmissions.push({ type: 'RAW_FOOTAGE', label: 'Raw Footage' });
    }
    
    return expectedSubmissions;
  }, [campaign]);

  const handleSearchChange = useCallback((event) => {
    setSearchTerm(event.target.value);
  }, []);

  // Get submission status for expected submissions
  const getSubmissionStatus = useCallback((creator, expectedType, order = null) => {
    if (!submissions || submissions.length === 0) return 'Not Created';
    
    let matchingSubmission;
    
    if (order) {
      // For videos and raw footage with specific order
      matchingSubmission = submissions.find(s => 
        s.submissionType.type === expectedType && s.contentOrder === order
      );
    } else {
      // For photos (no specific order)
      matchingSubmission = submissions.find(s => s.submissionType.type === expectedType);
    }
    
    if (!matchingSubmission) return 'Not Created';
    
    // Return formatted status
    return matchingSubmission.status?.replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  }, [submissions]);

  // Get status color for display
  const getStatusColor = useCallback((status) => {
    if (status === 'Not Created') return 'default';
    
    const statusColors = {
      'Pending Review': 'warning',
      'In Progress': 'info', 
      'Approved': 'success',
      'Rejected': 'error',
      'Changes Required': 'warning',
      'Sent To Client': 'primary',
      'Client Approved': 'success',
      'Client Feedback': 'warning',
      'Sent To Admin': 'info',
    };
    return statusColors[status] || 'default';
  }, []);

  // Filter creators based on search term
  const filteredCreators = campaign?.shortlisted?.filter(creator => {
    const name = creator.user?.name?.toLowerCase() || '';
    const email = creator.user?.email?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    return name.includes(searchLower) || email.includes(searchLower);
  }) || [];

  // Only show V4 campaigns
  if (campaign?.submissionVersion !== 'v4') {
    return (
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" color="text.secondary" textAlign="center">
          V4 Creator Submissions
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
          This tab is only available for V4 campaigns with content-type based submissions.
        </Typography>
        <Typography variant="caption" color="text.secondary" textAlign="center" display="block" sx={{ mt: 1 }}>
          Current campaign version: {campaign?.submissionVersion || 'v3'}
        </Typography>
      </Card>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex' }}>
      {/* Creator Sidebar */}
      <Card sx={{ width: 350, mr: 2, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom>
            Creators ({filteredCreators.length})
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Search creators..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled', mr: 1 }} />,
            }}
          />
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {filteredCreators.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No creators found
              </Typography>
            </Box>
          ) : (
            filteredCreators.map((creator, index) => {
              const expectedSubmissions = getExpectedSubmissions(creator);
              const isSelected = selectedCreator?.userId === creator.userId;
              
              // Calculate completion status for this creator
              const completedCount = expectedSubmissions.filter(expected => {
                const status = getSubmissionStatus(creator, expected.type, expected.order);
                return status === 'Approved' || status === 'Client Approved';
              }).length;
              
              const totalCount = expectedSubmissions.length;
              
              return (
                <Box key={creator.userId || index}>
                  <Button
                    fullWidth
                    onClick={() => handleSelectCreator(creator)}
                    sx={{
                      p: 2,
                      justifyContent: 'flex-start',
                      borderRadius: 0,
                      bgcolor: isSelected ? 'action.selected' : 'transparent',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <Avatar
                      src={creator.user?.photoURL}
                      alt={creator.user?.name}
                      sx={{ width: 40, height: 40, mr: 2 }}
                    >
                      {creator.user?.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, textAlign: 'left' }}>
                      <Typography variant="subtitle2" noWrap>
                        {creator.user?.name || 'Unknown Creator'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {creator.user?.email}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        {completedCount}/{totalCount} submissions completed
                      </Typography>
                    </Box>
                  </Button>
                  
                  {/* Show individual submissions when selected */}
                  {isSelected && (
                    <Box sx={{ pl: 2, pr: 1, pb: 1, bgcolor: 'action.selected' }}>
                      <Stack spacing={0.5}>
                        {expectedSubmissions.map((expected, submissionIndex) => {
                          const status = getSubmissionStatus(creator, expected.type, expected.order);
                          return (
                            <Stack
                              key={`${expected.type}-${expected.order || 0}`}
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                              sx={{ py: 0.5, px: 1 }}
                            >
                              <Typography variant="caption" color="text.secondary">
                                {expected.label}
                              </Typography>
                              <Chip
                                label={status}
                                color={getStatusColor(status)}
                                size="small"
                                sx={{ 
                                  height: 18, 
                                  fontSize: '0.7rem',
                                  '& .MuiChip-label': { px: 0.75 }
                                }}
                              />
                            </Stack>
                          );
                        })}
                      </Stack>
                    </Box>
                  )}
                  
                  {index < filteredCreators.length - 1 && <Divider />}
                </Box>
              );
            })
          )}
        </Box>
      </Card>

      {/* Submissions Content */}
      <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedCreator ? (
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {/* Creator Header */}
            <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar
                  src={selectedCreator.user?.photoURL}
                  alt={selectedCreator.user?.name}
                  sx={{ width: 50, height: 50 }}
                >
                  {selectedCreator.user?.name?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedCreator.user?.name || 'Unknown Creator'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedCreator.user?.email}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Loading State */}
            {submissionsLoading && (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography>Loading submissions...</Typography>
              </Box>
            )}

            {/* Submissions */}
            {!submissionsLoading && (
              <Box sx={{ p: 2 }}>
                {submissions.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No content submissions found for this creator
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Content submissions are created automatically when the creator's agreement is approved
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {/* Video Submissions */}
                    {grouped.videos?.map((videoSubmission, index) => (
                      <V4VideoSubmission
                        key={videoSubmission.id}
                        submission={videoSubmission}
                        campaign={campaign}
                        index={index + 1}
                        onUpdate={submissionsMutate}
                      />
                    ))}

                    {/* Photo Submissions */}
                    {grouped.photos?.map((photoSubmission, index) => (
                      <V4PhotoSubmission
                        key={photoSubmission.id}
                        submission={photoSubmission}
                        campaign={campaign}
                        index={index + 1}
                        onUpdate={submissionsMutate}
                      />
                    ))}

                    {/* Raw Footage Submissions */}
                    {grouped.rawFootage?.map((rawFootageSubmission, index) => (
                      <V4RawFootageSubmission
                        key={rawFootageSubmission.id}
                        submission={rawFootageSubmission}
                        campaign={campaign}
                        index={index + 1}
                        onUpdate={submissionsMutate}
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Iconify icon="eva:people-outline" sx={{ width: 64, height: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Select a Creator
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose a creator from the left panel to view their V4 submissions
              </Typography>
            </Box>
          </Box>
        )}
      </Card>
    </Box>
  );
}

CampaignCreatorSubmissionsV4.propTypes = {
  campaign: PropTypes.object,
};