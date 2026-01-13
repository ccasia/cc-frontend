import useSWR from 'swr';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useMemo, useState, useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, useFieldArray } from 'react-hook-form';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Dialog,
  Button,
  Divider,
  Collapse,
  MenuItem,
  IconButton,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import axiosInstance, { fetcher } from 'src/utils/axios';
import { formatReservationSlot } from 'src/utils/reservation-time';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, { RHFSelect, RHFTextField } from 'src/components/hook-form';

import CreatorCalendarPicker from './creator-calendar-picker';

export default function CreatorReservationDialog({ open, onClose, campaign, onUpdate }) {
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();

  const [showPicker, setShowPicker] = useState(false);

  const { data: config } = useSWR(
    open && campaign?.id ? `/api/logistics/campaign/${campaign.id}/reservation-config` : null,
    fetcher
  );

  const isAuto = config?.mode === 'AUTO_SCHEDULE';
  const creator = campaign?.creator || user;
  const logistic = Array.isArray(campaign?.logistics)
    ? campaign.logistics.find((item) => item.creatorId === user?.id)
    : campaign?.logistics;
  const reservationDetails = logistic?.reservationDetails;

  const isLocked = useMemo(() => {
    if (!isAuto || !config?.availabilityRules) return false;
    const totalSlotsCount = config.availabilityRules.reduce(
      (acc, rule) => acc + (rule.slots?.length || 0),
      0
    );
    return totalSlotsCount === 1;
  }, [config, isAuto]);

  const ReservationSchema = Yup.object().shape({
    outlet: Yup.string().required('Outlet is required'),
    phoneNumber: Yup.string().required('Contact number is required'),
    remarks: Yup.string(),
    selectedSlots: Yup.array().required('Availability is required'),
  });

  const defaultValues = {
    outlet: reservationDetails?.outlet || '',
    phoneNumber: creator?.phoneNumber || '',
    remarks: reservationDetails?.creatorRemarks || '',
    selectedSlots: [],
  };

  const methods = useForm({
    resolver: yupResolver(ReservationSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = methods;

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'selectedSlots',
  });

  console.log('reservation', reservationDetails);

  useEffect(() => {
    if (open && config) {
      reset(defaultValues);
      setShowPicker(false);

      if (isLocked && config.availabilityRules?.length > 0) {
        const firstRule = config.availabilityRules[0];
        const firstSlot = firstRule.slots[0];
        const dateStr = firstRule.dates[0];

        const autoSlot = {
          start: `${dateStr}T${firstSlot.startTime}:00.000Z`,
          end: `${dateStr}T${firstSlot.endTime}:00.000Z`,
        };

        replace([autoSlot]);

        if (config.locations?.length > 0) {
          const firstLoc =
            typeof config.locations[0] === 'string'
              ? config.locations[0]
              : config.locations[0].name;
          setValue('outlet', firstLoc);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isLocked, config, replace]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        outlet: data.outlet,
        phoneNumber: data.phoneNumber,
        remarks: data.remarks,
        pax: 1,
        selectedSlots: data.selectedSlots.map((slot) => ({
          start: slot.start,
          end: slot.end,
        })),
      };

      await axiosInstance.post(`/api/logistics/campaign/${campaign.id}/reservation`, payload);

      enqueueSnackbar('Reservation submitted successfully!', { variant: 'success' });
      onUpdate();
      onClose();
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Failed to submit reservation', { variant: 'error' });
    }
  };

  const handleAddSlot = (slot) => {
    if (isAuto) {
      replace([slot]);
      setShowPicker(false);
      return;
    }

    if (fields.length >= 3) {
      enqueueSnackbar('You can only select up to 3 slots', { variant: 'warning' });
      return;
    }

    const exists = fields.some((f) => f.start === slot.start);
    if (!exists) {
      append(slot);
      setShowPicker(false);
    } else {
      enqueueSnackbar('This slot is already selected', { variant: 'warning' });
    }
  };

  return isAuto ? (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { bgcolor: '#F4F4F4', borderRadius: 2 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography
              variant="h3"
              fontFamily="instrument serif"
              sx={{ fontWeight: 400, color: '#231F20' }}
            >
              Confirm Details
            </Typography>
            <Typography variant="body2" sx={{ color: '#231F20', mt: 0.5 }}>
              You can reschedule later.
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Iconify icon="eva:close-outline" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider sx={{ mb: 2, mx: 3 }} />

      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ overflowY: 'auto', maxHeight: '70vh', px: 3 }}>
          <Stack spacing={3}>
            {/* Contact Number */}
            <Box>
              <Typography variant="caption" sx={{ color: '#636366', display: 'block', mb: 0.5 }}>
                Contact Number <span style={{ color: '#FF4842' }}>*</span>
              </Typography>
              <RHFTextField
                name="phoneNumber"
                placeholder="+60 12-3151 580"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#FFFFFF',
                    borderRadius: 1,
                    '& fieldset': {
                      borderRadius: 1,
                    },
                  },
                }}
              />
            </Box>

            {/* Outlet Selection */}
            <Box>
              <Typography variant="caption" sx={{ color: '#636366', display: 'block', mb: 0.5 }}>
                Select Outlet <span style={{ color: '#FF4842' }}>*</span>
              </Typography>
              <RHFSelect
                name="outlet"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#FFFFFF',
                    borderRadius: 1,
                    '& fieldset': {
                      borderRadius: 1,
                    },
                  },
                }}
              >
                {config?.locations?.map((loc, idx) => {
                  const val = typeof loc === 'string' ? loc : loc.name;
                  return (
                    <MenuItem key={idx} value={val} sx={{ textTransform: 'capitalize' }}>
                      {val}
                    </MenuItem>
                  );
                })}
              </RHFSelect>
            </Box>

            {/* Time Slot Selection */}
            <Box>
              <Typography variant="caption" sx={{ color: '#636366', display: 'block', mb: 0.5 }}>
                Confirm Time Slot <span style={{ color: '#FF4842' }}>*</span>
              </Typography>

              <Stack spacing={1.5}>
                {fields.map((item, index) => (
                  <Stack key={item.id} direction="row" spacing={1}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1.5}
                      sx={{
                        flexGrow: 1,
                        p: 1.5,
                        bgcolor: isLocked ? '#F9F9F9' : '#FFFFFF',
                        borderRadius: 1,
                        border: '1px solid #EDEFF2',
                      }}
                    >
                      <Iconify icon="eva:calendar-outline" sx={{ color: '#1340FF' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#231F20' }}>
                        {formatReservationSlot(item.start, item.end, true)}
                      </Typography>
                    </Stack>

                    {!isLocked && (
                      <IconButton
                        onClick={() => remove(index)}
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 1,
                          bgcolor: '#FFFFFF',
                          border: '1px solid #EDEFF2',
                          color: '#FF5630',
                          '&:hover': { bgcolor: '#FFF5F5' },
                        }}
                      >
                        <Iconify icon="eva:trash-2-outline" width={22} />
                      </IconButton>
                    )}
                  </Stack>
                ))}

                {/* Show Picker only if not locked and we haven't reached limits */}
                {!isLocked && !showPicker && (
                  <Button
                    onClick={() => setShowPicker(true)}
                    disabled={isAuto ? fields.length >= 1 : fields.length >= 3}
                    sx={{
                      width: 48,
                      height: 48,
                      minWidth: 48,
                      borderRadius: 1,
                      bgcolor: '#FFFFFF',
                      color: '#1340FF',
                      border: '1px solid #E0E0E0',
                      '&:hover': { bgcolor: '#F4F6F8' },
                    }}
                  >
                    <Iconify icon="eva:plus-fill" width={24} />
                  </Button>
                )}

                <Collapse in={showPicker} unmountOnExit>
                  <CreatorCalendarPicker
                    campaignId={campaign?.id}
                    onSlotSelect={handleAddSlot}
                    onCancel={() => setShowPicker(false)}
                  />
                </Collapse>
              </Stack>
            </Box>

            {/* Remarks */}
            <Box>
              <Typography variant="caption" sx={{ color: '#636366', display: 'block', mb: 0.5 }}>
                Remarks
              </Typography>
              <RHFTextField
                name="remarks"
                multiline
                rows={3}
                placeholder="Add any special notes..."
                sx={{ bgcolor: '#fff', borderRadius: 1 }}
              />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button variant="outlined" onClick={onClose} sx={{ bgcolor: '#fff', color: '#231F20' }}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting}
            sx={{
              bgcolor: '#1340FF',
              color: '#FFFFFF',
              boxShadow: '0px -4px 0px 0px #0B2DAD inset',
              px: 4,
              '&:hover': { bgcolor: '#0B2DAD' },
            }}
          >
            Confirm
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  ) : (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: { bgcolor: '#F4F4F4', borderRadius: 2 },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography
              variant="h2"
              fontFamily="instrument serif"
              sx={{ fontWeight: 400, color: '#231F20' }}
            >
              Confirm Details
            </Typography>
            <Typography variant="body2" sx={{ color: '#FF5630', mb: 0.5 }}>
              You will only be able to edit this once.
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Iconify icon="eva:close-outline" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider sx={{ mb: 2, mx: 3 }} />

      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ overflowY: 'auto', maxHeight: '70vh', px: 3, pb: 2 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="caption" sx={{ color: '#636366', display: 'block', mb: 0.5 }}>
                Select Outlet <span style={{ color: '#FF4842' }}>*</span>
              </Typography>
              <RHFSelect
                name="outlet"
                placeholder="Select Outlet"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#FFFFFF',
                    borderRadius: 1,
                    '& fieldset': {
                      borderRadius: 1,
                    },
                  },
                }}
              >
                {config?.locations?.map((loc, idx) => {
                  const val = typeof loc === 'string' ? loc : loc.name;
                  return (
                    <MenuItem key={idx} value={val} sx={{ textTransform: 'capitalize' }}>
                      {val}
                    </MenuItem>
                  );
                })}
              </RHFSelect>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#636366', display: 'block', mb: 0.5 }}>
                Select Availability <span style={{ color: '#FF4842' }}>*</span>
              </Typography>

              <Stack spacing={1.5}>
                {fields.map((item, index) => (
                  <Stack key={item.id} direction="row" alignItems="stretch" spacing={1}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1.5}
                      sx={{
                        flexGrow: 1,
                        p: 1.5,
                        bgcolor: '#FFFFFF',
                        borderRadius: 1,
                        border: '1px solid #EDEFF2',
                      }}
                    >
                      <Iconify icon="eva:calendar-outline" sx={{ color: '#1340FF' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#231F20' }}>
                        {formatReservationSlot(item.start, item.end, true)}
                      </Typography>
                    </Stack>

                    <IconButton
                      onClick={() => remove(index)}
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 1,
                        bgcolor: '#FFFFFF',
                        border: '1px solid #EDEFF2',
                        color: '#FF5630',
                        '&:hover': { bgcolor: '#FFF5F5', borderColor: '#FF5630' },
                      }}
                    >
                      <Iconify icon="eva:trash-2-outline" width={22} />
                    </IconButton>
                  </Stack>
                ))}

                {methods.formState.errors.selectedSlots && (
                  <Typography variant="caption" color="error">
                    {methods.formState.errors.selectedSlots.message}
                  </Typography>
                )}

                <Collapse in={showPicker} unmountOnExit>
                  <CreatorCalendarPicker
                    campaignId={campaign?.id}
                    onSlotSelect={handleAddSlot}
                    onCancel={() => setShowPicker(false)}
                  />
                </Collapse>

                {!showPicker && (
                  <Button
                    onClick={() => setShowPicker(true)}
                    disabled={fields.length >= 3}
                    sx={{
                      width: 48,
                      height: 48,
                      minWidth: 48,
                      borderRadius: 1,
                      bgcolor: '#FFFFFF',
                      color: '#1340FF',
                      border: '1px solid #E0E0E0',
                      '&:hover': { bgcolor: '#F4F6F8' },
                    }}
                  >
                    <Iconify icon="eva:plus-fill" width={24} />
                  </Button>
                )}
                {fields.length >= 3 && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1 }}>
                    Delete a time slot to add new time slots.
                  </Typography>
                )}
              </Stack>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#636366', display: 'block', mb: 0.5 }}>
                Contact Number <span style={{ color: '#FF4842' }}>*</span>
              </Typography>
              <RHFTextField
                name="phoneNumber"
                placeholder="+60 12-3151 580"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#FFFFFF',
                    borderRadius: 1,
                    '& fieldset': {
                      borderRadius: 1,
                    },
                  },
                }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#636366', display: 'block', mb: 0.5 }}>
                Special Remarks
              </Typography>
              <RHFTextField
                name="remarks"
                placeholder="Halal menu only. Bringing partner with me (2 pax)."
                multiline
                rows={3}
                sx={{ bgcolor: '#FFFFFF', borderRadius: 1 }}
              />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              bgcolor: '#FFFFFF',
              color: '#231F20',
              border: '1px solid #E0E0E0',
              '&:hover': { bgcolor: '#F4F6F8' },
            }}
          >
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting}
            sx={{
              bgcolor: '#1340FF',
              color: '#FFFFFF',
              boxShadow: '0px -4px 0px 0px #0B2DAD inset',
              '&:hover': { bgcolor: '#0B2DAD' },
            }}
          >
            Confirm
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}

CreatorReservationDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  campaign: PropTypes.object,
  onUpdate: PropTypes.func,
};
