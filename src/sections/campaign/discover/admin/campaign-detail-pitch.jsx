import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { enqueueSnackbar } from 'notistack';

import {
  Box,
  Card,
  Chip,
  Stack,
  alpha,
  Dialog,
  Button,
  Drawer,
  Tooltip,
  IconButton,
  DialogTitle,
  ListItemText,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { countries } from 'src/assets/data';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';
import Markdown from 'src/components/markdown';
import EmptyContent from 'src/components/empty-content/empty-content';

import MediaKitModal from './media-kit-modal';

const CampaignDetailPitch = ({ pitches, shortlisted }) => {
  const [open, setOpen] = useState(false);
  const [selectedPitch, setSelectedPitch] = useState(null);
  const router = useRouter();
  const filterBar = useBoolean();

  const mediaKit = useBoolean();

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

  const getFullPhoneNumber = (country, phoneNumber) => {
    const initial = countries.filter((elem) => elem.label.includes(country))[0].phone;
    return `+${initial}-${phoneNumber}`;
  };

  const renderFilterDrawer = (
    <Drawer
      anchor="right"
      open={filterBar.value}
      onClose={filterBar.onFalse}
      slotProps={{
        backdrop: { invisible: true },
      }}
      PaperProps={{
        sx: { width: 280 },
      }}
    >
      <h1>asdas</h1>
    </Drawer>
  );

  return pitches.length > 0 ? (
    <>
      <Box
        sx={{
          textAlign: 'end',
        }}
      >
        <Button onClick={filterBar.onTrue}>Filter</Button>
      </Box>
      <Box
        display="grid"
        gridTemplateColumns={{ xs: 'repeat(1,1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3,1fr)' }}
        gap={2}
      >
        {pitches &&
          pitches.map((pitch) => (
            <>
              <Card
                key={pitch?.id}
                sx={{
                  p: 1.5,
                }}
              >
                {/* {isShortlisted(pitch?.userId) && pitch?.status === 'accept' && (
                <Chip
                  label="shortlisted"
                  size="small"
                  color="success"
                  sx={{
                    position: 'absolute',
                    bottom: 10,
                    right: 10,
                  }}
                />
              )} */}

                {pitch?.status ? (
                  <>
                    {pitch?.status === 'accept' && (
                      <Chip
                        label="approved"
                        size="small"
                        color="success"
                        sx={{
                          position: 'absolute',
                          bottom: 10,
                          right: 10,
                        }}
                      />
                    )}
                    {pitch?.status === 'reject' && (
                      <Chip
                        label="rejected"
                        size="small"
                        color="error"
                        sx={{
                          position: 'absolute',
                          bottom: 10,
                          right: 10,
                        }}
                      />
                    )}
                    {pitch?.status === 'filtered' && (
                      <Chip
                        label="filtered"
                        size="small"
                        color="success"
                        sx={{
                          position: 'absolute',
                          bottom: 10,
                          right: 10,
                        }}
                      />
                    )}
                  </>
                ) : (
                  <Chip
                    label="Pending"
                    size="small"
                    color="warning"
                    sx={{
                      position: 'absolute',
                      bottom: 10,
                      right: 10,
                    }}
                  />
                )}

                <Tooltip title={`View ${pitch?.user?.name}`}>
                  <IconButton
                    sx={{
                      position: ' absolute',
                      top: 0,
                      right: 0,
                    }}
                    onClick={() => router.push(paths.dashboard.campaign.pitch(pitch?.id))}
                    // onClick={() => {
                    //   setOpen(true);
                    //   setSelectedPitch(pitch);
                    // }}
                  >
                    <Iconify icon="fluent:open-12-filled" width={16} />
                  </IconButton>
                </Tooltip>
                <Stack direction="row" spacing={2}>
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
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Tooltip
                        title={getFullPhoneNumber(pitch?.user?.country, pitch?.user?.phoneNumber)}
                      >
                        <IconButton
                          size="small"
                          color="success"
                          sx={{
                            borderRadius: 1,
                            bgcolor: (theme) => alpha(theme.palette.success.main, 0.08),
                            '&:hover': {
                              bgcolor: (theme) => alpha(theme.palette.success.main, 0.16),
                            },
                          }}
                        >
                          <Iconify icon="material-symbols:call" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Media Kit">
                        <IconButton
                          size="small"
                          color="info"
                          sx={{
                            borderRadius: 1,
                            bgcolor: (theme) => alpha(theme.palette.info.main, 0.08),
                            '&:hover': {
                              bgcolor: (theme) => alpha(theme.palette.info.main, 0.16),
                            },
                          }}
                          onClick={mediaKit.onTrue}
                        >
                          <Iconify icon="flowbite:profile-card-outline" width={15} />
                        </IconButton>
                      </Tooltip>
                      {/* <Typography variant="caption">Type</Typography>
                  <Chip label={pitch?.type} size="small" color="secondary" /> */}
                      {/* <Button onClick={() => router.push(paths.dashboard.campaign.pitch(pitch?.id))}>
                    View
                  </Button> */}
                    </Stack>
                  </Stack>
                </Stack>
              </Card>
              <MediaKitModal
                open={mediaKit.value}
                handleClose={mediaKit.onFalse}
                creatorId={pitch?.user?.creator?.id}
              />
            </>
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
      {renderFilterDrawer}
    </>
  ) : (
    <EmptyContent title="No Pitch" filled />
  );
};

export default CampaignDetailPitch;

CampaignDetailPitch.propTypes = {
  pitches: PropTypes.array,
  shortlisted: PropTypes.array,
};
