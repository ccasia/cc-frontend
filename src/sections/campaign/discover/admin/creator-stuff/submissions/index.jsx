/* eslint-disable no-nested-ternary */
import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';

import { Box, Stack, Typography } from '@mui/material';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
// import Iconify from 'src/components/iconify/Iconify';
import EmptyContent from 'src/components/empty-content/empty-content';

import Agreement from './agreement';
import FirstDraft from './firstDraft';
import FinalDraft from './finalDraft';
import Posting from './posting/posting';

const Submissions = ({ campaign, submissions, creator }) => {
  const [currentTab, setCurrentTab] = useState('agreement');

  const agreementSubmission = useMemo(
    () => submissions?.find((item) => item.submissionType.type === 'AGREEMENT_FORM'),
    [submissions]
  );

  const firstDraftSubmission = useMemo(
    () => submissions?.find((item) => item.submissionType.type === 'FIRST_DRAFT'),
    [submissions]
  );

  const finalDraftSubmission = useMemo(
    () => submissions?.find((item) => item.submissionType.type === 'FINAL_DRAFT'),
    [submissions]
  );

  const postingSubmission = useMemo(
    () => submissions?.find((item) => item.submissionType.type === 'POSTING'),
    [submissions]
  );

  const getVisibleStages = () => {
    let stages = [];

    stages.push({
      name: 'Agreement Submission',
      value: 'agreement',
      type: 'AGREEMENT_FORM',
    });

    // Show Draft Submissions if Agreement is approved
    if (agreementSubmission?.status === 'APPROVED') {
      stages.push({
        name: 'Draft Submissions',
        value: 'drafts',
        type: 'DRAFTS',
      });
    }

    // Show Posting if either draft is approved
    if (
      firstDraftSubmission?.status === 'APPROVED' ||
      finalDraftSubmission?.status === 'APPROVED'
    ) {
      stages.push({
        name: 'Posting Link',
        value: 'posting',
        type: 'POSTING',
      });
    }

    if (!postingSubmission) {
      stages = stages.filter((stage) => stage.value !== 'posting');
    }

    return stages;
  };

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={{ xs: 2, md: 1 }}
      sx={{
        width: '100%',
        px: { xs: 1, md: 0 },
      }}
    >
      {/* Left Column - Navigation */}
      <Box
        sx={{
          width: { xs: '100%', md: '50%' },
          minWidth: { xs: '100%', md: '320px' },
          maxWidth: { xs: '100%', md: '600px' },
          boxShadow: 'none',
          ml: { xs: 0, md: -2 },
          mr: { xs: 0, md: -1.5 },
          mt: { xs: 0, md: -1.55 },
          mb: { xs: 2, md: 0 },
        }}
      >
        <Box
          sx={{
            height: '100%',
            py: { xs: 1, md: 2 },
            px: { xs: 0, md: 0 },
          }}
        >
          {getVisibleStages().map((item) => (
            <Box
              key={item.value}
              sx={{
                mx: 2,
                mb: 1,
                p: 2.5,
                cursor: 'pointer',
                borderRadius: 2,
                bgcolor: currentTab === item.value ? '#f5f5f5' : 'transparent',
                '&:hover': { bgcolor: '#f5f5f5' },
                minHeight: 75,
                display: 'flex',
                alignItems: 'center',
              }}
              onClick={() => setCurrentTab(item.value)}
            >
              <Stack direction="row" spacing={2} alignItems="center" width="100%">
                <Label
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor:
                      item.type === 'AGREEMENT_FORM'
                        ? '#e0fe52'
                        : item.type === 'POSTING'
                          ? '#835cf5'
                          : '#eb4a26',
                  }}
                >
                  <Typography
                    sx={{
                      color: '#000',
                      fontSize: '1.25rem',
                    }}
                  >
                    {item.type === 'AGREEMENT_FORM' ? '✍️' : item.type === 'POSTING' ? '✅' : '📝'}
                  </Typography>
                </Label>

                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" sx={{ mb: 0.2 }}>
                    {item.name}
                  </Typography>
                </Box>

                <Iconify
                  icon="eva:arrow-ios-forward-fill"
                  sx={{
                    color: 'text.secondary',
                    width: 26,
                    height: 26,
                    ml: 1,
                  }}
                />
              </Stack>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Right Column - Content */}
      <Box
        sx={{
          width: { xs: '100%', md: '60%' },
          flexGrow: 1,
          mr: { xs: 0, md: 0 },
          mt: { xs: 0, md: 0.2 },
          maxWidth: '100%',
          overflow: 'auto',
        }}
      >
        {!currentTab && (
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              p: { xs: 2, md: 3 },
            }}
          >
            <EmptyContent title="Click tab above to see content." />
          </Box>
        )}

        {currentTab === 'agreement' && agreementSubmission && (
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              p: { xs: 1.5, md: 3 },
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              sx={{
                mb: { xs: 2, md: 3 },
                pb: 2,
                gap: { xs: 1, sm: 0 },
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  color: '#221f20',
                  ml: 0.2,
                  fontSize: { xs: '1.25rem', md: '1.5rem' },
                }}
              >
                Agreement Submission
              </Typography>
              <Label
                sx={{
                  mr: { xs: 0, sm: 2 },
                  py: { xs: 1.5, md: 2 },
                  px: { xs: 2, md: 3 },
                  color:
                    agreementSubmission.status === 'APPROVED'
                      ? '#2e6c56'
                      : agreementSubmission.status === 'REJECTED'
                        ? '#FF4842'
                        : '#f19f39',
                  border: `1px solid ${
                    agreementSubmission.status === 'APPROVED'
                      ? '#2e6c56'
                      : agreementSubmission.status === 'REJECTED'
                        ? '#FF4842'
                        : '#f19f39'
                  }`,
                  borderBottom: `3px solid ${
                    agreementSubmission.status === 'APPROVED'
                      ? '#2e6c56'
                      : agreementSubmission.status === 'REJECTED'
                        ? '#FF4842'
                        : '#f19f39'
                  }`,
                  bgcolor: 'transparent',
                  borderRadius: 0.7,
                  fontWeight: 700,
                }}
              >
                {agreementSubmission.status}
              </Label>
            </Stack>
            <Agreement submission={agreementSubmission} campaign={campaign} creator={creator} />
          </Box>
        )}

        {currentTab === 'drafts' && (
          <Stack spacing={3}>
            {finalDraftSubmission && firstDraftSubmission?.status === 'CHANGES_REQUIRED' && (
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: { xs: 1.5, md: 3 },
                }}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  justifyContent="space-between"
                  sx={{
                    mb: { xs: 2, md: 3 },
                    pb: 2,
                    gap: { xs: 1, sm: 0 },
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 600,
                      color: '#221f20',
                      ml: 1.5,
                      fontSize: { xs: '1.25rem', md: '1.5rem' },
                    }}
                  >
                    2nd Draft Submission
                  </Typography>
                  <Label
                    sx={{
                      mr: { xs: 0, sm: 2 },
                      py: { xs: 1.5, md: 2 },
                      px: { xs: 2, md: 3 },
                      color:
                        finalDraftSubmission.status === 'APPROVED'
                          ? '#2e6c56'
                          : finalDraftSubmission.status === 'REJECTED'
                            ? '#FF4842'
                            : '#f19f39',
                      border: `1px solid ${
                        finalDraftSubmission.status === 'APPROVED'
                          ? '#2e6c56'
                          : finalDraftSubmission.status === 'REJECTED'
                            ? '#FF4842'
                            : '#f19f39'
                      }`,
                      borderBottom: `3px solid ${
                        finalDraftSubmission.status === 'APPROVED'
                          ? '#2e6c56'
                          : finalDraftSubmission.status === 'REJECTED'
                            ? '#FF4842'
                            : '#f19f39'
                      }`,
                      bgcolor: 'transparent',
                      borderRadius: 0.7,
                      fontWeight: 700,
                    }}
                  >
                    {finalDraftSubmission.status}
                  </Label>
                </Stack>
                <FinalDraft
                  submission={finalDraftSubmission}
                  campaign={campaign}
                  creator={creator}
                />
              </Box>
            )}

            {firstDraftSubmission && (
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: { xs: 1.5, md: 3 },
                }}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  justifyContent="space-between"
                  sx={{
                    mb: { xs: 2, md: 3 },
                    pb: 2,
                    mb: 1,
                    gap: { xs: 1, sm: 0 },
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 600,
                      color: '#221f20',
                      ml: 1.5,
                      fontSize: { xs: '1.25rem', md: '1.5rem' },
                    }}
                  >
                    1st Draft Submission
                  </Typography>
                  <Label
                    sx={{
                      mr: { xs: 0, sm: 2 },
                      py: { xs: 1.5, md: 2 },
                      px: { xs: 2, md: 3 },
                      color:
                        firstDraftSubmission.status === 'APPROVED'
                          ? '#2e6c56'
                          : firstDraftSubmission.status === 'REJECTED'
                            ? '#FF4842'
                            : '#f19f39',
                      border: `1px solid ${
                        firstDraftSubmission.status === 'APPROVED'
                          ? '#2e6c56'
                          : firstDraftSubmission.status === 'REJECTED'
                            ? '#FF4842'
                            : '#f19f39'
                      }`,
                      borderBottom: `3px solid ${
                        firstDraftSubmission.status === 'APPROVED'
                          ? '#2e6c56'
                          : firstDraftSubmission.status === 'REJECTED'
                            ? '#FF4842'
                            : '#f19f39'
                      }`,
                      bgcolor: 'transparent',
                      borderRadius: 0.7,
                      fontWeight: 700,
                    }}
                  >
                    {firstDraftSubmission.status}
                  </Label>
                </Stack>
                <FirstDraft
                  submission={firstDraftSubmission}
                  campaign={campaign}
                  creator={creator}
                />
              </Box>
            )}
          </Stack>
        )}

        {currentTab === 'posting' && postingSubmission && (
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              p: { xs: 1.5, md: 3 },
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              sx={{
                mb: { xs: 2, md: 3 },
                pb: 2,
                gap: { xs: 1, sm: 0 },
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  color: '#221f20',
                  ml: 1.5,
                  fontSize: { xs: '1.25rem', md: '1.5rem' },
                }}
              >
                Posting Link
              </Typography>
              <Label
                sx={{
                  mr: { xs: 0, sm: 2 },
                  py: { xs: 1.5, md: 2 },
                  px: { xs: 2, md: 3 },
                  color:
                    postingSubmission.status === 'APPROVED'
                      ? '#2e6c56'
                      : postingSubmission.status === 'REJECTED'
                        ? '#FF4842'
                        : '#f19f39',
                  border: `1px solid ${
                    postingSubmission.status === 'APPROVED'
                      ? '#2e6c56'
                      : postingSubmission.status === 'REJECTED'
                        ? '#FF4842'
                        : '#f19f39'
                  }`,
                  borderBottom: `3px solid ${
                    postingSubmission.status === 'APPROVED'
                      ? '#2e6c56'
                      : postingSubmission.status === 'REJECTED'
                        ? '#FF4842'
                        : '#f19f39'
                  }`,
                  bgcolor: 'transparent',
                  borderRadius: 0.7,
                  fontWeight: 700,
                }}
              >
                {postingSubmission.status}
              </Label>
            </Stack>
            <Posting submission={postingSubmission} campaign={campaign} creator={creator} />
          </Box>
        )}
      </Box>
    </Stack>
  );
};

export default Submissions;

Submissions.propTypes = {
  campaign: PropTypes.object,
  submissions: PropTypes.array,
  creator: PropTypes.object,
};
