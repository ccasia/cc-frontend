import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useRef } from 'react';
import { enqueueSnackbar } from 'notistack';

import { Box, Card, Chip, Stack, Button, Typography, ListItemText } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import Markdown from 'src/components/markdown';
import { useSnackbar } from 'src/components/snackbar';
import { useAuthContext } from 'src/auth/hooks';

const CampaignPitchDetail = ({ pitch }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();
  const a = useRef(null);
  const b = useRef(null);
  
  const isClient = user?.role === 'client' || user?.admin?.role?.name === 'client';

  const approve = async ({ campaignId, creatorId, pitchId }) => {
    try {
      const res = await axiosInstance.post(endpoints.campaign.pitch.approve, {
        campaignId,
        creatorId,
        pitchId,
      });
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      console.log(error);

      enqueueSnackbar(error?.message || 'Creator has been shortlisted', {
        variant: 'error',
      });
    }
  };

  const reject = async ({ campaignId, creatorId, pitchId }) => {
    try {
      const res = await axiosInstance.post(endpoints.campaign.pitch.reject, {
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

  const filter = async ({ pitchId }) => {
    try {
      const res = await axiosInstance.post(endpoints.campaign.pitch.filter, {
        pitchId,
      });
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    }
  };

  const renderCreatorInformation = (
    <Box
      component={Card}
      p={2}
      sx={{
        // borderStyle: 'dashed',
        borderColor: (theme) => theme.palette.text.disabled,
      }}
    >
      <Typography variant="h5">Creator Information</Typography>

      <Box
        display="grid"
        gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }}
        gap={2}
        mt={2}
      >
        <ListItemText
          primary="Name"
          secondary={pitch?.user?.name}
          primaryTypographyProps={{
            variant: 'subtitle1',
          }}
          secondaryTypographyProps={{
            variant: 'subtitle2',
          }}
        />
        <ListItemText
          primary="Email"
          secondary={pitch?.user?.email}
          primaryTypographyProps={{
            variant: 'subtitle1',
          }}
          secondaryTypographyProps={{
            variant: 'subtitle2',
          }}
        />
        <ListItemText
          primary="Age"
          secondary={`${dayjs().get('year') - dayjs(pitch?.user?.creator?.birthDate).get('year')} years old`}
          primaryTypographyProps={{
            variant: 'subtitle1',
          }}
          secondaryTypographyProps={{
            variant: 'subtitle2',
          }}
        />
        <ListItemText
          primary="Languages"
          secondary={pitch?.user?.creator?.languages.map((elem) => (
            <Chip label={elem} size="small" sx={{ mr: 1 }} />
          ))}
          primaryTypographyProps={{
            variant: 'subtitle1',
          }}
          secondaryTypographyProps={{
            variant: 'subtitle2',
          }}
        />
        <ListItemText
          primary="Pronounce"
          secondary={pitch?.user?.creator?.pronounce}
          primaryTypographyProps={{
            variant: 'subtitle1',
          }}
          secondaryTypographyProps={{
            variant: 'subtitle2',
          }}
        />

        <ListItemText
          primary="Employement Type"
          secondary={pitch?.user?.creator?.employment}
          primaryTypographyProps={{
            variant: 'subtitle1',
          }}
          secondaryTypographyProps={{
            variant: 'subtitle2',
          }}
        />

        <ListItemText
          primary="Industries"
          secondary={pitch?.user?.creator?.industries.map((elem) => (
            <Chip size="small" label={elem?.name} sx={{ mr: 1 }} />
          ))}
          primaryTypographyProps={{
            variant: 'subtitle1',
          }}
          secondaryTypographyProps={{
            variant: 'subtitle2',
          }}
        />

        <ListItemText
          primary="Interests"
          secondary={pitch?.user?.creator?.interests.map((elem) => (
            <Chip size="small" label={elem?.name} sx={{ mr: 1 }} />
          ))}
          primaryTypographyProps={{
            variant: 'subtitle1',
          }}
          secondaryTypographyProps={{
            variant: 'subtitle2',
          }}
        />

        <ListItemText
          primary="Instagram"
          secondary={pitch?.user?.creator?.instagram}
          primaryTypographyProps={{
            variant: 'subtitle1',
          }}
          secondaryTypographyProps={{
            variant: 'subtitle2',
          }}
        />

        <ListItemText
          primary="Tiktok"
          secondary={pitch?.user?.creator?.tiktok}
          primaryTypographyProps={{
            variant: 'subtitle1',
          }}
          secondaryTypographyProps={{
            variant: 'subtitle2',
          }}
        />
      </Box>

      {/* <List>
        <ListItem>
          <ListItemText
            primary="Name"
            secondary={pitch?.user?.name}
            primaryTypographyProps={{
              variant: 'subtitle1',
            }}
            secondaryTypographyProps={{
              variant: 'subtitle2',
            }}
          />
        </ListItem>
      </List> */}
    </Box>
  );

  const renderPitchContentScript = (
    <Box
      p={2}
      sx={{ border: (theme) => `dashed 1px ${theme.palette.divider}`, borderRadius: 2, mt: 2 }}
    >
      <Box component={Card} p={2} mb={2} ref={a}>
        <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
          <Iconify icon="streamline:script-2-solid" />
          <Typography>Pitch Script</Typography>
        </Stack>
      </Box>

      <Box component={Card} ref={b} p={2}>
        <Markdown children={pitch?.content} />
      </Box>
    </Box>
  );

  const renderPitchContentVideo = (
    <>
      <Typography>Video</Typography>
      <Typography>dwad</Typography>
    </>
  );

  const renderButton = (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems="center"
      justifyContent="stretch"
      mt={2}
      gap={2}
    >
      <Button
        fullWidth
        // color="success"
        variant="contained"
        onClick={() => filter({ pitchId: pitch?.id })}
      >
        Filter this pitch
      </Button>
      <Button
        fullWidth
        // color="error"
        variant="outlined"
        onClick={() =>
          reject({ campaignId: pitch?.campaignId, creatorId: pitch?.userId, pitchId: pitch?.id })
        }
        startIcon={<Iconify icon="oui:thumbs-down" />}
      >
        Reject
      </Button>
      <Button
        fullWidth
        color="success"
        variant="contained"
        onClick={() =>
          approve({ campaignId: pitch?.campaignId, creatorId: pitch?.userId, pitchId: pitch?.id })
        }
        startIcon={<Iconify icon="oui:thumbs-up" />}
      >
        Accept
      </Button>
    </Stack>
  );

  return (
    <>
      {renderCreatorInformation}
      {/* {renderTabs} */}
      {pitch?.content ? renderPitchContentScript : renderPitchContentVideo}

      {/* Only show action buttons for admin users */}
      {!isClient && renderButton}
    </>
  );
};

export default CampaignPitchDetail;

CampaignPitchDetail.propTypes = {
  pitch: PropTypes.object,
};
