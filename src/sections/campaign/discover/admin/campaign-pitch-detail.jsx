import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

import { Box, Tab, Card, Chip, Tabs, Typography, ListItemText } from '@mui/material';

import Iconify from 'src/components/iconify';
import Markdown from 'src/components/markdown/markdown';

const CampaignPitchDetail = ({ pitch }) => {
  const [currentTab, setCurrentTab] = useState('script');

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

  const renderTabs = (
    <Tabs
      value={currentTab}
      onChange={(e, val) => setCurrentTab(val)}
      variant="fullWidth"
      sx={{
        border: (theme) => `dashed 1px ${theme.palette.divider}`,
        borderRadius: 2,
        p: 2,
        [`& .Mui-selected`]: {
          bgcolor: (theme) => theme.palette.background.paper,
          borderRadius: 1.5,
        },
        mt: 2,
      }}
      TabIndicatorProps={{
        sx: {
          display: 'none',
        },
      }}
    >
      <Tab
        value="script"
        label="Pitch Script"
        icon={<Iconify icon="streamline:script-2-solid" />}
      />
      <Tab value="video" label="Pitch Video" icon={<Iconify icon="ph:video-fill" />} />
    </Tabs>
  );

  const renderPitchContentScript = (
    <Box
      p={2}
      sx={{ border: (theme) => `dashed 1px ${theme.palette.divider}`, borderRadius: 2, mt: 2 }}
    >
      <Markdown children={pitch?.content} />
    </Box>
  );

  //   const renderPitchContentVideo = (
  //     <>
  //       <Typography>dwad</Typography>
  //       <Typography>dwad</Typography>
  //     </>
  //   );

  return (
    <>
      {renderCreatorInformation}
      {renderTabs}
      {pitch?.content && renderPitchContentScript}
      {/* {currentTab === 'script' ? renderPitchContentScript : renderPitchContentVideo} */}
    </>
  );
};

export default CampaignPitchDetail;

CampaignPitchDetail.propTypes = {
  pitch: PropTypes.object,
};
