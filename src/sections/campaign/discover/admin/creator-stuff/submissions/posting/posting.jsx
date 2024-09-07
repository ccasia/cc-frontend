import React from 'react';
import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';

import { Box, Grid, Stack, Paper, Button, Typography } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Label from 'src/components/label';
import Image from 'src/components/image';
import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content/empty-content';

const Posting = ({ campaign, submission, creator }) => {
  const onSubmit = async () => {
    try {
      const res = await axiosInstance.patch(endpoints.submission.admin.posting, {
        submissionId: submission?.id,
        status: 'APPROVED',
      });
      mutate(
        `${endpoints.submission.root}?creatorId=${creator?.user?.id}&campaignId=${campaign?.id}`
      );
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar('Error', {
        variant: 'error',
      });
    }
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Box component={Paper} p={1.5}>
            <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
              <Stack spacing={1} justifyContent="space-evenly">
                <Typography variant="subtitle2">Due Date</Typography>
                <Typography variant="subtitle2">Status</Typography>
                <Typography variant="subtitle2">Date Submission</Typography>
                <Typography variant="subtitle2">Review on</Typography>
              </Stack>
              <Stack spacing={1} justifyContent="space-evenly">
                <Typography variant="subtitle2" color="text.secondary">
                  {dayjs(submission?.dueDate).format('ddd LL')}
                </Typography>
                <Label>{submission?.status}</Label>
                <Typography variant="subtitle2" color="text.secondary">
                  {submission?.submissionDate
                    ? dayjs(submission?.submissionDate).format('ddd LL')
                    : '-'}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  {submission?.isReview
                    ? dayjs(submission?.updatedAt).format('ddd LL')
                    : 'Pending Review'}
                </Typography>
              </Stack>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={9}>
          {submission?.status === 'IN_PROGRESS' ? (
            <EmptyContent title="No submission" />
          ) : (
            <>
              <Box component={Paper} p={1.5}>
                {/* <Box width={400}>
                <iframe
                src="https://www.instagram.com/apikoll/p/BxBstXxHKGn"
                title="Posting"
                width={400}
                height={400}
                />
                </Box> */}
                <Button
                  LinkComponent="a"
                  target="__blank"
                  href={submission?.content}
                  variant="contained"
                  startIcon={<Iconify icon="lucide:external-link" />}
                  fullWidth
                >
                  View Posting
                </Button>
              </Box>
              {submission?.status === 'PENDING_REVIEW' && (
                <Box my={2} textAlign="end">
                  <Button size="small" variant="contained" color="success" onClick={onSubmit}>
                    Approve
                  </Button>
                </Box>
              )}
            </>
          )}
          {submission?.isReview && submission?.status === 'APPROVED' && (
            <Box component={Paper} position="relative" p={10}>
              <Stack gap={1.5} alignItems="center">
                <Image src="/assets/approve.svg" width={200} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ textAlign: 'center' }}>
                  Posting has been reviewed
                </Typography>
              </Stack>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Posting;

Posting.propTypes = {
  campaign: PropTypes.object,
  submission: PropTypes.object,
  creator: PropTypes.object,
};
