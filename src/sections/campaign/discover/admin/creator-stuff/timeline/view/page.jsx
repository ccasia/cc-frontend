import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React from 'react';

import { Box, Stack, Button, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

import Label from 'src/components/label';
import Scrollbar from 'src/components/scrollbar';

const TimelineCreator = ({ campaign, creator }) => {
  const submissionTimelines = campaign?.submission?.filter(
    (item) => item?.userId === creator?.user?.id
  );

  const getSubmissionByType = (type) => 
    submissionTimelines?.find((item) => item?.submissionType?.type === type);

  const agreementSubmission = getSubmissionByType('AGREEMENT_FORM');
  const firstDraftSubmission = getSubmissionByType('FIRST_DRAFT');
  const finalDraftSubmission = getSubmissionByType('FINAL_DRAFT');
  const postingSubmission = getSubmissionByType('POSTING');

  const handleViewSubmission = (stage) => {
  };

  return (
    <Box>
      <Scrollbar>
        <TableContainer 
          sx={{ 
            minWidth: 800, 
            position: 'relative',
            bgcolor: 'transparent',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell 
                  sx={{ 
                    py: 1, 
                    color: '#221f20', 
                    fontWeight: 600,
                    borderRadius: '10px 0 0 10px',
                    bgcolor: '#f5f5f5',
                  }}
                >
                  Phases
                </TableCell>
                <TableCell 
                  sx={{ 
                    py: 1, 
                    color: '#221f20', 
                    fontWeight: 600,
                    bgcolor: '#f5f5f5',
                  }}
                >
                  Date Due
                </TableCell>
                <TableCell 
                  sx={{ 
                    py: 1, 
                    color: '#221f20', 
                    fontWeight: 600,
                    bgcolor: '#f5f5f5',
                  }}
                >
                  Status
                </TableCell>
                <TableCell 
                  sx={{ 
                    py: 1,
                    borderRadius: '0 10px 10px 0',
                    bgcolor: '#f5f5f5',
                  }}
                >
                  {/* Actions */}
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {/* Agreement Row */}
              {agreementSubmission && (
                <TableRow hover>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Label
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: '#e0fe52',
                        }}
                      >
                        <Typography sx={{ color: '#000', fontSize: '1.25rem' }}>
                          ✍️
                        </Typography>
                      </Label>
                      <Typography variant="subtitle1">Agreement Submission</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{dayjs(agreementSubmission.dueDate).format('ddd LL')}</TableCell>
                  <TableCell>
                    <Label
                      sx={{
                        py: 2,
                        color: agreementSubmission.status === 'APPROVED' 
                          ? '#2e6c56' 
                          : agreementSubmission.status === 'REJECTED'
                          ? '#FF4842'
                          : '#f19f39',
                        border: `1px solid currentColor`,
                        borderBottom: '3px solid currentColor',
                        bgcolor: 'transparent',
                        borderRadius: 0.7,
                        fontWeight: 700,
                      }}
                    >
                      {agreementSubmission.status}
                    </Label>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleViewSubmission('agreement')}
                      sx={{
                        px: 1.5,
                        py: 2,
                        border: '1px solid #e7e7e7',
                        borderBottom: '3px solid #e7e7e7',
                        borderRadius: 1,
                        color: '#221f20',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        height: '28px',
                        textTransform: 'none',
                        '&:hover': {
                          bgcolor: 'rgba(32, 63, 245, 0.04)',
                        },
                      }}
                    >
                      View Submission
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {/* First Draft Row */}
              {firstDraftSubmission && (
                <TableRow hover>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Label
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: '#eb4a26',
                        }}
                      >
                        <Typography sx={{ color: '#000', fontSize: '1.25rem' }}>
                          📝
                        </Typography>
                      </Label>
                      <Typography variant="subtitle1">1st Draft Submission</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{dayjs(firstDraftSubmission.dueDate).format('ddd LL')}</TableCell>
                  <TableCell>
                    <Label
                      sx={{
                        py: 2,
                        color: firstDraftSubmission.status === 'APPROVED' 
                          ? '#2e6c56' 
                          : firstDraftSubmission.status === 'REJECTED'
                          ? '#FF4842'
                          : '#f19f39',
                        border: `1px solid currentColor`,
                        borderBottom: '3px solid currentColor',
                        bgcolor: 'transparent',
                        borderRadius: 0.7,
                        fontWeight: 700,
                      }}
                    >
                      {firstDraftSubmission.status}
                    </Label>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleViewSubmission('drafts')}
                      sx={{
                        px: 1.5,
                        py: 2,
                        border: '1px solid #e7e7e7',
                        borderBottom: '3px solid #e7e7e7',
                        borderRadius: 1,
                        color: '#221f20',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        height: '28px',
                        textTransform: 'none',
                        '&:hover': {
                          bgcolor: 'rgba(32, 63, 245, 0.04)',
                        },
                      }}
                    >
                      View Submission
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {/* Final Draft Row (if exists) */}
              {finalDraftSubmission && firstDraftSubmission?.status === 'CHANGES_REQUIRED' && (
                <TableRow hover>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Label
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: '#eb4a26',
                        }}
                      >
                        <Typography sx={{ color: '#000', fontSize: '1.25rem' }}>
                          📝
                        </Typography>
                      </Label>
                      <Typography variant="subtitle1">2nd Draft Submission</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{dayjs(finalDraftSubmission.dueDate).format('ddd LL')}</TableCell>
                  <TableCell>
                    <Label
                      sx={{
                        py: 2,
                        color: finalDraftSubmission.status === 'APPROVED' 
                          ? '#2e6c56' 
                          : finalDraftSubmission.status === 'REJECTED'
                          ? '#FF4842'
                          : '#f19f39',
                        border: `1px solid currentColor`,
                        borderBottom: '3px solid currentColor',
                        bgcolor: 'transparent',
                        borderRadius: 0.7,
                        fontWeight: 700,
                      }}
                    >
                      {finalDraftSubmission.status}
                    </Label>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleViewSubmission('drafts')}
                      sx={{
                        px: 1.5,
                        py: 2,
                        border: '1px solid #e7e7e7',
                        borderBottom: '3px solid #e7e7e7',
                        borderRadius: 1,
                        color: '#221f20',   
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        height: '28px',
                        textTransform: 'none',
                        '&:hover': {
                          bgcolor: 'rgba(32, 63, 245, 0.04)',
                        },
                      }}
                    >
                      View Submission
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {/* Posting Row */}
              {postingSubmission && (
                <TableRow hover>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Label
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: '#835cf5',
                        }}
                      >
                        <Typography sx={{ color: '#000', fontSize: '1.25rem' }}>
                          ✅
                        </Typography>
                      </Label>
                      <Typography variant="subtitle1">Posting Link</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{dayjs(postingSubmission.dueDate).format('ddd LL')}</TableCell>
                  <TableCell>
                    <Label
                      sx={{
                        py: 2,
                        color: postingSubmission.status === 'APPROVED' 
                          ? '#2e6c56' 
                          : postingSubmission.status === 'REJECTED'
                          ? '#FF4842'
                          : '#f19f39',
                        border: `1px solid currentColor`,
                        borderBottom: '3px solid currentColor',
                        bgcolor: 'transparent',
                        borderRadius: 0.7,
                        fontWeight: 700,
                      }}
                    >
                      {postingSubmission.status}
                    </Label>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleViewSubmission('posting')}
                      sx={{
                        px: 1.5,
                        py: 2,
                        border: '1px solid #e7e7e7',
                        borderBottom: '3px solid #e7e7e7',
                        borderRadius: 1,
                        color: '#221f20',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        height: '28px',
                        textTransform: 'none',
                        '&:hover': {
                          bgcolor: 'rgba(32, 63, 245, 0.04)',
                        },
                      }}
                    >
                      View Submission
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Scrollbar>
    </Box>
  );
};

export default TimelineCreator;

TimelineCreator.propTypes = {
  campaign: PropTypes.object,
  creator: PropTypes.object,
};
