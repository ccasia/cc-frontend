import PropTypes from 'prop-types';
import { useState } from 'react';
import { Box, Stack, Button, TextField, Select, MenuItem, FormControl, Chip, Typography, Tooltip } from '@mui/material';
import { BUTTON_STYLES, FEEDBACK_CHIP_STYLES } from './submission-styles';
import { options_changes } from '../constants';
import { getFeedbackActionsVisibility } from './feedback-utils';
import ConfirmDialogV2 from 'src/components/custom-dialog/confirm-dialog-v2';

export default function FeedbackActions({
  submission,
  isClient,
  clientVisible,
  isClientFeedback,
  action,
  setAction,
  reasons,
  setReasons,
  feedback,
  setFeedback,
  loading,
  handleApprove,
  handleRequestChanges,
  campaign,
  hasPostingLink = false,
  onViewLogs
}) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  if ((submission.status === 'CLIENT_APPROVED' || submission.status === 'POSTED' || hasPostingLink) && campaign?.campaignType === 'normal') {
    return null;
  }

  const visibility = getFeedbackActionsVisibility({
    isClient,
    submission,
    clientVisible,
    isClientFeedback,
    action
  });

  if (!visibility.showFeedbackActions) return null;

  const handleConfirmApprove = () => {
    setConfirmDialogOpen(false);
    handleApprove();
  };

  const actionText = !isClient ? 'Send this Submission to Client?' : 'Approve Submission?';

  return (
    <Box sx={{ flex: '0 0 auto' }}>
      <Stack spacing={{ xs: 1, sm: 0 }}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={{ xs: 0.8, sm: 1 }} 
          width="100%" 
          justifyContent="flex-end"
        >
          {visibility.showRequestChangeButton && (
            <Button
              variant="contained"
              color="warning"
              size='small'
              onClick={() => setAction('request_revision')}
              disabled={loading}
              sx={{
                ...BUTTON_STYLES.base,
                ...BUTTON_STYLES.warning,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                py: { xs: 0.6, sm: 0.75 },
                px: { xs: 1.5, sm: 2 },
                minHeight: { xs: 32, sm: 36 },
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              {loading ? 'Processing...' : 'Request a Change'}
            </Button>
          )}

          {visibility.showChangeRequestForm && (
            <Box 
              display="flex" 
              flexDirection={{ xs: 'column', sm: 'row' }} 
              width="100%" 
              gap={{ xs: 0.8, sm: 1 }} 
              justifyContent="flex-end"
            >
              <Button
                variant="contained"
                color="secondary"
                size='small'
                onClick={() => {
                  setAction('approve');
                  setReasons([]);
                }}
                disabled={loading}
                sx={{
                  ...BUTTON_STYLES.base,
                  ...BUTTON_STYLES.secondary,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  py: { xs: 0.6, sm: 0.75 },
                  px: { xs: 1.5, sm: 2 },
                  minHeight: { xs: 32, sm: 36 },
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                Cancel Change Request
              </Button>
              <Button
                variant="contained"
                color={'warning'}
                size='small'
                onClick={handleRequestChanges}
                disabled={loading}
                sx={{
                  ...BUTTON_STYLES.base,
                  ...BUTTON_STYLES.warning,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  py: { xs: 0.6, sm: 0.75 },
                  px: { xs: 1.5, sm: 2 },
                  minHeight: { xs: 32, sm: 36 },
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                {loading ? 'Processing...' : !isClient ? 'Send to Creator' : 'Request a Change'}
              </Button>
            </Box>
          )}

          {visibility.showApproveButton && (
            <Button
              variant="contained"
              color="success"
              size='small'
              onClick={() => setConfirmDialogOpen(true)}
              disabled={loading}
              sx={{
                ...BUTTON_STYLES.base,
                ...BUTTON_STYLES.success,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                py: { xs: 0.6, sm: 0.75 },
                px: { xs: 1.5, sm: 2 },
                minHeight: { xs: 32, sm: 36 },
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              {loading ? 'Processing...' : !isClient ? 'Send to Client' : 'Approve'}
            </Button>
          )}

          {visibility.showAdminClientFeedbackActions && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' }, 
              justifyContent: 'space-between', 
              alignItems: { xs: 'stretch', sm: 'center' }, 
              width: '100%',
              gap: { xs: 1, sm: 0 }
            }}>
              {(() => {
                if (submission.status === 'CLIENT_FEEDBACK' && submission.feedback && submission.feedback.length > 0) {
                  const clientRequestFeedbacks = submission.feedback.filter(fb =>
                    fb.admin?.role === 'client' && fb.type === 'REQUEST'
                  );
                  const latestClientFeedback = clientRequestFeedbacks[0];

                  if (latestClientFeedback?.reasons && latestClientFeedback.reasons.length > 0) {
                    const clientReasons = latestClientFeedback.reasons;
                    const hasMultipleReasons = clientReasons.length > 1;

                  return (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: { xs: 0.3, sm: 0.5 },
                      flexWrap: 'wrap'
                    }}>
                      <Chip
                        sx={{
                          ...FEEDBACK_CHIP_STYLES,
                          fontSize: { xs: '0.65rem', sm: '0.75rem' },
                          height: { xs: 24, sm: 28 },
                          '& .MuiChip-label': {
                            px: { xs: 0.5, sm: 1 }
                          }
                        }}
                        label={clientReasons[0]}
                        size="small"
                        variant="outlined"
                        color="warning"
                      />                        {hasMultipleReasons && (
                          <Tooltip
                            title={
                              <Box sx={{ maxWidth: 500 }}>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {clientReasons.slice(1).map((reason, index) => (
                                    <Chip
                                      key={index}
                                      sx={FEEDBACK_CHIP_STYLES}
                                      label={reason}
                                      size="small"
                                      variant="outlined"
                                      color="warning"
                                    />
                                  ))}
                                </Box>
                              </Box>
                            }
                            placement="top"
                            PopperProps={{
                              modifiers: [
                                {
                                  name: 'offset',
                                  options: {
                                    offset: [0, 0],
                                  },
                                },
                              ],
                            }}
                            slotProps={{
                              tooltip: {
                                sx: {
                                  bgcolor: '#f8f9fa',
                                  color: '#333',
                                  border: '1px solid #e0e0e0',
                                  borderRadius: 1.5,
                                  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.20)',
                                  p: 1,
                                  maxWidth: 400,
                                  fontSize: 12
                                }
                              },
                            }}
                          >
                            <Chip
                              sx={{
                                ...FEEDBACK_CHIP_STYLES,
                                minWidth: 28,
                                height: 28,
                                cursor: 'pointer',
                                '& .MuiChip-label': {
                                  px: 0.5,
                                  fontSize: 14,
                                  fontWeight: 'bold'
                                }
                              }}
                              label={`+${clientReasons.length - 1}`}
                              size="small"
                              variant="outlined"
                              color="warning"
                            />
                          </Tooltip>
                        )}
                      </Box>
                    );
                  }
                }
                return <Box />;
              })()}

              <Button
                variant="contained"
                color="secondary"
                size='small'
                onClick={handleRequestChanges}
                disabled={loading}
                sx={{
                  ...BUTTON_STYLES.base,
                  ...BUTTON_STYLES.warning,
                  width: { xs: '100%', sm: 140 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  py: { xs: 0.6, sm: 0.75 },
                  px: { xs: 1.5, sm: 2 },
                  minHeight: { xs: 32, sm: 36 }
                }}
              >
                {loading ? 'Processing...' : 'Send to Creator'}
              </Button>
            </Box>
          )}
        </Stack>

        {!isClient && submission.status !== 'CLIENT_FEEDBACK' &&
          <Box display={'flex'} justifyContent={'flex-end'}>
            <Button
              size="small"
              variant="text"
              onClick={onViewLogs}
              sx={{
                fontSize: { xs: 11, sm: 12 },
                color: '#919191',
                p: 0,
                minWidth: 'auto',
                textTransform: 'none',
                minHeight: { xs: 28, sm: 32 },
                '&:hover': {
                  backgroundColor: 'transparent',
                },
              }}
            >
              view logs
            </Button>
          </Box>
        }

        {visibility.showReasonsDropdown && (
          <FormControl 
            fullWidth 
            style={{ 
              backgroundColor: '#fff', 
              borderRadius: 10, 
              marginTop: { xs: 4, sm: 5 } 
            }} 
            hiddenLabel 
            size='small'
          >
            <Select
              multiple
              value={reasons}
              onChange={(e) => setReasons(e.target.value)}
              displayEmpty
              sx={{
                '& .MuiSelect-select': {
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  py: { xs: 1, sm: 1.5 },
                }
              }}
              renderValue={(selected) => {
                if (selected.length === 0) {
                  return (
                    <span style={{ 
                      color: '#999', 
                      fontSize: window.innerWidth < 600 ? '0.875rem' : '1rem' 
                    }}>
                      Change Request Reasons
                    </span>
                  );
                }
                return (
                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: { xs: 0.3, sm: 0.5 }, 
                    maxHeight: { xs: 30, sm: 35 } 
                  }}>
                    {selected.map((value) => (
                      <Chip 
                        key={value} 
                        label={value} 
                        size="small"
                        sx={{
                          fontSize: { xs: '0.7rem', sm: '0.75rem' },
                          height: { xs: 20, sm: 24 },
                          '& .MuiChip-label': {
                            px: { xs: 0.5, sm: 0.75 }
                          }
                        }}
                      />
                    ))}
                  </Box>
                );
              }}
            >
              {options_changes.map((option) => (
                <MenuItem 
                  key={option} 
                  value={option}
                  sx={{ 
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    py: { xs: 0.8, sm: 1 }
                  }}
                >
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {(() => {
          const filteredFeedback = submission.feedback?.filter(fb => {
            if (isClient) {
              return fb.type === 'COMMENT';
            }
            if (submission.status === 'SENT_TO_CLIENT') {
              return fb.type === 'COMMENT';
            }
            return fb.type === 'REQUEST';
          }) || [];

          const latestRelevantFeedback = filteredFeedback[0];

          if (!latestRelevantFeedback) {
            return null;
          }

          return (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
              gap: { xs: 0.5, sm: 0 }
            }}>
              {!isClient && latestRelevantFeedback.type === 'REQUEST' && latestRelevantFeedback.admin?.role === 'client' &&
                <>
                  <Typography 
                    variant='caption' 
                    fontWeight="bold" 
                    color={'#636366'}
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                  >
                    Client Feedback
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    onClick={onViewLogs}
                    sx={{
                      fontSize: { xs: 11, sm: 12 },
                      color: '#919191',
                      p: 0,
                      minWidth: 'auto',
                      textTransform: 'none',
                      minHeight: { xs: 28, sm: 32 },
                      '&:hover': {
                        backgroundColor: 'transparent',
                      },
                    }}
                  >
                    view logs
                  </Button>
                </>
              }
            </Box>
          );
        })()}

        <TextField
          style={{ marginTop: { xs: 4, sm: 5 } }}
          multiline
          rows={{ xs: 2, sm: 3 }}
          fullWidth
          placeholder="Insert optional comments here"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.paper',
              fontSize: { xs: '0.875rem', sm: '1rem' },
            },
            '& .MuiInputBase-input': {
              py: { xs: 1, sm: 1.5 },
            }
          }}
          size='small'
        />

        <ConfirmDialogV2
          open={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
          title={actionText}
          emoji={!isClient ? '🫩' : '🙂‍↕️'}
          content=""
          action={
            <Button
              variant="contained"
              color="success"
              onClick={handleConfirmApprove}
              disabled={loading}
            >
              {actionText}
            </Button>
          }
        />
      </Stack>
    </Box>
  );
}

FeedbackActions.propTypes = {
  submission: PropTypes.object.isRequired,
  campaign: PropTypes.object,
  isClient: PropTypes.bool.isRequired,
  clientVisible: PropTypes.bool.isRequired,
  isClientFeedback: PropTypes.bool.isRequired,
  action: PropTypes.string.isRequired,
  setAction: PropTypes.func.isRequired,
  reasons: PropTypes.array.isRequired,
  setReasons: PropTypes.func.isRequired,
  feedback: PropTypes.string.isRequired,
  setFeedback: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  handleApprove: PropTypes.func.isRequired,
  handleRequestChanges: PropTypes.func.isRequired,
  hasPostingLink: PropTypes.bool,
  onViewLogs: PropTypes.func,
};
