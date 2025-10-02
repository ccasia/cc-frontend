import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, IconButton, Typography, Stack, Chip } from '@mui/material';
import { FEEDBACK_CHIP_STYLES } from './submission-styles';
import Iconify from 'src/components/iconify';

export default function FeedbackLogs({ submission, onClose }) {
  const feedbackLogs = submission.feedback || [];
  const [activeTab, setActiveTab] = useState(0);

  const captionEdits = submission.caption;

  const commentsAndFeedback = feedbackLogs.filter(log => 
    (log.type === 'REQUEST' || log.type === 'COMMENT') && log.content !== ''
  );

  const handleTabChange = (newValue) => {
    setActiveTab(newValue);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const formatted = date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return formatted.replace(',', '').replace(' ', '');
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
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 1,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              transition: 'all 0.2s',
              bgcolor: activeTab === 0 && '#fff',
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
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 1,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              transition: 'all 0.2s',
              bgcolor: activeTab === 1 && '#fff',
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
                      {getActionLabel(log.type, log.sentToCreator, log.admin.role)} {formatDate(log.createdAt)}
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
          captionEdits ? (
            <Box
              sx={{
                p: 2,
                bgcolor: 'background.neutral',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                mt: 2
              }}
            >
              <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, }}>
                {captionEdits}
              </Typography>
            </Box>
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
                No caption available
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