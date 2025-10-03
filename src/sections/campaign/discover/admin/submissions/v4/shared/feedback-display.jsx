import PropTypes from 'prop-types';
import { Box, Button, Chip, Typography } from '@mui/material';
import { FEEDBACK_CHIP_STYLES } from './submission-styles';

export default function FeedbackDisplay({ feedback, submission, isClient, onViewLogs }) {
  if (!feedback) return null;

  const hasReasons = feedback.reasons && feedback.reasons.length > 0;
  const hasContent = feedback.content && feedback.content.trim().length > 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', mb: 1 }}>
      {(!isClient && (hasContent || hasReasons) && submission.status === 'CHANGES_REQUIRED') && (
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant='caption' fontWeight="bold" color={'#636366'}>
            CS Feedback
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
        </Box>
      )}
      {(!isClient && submission.status === 'SENT_TO_CLIENT') && (
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: hasContent ? 'space-between' : 'flex-end' }}>
          {hasContent && 
            <Typography variant='caption' fontWeight="bold" color={'#636366'}>
              CS Comments
            </Typography>
          }
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
        </Box>
      )}
      {hasReasons && submission.status !== 'CLIENT_FEEDBACK' && (
        <Box>
          {feedback.reasons.map((reason, reasonIndex) => (
            <Chip
              sx={{...FEEDBACK_CHIP_STYLES, mb: 0.5}}
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
        <Typography variant='caption' fontWeight="bold" color={'#636366'} mb={0.5}>
          CS Comments
        </Typography>
      )}
      {(!isClient && submission.status === 'CLIENT_APPROVED') && (
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: hasContent ? 'space-between' : 'flex-end' }}>
          {hasContent && 
            <Typography variant='caption' fontWeight="bold" color={'#636366'}>
              Client Feedback
            </Typography>
          }
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
        </Box>
      )}
      {hasContent && submission.status !== 'CLIENT_FEEDBACK' && (
        <Typography fontSize={12} sx={{ mb: 0.5 }}>
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
