import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, useFieldArray } from 'react-hook-form';
import React, { memo, useRef, useMemo, useState, useEffect } from 'react';
import {
  format,
  isAfter,
  isToday,
  subDays,
  addDays,
  isBefore,
  endOfDay,
  isSameDay,
  endOfWeek,
  addMonths,
  subMonths,
  endOfMonth,
  startOfDay,
  addMinutes,
  startOfWeek,
	startOfMonth,
	isWithinInterval,
	eachDayOfInterval,
} from 'date-fns';

import { LoadingButton } from '@mui/lab';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DesktopTimePicker } from '@mui/x-date-pickers/DesktopTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Box,
  Grid,
  Stack,
  Radio,
  Switch,
  Button,
  Divider,
  Checkbox,
  MenuItem,
  TextField,
  FormLabel,
  Typography,
  IconButton,
  FormControlLabel,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFSelect, RHFTextField } from 'src/components/hook-form';

// Form field component with consistent styling
const FormField = ({ label, children, required = true }) => (
	<Stack spacing={0.5}>
		<FormLabel
			required={required}
			sx={{
				fontWeight: 700,
				color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
				fontSize: '0.875rem', // Smaller font size for labels
				mb: 0.5,
				'& .MuiFormLabel-asterisk': {
					display: required ? 'inline-block' : 'none',
					color: '#FF3500', // Change this to your desired color
				},
			}}
		>
			{label}
		</FormLabel>
		{children}
	</Stack>
);

FormField.propTypes = {
	label: PropTypes.string.isRequired,
	children: PropTypes.node.isRequired,
	required: PropTypes.bool,
};

// This component is not used in this file but kept for consistency

// Validation schema
const UpdateLogisticsSchema = Yup.object().shape({
  logisticsType: Yup.string().nullable(),
  schedulingOption: Yup.string().when('logisticsType', {
    is: 'RESERVATION',
    then: (schema) => schema.required('Scheduling option is required'),
    otherwise: (schema) => schema.nullable(),
  }),
  allowMultipleBookings: Yup.boolean(),
  products: Yup.array().of(
    Yup.object().shape({
      name: Yup.string(),
    })
  ),
  locations: Yup.array().of(
    Yup.object().shape({
      name: Yup.string(),
      pic: Yup.string().nullable(),
      contactNumber: Yup.string().nullable(),
    })
  ),
  availabilityRules: Yup.array(),
  clientRemarks: Yup.string().nullable(),
});

const UpdateLogistics = ({ campaign, campaignMutate }) => {
  const { enqueueSnackbar } = useSnackbar();
  const bottomRef = useRef(null);

  // Get existing values from campaign
  const defaultValues = useMemo(() => {
    const reservationConfig = campaign?.reservationConfig;
    let schedulingOption = '';
    if (reservationConfig?.mode === 'AUTO_SCHEDULE') {
      schedulingOption = 'auto';
    } else if (reservationConfig?.mode === 'MANUAL_CONFIRMATION') {
      schedulingOption = 'confirmation';
    }
    return {
      logisticsType: campaign?.logisticsType || '',
      schedulingOption,
      allowMultipleBookings: reservationConfig?.allowMultipleBookings || false,
      products:
        campaign?.products?.length > 0
          ? campaign.products.map((p) => ({ id: p.id, name: p.productName }))
          : [{ name: '' }],
      locations:
        reservationConfig?.locations?.length > 0
          ? reservationConfig.locations
          : [{ name: '', pic: '', contactNumber: '' }],
      availabilityRules: reservationConfig?.availabilityRules || [],
      clientRemarks: reservationConfig?.clientRemarks || '',
    };
  }, [campaign]);

  const methods = useForm({
    resolver: yupResolver(UpdateLogisticsSchema),
    defaultValues,
    mode: 'onChange',
  });

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    getValues,
    formState: { isSubmitting, isDirty },
  } = methods;

  // Product editing state
  const [, setEditingIndex] = useState(-1);
  const [, setLastAddedIndex] = useState(0);

  // Field arrays for products and locations
  const {
    fields: productFields,
    append: appendProduct,
    remove: removeProduct,
  } = useFieldArray({
    control,
    name: 'products',
  });

  const {
    fields: locationFields,
    append: appendLocation,
    remove: removeLocation,
  } = useFieldArray({
    control,
    name: 'locations',
  });

  // Reset form when campaign data changes
  useEffect(() => {
    if (campaign) {
      reset(defaultValues);
      // Set lastAddedIndex to the last product index when loading existing products
      if (campaign?.products?.length > 0) {
        setLastAddedIndex(campaign.products.length - 1);
      }
    }
  }, [campaign, defaultValues, reset]);

  // Product editing handlers
  const handleEdit = (index, value) => {
    setEditingIndex(index);
    setEditValue(value);
  };

  const handleSaveEdit = (index) => {
    setValue(`products.${index}.name`, editValue, { shouldDirty: true });
    setEditingIndex(-1);
  };

  const handleCancelEdit = () => {
    setEditingIndex(-1);
  };

  const handleAddProduct = () => {
    appendProduct({ name: '' });
    setLastAddedIndex(productFields.length);
    setEditingIndex(-1);
  };

  const logisticsType = watch('logisticsType');
  const schedulingOption = watch('schedulingOption');
  const allowMultipleBookings = watch('allowMultipleBookings');
  const savedRules = watch('availabilityRules') || [];

  // Reservation slots state
  const campaignStartDate = campaign?.campaignBrief?.startDate;
  const campaignEndDate = campaign?.campaignBrief?.endDate;

  const [currentMonth, setCurrentMonth] = useState(
    campaignStartDate ? new Date(campaignStartDate) : new Date()
  );
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectionStart, setSelectionStart] = useState(null);
  const [startTime, setStartTime] = useState(new Date().setHours(9, 0, 0, 0));
  const [endTime, setEndTime] = useState(new Date().setHours(17, 0, 0, 0));
  const [allDay, setAllDay] = useState(false);
  const [intervalsChecked, setIntervalsChecked] = useState(true);
  const [interval, setInterval] = useState(1);
  const [showIntervalDropdown, setShowIntervalDropdown] = useState(false);
  const [generatedSlots, setGeneratedSlots] = useState([]);

  const intervalOptions = [0.5, 1, 1.5, 2, 3, 4];

  const selectedSet = useMemo(
    () => new Set(selectedDates.map((d) => format(d, 'yyyy-MM-dd'))),
    [selectedDates]
  );

  const campaignInterval = useMemo(() => {
    if (!campaignStartDate || !campaignEndDate) return null;
    return {
      start: startOfDay(new Date(campaignStartDate)),
      end: endOfDay(new Date(campaignEndDate)),
    };
  }, [campaignStartDate, campaignEndDate]);

  const calendarDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentMonth)),
        end: endOfWeek(endOfMonth(currentMonth)),
      }),
    [currentMonth]
  );

  useEffect(() => {
    generateGrid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime, endTime, interval, intervalsChecked]);

  const generateGrid = () => {
    if (!intervalsChecked) {
      setGeneratedSlots([{ label: 'All Day', selected: true }]);
      return;
    }
    const slots = [];
    let current = new Date(startTime);
    const end = new Date(endTime);

    while (isBefore(current, end)) {
      const slotEnd = addMinutes(current, interval * 60);
      if (isAfter(slotEnd, end)) break;
      slots.push({
        label: `${format(current, 'h:mm a')} - ${format(slotEnd, 'h:mm a')}`,
        start: format(current, 'HH:mm'),
        end: format(slotEnd, 'HH:mm'),
        selected: true,
      });
      current = slotEnd;
    }
    setGeneratedSlots(slots);
  };

  const toggleSlot = (index) => {
    const updated = [...generatedSlots];
    updated[index].selected = !updated[index].selected;
    setGeneratedSlots(updated);
  };

  const handleDateClick = (date) => {
    if (!campaignInterval) return;
    if (!isWithinInterval(date, campaignInterval)) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    if (selectedSet.has(dateStr)) {
      setSelectedDates(selectedDates.filter((d) => format(d, 'yyyy-MM-dd') !== dateStr));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const handleSaveRule = () => {
    if (selectedDates.length === 0) {
      enqueueSnackbar('Please select at least one date', { variant: 'warning' });
      return;
    }

    const selectedSlots = generatedSlots.filter((s) => s.selected);
    if (selectedSlots.length === 0) {
      enqueueSnackbar('Please select at least one time slot', { variant: 'warning' });
      return;
    }

    const newRule = {
      dates: selectedDates.map((d) => format(d, 'yyyy-MM-dd')),
      slots: allDay
        ? [{ label: 'All Day', allDay: true }]
        : selectedSlots.map((s) => ({ startTime: s.start, endTime: s.end, label: s.label })),
      allDay,
    };

    setValue('availabilityRules', [...savedRules, newRule], { shouldDirty: true });
    setSelectedDates([]);
    setGeneratedSlots([]);
    enqueueSnackbar('Availability rule added', { variant: 'success' });
  };

  const handleRemoveRule = (index) => {
    const updatedRules = savedRules.filter((_, i) => i !== index);
    setValue('availabilityRules', updatedRules, { shouldDirty: true });
  };

	const getDayStyles = (day) => {
		const dateStr = format(day, 'yyyy-MM-dd');
		const isSelected = selectedSet.has(dateStr);
		const isPendingStart = selectionStart && isSameDay(day, selectionStart);
		const isTodayDate = isToday(day);

		const isWithinCampaign = campaignInterval ? isWithinInterval(day, campaignInterval) : true;
		const isCurrentMonth = day.getMonth() === currentMonth.getMonth();

		const prevDateStr = format(subDays(day, 1), 'yyyy-MM-dd');
		const nextDateStr = format(addDays(day, 1), 'yyyy-MM-dd');

		const isPrevSelected = selectedSet.has(prevDateStr);
		const isNextSelected = selectedSet.has(nextDateStr);

		const isVisualStart = !isPrevSelected;
		const isVisualEnd = !isNextSelected;
		const isSingleDay = isVisualStart && isVisualEnd;

		const baseStyles = {
			height: 40,
			mx: 'auto',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			cursor: 'pointer',
			transition: '0.2s',
			borderRadius: '50%',
			position: 'relative',
			zIndex: 1,
			color: isCurrentMonth ? '#212B36' : '#919EAB',
		};

		if (!isSelected && !isPendingStart && isTodayDate) {
			return {
				...baseStyles,
				border: '1.2px solid #1340FF',
				borderRadius: '50%',
				color: '#1340FF',
				// fontWeight: '700',
				'&:hover': {
					bgcolor: '#F4F6F8',
				},
			};
		}

		if (!isWithinCampaign) {
			return {
				...baseStyles,
				color: '#919EAB',
				opacity: 0.5,
				cursor: 'default',
			};
		}

		if (isPendingStart && !selectedSet.has(prevDateStr) && !selectedSet.has(nextDateStr)) {
			return {
				...baseStyles,
				bgcolor: 'rgba(19, 64, 255, 0.15)',
				color: '#1340FF',
				borderRadius: '50%',
				fontWeight: 700,
			};
		}

		if (!isSelected) {
			return {
				...baseStyles,
				'&:hover': {
					bgcolor: '#F4F6F8',
				},
			};
		}

		const selectedStyles = {
			...baseStyles,
			bgcolor: isSingleDay ? '#1340FF' : 'rgba(19, 64, 255, 0.15)',
			color: isSingleDay ? 'white' : '#1340FF',
			fontWeight: isSingleDay ? 'normal' : 'bold',
			borderRadius: 0,
		};

		if (isSingleDay) {
			return {
				...selectedStyles,
				borderRadius: '50%',
			};
		}

		if (isVisualStart) {
			return {
				...selectedStyles,
				bgcolor: '#1340FF',
				color: 'white',
				borderRadius: '50%',
				'&::after': {
					content: '""',
					position: 'absolute',
					right: 0,
					top: 0,
					bottom: 0,
					width: '50%',
					bgcolor: 'rgba(19, 64, 255, 0.15)',
					zIndex: -1,
				},
			};
		}

		if (isVisualEnd) {
			return {
				...selectedStyles,
				bgcolor: '#1340FF',
				color: 'white',
				borderRadius: '50%',
				'&::after': {
					content: '""',
					position: 'absolute',
					left: 0,
					top: 0,
					bottom: 0,
					width: '50%',
					bgcolor: 'rgba(19, 64, 255, 0.15)',
					zIndex: -1,
				},
			};
		}

		// Middle segments
		return selectedStyles;
	};

  const formatDatesForDisplay = (dateStrings) => {
    if (!dateStrings || dateStrings.length === 0) return '';
    const dates = dateStrings.map((d) => new Date(d)).sort((a, b) => a - b);
    if (dates.length === 1) return format(dates[0], 'MMM d, yyyy');
    if (dates.length <= 3) return dates.map((d) => format(d, 'MMM d')).join(', ');
    return `${format(dates[0], 'MMM d')} - ${format(dates[dates.length - 1], 'MMM d')} (${dates.length} days)`;
  };

  const onSubmit = async (data) => {
    try {
      await axiosInstance.patch(endpoints.campaign.editCampaignLogistics, {
        campaignId: campaign?.id,
        logisticsType: data.logisticsType || null,
        products: data.logisticsType === 'PRODUCT_DELIVERY' ? data.products : [],
        // Reservation fields
        schedulingOption: data.schedulingOption,
        allowMultipleBookings: data.allowMultipleBookings,
        locations: data.locations,
        availabilityRules: data.availabilityRules,
        clientRemarks: data.clientRemarks,
      });

      enqueueSnackbar('Logistics updated successfully!', { variant: 'success' });
      if (campaignMutate) campaignMutate();
    } catch (error) {
      enqueueSnackbar(
        error?.response?.data?.message || error?.message || 'Failed to update logistics',
        { variant: 'error' }
      );
    }
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
					maxWidth: logisticsType === 'PRODUCT_DELIVERY' ? 600 : 800
        }}
      >
        {/* Logistics Type Selection */}
        <Stack spacing={2} maxWidth={logisticsType === 'RESERVATION' ? 800 : 600}>
          <FormField label="Logistics Type" required={false}>
            <RHFSelect
              name="logisticsType"
              placeholder="Select logistics type"
            >
              <MenuItem value="">No Logistics</MenuItem>
              <MenuItem value="PRODUCT_DELIVERY">Product Delivery</MenuItem>
              <MenuItem value="RESERVATION">Reservation</MenuItem>
            </RHFSelect>
          </FormField>
        </Stack>

        {/* Product Delivery Section */}
        {logisticsType === 'PRODUCT_DELIVERY' && (
          <Stack spacing={2}>
            {productFields.map((field, index) => (
              <Stack key={field.id} spacing={1}>
                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: '14px',
                      color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
                    }}
                  >
                    {index === 0 ? 'Product' : `Product ${index + 1}`}
                  </Typography>
                </Box>

                {editingIndex === index ? (
                  <Box>
                    <TextField
                      fullWidth
                      placeholder="Product Name"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                        },
                        mb: 1,
                      }}
                      autoFocus
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Button
                        onClick={() => handleCancelEdit()}
                        sx={{
                          height: 38,
                          borderRadius: '8px',
                          padding: '8px 12px',
                          background: '#FFFFFF',
                          border: '1px solid #E7E7E7',
                          boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                          color: 'text.primary',
                          '&:hover': { bgcolor: '#f5f5f5' },
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleSaveEdit(index)}
                        sx={{
                          height: 38,
                          borderRadius: '8px',
                          padding: '8px 12px',
                          background: '#FFFFFF',
                          border: '1px solid #E7E7E7',
                          boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                          color: 'text.primary',
                          '&:hover': { bgcolor: '#f5f5f5' },
                        }}
                      >
                        Save
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <RHFTextField
                      fullWidth
                      placeholder="Product Name"
                      name={`products.${index}.name`}
                      disabled={index !== lastAddedIndex && editingIndex !== index}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                        },
                      }}
                    />
                    {index !== lastAddedIndex && (
                      <IconButton
                        onClick={() => handleEdit(index, getValues(`products.${index}.name`))}
                        sx={{ ml: 1 }}
                      >
                        <Iconify icon="feather:edit" sx={{ color: '#231F20' }} width={18} />
                      </IconButton>
                    )}
                  </Box>
                )}
              </Stack>
            ))}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              {productFields.length > 1 && (
                <Button
                  onClick={() => removeProduct(productFields.length - 1)}
                  sx={{
                    borderRadius: '8px',
                    padding: '8px 12px',
                    background: '#FFFFFF',
                    border: '1px solid #E7E7E7',
                    boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
                    color: '#D4321C',
                    '&:hover': { bgcolor: '#f5f5f5' },
                  }}
                >
                  Remove
                </Button>
              )}
              <IconButton
                onClick={handleAddProduct}
                sx={{
                  gap: '4px',
                  opacity: 1,
                  borderRadius: '8px',
                  padding: '8px 12px 11px 12px',
                  borderWidth: '1px',
                  background: '#FFFFFF',
                  border: '1px solid #E7E7E7',
                  boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
                  '&:hover': { bgcolor: '#f5f5f5' },
                }}
              >
                <Iconify icon="eva:plus-fill" sx={{ color: '#1340FF' }} />
              </IconButton>
            </Box>
          </Stack>
        )}

        {/* Reservation Section */}
        {logisticsType === 'RESERVATION' && (
          <>
            {/* Scheduling Option */}
            <Stack spacing={1} maxWidth={800}>
              <FormLabel
                sx={{
                  fontWeight: 600,
                  color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
                }}
              >
                Scheduling Option{' '}
                <Typography component="span" color="error">
                  *
                </Typography>
              </FormLabel>

              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Box
                  sx={{
                    flex: 1,
                    p: 2,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: schedulingOption === 'confirmation' ? '#3366FF' : '#E7E7E7',
                    bgcolor: schedulingOption === 'confirmation' ? '#F0F7FF' : 'transparent',
                    cursor: 'pointer',
                  }}
                  onClick={() =>
                    setValue('schedulingOption', 'confirmation', { shouldDirty: true })
                  }
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <Radio
                      checked={schedulingOption === 'confirmation'}
                      sx={{
                        p: 0,
                        mr: 1,
                        color: '#3366FF',
                        '&.Mui-checked': {
                          color: '#3366FF',
                        },
                      }}
                    />
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          mb: 0.5,
                          color: schedulingOption === 'confirmation' ? '#1340FF' : 'text.primary',
                        }}
                      >
                        Ask for my confirmation
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '14px',
                          color: schedulingOption === 'confirmation' ? '#1340FF' : 'text.secondary',
                        }}
                      >
                        Prompt me for confirmation each time the creator requests a reschedule.
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box
                  sx={{
                    flex: 1,
                    p: 2,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: schedulingOption === 'auto' ? '#3366FF' : '#E7E7E7',
                    bgcolor: schedulingOption === 'auto' ? '#F0F7FF' : 'transparent',
                    cursor: 'pointer',
                  }}
                  onClick={() => setValue('schedulingOption', 'auto', { shouldDirty: true })}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <Radio
                      checked={schedulingOption === 'auto'}
                      sx={{
                        p: 0,
                        mr: 1,
                        '&.Mui-checked': {
                          color: '#3366FF',
                        },
                      }}
                    />
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          mb: 0.5,
                          color: schedulingOption === 'auto' ? '#1340FF' : 'text.primary',
                        }}
                      >
                        Auto-Schedule
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '14px',
                          color: schedulingOption === 'auto' ? '#1340FF' : 'text.secondary',
                        }}
                      >
                        Allow creators to schedule their time slots without needing confirmation.
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Stack>

            {/* Multiple Bookings Toggle */}
            <Stack spacing={0}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Allow multiple creators to book the same timeslot
                  </Typography>
                  <Switch
                    checked={allowMultipleBookings}
                    onChange={(e) =>
                      setValue('allowMultipleBookings', e.target.checked, { shouldDirty: true })
                    }
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#1340FF',
                      },
                    }}
                  />
                </Stack>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Enabling this option allows <strong>multiple</strong> creators to visit your outlet
                  at the same time. Leaving this option disabled restricts <strong>one</strong>{' '}
                  timeslot to <strong>one</strong> creator only.
                </Typography>
              </Stack>

            {/* Locations */}
            <Stack spacing={1}>
              <FormLabel
                sx={{
                  fontWeight: 600,
                  color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
                }}
              >
                Location
                <Typography component="span" color="error">
                  *
                </Typography>
              </FormLabel>

              <Stack direction="row" spacing={2} sx={{ px: 0.5 }}>
                <Typography variant="caption" sx={{ flex: 1.5, color: '#636366', fontWeight: 500 }}>
                  Outlet
                </Typography>
                <Typography variant="caption" sx={{ flex: 1.5, color: '#636366', fontWeight: 500 }}>
                  PIC{' '}
                  <Box component="span" sx={{ fontWeight: 400 }}>
                    (Optional)
                  </Box>
                </Typography>
                <Typography variant="caption" sx={{ flex: 1.5, color: '#636366', fontWeight: 500 }}>
                  Contact{' '}
                  <Box component="span" sx={{ fontWeight: 400 }}>
                    (Optional)
                  </Box>
                </Typography>
                <Box sx={{ width: 48 }} />
              </Stack>

              <Stack spacing={1.5}>
                {locationFields.map((field, index) => (
                  <Stack key={field.id} direction="row" spacing={2} alignItems="center">
                    <RHFTextField
                      name={`locations.${index}.name`}
                      placeholder="Outlet"
                      sx={{ flex: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                    />
                    <RHFTextField
                      name={`locations.${index}.pic`}
                      placeholder="PIC"
                      sx={{ flex: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                    />
                    <RHFTextField
                      name={`locations.${index}.contactNumber`}
                      placeholder="Contact Number"
                      sx={{ flex: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                    />

                    <IconButton
                      onClick={() => removeLocation(index)}
                      disabled={locationFields.length === 1}
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 1,
                        border: '1px solid #E7E7E7',
                        color: '#FF3030',
                        boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                        '&:hover': { bgcolor: '#FFF5F5' },
                      }}
                    >
                      <Iconify icon="eva:trash-2-outline" width={22} />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton
                  onClick={() => appendLocation({ name: '' })}
                  sx={{
                    width: 38,
                    height: 38,
                    gap: '4px',
                    opacity: 1,
                    borderRadius: '8px',
                    padding: '8px 12px 11px 12px',
                    borderWidth: '1px',
                    background: '#FFFFFF',
                    border: '1px solid #E7E7E7',
                    boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                    '&:hover': { bgcolor: '#f5f5f5' },
                  }}
                >
                  <Iconify icon="eva:plus-fill" sx={{ color: '#1340FF' }} />
                </IconButton>
              </Box>
            </Stack>

            {/* Availability Rules */}
            <Box
              sx={{
                border: '1px solid #E0E0E0',
                borderRadius: 2,
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                overflow: 'hidden',
                bgcolor: '#fff',
              }}
            >
              <Box
                sx={{ p: 3, width: { xs: '100%', md: '45%' }, borderRight: { md: '1px solid #E0E0E0' } }}
              >
                <Typography sx={{ fontWeight: 600, fontSize: '18px', mb: 1 }}>Select Dates:</Typography>

                <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 2 }}>
                  Between {campaignStartDate ? format(new Date(campaignStartDate), 'd MMMM yyyy') : '...'}{' '}
                  to {campaignEndDate ? format(new Date(campaignEndDate), 'd MMMM yyyy') : '...'}
                </Typography>

                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Switch
                    size="small"
                    checked={allDay}
                    onChange={(e) => setAllDay(e.target.checked)}
                    sx={{ '& .Mui-checked': { color: '#1340FF' } }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    All Day
                  </Typography>
                </Stack>

                <Box sx={{ borderRadius: '8px', bgcolor: '#1340FF', p: 1, mb: 3 }}>
                  <Typography sx={{ fontSize: '12px', color: 'white', lineHeight: 1.5 }}>
                    Click once to select the start date, then click again on the end date to include all
                    days in between. <br />
                    <strong>Double-click for a single day</strong>, and click a selected date to deselect
                    it.
                  </Typography>
                </Box>

                <Divider sx={{ mb: 3 }} />
                <Box sx={{ maxWidth: 300, mx: 'auto' }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 3 }}
                  >
                    <IconButton onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} size="small">
                      <Iconify icon="eva:arrow-ios-back-fill" />
                    </IconButton>
                    <Typography sx={{ fontWeight: 700 }}>{format(currentMonth, 'MMM yyyy')}</Typography>
                    <IconButton onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} size="small">
                      <Iconify icon="eva:arrow-ios-forward-fill" />
                    </IconButton>
                  </Stack>

                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
                      <Box key={d} sx={{ textAlign: 'center', mb: 1 }}>
                        <Typography variant="caption" sx={{ color: '#919EAB', fontWeight: 600 }}>
                          {d}
                        </Typography>
                      </Box>
                    ))}
                    {calendarDays.map((day, i) => (
                      <Box key={i}>
                        <Box onClick={() => handleDateClick(day)} sx={getDayStyles(day)}>
                          <Typography variant="body2" sx={{ fontWeight: 'inherit', color: 'inherit' }}>
                            {format(day, 'd')}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Clear Dates and Select All */}
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                  <Button
                    onClick={() => {
                      setSelectedDates([]);
                      setSelectionStart(null);
                    }}
                    size="small"
                    sx={{
                      fontSize: '14px',
                      textTransform: 'none',
                      fontWeight: 500,
                      minWidth: 'auto',
                      p: 0,
                      '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                    }}
                  >
                    <Iconify icon="eva:trash-2-outline" color="#FF5630" width={20} sx={{ mr: 1 }} /> Clear
                    Dates
                  </Button>

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={
                          campaignInterval &&
                          selectedDates.length > 0 &&
                          selectedDates.length === eachDayOfInterval(campaignInterval).length
                        }
                        onChange={(e) => {
                          if (e.target.checked && campaignInterval) {
                            setSelectedDates(eachDayOfInterval(campaignInterval));
                          } else {
                            setSelectedDates([]);
                          }
                          setSelectionStart(null);
                        }}
                        size="small"
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>Select All Dates</Typography>
                    }
                  />
                </Box>
              </Box>

              <Box
                sx={{
                  p: 3,
                  width: { xs: '100%', md: '55%' },
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 500,
                }}
              >
                <Typography sx={{ fontWeight: 600, fontSize: '18px', mb: 3 }}>
                  Select Time Slots:
                </Typography>

                <ThemeProvider
                  theme={createTheme({
                    palette: {
                      primary: { main: '#1340FF' },
                    },
                    components: {
                      MuiIconButton: {
                        styleOverrides: {
                          root: {
                            color: '#1340FF',
                          },
                        },
                      },
                      MuiMultiSectionDigitalClockSection: {
                        styleOverrides: {
                          root: {
                            '&::-webkit-scrollbar': {
                              display: 'none',
                            },
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                          },
                          item: {
                            '&.Mui-selected': {
                              backgroundColor: '#1340FF !important',
                              color: '#fff !important',
                              fontWeight: 'bold',
                              borderRadius: 3.5,
                            },
                          },
                        },
                      },
                    },
                  })}
                >
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                      <DesktopTimePicker
                        disabled={allDay}
                        onChange={(value) => setStartTime(value?.getTime())}
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                            sx: {
                              '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                              ...(allDay && { bgcolor: '#F4F6F8' }),
                            },
                          },
                          openPickerButton: {
                            sx: { color: allDay ? 'text.disabled' : '#1340FF' },
                          },
                        }}
                      />
                      <Typography variant="body2" sx={{ color: allDay ? 'text.disabled' : '#636366' }}>
                        to
                      </Typography>
                      <DesktopTimePicker
                        disabled={allDay}
                        onChange={(value) => setEndTime(value?.getTime())}
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                            sx: {
                              '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                              ...(allDay && { bgcolor: '#F4F6F8' }),
                            },
                          },
                          openPickerButton: {
                            sx: { color: allDay ? 'text.disabled' : '#1340FF' },
                          },
                        }}
                      />
                    </Stack>
                  </LocalizationProvider>
                </ThemeProvider>

                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{
                    mb: 3,
                    position: 'relative',
                    opacity: allDay ? 0.6 : 1,
                  }}
                >
                  <Checkbox
                    disabled={allDay}
                    checked={intervalsChecked}
                    onChange={(e) => setIntervalsChecked(e.target.checked)}
                    size="small"
                    sx={{ p: 0, '&.Mui-disabled': { color: 'text.disabled' } }}
                  />
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 500,
                      ml: 1,
                      color: allDay ? 'text.disabled' : 'inherit',
                    }}
                  >
                    Intervals
                  </Typography>

                  {intervalsChecked && (
                    <Button
                      disabled={allDay}
                      variant="outlined"
                      size="small"
                      onClick={() => !allDay && setShowIntervalDropdown(!showIntervalDropdown)}
                      endIcon={
                        <Iconify icon="eva:chevron-down-fill" color={allDay ? '#919EAB' : '#1340FF'} />
                      }
                      sx={{
                        ml: 2,
                        borderColor: '#E0E0E0',
                        color: allDay ? 'text.disabled' : '#212B36',
                        textTransform: 'none',
                        px: 2,
                        borderRadius: 1.5,
                        '&.Mui-disabled': { borderColor: '#F4F6F8' },
                      }}
                    >
                      {interval} hr
                    </Button>
                  )}

                  {showIntervalDropdown && !allDay && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 100,
                        zIndex: 10,
                        bgcolor: '#fff',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        borderRadius: 1,
                        minWidth: 100,
                        mt: 1,
                      }}
                    >
                      {intervalOptions.map((opt) => (
                        <MenuItem
                          key={opt}
                          onClick={() => {
                            setInterval(opt);
                            setShowIntervalDropdown(false);
                          }}
                          sx={{ fontSize: '14px', px: 2 }}
                        >
                          {opt} hr
                        </MenuItem>
                      ))}
                    </Box>
                  )}
                </Stack>

                <Divider sx={{ mb: 3 }} />

                {/* Generated Slots - Matching reservation-slots.jsx styling */}
                <Box
                  sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                  }}
                >
                  {/* Lint fix: no-nested-ternary */}
                  {allDay && (
                    <Stack spacing={1} alignItems="center" textAlign="center">
                      <Typography sx={{ fontSize: '48px' }}>👌</Typography>
                      <Typography variant="h6" fontWeight={700}>
                        All-Day Events
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Select dates and you&apos;re good to go!
                      </Typography>
                    </Stack>
                  )}
                  {!allDay && generatedSlots.length > 0 && (
                    <Box sx={{ width: '100%', maxHeight: 280, overflowY: 'auto' }}>
                      <Grid container spacing={1.5}>
                        {generatedSlots.map((slot, idx) => (
                          <Grid item xs={6} key={idx}>
                            <Box
                              onClick={() => toggleSlot(idx)}
                              sx={{
                                p: 1.5,
                                textAlign: 'center',
                                border: '1.5px solid',
                                borderRadius: 1.5,
                                cursor: 'pointer',
                                borderColor: slot.selected ? '#1340FF' : '#F4F6F8',
                                bgcolor: slot.selected ? 'rgba(19, 64, 255, 0.04)' : '#fff',
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  color: slot.selected ? '#1340FF' : '#919EAB',
                                }}
                              >
                                {slot.label}
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                  {!allDay && generatedSlots.length === 0 && (
                    <Stack spacing={1} alignItems="center" textAlign="center">
                      <Typography sx={{ fontSize: '48px' }}>😘</Typography>
                      <Typography variant="h6" fontWeight={700}>
                        Add Time Slots
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Select a start/end time and interval.
                      </Typography>
                    </Stack>
                  )}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
                  {(allDay || generatedSlots.length > 0) && (
                    <Button
                      onClick={handleSaveRule}
                      sx={{
                        mt: 2,
                        alignSelf: 'flex-end',
                        width: 'fit-content',
                        px: 4,
                        height: 48,
                        bgcolor: '#3A3A3C',
                        color: '#fff',
                        borderRadius: '12px',
                        fontWeight: 600,
                        textTransform: 'none',
                        boxShadow: '0px -3px 0px 0px #00000073 inset',
                        '&:hover': { bgcolor: '#000' },
                        '&.Mui-disabled': {
                          bgcolor: '#F4F6F8',
                          color: '#919EAB',
                          boxShadow: 'none',
                        },
                      }}
                    >
                      {allDay ? 'Save All Day' : 'Save Time Slots'}
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Saved Rules Display */}
            <Box
              ref={bottomRef}
              sx={{ mt: 3, border: '1px solid #E0E0E0', borderRadius: 2, p: 2, bgcolor: '#fff' }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <Iconify icon="eva:calendar-outline" width={18} color="#1340FF" />
                <Typography variant="overline" sx={{ fontWeight: 800, color: '#212B36', mt: 0.5 }}>
                  RESERVATION SLOTS
                </Typography>
              </Stack>
              <Divider />
              {savedRules.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#919EAB', py: 3, textAlign: 'center' }}>
                  Saved time slots will show up here.
                </Typography>
              ) : (
                <Stack spacing={1} sx={{ mt: 2 }}>
                  {savedRules.map((rule, index) => (
                    <Stack
                      key={index}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ p: 1.5, bgcolor: '#F9FAFB', borderRadius: 1.5 }}
                    >
                      <Stack direction="row" spacing={2}>
                        <Iconify icon="feather:edit" color="#1340FF" sx={{ mt: 0.5 }} />
                        <Box>
                          <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
                            {formatDatesForDisplay(rule.dates)}
                          </Typography>
                          <Typography sx={{ fontSize: '14px', color: '#636366', mt: 0.5 }}>
                            {rule.slots.map((slot, i) => (
                              <span key={i}>
                                {slot.label}
                                {i < rule.slots.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </Typography>
                        </Box>
                      </Stack>
                      <IconButton onClick={() => handleRemoveRule(index)} size="small">
                        <Iconify icon="eva:trash-2-outline" color="#FF5630" width={20} />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Box>

            {/* Client Remarks */}
            <Stack spacing={1}>
              <FormLabel
                sx={{
                  fontWeight: 600,
                  color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
                }}
              >
                Remarks for Creators
              </FormLabel>
              <Typography variant="body2" sx={{ color: '#636366', mb: 1 }}>
                Add details you want to send to all participants. This could include payment
                arrangements, venue policies, cancellation penalties, or instructions.
              </Typography>
              <RHFTextField
                name="clientRemarks"
                placeholder="Type your remarks here..."
                multiline
                rows={4}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
              />
            </Stack>
          </>
        )}

        {/* Submit Button */}
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3, maxWidth: logisticsType === 'RESERVATION' ? 800 : 600 }}>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting}
            disabled={!isDirty}
            size="large"
            sx={{
              bgcolor: '#1340ff',
              boxShadow: '0px -3px 0px 0px rgba(0,0,0,0.45) inset',
              '&:hover': { bgcolor: '#1340ff' },
              '&:disabled': {
                bgcolor: 'rgba(19, 64, 255, 0.3)',
                color: '#fff',
                boxShadow: '0px -3px 0px 0px inset rgba(0, 0, 0, 0.1)',
              },
            }}
          >
            Save Logistics
          </LoadingButton>
        </Stack>
      </Box>
    </FormProvider>
  );
};

UpdateLogistics.propTypes = {
  campaign: PropTypes.object,
  campaignMutate: PropTypes.func,
};

export default memo(UpdateLogistics);
