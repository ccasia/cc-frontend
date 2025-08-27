import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';
import { enqueueSnackbar } from 'notistack';

import {
  Box,
  Card,
  Chip,
  Stack,
  Button,
  Dialog,
  TextField,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  OutlinedInput,
  IconButton,
  Grid,
} from '@mui/material';

import axiosInstance from 'src/utils/axios';
import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { approveV4Submission } from 'src/hooks/use-get-v4-submissions';
import { options_changes } from './constants';

// ----------------------------------------------------------------------

export default function V4RawFootageSubmission({ submission, campaign, index = 1, onUpdate }) {
  const { user } = useAuthContext();
  const [feedbackDialog, setFeedbackDialog] = useState(false);
  const [individualFeedbackDialog, setIndividualFeedbackDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [individualFeedback, setIndividualFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [individualLoading, setIndividualLoading] = useState(false);
  const [action, setAction] = useState('approve');
  const [individualAction, setIndividualAction] = useState('approve');
  const [reasons, setReasons] = useState([]);
  const [individualReasons, setIndividualReasons] = useState([]);
  const [selectedContent, setSelectedContent] = useState(null);
  const [selectedRawFootageFeedback, setSelectedRawFootageFeedback] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [forwardingFeedback, setForwardingFeedback] = useState({});

  // Detect client role
  const userRole = user?.admin?.role?.name || user?.role?.name || user?.role || '';
  const isClient = userRole.toLowerCase() === 'client';

  // Determine if client can see the actual content vs just placeholder
  const clientCanSeeContent = !isClient || ['SENT_TO_CLIENT', 'CLIENT_APPROVED', 'CLIENT_FEEDBACK', 'POSTED'].includes(submission.status);

  const rawFootages = submission.rawFootages || []; // V4 can have multiple raw footage files

  // Individual content feedback handlers
  const handleIndividualFeedback = useCallback((contentId, actionType, contentIndex) => {
    setSelectedContent({ id: contentId, type: 'rawFootage', index: contentIndex });
    setIndividualAction(actionType);
    setIndividualFeedback('');
    setIndividualReasons([]);
    setIndividualFeedbackDialog(true);
  }, []);

  const handleSubmitIndividualFeedback = useCallback(async () => {
    if (!selectedContent) return;
    
    if (individualAction === 'reject' && !individualFeedback.trim()) {
      enqueueSnackbar('Please provide feedback for rejection', { variant: 'error' });
      return;
    }

    if (individualAction === 'request_changes' && !individualFeedback.trim()) {
      enqueueSnackbar('Please provide feedback for changes', { variant: 'error' });
      return;
    }
    
    try {
      setIndividualLoading(true);
      
      if (isClient) {
        // Client-specific endpoint
        const clientAction = individualAction === 'approve' ? 'approve' : 'request_changes';
        const endpoint = clientAction === 'approve' 
          ? '/api/submissions/v4/content/approve/client'
          : '/api/submissions/v4/content/request-changes/client';
          
        await axiosInstance.patch(endpoint, {
          contentType: 'rawFootage',
          contentId: selectedContent.id,
          feedback: individualFeedback.trim() || undefined,
          reasons: individualReasons || []
        });

        enqueueSnackbar(
          `Raw footage ${clientAction === 'approve' ? 'approved' : 'changes requested'} successfully`,
          { variant: 'success' }
        );
      } else {
        // Admin endpoint
        const endpoint = individualAction === 'approve'
          ? '/api/submissions/v4/content/approve'
          : '/api/submissions/v4/content/request-changes';
          
        await axiosInstance.patch(endpoint, {
          contentType: 'rawFootage',
          contentId: selectedContent.id,
          feedback: individualFeedback.trim() || undefined,
          reasons: individualReasons || []
        });

        enqueueSnackbar(
          `Raw footage ${individualAction === 'approve' ? 'approved' : 'rejected'} successfully`,
          { variant: 'success' }
        );
      }
      
      setIndividualFeedbackDialog(false);
      setSelectedContent(null);
      setIndividualFeedback('');
      setIndividualReasons([]);
      onUpdate?.();
    } catch (error) {
      console.error('Error submitting individual feedback:', error);
      enqueueSnackbar(error.message || 'Failed to submit feedback', { variant: 'error' });
    } finally {
      setIndividualLoading(false);
    }
  }, [selectedContent, individualAction, individualFeedback, individualReasons, onUpdate, isClient]);


  const handleShowRawFootageFeedback = useCallback(async (rawFootageId) => {
    try {
      setFeedbackLoading(true);
      setSelectedRawFootageFeedback(null); // Reset previous data
      
      const response = await axiosInstance.get(`/api/submissions/v4/rawFootage/${rawFootageId}/feedback`);
      setSelectedRawFootageFeedback(response.data);
    } catch (error) {
      console.error('Error fetching raw footage feedback:', error);
      enqueueSnackbar('Failed to load feedback', { variant: 'error' });
      setSelectedRawFootageFeedback(null);
    } finally {
      setFeedbackLoading(false);
    }
  }, []);

  const handleForwardFeedback = useCallback(async (feedbackId) => {
    try {
      setForwardingFeedback(prev => ({ ...prev, [feedbackId]: true }));
      
      await axiosInstance.post('/api/submissions/v4/forward-raw-footage-feedback', {
        feedbackId
      });

      enqueueSnackbar('Feedback forwarded to creator successfully', { variant: 'success' });
      
      // Refresh the feedback history
      if (selectedRawFootageFeedback?.content?.id) {
        const response = await axiosInstance.get(`/api/submissions/v4/rawFootage/${selectedRawFootageFeedback.content.id}/feedback`);
        setSelectedRawFootageFeedback(response.data);
      }
      
      // Refresh the main submission data
      onUpdate?.();
    } catch (error) {
      console.error('Error forwarding feedback:', error);
      enqueueSnackbar(error.message || 'Failed to forward feedback', { variant: 'error' });
    } finally {
      setForwardingFeedback(prev => ({ ...prev, [feedbackId]: false }));
    }
  }, [selectedRawFootageFeedback, onUpdate]);

  const getStatusColor = (status) => {
    const statusColors = {
      PENDING_REVIEW: 'warning',
      IN_PROGRESS: 'info', 
      APPROVED: 'success',
      REJECTED: 'error',
      CHANGES_REQUIRED: 'warning',
      SENT_TO_CLIENT: 'primary',
      CLIENT_APPROVED: 'success',
      CLIENT_FEEDBACK: 'warning',
      SENT_TO_ADMIN: 'info',
    };
    return statusColors[status] || 'default';
  };

  const formatStatus = (status) => {
    return status?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  };

  // Map admin statuses to client-friendly labels based on the business process
  const getClientStatusLabel = (status) => {
    if (!isClient) return formatStatus(status); // Admins see the raw status

    switch (status) {
      case 'NOT_STARTED':
        return 'Not Started';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'PENDING_REVIEW':
        return 'In Progress'; // Creator has submitted, admin reviewing
      case 'SENT_TO_CLIENT':
        return 'Pending Review'; // Client should see this as pending their review
      case 'CLIENT_APPROVED':
      case 'APPROVED':
        return 'Approved';
      case 'CLIENT_FEEDBACK':
        return 'Changes Required'; // Client requested changes
      case 'CHANGES_REQUIRED':
      case 'REJECTED':
        return 'Changes Required';
      default:
        return formatStatus(status);
    }
  };

  return (
    <>
      <Accordion>
        <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Iconify icon="eva:film-fill" sx={{ color: 'warning.main' }} />
                <Typography variant="h6">
                  Raw Footage {index}
                </Typography>
                <Chip
                  label={getClientStatusLabel(submission.status)}
                  color={getStatusColor(submission.status)}
                  size="small"
                />
              </Stack>
            </Box>
          </Stack>
        </AccordionSummary>

        <AccordionDetails>
          <Stack spacing={3}>
            {/* Raw Footage Content */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Raw Footage Content {clientCanSeeContent && rawFootages.length > 0 && `(${rawFootages.length} file${rawFootages.length !== 1 ? 's' : ''})`}
              </Typography>
              
              {clientCanSeeContent ? (
                // Show actual content to admins or when sent to client
                rawFootages.length > 0 ? (
                  <Grid container spacing={2}>
                    {rawFootages.map((rawFootage, footageIndex) => (
                      <Grid item xs={12} sm={6} md={4} key={rawFootage.id || footageIndex}>
                        <Card sx={{ overflow: 'hidden' }}>
                          {rawFootage.url ? (
                            <Box
                              sx={{
                                position: 'relative',
                                width: '100%',
                                height: 200,
                                bgcolor: 'background.neutral',
                              }}
                            >
                              <video
                                controls
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                src={rawFootage.url}
                              >
                                <track kind="captions" srcLang="en" label="English" />
                              </video>
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                height: 200,
                                bgcolor: 'background.neutral',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Stack spacing={2} alignItems="center">
                                <Iconify icon="eva:film-fill" sx={{ color: 'text.disabled', fontSize: 48 }} />
                                <Typography color="text.secondary">No raw footage uploaded yet</Typography>
                              </Stack>
                            </Box>
                          )}
                          
                          <Box sx={{ p: 1 }}>
                            <Stack spacing={1}>
                              <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Typography variant="caption" fontWeight="medium">
                                  Raw Footage {footageIndex + 1}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => handleShowRawFootageFeedback(rawFootage.id)}
                                  title="View feedback history"
                                >
                                  <Iconify icon="eva:message-circle-outline" />
                                </IconButton>
                              </Stack>
                              
                              <Chip
                                label={getClientStatusLabel(rawFootage.status)}
                                color={getStatusColor(rawFootage.status)}
                                size="small"
                              />
                              
                              {/* Individual feedback buttons for admin */}
                              {!isClient && ['PENDING'].includes(rawFootage.status) && (
                                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    onClick={() => handleIndividualFeedback(rawFootage.id, 'approve', footageIndex)}
                                    startIcon={<Iconify icon="eva:checkmark-fill" />}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={() => handleIndividualFeedback(rawFootage.id, 'request_changes', footageIndex)}
                                    startIcon={<Iconify icon="eva:close-fill" />}
                                  >
                                    Request a Change
                                  </Button>
                                </Stack>
                              )}
                              
                              {/* Individual feedback buttons for client */}
                              {isClient && rawFootage.status === 'SENT_TO_CLIENT' && (
                                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    onClick={() => handleIndividualFeedback(rawFootage.id, 'approve', footageIndex)}
                                    startIcon={<Iconify icon="eva:checkmark-fill" />}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="warning"
                                    onClick={() => handleIndividualFeedback(rawFootage.id, 'request_changes', footageIndex)}
                                    startIcon={<Iconify icon="eva:edit-fill" />}
                                  >
                                    Request a Change
                                  </Button>
                                </Stack>
                              )}
                              
                              {rawFootage.feedback && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="caption" fontWeight="medium">
                                    Feedback:
                                  </Typography>
                                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                    {rawFootage.feedback}
                                  </Typography>
                                </Box>
                              )}
                            </Stack>
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography color="text.secondary">No raw footage uploaded yet</Typography>
                )
              ) : (
                // Show placeholder for clients when content is being processed
                <Card sx={{ p: 3, bgcolor: 'background.neutral', textAlign: 'center' }}>
                  <Stack spacing={2} alignItems="center">
                    <Iconify icon="eva:film-fill" sx={{ color: 'text.disabled', fontSize: 48 }} />
                    <Typography variant="body2" color="text.secondary">
                      Raw footage content is being processed by the admin
                    </Typography>
                    <Chip
                      label="In Progress"
                      color="info"
                      size="small"
                    />
                  </Stack>
                </Card>
              )}
            </Box>

            {/* Caption */}
            {submission.caption && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Caption
                </Typography>
                <Card sx={{ p: 2, bgcolor: 'background.neutral' }}>
                  <Typography variant="body2">{submission.caption}</Typography>
                </Card>
              </Box>
            )}


            {/* Submission Metadata */}
            <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">
                Created: {new Date(submission.createdAt).toLocaleString()} •
                Last updated: {new Date(submission.updatedAt).toLocaleString()}
              </Typography>
            </Box>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Individual Content Feedback Dialog */}
      <Dialog open={individualFeedbackDialog} onClose={() => setIndividualFeedbackDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {individualAction === 'approve' ? 'Approve Raw Footage Content' : 'Request Changes for Raw Footage Content'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label={individualAction === 'approve' ? 'Approval message (optional)' : 'Feedback'}
            value={individualFeedback}
            onChange={(e) => setIndividualFeedback(e.target.value)}
            placeholder={
              individualAction === 'approve' ? 'Add any comments about this raw footage...' :
              'Please specify what changes are needed for this raw footage...'
            }
            sx={{ mt: 1 }}
          />
        
          {/* Reasons selection for request changes */}
          {individualAction === 'request_changes' && (
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Select Issues (Optional)</InputLabel>
                <Select
                  multiple
                  value={individualReasons}
                  onChange={(e) => setIndividualReasons(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                  input={<OutlinedInput label="Select Issues (Optional)" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {options_changes.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIndividualFeedbackDialog(false)} disabled={individualLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitIndividualFeedback}
            variant="contained"
            loading={individualLoading}
            color={individualAction === 'approve' ? 'success' : 'warning'}
          >
            {individualAction === 'approve' ? 'Approve Raw Footage' : 'Request Changes'}
          </Button>
        </DialogActions>
      </Dialog>


      {/* Raw Footage Feedback History Dialog */}
      <Dialog open={Boolean(selectedRawFootageFeedback)} onClose={() => setSelectedRawFootageFeedback(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Iconify icon="eva:message-circle-fill" />
            <Typography variant="h6">
              Feedback History - Raw Footage
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {feedbackLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <Typography>Loading feedback...</Typography>
            </Box>
          ) : selectedRawFootageFeedback && selectedRawFootageFeedback.content ? (
            <Stack spacing={3}>
              {/* Raw Footage Info */}
              <Card sx={{ p: 2, bgcolor: 'background.neutral' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  {selectedRawFootageFeedback.content?.url && (
                    <Box sx={{ width: 80, height: 60, bgcolor: 'background.paper', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Iconify icon="eva:film-fill" sx={{ color: 'text.disabled', fontSize: 24 }} />
                    </Box>
                  )}
                  <Box>
                    <Typography variant="subtitle2">
                      Raw Footage ID: {selectedRawFootageFeedback.content?.id}
                    </Typography>
                    <Chip
                      label={formatStatus(selectedRawFootageFeedback.content?.status)}
                      color={getStatusColor(selectedRawFootageFeedback.content?.status)}
                      size="small"
                    />
                  </Box>
                </Stack>
              </Card>

              {/* Feedback History */}
              {selectedRawFootageFeedback.feedbackHistory?.length > 0 ? (
                <Stack spacing={2}>
                  <Typography variant="subtitle2">
                    Feedback History ({selectedRawFootageFeedback.totalFeedback} items):
                  </Typography>
                  {selectedRawFootageFeedback.feedbackHistory
                    .filter((feedback, index, array) => {
                      // Remove duplicates by checking if this is the first occurrence of this feedback content and timestamp
                      return array.findIndex(f => 
                        f.feedback === feedback.feedback && 
                        f.createdAt === feedback.createdAt &&
                        f.admin?.name === feedback.admin?.name
                      ) === index;
                    })
                    .map((feedback) => (
                    <Card key={`${feedback.id}-${feedback.type}-${feedback.createdAt}`} sx={{ p: 2 }}>
                      <Stack spacing={1}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Box sx={{ 
                            minWidth: 32, 
                            height: 32, 
                            borderRadius: '50%', 
                            bgcolor: feedback.type === 'individual' && feedback.status === 'CLIENT_FEEDBACK' ? 'warning.main' : 'primary.main',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                          }}>
                            <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
                              {feedback.type === 'individual' && feedback.status === 'CLIENT_FEEDBACK' ? 'C' : feedback.admin?.name?.charAt(0) || 'A'}
                            </Typography>
                          </Box>
                          <Box flex={1}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="subtitle2">
                                {feedback.admin?.name || 'Admin'}
                                {feedback.type === 'individual' && feedback.status === 'CLIENT_FEEDBACK' && ' (Client)'}
                              </Typography>
                              <Chip 
                                label={feedback.type === 'individual' && feedback.status === 'CLIENT_FEEDBACK' ? 'Client Feedback' : feedback.type === 'individual' ? 'Individual Feedback' : 'Admin Feedback'} 
                                size="small" 
                                variant="outlined"
                                color={feedback.type === 'individual' && feedback.status === 'CLIENT_FEEDBACK' ? 'warning' : feedback.type === 'individual' ? 'info' : 'primary'}
                              />
                              {!feedback.sentToCreator && feedback.type === 'individual' && feedback.admin && typeof feedback.admin === 'object' && feedback.status === 'CLIENT_FEEDBACK' && (
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Chip 
                                    label="Pending Forward" 
                                    size="small" 
                                    color="warning"
                                  />
                                  {!isClient && (
                                    <Button
                                      size="small"
                                      variant="contained"
                                      color="primary"
                                      onClick={() => handleForwardFeedback(feedback.id)}
                                      disabled={forwardingFeedback[feedback.id]}
                                      startIcon={forwardingFeedback[feedback.id] ? 
                                        <Iconify icon="eva:loader-outline" spin /> : 
                                        <Iconify icon="eva:arrow-forward-fill" />
                                      }
                                    >
                                      {forwardingFeedback[feedback.id] ? 'Forwarding...' : 'Forward'}
                                    </Button>
                                  )}
                                </Stack>
                              )}
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(feedback.createdAt).toLocaleString()}
                              {feedback.sentToCreator && feedback.type === 'individual' && feedback.status === 'CLIENT_FEEDBACK' && ' (forwarded to creator)'}
                            </Typography>
                          </Box>
                        </Stack>
                        
                        <Typography variant="body2">
                          {feedback.feedback}
                        </Typography>
                        
                        {feedback.reasons?.length > 0 && (
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {feedback.reasons.map((reason, i) => (
                              <Chip key={i} label={reason} size="small" variant="outlined" color="warning" />
                            ))}
                          </Stack>
                        )}
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Typography color="text.secondary" textAlign="center" py={2}>
                  No feedback available for this raw footage yet.
                </Typography>
              )}
            </Stack>
          ) : (
            <Typography color="text.secondary" textAlign="center" py={2}>
              {selectedRawFootageFeedback === null ? 'Failed to load feedback data. Please try again.' : 'No feedback data available.'}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedRawFootageFeedback(null)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

    </>
  );
}

V4RawFootageSubmission.propTypes = {
  submission: PropTypes.object.isRequired,
  campaign: PropTypes.object.isRequired,
  index: PropTypes.number,
  onUpdate: PropTypes.func,
};