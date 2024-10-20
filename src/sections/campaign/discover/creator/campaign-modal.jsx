/* eslint-disable no-nested-ternary */
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import 'react-quill/dist/quill.snow.css';
import { enqueueSnackbar } from 'notistack';

import Dialog from '@mui/material/Dialog';
import CloseIcon from '@mui/icons-material/Close';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import {
  Box,
  Chip,
  Grid,
  Stack,
  Paper,
  Button,
  Avatar,
  Typography,
  IconButton,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { formatText } from 'src/utils/format-test';
import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';
import Carousel from 'src/components/carousel/carousel';

const CampaignModal = ({ open, handleClose, campaign, openForm, dialog }) => {
  // const [activeTab, setActiveTab] = useState(0);
  const { user } = useAuthContext();
  const router = useRouter();

  const isShortlisted = user?.shortlisted && user?.shortlisted.map((item) => item.campaignId);

  const existingPitch = user?.pitch && user?.pitch.find((item) => item.campaignId === campaign?.id);

  const saveCampaign = async (campaignId) => {
    try {
      const res = await axiosInstance.post(endpoints.campaign.creator.saveCampaign, {
        campaignId,
      });
      mutate(endpoints.campaign.getMatchedCampaign);
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar('Error', {
        variant: 'error',
      });
    }
  };

  const unSaveCampaign = async (saveCampaignId) => {
    try {
      const res = await axiosInstance.delete(
        endpoints.campaign.creator.unsaveCampaign(saveCampaignId)
      );
      mutate(endpoints.campaign.getMatchedCampaign);
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar('Error', {
        variant: 'error',
      });
    }
  };

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullImageOpen, setFullImageOpen] = useState(false);
  const images = campaign?.campaignBrief?.images || [];

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : images.length - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex < images.length - 1 ? prevIndex + 1 : 0));
  };

  const handleImageClick = () => {
    setFullImageOpen(true);
  };

  const handleFullImageClose = () => {
    setFullImageOpen(false);
  };

  const renderContent = (
    <Box sx={{ p: 3, pt: 4 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar
            src={campaign?.company?.logo}
            alt={campaign?.company?.name}
            sx={{ width: 64, height: 64 }}
          />
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 'bold',
                mb: 0.5,
              }}
            >
              {campaign?.name}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
              }}
            >
              by {campaign?.company?.name}
            </Typography>
          </Box>
        </Stack>
        <Box sx={{ width: '30%', maxWidth: 200 }}>
          <Typography variant="caption" color="text.secondary" noWrap>
            Profile match:{' '}
            <Box component="span" sx={{ color: 'success.main', fontWeight: 'bold' }}>
              {Math.min(Math.round(campaign?.percentageMatch), 100)}%
            </Box>
          </Typography>
          <LinearProgress
            variant="determinate"
            value={Math.min(Math.round(campaign?.percentageMatch), 100)}
            sx={{
              mt: 0.5,
              height: 4,
              borderRadius: 1,
              bgcolor: 'success.lighter',
              '& .MuiLinearProgress-bar': {
                borderRadius: 1,
                bgcolor: 'success.main',
              },
            }}
          />
        </Box>
      </Stack>
      {/* <Box sx={{ position: 'relative', height: 400, mb: 3 }}>
        <Image
          src={images[currentImageIndex]}
          alt={`Campaign image ${currentImageIndex + 1}`}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: 2,
            cursor: 'pointer',
          }}
          onClick={handleImageClick}
        />
        {images.length > 1 && (
          <>
            <IconButton
              onClick={handlePrevImage}
              sx={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                },
              }}
            >
              <ArrowBackIosNewIcon />
            </IconButton>
            <IconButton
              onClick={handleNextImage}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                },
              }}
            >
              <ArrowForwardIosIcon />
            </IconButton>
          </>
        )}
      </Box> */}
      <Box sx={{ mb: 3 }}>
        <Carousel images={campaign?.campaignBrief?.images} />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Stack spacing={3}>
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.neutral', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Campaign Description
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {campaign?.description}
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.neutral', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom color="primary">
                User Persona
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {formatText(campaign?.campaignRequirement?.user_persona)}
              </Typography>
            </Paper>
          </Stack>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.neutral', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Campaign Requirements
            </Typography>
            <Grid container spacing={2}>
              {[
                {
                  label: 'Gender',
                  data: campaign?.campaignRequirement?.gender,
                  icon: 'mdi:gender-male-female',
                },
                {
                  label: 'Age',
                  data: campaign?.campaignRequirement?.age,
                  icon: 'mdi:account-outline',
                },
              ].map((item, index) => (
                <Grid item xs={6} key={index}>
                  <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                      <Iconify icon={item.icon} width={20} height={20} />
                      <Typography variant="subtitle2">{item.label}</Typography>
                    </Stack>
                    <Stack direction="row" flexWrap="wrap" gap={0.5}>
                      {item.data?.map((value, idx) => (
                        <Chip key={idx} label={formatText(value)} size="small" />
                      ))}
                    </Stack>
                  </Paper>
                </Grid>
              ))}
              <Grid item xs={6} sx={{ display: 'flex' }}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, width: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <Iconify icon="mdi:map-marker-outline" width={20} height={20} />
                    <Typography variant="subtitle2">Geo Location</Typography>
                  </Stack>
                  <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ flexGrow: 1 }}>
                    {campaign?.campaignRequirement?.geoLocation?.map((value, idx) => (
                      <Chip key={idx} label={formatText(value)} size="small" />
                    ))}
                  </Stack>
                </Paper>
              </Grid>
              <Grid item xs={6} sx={{ display: 'flex' }}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, width: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <Iconify icon="mdi:translate" width={20} height={20} />
                    <Typography variant="subtitle2">Language</Typography>
                  </Stack>
                  <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ flexGrow: 1 }}>
                    {campaign?.campaignRequirement?.language?.map((value, idx) => (
                      <Chip key={idx} label={formatText(value)} size="small" />
                    ))}
                  </Stack>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <Iconify icon="mdi:account-star-outline" width={20} height={20} />
                    <Typography variant="subtitle2">Creator Persona</Typography>
                  </Stack>
                  <Stack direction="row" flexWrap="wrap" gap={0.5}>
                    {campaign?.campaignRequirement?.creator_persona?.map((value, idx) => (
                      <Chip key={idx} label={formatText(value)} size="small" />
                    ))}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const renderActions = (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}
    >
      <Button
        variant="outlined"
        startIcon={
          <Iconify icon={campaign?.bookMarkCampaign ? 'mdi:bookmark' : 'mdi:bookmark-outline'} />
        }
        onClick={() =>
          campaign?.bookMarkCampaign
            ? unSaveCampaign(campaign?.bookMarkCampaign.id)
            : saveCampaign(campaign?.id)
        }
      >
        {campaign?.bookMarkCampaign ? 'Unsave' : 'Save'}
      </Button>
      <Stack direction="row" spacing={2}>
        <Button variant="outlined" onClick={handleClose}>
          Close
        </Button>
        {isShortlisted?.includes(campaign.id) ? (
          <Button
            variant="contained"
            onClick={() => router.push(paths.dashboard.campaign.creator.detail(campaign.id))}
          >
            Manage Campaign
          </Button>
        ) : (
          <>
            {existingPitch?.status === 'undecided' && (
              <Button
                variant="contained"
                startIcon={<Iconify icon="mdi:clock-outline" width={20} />}
                disabled
                color="warning"
              >
                Pitch In Review
              </Button>
            )}
            {!user?.creator?.isFormCompleted && (
              <Button
                variant="contained"
                startIcon={<Iconify icon="mdi:form-select" width={20} />}
                onClick={() => dialog.onTrue()}
              >
                Complete Profile
              </Button>
            )}
            {!existingPitch && user?.creator?.isFormCompleted && (
              <Button
                variant="contained"
                startIcon={<Iconify icon="mdi:send" width={20} />}
                onClick={() => {
                  handleClose();
                  openForm();
                }}
              >
                Pitch
              </Button>
            )}
          </>
        )}
      </Stack>
    </Stack>
  );

  const renderFullSizeImage = (
    <Dialog
      open={fullImageOpen}
      onClose={handleFullImageClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          borderRadius: 2,
        },
      }}
    >
      <DialogContent
        sx={{
          p: 0,
          position: 'relative',
          height: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            src={images[currentImageIndex] || '/path/to/default/image.jpg'}
            alt={`Full size campaign image ${currentImageIndex + 1}`}
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
        </Box>
        <IconButton
          onClick={handleFullImageClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'text.primary',
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <CloseIcon />
        </IconButton>
        {images.length > 1 && (
          <>
            <IconButton
              onClick={handlePrevImage}
              sx={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'text.primary',
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <ArrowBackIosNewIcon />
            </IconButton>
            <IconButton
              onClick={handleNextImage}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'text.primary',
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <ArrowForwardIosIcon />
            </IconButton>
          </>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
          },
        }}
      >
        <DialogContent sx={{ p: 0 }}>{renderContent}</DialogContent>
        {renderActions}
      </Dialog>
      {renderFullSizeImage}
    </>
  );
};

export default CampaignModal;

CampaignModal.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  campaign: PropTypes.object,
  openForm: PropTypes.func,
  dialog: PropTypes.object,
};
