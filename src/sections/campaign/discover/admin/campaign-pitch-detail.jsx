import dayjs from 'dayjs';
import React from 'react';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';

import { Box, Card, Chip, Stack, Button, Typography, ListItemText } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import Markdown from 'src/components/markdown/markdown';

const CampaignPitchDetail = ({ pitch }) => {
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

  //   const renderTabs = (
  //     <Tabs
  //       value={currentTab}
  //       onChange={(e, val) => setCurrentTab(val)}
  //       variant="fullWidth"
  //       sx={{
  //         border: (theme) => `dashed 1px ${theme.palette.divider}`,
  //         borderRadius: 2,
  //         p: 2,
  //         [`& .Mui-selected`]: {
  //           bgcolor: (theme) => theme.palette.background.paper,
  //           borderRadius: 1.5,
  //         },
  //         mt: 2,
  //       }}
  //       TabIndicatorProps={{
  //         sx: {
  //           display: 'none',
  //         },
  //       }}
  //     >
  //       {pitch?.content ? (
  //         <Tab
  //           value="script"
  //           label="Pitch Script"
  //           icon={<Iconify icon="streamline:script-2-solid" />}
  //         />
  //       ) : (
  //         <Tab value="video" label="Pitch Video" icon={<Iconify icon="ph:video-fill" />} />
  //       )}
  //     </Tabs>
  //   );

  const renderPitchContentScript = (
    <Box
      p={2}
      sx={{ border: (theme) => `dashed 1px ${theme.palette.divider}`, borderRadius: 2, mt: 2 }}
    >
      <Box component={Card} p={2} mb={2}>
        <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
          <Iconify icon="streamline:script-2-solid" />
          <Typography>Pitch Script</Typography>
        </Stack>
      </Box>
      <Markdown children={pitch?.content} />
    </Box>
  );

  const renderPitchContentVideo = (
    <>
      <Typography>Video</Typography>
      <Typography>dwad</Typography>
    </>
  );

  const renderButton = (
    <Stack direction="row" alignItems="center" justifyContent="stretch" mt={2} gap={2}>
      <Button
        fullWidth
        color="error"
        variant="outlined"
        onClick={() =>
          reject({ campaignId: pitch?.campaignId, creatorId: pitch?.userId, pitchId: pitch?.id })
        }
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
      {renderButton}
    </>
  );
};

export default CampaignPitchDetail;

CampaignPitchDetail.propTypes = {
  pitch: PropTypes.object,
};
