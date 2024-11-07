import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Paper,
  Table,
  Avatar,
  Dialog,
  Button,
  MenuItem,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
  Typography,
  DialogTitle,
  ListItemText,
  DialogContent,
  DialogActions,
  TableContainer,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { RHFSelect } from 'src/components/hook-form';
import Markdown from 'src/components/markdown/markdown';
import FormProvider from 'src/components/hook-form/form-provider';

const CampaignDetailPitchContent = ({ data, timelines }) => {
  const modal = useBoolean();

  const methods = useForm({
    defaultValues: {
      status: data?.status || '',
      pitchId: data?.id || '',
    },
  });

  const {
    setValue,
    getValues,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    setValue('status', data?.status);
    setValue('pitchId', data?.id);
  }, [setValue, data]);

  const handleChange = async (val) => {
    if (val.target.value === 'approved') {
      modal.onTrue();
    } else {
      const values = getValues();
      setValue('status', val.target.value);
      try {
        const res = await axiosInstance.patch(endpoints.campaign.pitch.changeStatus, {
          ...values,
          status: val.target.value,
        });
        enqueueSnackbar(res?.data?.message);
      } catch (error) {
        enqueueSnackbar('error', {
          variant: 'error',
        });
      }
    }
  };

  const onConfirm = async () => {
    const values = getValues();
    setValue('status', 'approved');

    try {
      const res = await axiosInstance.patch(endpoints.campaign.pitch.changeStatus, {
        ...values,
        status: 'approved',
      });

      enqueueSnackbar(res?.data?.message);
      modal.onFalse();
    } catch (error) {
      enqueueSnackbar('error', {
        variant: 'error',
      });
    }
  };

  const renderCampaignTaskModal = (
    <Dialog open={modal.value} onClose={modal.onFalse}>
      <DialogTitle>
        <ListItemText
          primary="Campaign Task"
          secondary={`Please confirm the list of tasks for creator ${data?.user?.name} before proceed.`}
          primaryTypographyProps={{
            variant: 'h5',
          }}
          secondaryTypographyProps={{
            variant: 'subtitle2',
          }}
        />
      </DialogTitle>

      <DialogContent>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 500 }}>
            <TableHead>
              <TableRow>
                <TableCell>Task Name</TableCell>
                <TableCell>Due Date</TableCell>
                {/* <TableCell>Priority</TableCell> */}
              </TableRow>
            </TableHead>
            <TableBody>
              {timelines
                .sort((a, b) => a.order - b.order)
                ?.map((timeline) => (
                  <TableRow key={timeline.id}>
                    <TableCell>{timeline.name}</TableCell>
                    <TableCell>{dayjs(timeline.endDate).format('ddd LL')}</TableCell>
                    {/* <TableCell>
                    <Label>Low</Label>
                  </TableCell> */}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={modal.onFalse} variant="outlined">
          Cancel
        </Button>
        <LoadingButton variant="contained" size="small" onClick={onConfirm} loading={isSubmitting}>
          Shortlist {data?.user?.name}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      <Stack spacing={2}>
        <Stack direction="row" gap={2} alignItems="center">
          <Stack direction="row" spacing={1} alignItems="center" flexGrow={1}>
            <Avatar alt={data?.user?.name} src={data?.user?.photoURL} />
            <Typography>{data?.user?.name}</Typography>
            <Iconify icon="mdi:tick-decagram" color="success.main" />
          </Stack>

          <FormProvider methods={methods}>
            <RHFSelect
              size="small"
              label="Status"
              name="status"
              sx={{ width: 150 }}
              onChange={(e, val) => handleChange(e)}
            >
              <MenuItem value="undecided">
                <Stack direction="row" alignItems="center">
                  <Iconify icon="mdi:dot" width={30} />
                  Undecided
                </Stack>
              </MenuItem>
              <MenuItem value="filtered">
                <Stack direction="row" alignItems="center">
                  <Iconify icon="mdi:dot" width={30} color="warning.main" />
                  Filtered
                </Stack>
              </MenuItem>
              <MenuItem value="approved">
                <Stack direction="row" alignItems="center">
                  <Iconify icon="mdi:dot" color="success.main" width={30} />
                  Approved
                </Stack>
              </MenuItem>
              <MenuItem value="rejected">
                <Stack direction="row" alignItems="center">
                  <Iconify icon="mdi:dot" color="error.main" width={30} />
                  Rejected
                </Stack>
              </MenuItem>
            </RHFSelect>
            {/* </FormControl> */}
          </FormProvider>
        </Stack>
        <Box display="flex" flexDirection="column">
          <Typography variant="h6">Profile</Typography>
          <Box
            display="grid"
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            }}
            gap={2}
            mt={1.5}
          >
            <ListItemText
              primary="Name"
              secondary={data?.user?.name}
              primaryTypographyProps={{
                variant: 'subtitle1',
              }}
              secondaryTypographyProps={{
                variant: 'subtitle2',
              }}
            />
            <ListItemText
              primary="Email"
              secondary={data?.user?.email}
              primaryTypographyProps={{
                variant: 'subtitle1',
              }}
              secondaryTypographyProps={{
                variant: 'subtitle2',
              }}
            />
            <ListItemText
              primary="Age"
              secondary={`${dayjs().get('year') - dayjs(data?.user?.creator?.birthDate).get('year')} years old`}
              primaryTypographyProps={{
                variant: 'subtitle1',
              }}
              secondaryTypographyProps={{
                variant: 'subtitle2',
              }}
            />
            <ListItemText
              primary="Languages"
              secondary={
                <Stack direction="row" gap={1} flexWrap="wrap">
                  {data?.user?.creator?.languages.map((elem, index) => (
                    <Label key={index}>{elem}</Label>
                  ))}
                </Stack>
              }
              primaryTypographyProps={{
                variant: 'subtitle1',
              }}
              secondaryTypographyProps={{
                variant: 'subtitle2',
              }}
            />
            <ListItemText
              primary="Pronounce"
              secondary={data?.user?.creator?.pronounce}
              primaryTypographyProps={{
                variant: 'subtitle1',
              }}
              secondaryTypographyProps={{
                variant: 'subtitle2',
              }}
            />

            <ListItemText
              primary="Employement Type"
              secondary={data?.user?.creator?.employment}
              primaryTypographyProps={{
                variant: 'subtitle1',
              }}
              secondaryTypographyProps={{
                variant: 'subtitle2',
              }}
            />

            <ListItemText
              primary="Interests"
              secondary={
                <Stack gap={1} direction="row" flexWrap="wrap">
                  {data?.user?.creator?.interests.map((elem, index) => (
                    <Label key={index}>{elem?.name}</Label>
                  ))}
                </Stack>
              }
              primaryTypographyProps={{
                variant: 'subtitle1',
              }}
              secondaryTypographyProps={{
                variant: 'subtitle2',
              }}
            />

            <ListItemText
              primary="Instagram"
              secondary={data?.user?.creator?.instagram}
              primaryTypographyProps={{
                variant: 'subtitle1',
              }}
              secondaryTypographyProps={{
                variant: 'subtitle2',
              }}
            />

            <ListItemText
              primary="Tiktok"
              secondary={data?.user?.creator?.tiktok}
              primaryTypographyProps={{
                variant: 'subtitle1',
              }}
              secondaryTypographyProps={{
                variant: 'subtitle2',
              }}
            />
          </Box>
        </Box>
        <Box display="flex" flexDirection="column">
          <Typography variant="h6">Pitch</Typography>

          <Box mt={1.5} mx="auto">
            {data?.type === 'text' ? (
              <Markdown children={data?.content} />
            ) : (
              <>
                {data.status === 'pending' ? (
                  <Typography>Video is uploading...</Typography>
                ) : (
                  <Box
                    component="video"
                    autoPlay
                    controls
                    sx={{
                      maxHeight: '60vh',
                      width: { xs: '70vw', sm: 'auto' },
                      borderRadius: 2,
                      boxShadow: 3,
                    }}
                  >
                    <source src={data?.content} />
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
      </Stack>
      {renderCampaignTaskModal}
    </>
  );
};

export default CampaignDetailPitchContent;

CampaignDetailPitchContent.propTypes = {
  data: PropTypes.object,
  timelines: PropTypes.array,
};
