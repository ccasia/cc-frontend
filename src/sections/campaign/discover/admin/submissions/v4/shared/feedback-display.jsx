import PropTypes from 'prop-types';
import { Box, Chip, Typography } from '@mui/material';
import { FEEDBACK_CHIP_STYLES } from './submission-styles';

export default function FeedbackDisplay({ feedback, submission, isClient }) {
  if (!feedback) return null;

  const hasReasons = feedback.reasons && feedback.reasons.length > 0;
  const hasContent = feedback.content && feedback.content.trim().length > 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', mb: 1 }}>
      {(!isClient && (hasContent || hasReasons) && submission.status === 'CHANGES_REQUIRED') && (
        <Typography variant='caption' fontWeight="bold" color={'#636366'} mb={1}>
          CS Feedback
        </Typography>
      )}
      {(!isClient && hasContent && submission.status === 'SENT_TO_CLIENT') && (
        <Typography variant='caption' fontWeight="bold" color={'#636366'} mb={1}>
          CS Comments
        </Typography>
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
      {(!isClient && hasContent && submission.status === 'CLIENT_APPROVED') && (
        <Typography variant='caption' fontWeight="bold" color={'#636366'} mb={0.5}>
          Client Feedback
        </Typography>
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
