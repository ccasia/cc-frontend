import PropTypes from 'prop-types';
import { useTheme } from '@emotion/react';
import React, { useMemo, useState } from 'react';

import {
  Box,
  Grid,
  Card,
  Stack,
  Button,
  Drawer,
  TextField,
  IconButton,
  InputAdornment,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content/empty-content';

import UserCard from './user-card';
import MediaKitModal from '../media-kit-modal';
import CampaignDetailPitchContent from './campaign-detail-pitch-content';

const CampaignDetailPitch = ({ pitches, shortlisted, timeline }) => {
  const smUp = useResponsive('up', 'sm');
  const [selectedPitch, setSelectedPitch] = useState(null);
  const [search, setSearch] = useState();
  const filterBar = useBoolean();
  const mediaKit = useBoolean();
  const router = useRouter();
  const theme = useTheme();
  const drawer = useBoolean();
  // const [currentTab, setCurrentTab] = useState(null);

  const filteredPitches = useMemo(
    () =>
      search
        ? pitches?.filter((elem) => elem.user.name.toLowerCase().includes(search.toLowerCase()))
        : pitches,
    [pitches, search]
  );

  const handleChange = (e) => {
    setSearch(e.target.value);
    setSelectedPitch(null);
  };

  const notfound = search && filteredPitches.length < 1;

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

  // const renderOverview = (
  //   <Tabs
  //     variant="fullWidth"
  //     value={currentTab}
  //     onChange={(e, val) => setCurrentTab(val)}
  //     sx={{ mb: 2 }}
  //   >
  //     <Tab
  //       value="undecided"
  //       label="Undecided"
  //       iconPosition="end"
  //       icon={
  //         <Label variant="filled">
  //           {pitches?.filter((item) => item.status === 'undecided').length}
  //         </Label>
  //       }
  //     />
  //     <Tab
  //       value="approved"
  //       label="Approved"
  //       iconPosition="end"
  //       icon={
  //         <Label variant="filled">
  //           {pitches?.filter((item) => item.status === 'approved').length}
  //         </Label>
  //       }
  //     />
  //     <Tab
  //       value="filtered"
  //       label="Filtered"
  //       iconPosition="end"
  //       icon={
  //         <Label variant="filled">
  //           {pitches?.filter((item) => item.status === 'filtered').length}
  //         </Label>
  //       }
  //     />
  //     <Tab
  //       value="rejected"
  //       label="Rejected"
  //       iconPosition="end"
  //       icon={
  //         <Label variant="filled">
  //           {pitches?.filter((item) => item.status === 'rejected').length}
  //         </Label>
  //       }
  //     />
  //   </Tabs>
  // );

  return pitches?.length > 0 ? (
    <>
      {/* <Box
        sx={{
          bgcolor: alpha(theme.palette.warning.light, 0.8),
          borderRadius: 1,
          p: 1,
          color: theme.palette.text.primary,
          mb: 2,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Iconify icon="fluent:warning-24-filled" />
          <Stack direction="row" gap={2} alignItems="center">
            <Typography variant="caption" fontWeight={700}>
              Submission Timelime
            </Typography>
            <Stack direction="row" alignItems="center" gap={1}>
              <Iconify icon="mdi:calendar" />
              <Typography variant="caption" fontWeight={700}>
                {dayjs(timeline.startDate).format('ddd LL')}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" gap={1}>
              <Iconify icon="mdi:calendar" />
              <Typography variant="caption" fontWeight={700}>
                {dayjs(timeline.endDate).format('ddd LL')}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Box> */}
      <Box
        sx={{
          // textAlign: 'end',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <TextField
          placeholder="Search by Name"
          sx={{
            width: 260,
          }}
          value={search}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="material-symbols:search" />
              </InputAdornment>
            ),
          }}
          onChange={handleChange}
        />
        <Button onClick={filterBar.onTrue}>Filter</Button>
      </Box>
      {/* {renderOverview} */}
      <Grid spacing={2} container>
        {smUp && (
          <Grid
            item
            xs={12}
            sm={4}
            sx={{
              maxHeight: 490,
              overflow: 'scroll',
            }}
          >
            {notfound ? (
              <EmptyContent title="Not found" />
            ) : (
              <Stack gap={2} gridColumn={1} overflow="scroll">
                {filteredPitches?.map((pitch) => (
                  <Box
                    key={pitch?.id}
                    onClick={() =>
                      smUp
                        ? setSelectedPitch(pitch)
                        : router.push(paths.dashboard.campaign.pitch(pitch?.campaignId, pitch?.id))
                    }
                  >
                    <UserCard creator={pitch} selectedPitch={selectedPitch} />
                    <MediaKitModal
                      open={mediaKit.value}
                      handleClose={mediaKit.onFalse}
                      creatorId={pitch?.user?.creator?.id}
                    />
                  </Box>
                ))}
              </Stack>
            )}
            {/* <Dialog open={open} onClose={handleClose}>
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
            </Dialog> */}
          </Grid>
        )}
        {!smUp && (
          <>
            <IconButton
              sx={{
                position: 'fixed',
                left: 10,
                top: '50%',
                zIndex: 1111,
              }}
              onClick={() => {
                drawer.onTrue();
              }}
            >
              <Iconify
                icon="mynaui:arrow-right-square"
                width={30}
                color={theme.palette.grey[400]}
              />
            </IconButton>
            <Drawer
              open={drawer.value}
              onClose={() => {
                drawer.onFalse();
              }}
              sx={{
                minWidth: '80%',
              }}
              PaperProps={{
                sx: { width: '80%' },
              }}
            >
              <Stack gap={2} p={2}>
                {filteredPitches?.map((pitch) => (
                  <Box
                    key={pitch?.id}
                    onClick={() => {
                      setSelectedPitch(pitch);
                      drawer.onFalse();
                    }}
                  >
                    <UserCard creator={pitch} selectedPitch={selectedPitch} />
                    <MediaKitModal
                      open={mediaKit.value}
                      handleClose={mediaKit.onFalse}
                      creatorId={pitch?.user?.creator?.id}
                    />
                  </Box>
                ))}
              </Stack>
            </Drawer>
          </>
        )}
        <Grid item xs={12} sm={8}>
          <Box component={Card} p={2}>
            {selectedPitch ? (
              <CampaignDetailPitchContent data={selectedPitch} />
            ) : (
              <EmptyContent title="Select a pitch" />
            )}
          </Box>
        </Grid>
      </Grid>
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
  timeline: PropTypes.array,
};

// {/* <Card
//   key={pitch?.id}
//   sx={{
//     p: 1.5,
//   }}
// >
//   {/* {isShortlisted(pitch?.userId) && pitch?.status === 'accept' && (
//                 <Chip
//                   label="shortlisted"
//                   size="small"
//                   color="success"
//                   sx={{
//                     position: 'absolute',
//                     bottom: 10,
//                     right: 10,
//                   }}
//                 />
//               )} */}

//   {pitch?.status ? (
//     <>
//       {pitch?.status === 'accept' && (
//         <Chip
//           label="approved"
//           size="small"
//           color="success"
//           sx={{
//             position: 'absolute',
//             bottom: 10,
//             right: 10,
//           }}
//         />
//       )}
//       {pitch?.status === 'reject' && (
//         <Chip
//           label="rejected"
//           size="small"
//           color="error"
//           sx={{
//             position: 'absolute',
//             bottom: 10,
//             right: 10,
//           }}
//         />
//       )}
//       {pitch?.status === 'filtered' && (
//         <Chip
//           label="filtered"
//           size="small"
//           color="success"
//           sx={{
//             position: 'absolute',
//             bottom: 10,
//             right: 10,
//           }}
//         />
//       )}
//     </>
//   ) : (
//     <Chip
//       label="Pending"
//       size="small"
//       color="warning"
//       sx={{
//         position: 'absolute',
//         bottom: 10,
//         right: 10,
//       }}
//     />
//   )}

//   <Tooltip title={`View ${pitch?.user?.name}`}>
//     <IconButton
//       sx={{
//         position: ' absolute',
//         top: 0,
//         right: 0,
//       }}
//       onClick={() => router.push(paths.dashboard.campaign.pitch(pitch?.id))}
//       // onClick={() => {
//       //   setOpen(true);
//       //   setSelectedPitch(pitch);
//       // }}
//     >
//       <Iconify icon="fluent:open-12-filled" width={16} />
//     </IconButton>
//   </Tooltip>
//   <Stack direction="row" spacing={2}>
//     <Image
//       src="/test.jpeg"
//       ratio="1/1"
//       sx={{
//         borderRadius: 1,
//         width: 70,
//       }}
//     />
//     <Stack spacing={1} alignItems="start">
//       <ListItemText
//         primary={pitch?.user?.name}
//         secondary={`Pitch at ${dayjs(pitch?.createdAt).format('LL')}`}
//         primaryTypographyProps={{
//           typography: 'subtitle1',
//         }}
//       />
//       <Stack direction="row" alignItems="center" spacing={1}>
//         <Tooltip title={getFullPhoneNumber(pitch?.user?.country, pitch?.user?.phoneNumber)}>
//           <IconButton
//             size="small"
//             color="success"
//             sx={{
//               borderRadius: 1,
//               bgcolor: (theme) => alpha(theme.palette.success.main, 0.08),
//               '&:hover': {
//                 bgcolor: (theme) => alpha(theme.palette.success.main, 0.16),
//               },
//             }}
//           >
//             <Iconify icon="material-symbols:call" />
//           </IconButton>
//         </Tooltip>
//         <Tooltip title="Media Kit">
//           <IconButton
//             size="small"
//             color="info"
//             sx={{
//               borderRadius: 1,
//               bgcolor: (theme) => alpha(theme.palette.info.main, 0.08),
//               '&:hover': {
//                 bgcolor: (theme) => alpha(theme.palette.info.main, 0.16),
//               },
//             }}
//             onClick={mediaKit.onTrue}
//           >
//             <Iconify icon="flowbite:profile-card-outline" width={15} />
//           </IconButton>
//         </Tooltip>
//         {/* <Typography variant="caption">Type</Typography>
//                   <Chip label={pitch?.type} size="small" color="secondary" /> */}
//         {/* <Button onClick={() => router.push(paths.dashboard.campaign.pitch(pitch?.id))}>
//                     View
//                   </Button> */}
//       </Stack>
//     </Stack>
//   </Stack>
// </Card>; */}
