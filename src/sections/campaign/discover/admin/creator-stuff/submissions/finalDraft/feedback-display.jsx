import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';

import {
  Box,
  Chip,
  Grid,
  Stack,
  Avatar,
  Collapse,
  Typography,
  ListItemText,
} from '@mui/material';

import Iconify from 'src/components/iconify';

const FeedbackDisplay = ({ submission, firstDraftSubmission, deliverables, campaign }) => {
  // State for collapsible feedback
  const [collapseOpen, setCollapseOpen] = useState({});

  // Processing feedback data to show multiple items for sections requiring changes
  const feedbacksTesting = useMemo(() => {
    if (!submission?.feedback?.length) return [];
    
    return submission.feedback
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((item) => {
        const photoFeedbacks = item?.photosToUpdate?.length || null;
        const videoFeedbacks = item?.videosToUpdate?.length || null;
        const rawFootageFeedbacks = item?.rawFootageToUpdate?.length || null;

        const changes = [];

        if (photoFeedbacks) {
          changes.push({ content: item.photoContent, changes: item.photosToUpdate, type: 'photo' });
        }

        if (videoFeedbacks) {
          changes.push({
            content: item.content,
            changes: item.videosToUpdate,
            type: 'video',
            reasons: item?.reasons,
          });
        }

        if (rawFootageFeedbacks) {
          changes.push({
            content: item.rawFootageContent,
            changes: item.rawFootageToUpdate,
            type: 'rawFootage',
          });
        }

        return {
          adminName: item?.admin?.name,
          role: item?.admin?.role,
          changes: changes || null,
          reasons: item?.reasons?.length ? item?.reasons : null,
          createdAt: item?.createdAt,
          admin: item?.admin,
        };
      });
  }, [submission]);

  // Don't render if no feedback to show
  if ((submission?.status !== 'CHANGES_REQUIRED' && submission?.status !== 'IN_PROGRESS') ||
      (!feedbacksTesting?.length && !submission?.feedback?.length && !firstDraftSubmission?.feedback?.length)) {
    return null;
  }

  return (
    <>
      {/* To display public feedbacks */}
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

      {/* Admin Feedback */}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          {feedbacksTesting && feedbacksTesting.length > 0 ? (
            <>
              {feedbacksTesting.map((feedback, feedbackIndex) => (
                <Box
                  key={`feedback-${feedbackIndex}`}
                  component="div"
                  mb={2}
                  p={2}
                  border={1}
                  borderColor="grey.300"
                  borderRadius={1}
                  display="flex"
                  alignItems="flex-start"
                  sx={{
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setCollapseOpen((prev) => ({
                      ...prev,
                      [feedbackIndex]: !prev[feedbackIndex]
                    }));
                  }}
                  position="relative"
                >
                  {/* Handle icon */}
                  <Box sx={{ position: 'absolute', top: 5, right: 10 }}>
                    {collapseOpen[feedbackIndex] ? (
                      <Iconify
                        icon="iconamoon:arrow-up-2-bold"
                        width={20}
                        color="text.secondary"
                      />
                    ) : (
                      <Iconify
                        icon="iconamoon:arrow-down-2-bold"
                        width={20}
                        color="text.secondary"
                      />
                    )}
                  </Box>
                  
                  <Avatar
                    src={feedback.admin?.photoURL || '/default-avatar.png'}
                    alt={feedback.adminName || 'User'}
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
                    <Stack
                      direction={{ md: 'row' }}
                      alignItems={{ md: 'end' }}
                    >
                      <ListItemText
                        primary={feedback.adminName || 'Unknown User'}
                        secondary={feedback.role || 'No Role'}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(feedback.createdAt).format('LLL')}
                      </Typography>
                    </Stack>
                    
                    <Collapse in={collapseOpen[feedbackIndex]} timeout="auto" unmountOnExit>
                      <Box sx={{ textAlign: 'left', mt: 1 }}>
                        {!!feedback.changes?.length &&
                          feedback.changes.map((item, itemIndex) => (
                            <React.Fragment key={`change-${feedbackIndex}-${itemIndex}`}>
                              {item?.type === 'video' && !!item.changes?.length && (
                                <Box mt={2}>
                                  {item?.content?.split('\n').map((line, i) => (
                                    <Typography
                                      key={i}
                                      variant="subtitle2"
                                      color="text.secondary"
                                    >
                                      Comment: {line}
                                    </Typography>
                                  ))}
                                  <Typography
                                    variant="subtitle2"
                                    color="warning.darker"
                                    sx={{ mb: 1 }}
                                  >
                                    Videos that need changes:
                                  </Typography>
                                  <Stack spacing={2}>
                                    {deliverables?.videos
                                      ?.filter(
                                        (video) =>
                                          video?.status === 'REVISION_REQUESTED' &&
                                          item.changes.includes(video.id)
                                      )
                                      .map((video) => (
                                        <Box
                                          key={video.id}
                                          sx={{
                                            display: 'flex',
                                            p: 1,
                                            borderRadius: 1,
                                            bgcolor: 'warning.lighter',
                                            border: '1px solid',
                                            borderColor: 'warning.light',
                                          }}
                                        >
                                          <Typography variant="body2">
                                            {video.url.split('/').pop()}
                                          </Typography>
                                        </Box>
                                      ))}
                                  </Stack>
                                </Box>
                              )}

                              {item?.type === 'rawFootage' && !!item.changes?.length && (
                                <Box mt={2}>
                                  {item?.content?.split('\n').map((line, i) => (
                                    <Typography
                                      key={i}
                                      variant="subtitle2"
                                      color="text.secondary"
                                    >
                                      Comment: {line}
                                    </Typography>
                                  ))}
                                  <Typography
                                    variant="subtitle2"
                                    color="warning.darker"
                                    sx={{ mb: 1 }}
                                  >
                                    Raw Footages that need changes:
                                  </Typography>
                                  <Stack spacing={2}>
                                    {deliverables?.rawFootages
                                      ?.filter(
                                        (footage) =>
                                          footage?.status === 'REVISION_REQUESTED' &&
                                          item.changes.includes(footage.id)
                                      )
                                      .map((footage) => (
                                        <Box
                                          key={footage.id}
                                          sx={{
                                            display: 'flex',
                                            p: 1,
                                            borderRadius: 1,
                                            bgcolor: 'warning.lighter',
                                            border: '1px solid',
                                            borderColor: 'warning.light',
                                          }}
                                        >
                                          <Typography variant="body2">
                                            {footage.url.split('/').pop()}
                                          </Typography>
                                        </Box>
                                      ))}
                                  </Stack>
                                </Box>
                              )}

                              {item?.type === 'photo' && !!item.changes?.length && (
                                <Box mt={2}>
                                  {item?.content?.split('\n').map((line, i) => (
                                    <Typography
                                      key={i}
                                      variant="subtitle2"
                                      color="text.secondary"
                                    >
                                      Comment: {line}
                                    </Typography>
                                  ))}
                                  <Typography
                                    variant="subtitle2"
                                    color="warning.darker"
                                    sx={{ mb: 1 }}
                                  >
                                    Photos that need changes:
                                  </Typography>
                                  <Stack spacing={2}>
                                    {deliverables?.photos
                                      ?.filter(
                                        (photo) =>
                                          photo?.status === 'REVISION_REQUESTED' &&
                                          item.changes.includes(photo.id)
                                      )
                                      .map((photo) => (
                                        <Box
                                          key={photo.id}
                                          sx={{
                                            display: 'flex',
                                            p: 1,
                                            borderRadius: 1,
                                            bgcolor: 'warning.lighter',
                                            border: '1px solid',
                                            borderColor: 'warning.light',
                                          }}
                                        >
                                          <Typography variant="body2">
                                            {photo.url.split('/').pop()}
                                          </Typography>
                                        </Box>
                                      ))}
                                  </Stack>
                                </Box>
                              )}
                            </React.Fragment>
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
                    </Collapse>
                  </Box>
                </Box>
              ))}
            </>
          ) : (
            [...(submission?.feedback || []), ...(firstDraftSubmission?.feedback || [])]
            ?.filter((item) => item.content)
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
                  <Stack
                    direction={{ md: 'row' }}
                    alignItems={{ md: 'end' }}
                  >
                    <ListItemText
                      primary={feedback.admin?.name || 'Unknown User'}
                      secondary={feedback.admin?.role || 'No Role'}
                    />
                    <Typography variant="caption" color="text.secondary">
                        {dayjs(feedback.createdAt).format('LLL')}
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
                        <Stack
                          direction="row"
                          spacing={0.5}
                          flexWrap="wrap"
                        >
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
              ))
          )}
        </Grid>
      </Grid>
    </>
  );
};

FeedbackDisplay.propTypes = {
  submission: PropTypes.object.isRequired,
  firstDraftSubmission: PropTypes.object,
  deliverables: PropTypes.object,
  campaign: PropTypes.object,
};

export default FeedbackDisplay; 