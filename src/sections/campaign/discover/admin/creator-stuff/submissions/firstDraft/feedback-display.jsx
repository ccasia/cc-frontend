import React from 'react';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import {
  Box,
  Chip,
  Stack,
  Avatar,
  Typography,
  ListItemText,
} from '@mui/material';

const FeedbackDisplay = ({ submission, campaign }) => {
  if (!submission?.feedback?.length && !submission?.publicFeedback?.length) {
    return null;
  }

  return (
    <>
      {/* Display public feedbacks */}
      {!!submission?.publicFeedback?.length &&
        submission.publicFeedback
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .map((feedback, index) => (
            <Box
              key={index}
              mb={2}
              p={2}
              border={1}
              borderColor="grey.300"
              borderRadius={1}
              display="flex"
              alignItems="flex-start"
              flexDirection="column"
            >
              {/* Title for Client Feedback */}
              <Typography
                variant="h6"
                sx={{ fontWeight: 'bold', marginBottom: 2 }}
              >
                Client Feedback
              </Typography>
              {/* Use company logo or fallback avatar */}
              <Avatar
                src={campaign?.company?.logoURL || '/default-avatar.png'}
                alt={campaign?.company?.name || 'Company'}
                sx={{ mr: 2, mb: 2 }}
              />
              <Box
                flexGrow={1}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'left',
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 'bold', marginBottom: '2px' }}
                >
                  {campaign?.company?.name || 'Unknown Company'}
                </Typography>

                {/* Feedback Content */}
                <Box sx={{ textAlign: 'left', mt: 1 }}>
                  {feedback.content && feedback.content.split('\n').map((line, i) => (
                    <Typography key={i} variant="body2">
                      {line}
                    </Typography>
                  ))}

                  {/* Display reasons if available */}
                  {feedback.reasons && feedback.reasons.length > 0 && (
                    <Box mt={1} sx={{ textAlign: 'left' }}>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {feedback.reasons.map((reason, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              border: '1.5px solid #e7e7e7',
                              borderBottom: '4px solid #e7e7e7',
                              borderRadius: 1,
                              p: 0.5,
                              display: 'inline-flex',
                            }}
                          >
                            <Chip
                              label={reason}
                              size="small"
                              color="default"
                              variant="outlined"
                              sx={{
                                border: 'none',
                                color: '#8e8e93',
                                fontSize: '0.75rem',
                                padding: '1px 2px',
                              }}
                            />
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          ))}

      {/* Display admin feedbacks */}
      {submission?.feedback
        ?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((feedback, index) => (
          <Box
            key={index}
            mb={2}
            p={2}
            border={1}
            borderColor="grey.300"
            borderRadius={1}
            display="flex"
            alignItems="flex-start"
          >
            <Avatar
              src={feedback.admin?.photoURL || '/default-avatar.png'}
              alt={feedback.admin?.name || 'User'}
              sx={{ mr: 2 }}
            />

            <Box
              flexGrow={1}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                textAlign: 'left',
              }}
            >
              <Stack direction={{ md: 'row' }} alignItems={{ md: 'end' }}>
                <ListItemText
                  primary={feedback.admin?.name || 'Unknown User'}
                  secondary={feedback.admin?.role || 'No Role'}
                />
                <Typography variant="caption" color="text.secondary">
                  {dayjs(feedback.createdAd).format('LLL')}
                </Typography>
              </Stack>

              <Box sx={{ textAlign: 'left', mt: 1 }}>
                {feedback.content && feedback.content.split('\n').map((line, i) => (
                  <Typography key={i} variant="body2">
                    {line}
                  </Typography>
                ))}

                {feedback.reasons && feedback.reasons.length > 0 && (
                  <Box mt={1} sx={{ textAlign: 'left' }}>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {feedback.reasons.map((reason, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            border: '1.5px solid #e7e7e7',
                            borderBottom: '4px solid #e7e7e7',
                            borderRadius: 1,
                            p: 0.5,
                            display: 'inline-flex',
                          }}
                        >
                          <Chip
                            label={reason}
                            size="small"
                            color="default"
                            variant="outlined"
                            sx={{
                              border: 'none',
                              color: '#8e8e93',
                              fontSize: '0.75rem',
                              padding: '1px 2px',
                            }}
                          />
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        ))}
    </>
  );
};

FeedbackDisplay.propTypes = {
  submission: PropTypes.object,
  campaign: PropTypes.object,
};

export default FeedbackDisplay; 