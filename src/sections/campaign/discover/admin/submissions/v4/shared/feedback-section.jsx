import PropTypes from 'prop-types';

import { Box, Stack } from '@mui/material';

import FeedbackDisplay from './feedback-display';

export default function FeedbackSection({ submission, isVisible, isClient, onViewLogs }) {
  if (!isVisible || !submission.feedback || submission.feedback.length === 0) {
    return null;
  }

  const filteredFeedback = submission.feedback.filter(feedback => {
    if (isClient) {
      return feedback.type === 'COMMENT';
    }
    return feedback.type;
  });

  if (filteredFeedback.length === 0) {
    return null;
  }

  const latestFeedback = filteredFeedback[0];
  const showContent = submission.status !== 'CLIENT_FEEDBACK';

  return (
    <Box sx={{ 
      flex: 1, 
      overflow: 'auto',
      minHeight: 0
    }}>
      <Stack spacing={{ xs: 0.8, sm: 1 }}>
        <FeedbackDisplay
          onViewLogs={onViewLogs}
          submission={submission}
          feedback={latestFeedback}
          showContent={showContent}
          isClient={isClient}
        />
      </Stack>
    </Box>
  );
}

FeedbackSection.propTypes = {
  submission: PropTypes.object.isRequired,
  isVisible: PropTypes.bool.isRequired,
  isClient: PropTypes.bool.isRequired,
};
