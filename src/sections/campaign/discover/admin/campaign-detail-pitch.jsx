import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { enqueueSnackbar } from 'notistack';

import {
  Box,
  Card,
  Chip,
  Stack,
  Dialog,
  Button,
  IconButton,
  DialogTitle,
  ListItemText,
  DialogContent,
  DialogActions,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';
import Markdown from 'src/components/markdown';

const CampaignDetailPitch = ({ pitches, shortlisted }) => {
  const [open, setOpen] = useState(false);
  const [selectedPitch, setSelectedPitch] = useState(null);

  const handleClose = () => {
    setOpen(false);
    setSelectedPitch(null);
  };

  const approve = async ({ campaignId, creatorId, pitchId }) => {
    try {
      const res = await axiosInstance.post(endpoints.campaign.pitch.approve, {
        campaignId,
        creatorId,
        pitchId,
      });
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    }
  };

  // const isShortlisted = (id) => {
  //   const a = shortlisted.some((item) => item.creatorId.includes(id));
  //   return a;
  // };

  return (
    <Box
      display="grid"
      gridTemplateColumns={{ xs: 'repeat(1,1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3,1fr)' }}
      gap={2}
    >
      {pitches &&
        pitches.map((pitch) => (
          <Card
            key={pitch?.id}
            sx={{
              p: 1.5,
            }}
          >
            <IconButton
              sx={{
                position: ' absolute',
                top: 0,
                right: 0,
              }}
              onClick={() => {
                setOpen(true);
                setSelectedPitch(pitch);
              }}
            >
              <Iconify icon="fluent:open-12-filled" width={16} />
            </IconButton>
            <Stack direction="row" spacing={2}>
              {/* {isShortlisted(pitch?.userId) && <Chip label="shortlisted" />} */}
              <Image
                src="/test.jpeg"
                ratio="1/1"
                sx={{
                  borderRadius: 1,
                  width: 70,
                }}
              />
              <Stack spacing={1} alignItems="start">
                <ListItemText
                  primary={pitch?.user?.name}
                  secondary={`Pitch at ${dayjs(pitch?.createdAt).format('LL')}`}
                  primaryTypographyProps={{
                    typography: 'subtitle1',
                  }}
                />
                <Chip label={pitch?.type} size="small" color="secondary" />
              </Stack>
            </Stack>
          </Card>
        ))}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Pitch Content</DialogTitle>
        <DialogContent>
          <Markdown children={selectedPitch?.content} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          <Button
            onClick={() => {
              approve({
                campaignId: selectedPitch?.campaignId,
                creatorId: selectedPitch?.userId,
                pitchId: selectedPitch?.id,
              });
              handleClose();
            }}
            color="success"
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CampaignDetailPitch;

CampaignDetailPitch.propTypes = {
  pitches: PropTypes.array,
  shortlisted: PropTypes.array,
};
