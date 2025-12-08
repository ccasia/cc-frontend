import React from 'react';

import PropTypes from 'prop-types';

import { Box, Typography, Stack, Card } from '@mui/material';

/**
 * Shared feedback display component for all submission types
 */
const SubmissionFeedback = ({ feedback, hasChangesRequired }) => {
  if (!hasChangesRequired || !feedback?.length) {
    return null;
  }

  return (
    <Card
      sx={{
        p: { xs: 1, md: 1 },
        pl: { xs: 0, md: 0 },
        bgcolor: 'transparent',
        boxShadow: 'none',
        border: 'none',
        mt: { xs: 1, md: 2 },
        maxHeight: { xs: 'auto', md: '220px' },
        overflowY: { xs: 'visible', md: 'auto' },
        mb: { xs: 0, md: 8 },
        position: { xs: 'static', md: 'relative' },
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(0,0,0,0.1)',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '4px',
          '&:hover': {
            background: 'rgba(0,0,0,0.5)',
          },
        },
      }}
    >
      <Stack spacing={2}>
        {feedback.map((feedbackItem, index) => (
          <Stack key={index} spacing={1}>
            {/* Reasons */}
            {feedbackItem.reasons?.length > 0 && (
              <Box sx={{ mb: 1 }}>
                {feedbackItem.reasons.map((reason, i) => (
                  <Typography
                    key={i}
                    variant="caption"
                    sx={{
                      display: 'inline-block',
                      px: 1.5,
                      py: 0.5,
                      mr: 0.5,
                      mb: 0.5,
                      fontWeight: 600,
                      border: '1px solid',
                      borderBottom: '3px solid',
                      borderRadius: 0.8,
                      bgcolor: 'white',
                      whiteSpace: 'nowrap',
                      color: '#FF4842',
                      borderColor: '#FF4842',
                      fontSize: '0.75rem',
                      fontFamily:
                        'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      maxWidth: '100%',
                      wordBreak: 'break-word',
                    }}
                  >
                    {reason}
                  </Typography>
                ))}
              </Box>
            )}

            {/* CS Feedback Content */}
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontFamily:
                    'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  color: '#636366',
                  fontWeight: 600,
                  mb: 0.5,
                }}
              >
                CS Feedback
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily:
                    'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  color: '#636366',
                  lineHeight: 1.4,
                  fontSize: '0.875rem',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto',
                  maxWidth: '100%',
                }}
              >
                {feedbackItem.content || 'No specific feedback provided.'}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </Card>
  );
};

SubmissionFeedback.propTypes = {
  feedback: PropTypes.array,
  hasChangesRequired: PropTypes.bool.isRequired,
};

SubmissionFeedback.defaultProps = {
  feedback: [],
};

export default SubmissionFeedback;