import PropTypes from 'prop-types';
import { Box, Stack, Button, TextField, Select, MenuItem, FormControl, Chip, Typography, Tooltip } from '@mui/material';
import { BUTTON_STYLES, FEEDBACK_CHIP_STYLES } from './submission-styles';
import { options_changes } from '../constants';
import { getFeedbackActionsVisibility } from './feedback-utils';

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

  return (
    <Box sx={{ flex: '0 0 auto' }}>
      <Stack>
        <Stack direction="row" spacing={1} width="100%" justifyContent="flex-end">
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
              }}
            >
              {loading ? 'Processing...' : 'Request a Change'}
            </Button>
          )}

          {visibility.showChangeRequestForm && (
            <Box display="flex" flexDirection="row" width="100%" gap={1} justifyContent="flex-end">
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
              onClick={handleApprove}
              disabled={loading}
              sx={{
                ...BUTTON_STYLES.base,
                ...BUTTON_STYLES.success,
              }}
            >
              {loading ? 'Processing...' : !isClient ? 'Send to Client' : 'Approve'}
            </Button>
          )}

          {visibility.showAdminClientFeedbackActions && (
            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Chip
                          sx={FEEDBACK_CHIP_STYLES}
                          label={clientReasons[0]}
                          size="small"
                          variant="outlined"
                          color="warning"
                        />

                        {hasMultipleReasons && (
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
                  width: 140,
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
                fontSize: 12,
                color: '#919191',
                p:0,
                minWidth: 'auto',
                textTransform: 'none',
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
          <FormControl fullWidth style={{ backgroundColor: '#fff', borderRadius: 10, marginTop: 8 }} hiddenLabel size='small'>
            <Select
              multiple
              value={reasons}
              onChange={(e) => setReasons(e.target.value)}
              displayEmpty
              renderValue={(selected) => {
                if (selected.length === 0) {
                  return <span style={{ color: '#999' }}>Change Request Reasons</span>;
                }
                return (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxHeight: 35 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                );
              }}
            >
              {options_changes.map((option) => (
                <MenuItem key={option} value={option}>
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
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: 1 }}>
              {!isClient && latestRelevantFeedback.type === 'REQUEST' && latestRelevantFeedback.admin?.role === 'client' &&
                <>
                  <Typography variant='caption' fontWeight="bold" color={'#636366'}>
                    Client Feedback
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    onClick={onViewLogs}
                    sx={{
                      fontSize: 12,
                      color: '#919191',
                      p: 0,
                      minWidth: 'auto',
                      textTransform: 'none',
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
          multiline
          rows={3}
          fullWidth
          placeholder="Insert optional comments here"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.paper',
            },
          }}
          size='small'
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
