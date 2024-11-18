import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogActions from '@mui/material/DialogActions';
import { MobileDateTimePicker } from '@mui/x-date-pickers/MobileDateTimePicker';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'

import { isAfter, fTimestamp } from 'src/utils/format-time';

import { createEvent, updateEvent } from 'src/api/calendar';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, { RHFSwitch, RHFTextField } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export default function CalendarForm({ currentEvent, colorOptions, onClose }) {
  const { enqueueSnackbar } = useSnackbar();

  const EventSchema = Yup.object().shape({
    title: Yup.string().max(255).required('Title is required'),
    description: Yup.string().max(5000, 'Description must be at most 5000 characters'),
    color: Yup.string(),
    allDay: Yup.boolean(),
    start: Yup.mixed(),
    end: Yup.mixed(),
  });

  const methods = useForm({
    resolver: yupResolver(EventSchema),
    defaultValues: {
      ...currentEvent,
      color: currentEvent?.color || null,
    },
  });

  const {
    reset,
    watch,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  const dateError = isAfter(values.start, values.end);

  const onSubmit = handleSubmit(async (data) => {
    const eventData = {
      id: currentEvent?.id,
      color: data?.color,
      title: data?.title,
      allDay: data?.allDay,
      description: data?.description,
      end: data?.end,
      start: data?.start,
    };

    try {
      if (!dateError) {
        if (currentEvent?.id) {
          await updateEvent(eventData);
          enqueueSnackbar('Event details updated!');
        } else {
          // await createEvent(eventData);
          await createEvent(eventData);
          enqueueSnackbar('New event added!');
        }
        onClose();
        reset();
      }
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Stack spacing={1} sx={{ px: 3 }}>
        
        <RHFTextField name="title" label="Title" sx={{ mb:1  }} />

        <RHFTextField name="description" label="Event Description..." multiline rows={3} />

        <RHFSwitch name="allDay" label="All day" sx={{ mt: 2 }} />

        <Stack direction="row" spacing={1} sx={{ mt: 2 , mb :2}}>
          <Controller
            name="start"
            control={control}
            render={({ field }) => (
              <MobileDateTimePicker
                {...field}
                value={new Date(field.value)}
                onChange={(newValue) => {
                  if (newValue) {
                    field.onChange(fTimestamp(newValue));
                  }
                }}
                label="Start date"
                format="dd MMM, h:mm a"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    InputProps: {
                      endAdornment: (
                        <InputAdornment 
                          position="end" 
                          sx={{
                            width: '24px',
                            height: '24px',
                            flex: 'none',
                            paddingRight: '10px',
                          }}
                        >
                          <IconButton sx={{ color: "#1340FF" }}>
                            <CalendarTodayOutlinedIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  },
                }}
              />
            )}
          />

          <Controller
            name="end"
            control={control}
            render={({ field }) => (
              <MobileDateTimePicker
                {...field}
                value={new Date(field.value)}
                onChange={(newValue) => {
                  if (newValue) {
                    field.onChange(fTimestamp(newValue));
                  }
                }}
                label="End date"
                format="dd MMM, h:mm a"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: dateError,
                    helperText: dateError && 'End date must be later than start date',
                    InputProps: {
                      endAdornment: (
                        <InputAdornment 
                        position="end" 
                        sx={{
                          width: '24px',
                          height: '24px',
                          flex: 'none',
                          paddingRight: '10px'
                        }}>
                          <IconButton sx={{ color: "#1340FF" }}>
                            <CalendarTodayOutlinedIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  },
                }}
              />
            )}
          />
        </Stack>

        <Controller
          name="color"
          label="Select Color"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              value={field.value || ""}
              onChange={(event) => {
                field.onChange(event.target.value || null);
              }}
              fullWidth
              displayEmpty
              renderValue={(selected) => {
                const selectedOption = colorOptions.find(option => option.color === selected);
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {selectedOption ? (
                      <>
                        <Box
                          sx={{
                            backgroundColor: selectedOption.color,
                            borderRadius: 1,
                            padding: '2px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '25px',
                            marginRight: '8px',
                          }}
                        >
                          <span style={{
                            color: (theme) => theme.palette.getContrastText(selectedOption.color),
                            fontSize: '12px',
                            textAlign: 'center',
                          }}>
                            {selectedOption.label}
                          </span>
                        </Box>
                      </>
                    ) : (
                      <span style={{ color: 'gray', fontSize: '12px' }}>Select Color</span>
                    )}
                  </Box>
                );
              }}
            >
              {colorOptions.map(({ color, label }) => (
                <MenuItem key={color} value={color}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        backgroundColor: color,
                        borderRadius: 1,
                        padding: '2px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '25px',
                      }}
                    >
                      <span style={{
                        color: (theme) => theme.palette.getContrastText(color),
                        fontSize: '12px',
                        textAlign: 'center',
                      }}>
                        {label}
                      </span>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          )}
        />
      </Stack>

      <DialogActions>
        <Box sx={{ flexGrow: 1 }} />

        <Button variant="outlined" color="inherit" onClick={onClose}>
          Cancel
        </Button>

        <LoadingButton
          type="submit"
          variant="contained"
          loading={isSubmitting}
          disabled={dateError}
        >
          Save Changes
        </LoadingButton>
      </DialogActions>
    </FormProvider>
  );
}

CalendarForm.propTypes = {
  colorOptions: PropTypes.arrayOf(PropTypes.string),
  currentEvent: PropTypes.object,
  onClose: PropTypes.func,
};
