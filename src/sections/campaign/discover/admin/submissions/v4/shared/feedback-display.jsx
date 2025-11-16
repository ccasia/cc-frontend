import PropTypes from 'prop-types';

import { Box, Chip, Button, Typography } from '@mui/material';

import { FEEDBACK_CHIP_STYLES } from './submission-styles';

export default function FeedbackDisplay({ feedback, submission, isClient, onViewLogs }) {
  if (!feedback) return null;

  const hasReasons = feedback.reasons && feedback.reasons.length > 0;
  const hasContent = feedback.content && feedback.content.trim().length > 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', mb: { xs: 0.8, sm: 1 } }}>
      {(!isClient && (hasContent || hasReasons) && submission.status === 'CHANGES_REQUIRED') && (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          gap: { xs: 0.5, sm: 0 }
        }}>
          <Typography 
            variant='caption' 
            fontWeight="bold" 
            color="#636366"
            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
          >
            CS Feedback
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
              '&:hover': {
                backgroundColor: 'transparent',
              },
            }}
          >
            view logs
          </Button>
        </Box>
      )}
      {(!isClient && submission.status === 'SENT_TO_CLIENT') && (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: hasContent ? 'space-between' : 'flex-end',
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          gap: { xs: 0.5, sm: 0 }
        }}>
          {hasContent && 
            <Typography 
              variant='caption' 
              fontWeight="bold" 
              color="#636366"
              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
            >
              CS Comments
            </Typography>
          }
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
              '&:hover': {
                backgroundColor: 'transparent',
              },
            }}
          >
            view logs
          </Button>
        </Box>
      )}
      {hasReasons && submission.status !== 'CLIENT_FEEDBACK' && (
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: { xs: 0.3, sm: 0.5 },
          mb: { xs: 0.4, sm: 0.5 }
        }}>
          {feedback.reasons.map((reason, reasonIndex) => (
            <Chip
              sx={{
                ...FEEDBACK_CHIP_STYLES, 
                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                height: { xs: 24, sm: 28 },
                '& .MuiChip-label': {
                  px: { xs: 0.5, sm: 1 }
                }
              }}
              key={reasonIndex}
              label={reason}
              size="small"
              variant="outlined"
              color="warning"
            />
          ))}
        </Box>
      )}
      {(isClient && hasContent && submission.status === 'SENT_TO_CLIENT') && (
        <Typography 
          variant='caption' 
          fontWeight="bold" 
          color="#636366" 
          mb={{ xs: 0.4, sm: 0.5 }}
          sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
        >
          CS Comments
        </Typography>
      )}
      {(!isClient && submission.status === 'CLIENT_APPROVED') && (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: hasContent ? 'space-between' : 'flex-end',
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          gap: { xs: 0.5, sm: 0 }
        }}>
          {hasContent && 
            <Typography 
              variant='caption' 
              fontWeight="bold" 
              color="#636366"
              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
            >
              Client Feedback
            </Typography>
          }
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
              '&:hover': {
                backgroundColor: 'transparent',
              },
            }}
          >
            view logs
          </Button>
        </Box>
      )}
      {hasContent && submission.status !== 'CLIENT_FEEDBACK' && (
        <Typography 
          fontSize={{ xs: 11, sm: 12 }} 
          sx={{ 
            mb: { xs: 0.4, sm: 0.5 },
            lineHeight: { xs: 1.4, sm: 1.5 },
            wordBreak: 'break-word'
          }}
        >
          {feedback.content}
        </Typography>
      )}
    </Box>
  );
}

FeedbackDisplay.propTypes = {
  feedback: PropTypes.object,
  submission: PropTypes.object.isRequired,
  isClient: PropTypes.bool.isRequired,
};
