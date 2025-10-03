import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, IconButton, Typography, Stack, Chip } from '@mui/material';
import { FEEDBACK_CHIP_STYLES } from './submission-styles';
import Iconify from 'src/components/iconify';
import { fDate, formatDateTime, fTime, fTimestamp } from 'src/utils/format-time';
import { fData } from 'src/utils/format-number';
import axios from 'axios';

export default function FeedbackLogs({ submission, onClose }) {
  const feedbackLogs = submission.feedback || [];
  const [activeTab, setActiveTab] = useState(0);
  const [captionHistory, setCaptionHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const captionEdits = submission.caption;

  const commentsAndFeedback = feedbackLogs.filter(log =>
    (log.type === 'REQUEST' || log.type === 'COMMENT') && log.content !== ''
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
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {log.reasons.map((reason, idx) => (
                        <Chip
                          key={idx}
                          label={reason}
                          sx={{...FEEDBACK_CHIP_STYLES, mr: 0}}
                          size="small"
                          variant="outlined"
                          color="warning"
                        />
                      ))}
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
                    <Typography fontSize={12} fontWeight="bold" color="#636366">
                      {getFeedbackLabel(log.type, log.sentToCreator, log.admin.role)}
                    </Typography>
                    <Typography fontSize={12} fontWeight="bold" color="#636366">
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
          ) : captionHistory.length > 0 || captionEdits ? (
            <Stack spacing={2} sx={{ mt: 2 }}>
              {/* Current Caption */}
              {captionEdits && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography fontSize={12} fontWeight="bold" color="#636366">
                      Current Caption
                    </Typography>
                    <Typography fontSize={12} fontWeight="bold" color="#636366">
                      {formatDateTime(submission.updatedAt)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: '#F0F9FF',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: '#BAE6FD',
                    }}
                  >
                    <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {captionEdits}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Caption History */}
              {captionHistory.map((log, index) => (
                <Box key={log.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography fontSize={12} fontWeight="bold" color="#636366">
                      Written by {log.authorType === 'admin' ? 'Admin' : 'Creator'}
                    </Typography>
                    <Typography fontSize={12} fontWeight="bold" color="#636366">
                      {formatDateTime(log.createdAt)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'background.neutral',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
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