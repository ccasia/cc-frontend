import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, IconButton, Typography, Stack, Chip, Tooltip } from '@mui/material';
import { FEEDBACK_CHIP_STYLES } from './submission-styles';
import Iconify from 'src/components/iconify';
import { formatDateTime } from 'src/utils/format-time';
import axios from 'axios';

export default function FeedbackLogs({ submission, onClose }) {
  const feedbackLogs = submission.feedback || [];
  const [activeTab, setActiveTab] = useState(0);
  const [captionHistory, setCaptionHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const captionEdits = submission.caption;

  const commentsAndFeedback = feedbackLogs.filter(log =>
    (log.type === 'REQUEST' || log.type === 'COMMENT') && (log.content !== '' || (log.reasons && log.reasons.length > 0))
  );

  // Fetch caption history when component mounts or when switching to caption history tab
  useEffect(() => {
    if (activeTab === 1 && captionHistory.length === 0) {
      fetchCaptionHistory();
    }
  }, [activeTab]);

  const fetchCaptionHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await axios.get(`/api/submissions/v4/${submission.id}/caption-history`);
      setCaptionHistory(response.data.history || []);
    } catch (error) {
      console.error('Error fetching caption history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const captionByAdminOnly = captionHistory.filter(caption => caption.authorType === 'admin')

  const handleTabChange = (newValue) => {
    setActiveTab(newValue);
  };

  const getFeedbackLabel = (type, sentToCreator = false, adminRole) => {
    const isClientFeedback = adminRole === 'client';

    switch (type) {
      case 'APPROVAL':
        return 'Approved';
      case 'REQUEST':
        if (sentToCreator) {
          return 'CS Feedback';
        }
        if (isClientFeedback) {
          return 'Client Feedback';
        }
        return 'CS Feedback'
      case 'COMMENT':
        return isClientFeedback ? 'Client Feedback' : 'CS Comments';
      default:
        return type;
    }
  };

  const getActionLabel = (type, sentToCreator = false, adminRole) => {
    const isClientFeedback = adminRole === 'client';

    switch (type) {
      case 'COMMENT':
        return isClientFeedback ? 'Sent to Admin' : 'Sent to Client';
      case (sentToCreator && 'REQUEST'):
        return 'Sent to Creator';
      case 'REQUEST':
        return 'Sent to Admin';
      default:
        return type;
    }
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderColor: 'divider',
          backgroundColor: '#F5F5F5'
        }}
      >
        <Box sx={{ display: 'flex' }}>
          <Box
            onClick={() => handleTabChange(0)}
            sx={{
              px: 2,
              py: 1,
              minWidth: 175,
              textAlign: 'center',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 1,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              transition: 'all 0.2s',
              bgcolor: activeTab === 0 ? '#fff' : '#E7E7E7',
              color: activeTab === 0 ? '#000' : '#8E8E93',
            }}
          >
            Feedback & Comments
          </Box>
          <Box
            onClick={() => handleTabChange(1)}
            sx={{
              px: 2,
              py: 1,
              minWidth: 175,
              textAlign: 'center',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 1,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              transition: 'all 0.2s',
              bgcolor: activeTab === 1 ? '#fff' : '#E7E7E7',
              color: activeTab === 0 ? '#8E8E93' : '#000',

            }}
          >
            Caption History
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ p: 0, '&:hover': { backgroundColor: 'transparent' } }}>
          <Iconify icon="eva:close-fill" sx={{ width: 25, height: 25 }} />
        </IconButton>
      </Box>

      {/* Logs Content */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          px: 2,
          pb: 2,
          scrollbarWidth: 'thin',
          scrollbarColor: '#888 transparent',
          '&::-webkit-scrollbar': {
            width: '4px',
          },
        }}
      >
        {activeTab === 0 ? (
          // Feedback & Comments Tab
          commentsAndFeedback.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
              }}
            >
              <Iconify
                icon="eva:message-circle-outline"
                sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                No feedback or comments available
              </Typography>
            </Box>
          ) : (
            <Stack>
              {commentsAndFeedback.map((log, index) => (
                <Box
                  key={index}
                  sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    py: 2
                  }}
                >
                  {/* Reasons (if any) */}
                  {log.reasons && log.reasons.length > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip
                        sx={FEEDBACK_CHIP_STYLES}
                        label={log.reasons[0]}
                        size="small"
                        variant="outlined"
                        color="warning"
                      />

                      {log.reasons.length > 1 && (
                        <Tooltip
                          title={
                            <Box sx={{ maxWidth: 500 }}>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {log.reasons.slice(1).map((reason, idx) => (
                                  <Chip
                                    key={idx}
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
                            label={`+${log.reasons.length - 1}`}
                            size="small"
                            variant="outlined"
                            color="warning"
                          />
                        </Tooltip>
                      )}
                    </Box>
                  )}
                  
                  {/* Feedback */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      my: 1
                    }}
                  >
                    <Typography fontSize={12} fontWeight="bold" color={getFeedbackLabel(log.type, log.sentToCreator, log.admin.role) === 'CS Comments' ? '#1340FF' : '#636366'}>
                      {getFeedbackLabel(log.type, log.sentToCreator, log.admin.role)}
                    </Typography>
                    <Typography fontSize={12} fontWeight="bold" color={getFeedbackLabel(log.type, log.sentToCreator, log.admin.role) === 'CS Comments' ? '#1340FF' : '#636366'}>
                      {getActionLabel(log.type, log.sentToCreator, log.admin.role)} {formatDateTime(log.createdAt)}
                    </Typography>
                  </Box>

                  {/* Feedback Message */}
                  <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-wrap'}}>
                    {log.content || ''}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )
        ) : (
          // Caption History Tab
          loadingHistory ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Loading caption history...
              </Typography>
            </Box>
          ) : captionHistory.length > 0 ? (
            <Stack spacing={2} sx={{ mt: 2 }}>
              {/* Caption History */}
              {captionHistory.map((log, index) => (
                <Box key={log.id} sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography fontSize={12} fontWeight="bold" color="#636366">
                      Caption
                    </Typography>
                    <Typography fontSize={12} fontWeight="bold" color="#636366">
                      Edited by {log.authorType === 'admin' ? 'Admin' : 'Creator'} {formatDateTime(log.createdAt)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {log.caption || '(empty)'}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
              }}
            >
              <Iconify
                icon="eva:file-text-outline"
                sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                No caption history available
              </Typography>
            </Box>
          )
        )}
      </Box>
    </Box>
  );
}

FeedbackLogs.propTypes = {
  submission: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};