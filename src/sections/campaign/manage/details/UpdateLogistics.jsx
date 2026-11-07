import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, useFieldArray } from 'react-hook-form';
import React, { memo, useRef, useMemo, useState, useEffect } from 'react';
import {
  format,
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
  isSameMonth,
  startOfWeek,
  startOfMonth,
  isWithinInterval,
  eachDayOfInterval,
} from 'date-fns';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DesktopTimePicker } from '@mui/x-date-pickers/DesktopTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Box,
  Grid,
  Stack,
  Switch,
  Button,
  Divider,
  Collapse,
  Checkbox,
  MenuItem,
  FormLabel,
  TextField,
  Typography,
  ButtonBase,
  IconButton,
  createTheme,
  ThemeProvider,
  useMediaQuery,
  FormHelperText,
  FormControlLabel,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';
import {
  PRIMARY_ACTION_SX,
  SECONDARY_ACTION_SX,
} from 'src/components/campaign/action-button-styles';

import { EASE_OUT } from 'src/sections/campaign/create/components/motion';
import SectionIn from 'src/sections/campaign/create/components/section-in';
import ChipSelect from 'src/sections/campaign/create/components/chip-select';
import LogisticRemarks from 'src/sections/campaign/create/stepsV2/logistic-remarks';
import {
  FIELD_HEIGHT,
  singleLineSx,
  helperTextSx,
} from 'src/sections/campaign/create/components/field-styles';
import {
  BLUE,
  cardSx,
  titleSx,
  ToggleCard,
  cardIconSx,
  descriptionSx,
} from 'src/sections/campaign/create/components/option-card';

import FormField from './components/form-field';
import { selectMenuProps } from './components/select-menu-props';

const LOGISTICS_TYPES = {
  PRODUCT_DELIVERY: {
    title: 'Product Delivery',
    description: 'Send products to creators by courier.',
  },
  RESERVATION: {
    title: 'Reservation',
    description: 'Creators book a time slot to visit your outlet.',
  },
};
const TYPE_OPTIONS = Object.keys(LOGISTICS_TYPES);
const typeTitle = (type) => LOGISTICS_TYPES[type]?.title ?? type;
const typeDescription = (type) => LOGISTICS_TYPES[type]?.description;

const SCHEDULING_OPTIONS = [
  {
    value: 'confirmation',
    icon: 'eva:person-done-outline',
    title: 'Ask for my confirmation',
    description: 'I approve each time a creator asks to reschedule.',
  },
  {
    value: 'auto',
    icon: 'eva:flash-outline',
    title: 'Auto-schedule',
    description: 'Creators book their time slots with no approval needed.',
  },
];

const LOCATION_COLUMNS = [
  { key: 'name', title: 'Outlet', placeholder: 'e.g. Pavilion KL' },
  { key: 'pic', title: 'PIC', optional: true, placeholder: 'e.g. Aisyah' },
  {
    key: 'contactNumber',
    title: 'Contact number',
    optional: true,
    placeholder: 'e.g. 012-345 6789',
    inputProps: { inputMode: 'tel' },
  },
];

const BLUE_SOFT = 'rgba(19, 64, 255, 0.15)';
const GREY = '#636366';
const MUTED = '#919EAB';
const BORDER = '#E0E0E0';
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const intervalLabel = (hours) => (hours < 1 ? `${hours * 60} min` : `${hours} hr`);
const isValidTime = (time) => time != null && !Number.isNaN(new Date(time).getTime());
const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

const labelSx = { fontWeight: 700, fontSize: '0.875rem', color: 'black' };
const checkboxSx = { '&.Mui-checked': { color: BLUE } };
const hoverSx = (styles) => ({
  '@media (hover: hover) and (pointer: fine)': { '&:hover': styles },
});

const removeButtonSx = {
  ...SECONDARY_ACTION_SX,
  width: FIELD_HEIGHT,
  minWidth: FIELD_HEIGHT,
  height: FIELD_HEIGHT,
  p: 0,
  pb: '3px',
  flexShrink: 0,
  color: '#8E8E93',
  transition: `${SECONDARY_ACTION_SX.transition}, color 140ms ease-out`,
  '@media (hover: hover) and (pointer: fine)': {
    '&:hover:not(:disabled)': { color: '#FF5630' },
  },
  '&.Mui-disabled': { ...SECONDARY_ACTION_SX['&.Mui-disabled'], opacity: 0.5 },
};

const addButtonSx = {
  ...SECONDARY_ACTION_SX,
  alignSelf: 'flex-start',
  height: 36,
  px: 1.5,
  pt: '7px',
  pb: '10px',
  gap: 0.75,
  fontSize: 14,
  lineHeight: '18px',
  color: '#3A3A3C',
};

const hiddenInputSx = {
  position: 'absolute',
  opacity: 0,
  width: 1,
  height: 1,
  m: 0,
  pointerEvents: 'none',
};

const pickerTheme = (outer) =>
  createTheme(outer, {
    palette: { primary: { main: BLUE } },
    components: {
      MuiMultiSectionDigitalClockSection: {
        styleOverrides: {
          root: { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } },
          item: {
            '&.Mui-selected': {
              backgroundColor: `${BLUE} !important`,
              color: '#fff !important',
              fontWeight: 700,
              borderRadius: 14,
            },
          },
        },
      },
    },
  });

const getDayStyles = ({ day, selectedSet, selectionStart, campaignInterval, currentMonth }) => {
  const key = (date) => format(date, 'yyyy-MM-dd');
  const isSelected = selectedSet.has(key(day));
  const isPendingStart = selectionStart && isSameDay(day, selectionStart);
  const isWithinCampaign = campaignInterval ? isWithinInterval(day, campaignInterval) : true;
  const isPrevSelected = selectedSet.has(key(subDays(day, 1)));
  const isNextSelected = selectedSet.has(key(addDays(day, 1)));
  const isSingleDay = !isPrevSelected && !isNextSelected;

  const base = {
    width: '100%',
    height: 40,
    fontSize: 14,
    fontFamily: 'inherit',
    borderRadius: '50%',
    position: 'relative',
    zIndex: 1,
    color: isSameMonth(day, currentMonth) ? '#212B36' : MUTED,
    transition: 'background-color 120ms ease, color 120ms ease',
    '&.Mui-focusVisible': { outline: `2px solid ${BLUE}`, outlineOffset: -2 },
  };

  if (!isWithinCampaign) {
    return {
      ...base,
      opacity: 0.5,
      cursor: 'default',
      ...(isToday(day) && { border: `1.2px solid ${BLUE}`, color: BLUE }),
    };
  }

  if (!isSelected) {
    return {
      ...base,
      ...(isToday(day) && { border: `1.2px solid ${BLUE}`, color: BLUE }),
      ...hoverSx({ bgcolor: '#F4F6F8' }),
    };
  }

  if (isPendingStart && isSingleDay) {
    return { ...base, bgcolor: BLUE_SOFT, color: BLUE, fontWeight: 700 };
  }

  if (isSingleDay) return { ...base, bgcolor: BLUE, color: 'white' };

  if (!isPrevSelected || !isNextSelected) {
    return {
      ...base,
      bgcolor: BLUE,
      color: 'white',
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: '50%',
        [isPrevSelected ? 'left' : 'right']: 0,
        bgcolor: BLUE_SOFT,
        zIndex: -1,
      },
    };
  }

  return { ...base, borderRadius: 0, bgcolor: BLUE_SOFT, color: BLUE, fontWeight: 700 };
};

function PickMark({ selected }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: 18,
        height: 18,
        mt: '1px',
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
        borderRadius: '50%',
        border: '1.5px solid',
        borderColor: selected ? BLUE : '#C4CDD5',
        bgcolor: selected ? BLUE : '#FFFFFF',
        color: '#FFFFFF',
        transition: 'background-color 150ms ease, border-color 150ms ease',
      }}
    >
      <Iconify
        icon="eva:checkmark-fill"
        width={12}
        sx={{
          opacity: selected ? 1 : 0,
          transform: selected ? 'scale(1)' : 'scale(0.6)',
          transition: `opacity 150ms ease, transform 200ms ${EASE_OUT}`,
          '@media (prefers-reduced-motion: reduce)': { transform: 'none' },
        }}
      />
    </Box>
  );
}

PickMark.propTypes = { selected: PropTypes.bool };

function RemoveButton({ label, disabled, onClick }) {
  return (
    <IconButton aria-label={label} disabled={disabled} onClick={onClick} sx={removeButtonSx}>
      <Iconify icon="eva:trash-2-outline" width={20} />
    </IconButton>
  );
}

RemoveButton.propTypes = {
  label: PropTypes.string,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
};

function AddButton({ children, onClick }) {
  return (
    <ButtonBase sx={addButtonSx} onClick={onClick}>
      <Iconify icon="mingcute:add-line" width={16} sx={{ color: BLUE }} />
      {children}
    </ButtonBase>
  );
}

AddButton.propTypes = { children: PropTypes.node, onClick: PropTypes.func };

const EmptyState = ({ icon, title, children }) => (
  <Stack spacing={1} alignItems="center" textAlign="center" sx={{ py: 4, px: 2 }}>
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        bgcolor: '#F4F6F8',
        display: 'grid',
        placeItems: 'center',
        mb: 0.5,
      }}
    >
      <Iconify icon={icon} width={24} color={GREY} />
    </Box>
    <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{title}</Typography>
    <Typography sx={{ fontSize: 13, color: GREY, maxWidth: 260 }}>{children}</Typography>
  </Stack>
);

EmptyState.propTypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
};

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

const UpdateLogistics = ({ campaign, campaignMutate, formId, onFormStateChange }) => {
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
    trigger,
    formState: { isSubmitting, isDirty, errors },
  } = methods;

  useEffect(() => {
    onFormStateChange?.({ isDirty, isSubmitting });
  }, [isDirty, isSubmitting, onFormStateChange]);

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
    if (!startTime || !endTime) return;
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isBefore(end, start)) {
      setGeneratedSlots([]);
      return;
    }

    const slots = [];
    if (!intervalsChecked) {
      slots.push({
        id: 'full',
        start,
        end,
        label: `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`,
        isSelected: true,
      });
    } else {
      let curr = new Date(start);
      while (isBefore(curr, end)) {
        const next = addMinutes(curr, interval * 60);
        if (isBefore(end, next)) break;
        slots.push({
          id: curr.getTime(),
          start: new Date(curr),
          end: new Date(next),
          label: `${format(curr, 'h:mm a')} - ${format(next, 'h:mm a')}`,
          isSelected: false,
        });
        curr = next;
      }
    }
    setGeneratedSlots(slots);
  };

  const toggleSlot = (index) => {
    const updated = [...generatedSlots];
    updated[index].isSelected = !updated[index].isSelected;
    setGeneratedSlots(updated);
  };

  const handleDateClick = (date) => {
    if (!date) return;

    if (campaignInterval && !isWithinInterval(date, campaignInterval)) {
      enqueueSnackbar('Date is outside campaign active range', { variant: 'warning' });
      return;
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    const prevDateStr = format(subDays(date, 1), 'yyyy-MM-dd');
    const nextDateStr = format(addDays(date, 1), 'yyyy-MM-dd');

    if (selectionStart) {
      const start = isBefore(date, selectionStart) ? date : selectionStart;
      const end = isBefore(date, selectionStart) ? selectionStart : date;
      const newRange = eachDayOfInterval({ start, end });

      setSelectedDates((prev) => {
        const combined = [...prev];
        newRange.forEach((day) => {
          if (!prev.some((p) => isSameDay(p, day))) combined.push(day);
        });
        return combined.sort((a, b) => a - b);
      });
      setSelectionStart(null);
      return;
    }

    if (selectedSet.has(dateStr)) {
      const isStartOfRange = !selectedSet.has(prevDateStr) && selectedSet.has(nextDateStr);
      const isEndOfRange = selectedSet.has(prevDateStr) && !selectedSet.has(nextDateStr);

      if (isStartOfRange) {
        let cursor = date;
        while (selectedSet.has(format(addDays(cursor, 1), 'yyyy-MM-dd'))) {
          cursor = addDays(cursor, 1);
        }
        const segmentEnd = cursor;

        setSelectedDates((prev) =>
          prev.filter(
            (d) =>
              !isWithinInterval(startOfDay(d), {
                start: startOfDay(date),
                end: startOfDay(subDays(segmentEnd, 1)),
              })
          )
        );
        setSelectionStart(segmentEnd);
        return;
      }

      if (isEndOfRange) {
        let cursor = date;
        while (selectedSet.has(format(subDays(cursor, 1), 'yyyy-MM-dd'))) {
          cursor = subDays(cursor, 1);
        }
        const segmentStart = cursor;

        setSelectedDates((prev) =>
          prev.filter(
            (d) =>
              !isWithinInterval(startOfDay(d), {
                start: startOfDay(addDays(segmentStart, 1)),
                end: startOfDay(date),
              })
          )
        );
        setSelectionStart(segmentStart);
        return;
      }

      setSelectedDates((prev) => prev.filter((d) => !isSameDay(d, date)));
      setSelectionStart(null);
      return;
    }

    const isBridging = selectedSet.has(prevDateStr) || selectedSet.has(nextDateStr);

    if (isBridging) {
      setSelectedDates((prev) => [...prev, date].sort((a, b) => a - b));
      setSelectionStart(null);
    } else {
      setSelectedDates((prev) => [...prev, date].sort((a, b) => a - b));
      setSelectionStart(date);
    }
  };

  const handleSaveRule = () => {
    if (selectedDates.length === 0) {
      enqueueSnackbar('Please select dates first', { variant: 'error' });
      return;
    }

    let newRule;

    if (allDay) {
      newRule = {
        dates: selectedDates.map((d) => format(d, 'yyyy-MM-dd')),
        slots: [{ startTime: '00:00', endTime: '23:59', label: 'All Day' }],
        allDay: true,
      };
    } else {
      const activeSlots = generatedSlots.filter((s) => s.isSelected);

      if (activeSlots.length === 0) {
        enqueueSnackbar('Please select at least one time slot', { variant: 'error' });
        return;
      }

      newRule = {
        dates: selectedDates.map((d) => format(d, 'yyyy-MM-dd')),
        slots: activeSlots.map((slot) => ({
          startTime: format(slot.start, 'HH:mm'),
          endTime: format(slot.end, 'HH:mm'),
          label: slot.label,
        })),
        allDay: false,
      };
    }

    const isDuplicate = savedRules.some((rule) => {
      if (rule.allDay !== newRule.allDay) return false;
      const datesMatch = JSON.stringify(rule.dates) === JSON.stringify(newRule.dates);
      const slotsMatch = JSON.stringify(rule.slots) === JSON.stringify(newRule.slots);
      return datesMatch && slotsMatch;
    });

    if (isDuplicate) {
      enqueueSnackbar('This timeslot has already been saved', { variant: 'error' });
      return;
    }

    setValue('availabilityRules', [...savedRules, newRule], {
      shouldValidate: true,
      shouldDirty: true,
    });

    enqueueSnackbar('Added successfully', { variant: 'success' });

    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);

    // Reset Selection
    setSelectedDates([]);
    setSelectionStart(null);
  };

  const handleRemoveRule = (index) => {
    const updatedRules = savedRules.filter((_, i) => i !== index);
    setValue('availabilityRules', updatedRules, { shouldValidate: true, shouldDirty: true });
  };

  const handleClear = () => {
    setSelectedDates([]);
    setSelectionStart(null);
  };

  const handleSelectAllDates = (e) => {
    if (e.target.checked && campaignInterval) {
      const allDays = eachDayOfInterval({
        start: campaignInterval.start,
        end: campaignInterval.end,
      });
      setSelectedDates(allDays);
    } else {
      setSelectedDates([]);
    }
    setSelectionStart(null);
  };

  const formatDatesForDisplay = (dateStrings) => {
    if (!dateStrings || dateStrings.length === 0) return '';

    // 1. Sort dates chronologically
    const sorted = [...dateStrings]
      .map((d) => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime());

    const groups = [];
    let currentGroup = [sorted[0]];

    // 2. Group consecutive dates
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1];
      const curr = sorted[i];

      // Check if the difference is exactly 1 day (approx 86400000ms)
      const diffTime = Math.abs(curr - prev);
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentGroup.push(curr);
      } else {
        groups.push(currentGroup);
        currentGroup = [curr];
      }
    }
    groups.push(currentGroup);

    // 3. Format the groups
    const parts = groups.map((group) => {
      const start = group[0];
      const end = group[group.length - 1];

      if (group.length === 1) {
        return format(start, 'd MMM');
      }
      return `${format(start, 'd MMM')} - ${format(end, 'd MMM')}`;
    });

    // 4. Add the Year to the end
    const lastDate = sorted[sorted.length - 1];
    return `${parts.join(', ')} ${format(lastDate, 'yyyy')}`;
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

  const showHeaders = useMediaQuery((theme) => theme.breakpoints.up('sm'));
  const timeOrderError =
    isValidTime(startTime) &&
    isValidTime(endTime) &&
    !isBefore(new Date(startTime), new Date(endTime));
  const pickedSlotCount = generatedSlots.filter((slot) => slot.isSelected).length;

  const timePickerProps = (value, onChange, label) => ({
    value: isValidTime(value) ? new Date(value) : null,
    onChange,
    slotProps: {
      textField: {
        fullWidth: true,
        error: timeOrderError,
        inputProps: { 'aria-label': label },
        sx: { '& .MuiOutlinedInput-root': { height: FIELD_HEIGHT, borderRadius: 1.5 } },
      },
      openPickerButton: { sx: { color: BLUE } },
    },
  });

  let slotsContent;
  if (generatedSlots.length > 0) {
    slotsContent = (
      <Box sx={{ maxHeight: 280, overflowY: 'auto', p: '2px', m: '-2px' }}>
        <Grid container spacing={1.5}>
          {generatedSlots.map((slot, idx) => (
            <Grid item xs={6} key={slot.id}>
              <ButtonBase
                onClick={() => toggleSlot(idx)}
                aria-pressed={slot.isSelected}
                sx={{
                  width: '100%',
                  height: 44,
                  gap: 0.75,
                  border: '1.5px solid',
                  borderRadius: 1.5,
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: 600,
                  borderColor: slot.isSelected ? BLUE : '#F4F6F8',
                  bgcolor: slot.isSelected ? 'rgba(19, 64, 255, 0.04)' : '#fff',
                  color: slot.isSelected ? BLUE : MUTED,
                  transition:
                    'border-color 150ms ease, background-color 150ms ease, color 150ms ease',
                  ...hoverSx({ borderColor: slot.isSelected ? BLUE : BORDER }),
                  '&.Mui-focusVisible': { outline: `2px solid ${BLUE}`, outlineOffset: 2 },
                }}
              >
                {slot.isSelected && <Iconify icon="eva:checkmark-fill" width={16} />}
                {slot.label}
              </ButtonBase>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  } else {
    slotsContent = (
      <EmptyState icon="eva:clock-outline" title="No time slots yet">
        {timeOrderError
          ? 'Fix the times above to see the slots.'
          : 'Pick a start time, an end time and a slot length.'}
      </EmptyState>
    );
  }

  return (
    <FormProvider id={formId} methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0, 800px)',
            xl:
              logisticsType === 'RESERVATION'
                ? 'minmax(0, 800px) minmax(320px, 600px)'
                : 'minmax(0, 800px)',
          },
          columnGap: 5,
          alignItems: 'start',
          width: '100%',
          maxWidth: logisticsType === 'RESERVATION' ? 1440 : 800,
          ...helperTextSx,
        }}
      >
        <Stack spacing={3} sx={{ maxWidth: logisticsType === 'RESERVATION' ? 800 : 600 }}>
          <Box sx={{ maxWidth: 600 }}>
            <FormField
              label="Logistics Type"
              hint="Optional. Leave empty if creators need nothing."
            >
              <ChipSelect
                single
                clearable
                name="logisticsType"
                options={TYPE_OPTIONS}
                getTitle={typeTitle}
                getDescription={typeDescription}
                placeholder="Select logistics type"
              />
            </FormField>
          </Box>

          {logisticsType === 'PRODUCT_DELIVERY' && (
            <SectionIn component={Stack} key="products" spacing={1.5}>
              <FormField label="Products" required>
                <Box>
                  {productFields.map((field, index) => (
                    <Stack key={field.id} direction="row" spacing={1} sx={{ pb: 1 }}>
                      <RHFTextField
                        fullWidth
                        size="small"
                        placeholder="Product name"
                        name={`products.${index}.name`}
                        sx={singleLineSx}
                      />
                      <RemoveButton
                        label="Remove product"
                        disabled={productFields.length === 1}
                        onClick={() => removeProduct(index)}
                      />
                    </Stack>
                  ))}
                </Box>
              </FormField>
              <AddButton onClick={handleAddProduct}>Add product</AddButton>
            </SectionIn>
          )}

          {logisticsType === 'RESERVATION' && (
            <SectionIn component={Stack} key="reservation" spacing={3}>
              <Stack spacing={1.5}>
                <FormField label="Scheduling Option" required>
                  <Stack
                    role="radiogroup"
                    aria-label="Scheduling option"
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                  >
                    {SCHEDULING_OPTIONS.map((option) => {
                      const selected = schedulingOption === option.value;
                      return (
                        <Box
                          key={option.value}
                          component="label"
                          sx={{ ...cardSx(selected), flex: 1 }}
                        >
                          <Box
                            component="input"
                            type="radio"
                            name="schedulingOption"
                            value={option.value}
                            checked={selected}
                            onChange={() =>
                              setValue('schedulingOption', option.value, { shouldDirty: true })
                            }
                            sx={hiddenInputSx}
                          />
                          <Iconify
                            icon={option.icon}
                            width={20}
                            sx={{ mt: '1px', ...cardIconSx(selected) }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={titleSx(selected)}>{option.title}</Typography>
                            <Typography sx={descriptionSx}>{option.description}</Typography>
                          </Box>
                          <PickMark selected={selected} />
                        </Box>
                      );
                    })}
                  </Stack>
                </FormField>

                <ToggleCard
                  icon="eva:people-outline"
                  title="Allow multiple creators per time slot"
                  description={
                    allowMultipleBookings
                      ? 'Several creators can visit your outlet at the same time.'
                      : 'Each time slot is for one creator only.'
                  }
                  checked={!!allowMultipleBookings}
                  onChange={(checked) =>
                    setValue('allowMultipleBookings', checked, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
              </Stack>

              <Stack spacing={1.5}>
                <FormField label="Locations" required>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ display: { xs: 'none', sm: 'flex' }, pr: `${FIELD_HEIGHT + 8}px` }}
                  >
                    {LOCATION_COLUMNS.map((column) => (
                      <Typography
                        key={column.key}
                        sx={{
                          flex: 1,
                          fontSize: 12,
                          lineHeight: '16px',
                          fontWeight: 600,
                          color: GREY,
                        }}
                      >
                        {column.title}
                        {column.optional && (
                          <Box component="span" sx={{ fontWeight: 400, color: '#8E8E93' }}>
                            {' '}
                            (optional)
                          </Box>
                        )}
                      </Typography>
                    ))}
                  </Stack>
                  <Box>
                    {locationFields.map((field, index) => (
                      <Stack key={field.id} direction="row" spacing={1} sx={{ pb: 1 }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flex: 1 }}>
                          {LOCATION_COLUMNS.map((column) => (
                            <RHFTextField
                              key={column.key}
                              size="small"
                              name={`locations.${index}.${column.key}`}
                              placeholder={
                                showHeaders
                                  ? column.placeholder
                                  : `${column.title}${column.optional ? ' (optional)' : ''}`
                              }
                              inputProps={{ 'aria-label': column.title, ...column.inputProps }}
                              {...(column.key === 'name' && {
                                onChange: (e) => {
                                  setValue(`locations.${index}.name`, e.target.value, {
                                    shouldValidate: true,
                                  });
                                  trigger('locations');
                                },
                                error:
                                  index === 0
                                    ? !!errors.locations && !Array.isArray(errors.locations)
                                    : !!errors?.locations?.[index]?.name,
                              })}
                              sx={{ flex: 1, ...singleLineSx }}
                            />
                          ))}
                        </Stack>
                        <RemoveButton
                          label="Remove location"
                          disabled={locationFields.length === 1}
                          onClick={() => removeLocation(index)}
                        />
                      </Stack>
                    ))}
                  </Box>
                  {errors.locations && !Array.isArray(errors.locations) && (
                    <FormHelperText error sx={{ mt: '-2px !important' }}>
                      {errors.locations.message}
                    </FormHelperText>
                  )}
                </FormField>
                <AddButton onClick={() => appendLocation({ name: '' })}>Add location</AddButton>
              </Stack>

              <Box sx={{ maxWidth: 900, mx: 'auto', p: 2, mb: 10 }}>
                <Typography
                  variant="body2"
                  textAlign="center"
                  sx={{ color: GREY, maxWidth: 500, mx: 'auto', mb: 4 }}
                >
                  Add the dates and times creators can book. All times are in Malaysian time
                  (UTC+08:00).
                </Typography>

                <Box
                  sx={{
                    border: `1px solid ${BORDER}`,
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    overflow: 'hidden',
                    bgcolor: '#fff',
                  }}
                >
                  <Box
                    sx={{
                      p: 3,
                      width: { xs: '100%', md: '45%' },
                      borderRight: { md: `1px solid ${BORDER}` },
                      borderBottom: { xs: `1px solid ${BORDER}`, md: 'none' },
                    }}
                  >
                    <FormLabel sx={labelSx}>Dates</FormLabel>
                    <Typography sx={{ fontSize: 13, color: GREY, mt: 0.5 }}>
                      {campaignInterval
                        ? `${format(campaignInterval.start, 'd MMM yyyy')} - ${format(campaignInterval.end, 'd MMM yyyy')}`
                        : 'Set the campaign dates first.'}
                    </Typography>

                    <Stack direction="row" spacing={0.75} sx={{ mt: 1.5, color: GREY }}>
                      <Iconify
                        icon="eva:info-outline"
                        width={16}
                        sx={{ flexShrink: 0, mt: '1px' }}
                      />
                      <Typography sx={{ fontSize: 12, lineHeight: '18px' }}>
                        Click a start date, then an end date to pick the days between. Click a
                        picked date to remove it.
                      </Typography>
                    </Stack>

                    <Divider sx={{ my: 2.5 }} />

                    <Box sx={{ maxWidth: 300, mx: 'auto' }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 2 }}
                      >
                        <IconButton
                          aria-label="Previous month"
                          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                          size="small"
                        >
                          <Iconify icon="eva:arrow-ios-back-fill" />
                        </IconButton>
                        <Typography aria-live="polite" sx={{ fontWeight: 700 }}>
                          {format(currentMonth, 'MMMM yyyy')}
                        </Typography>
                        <IconButton
                          aria-label="Next month"
                          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                          size="small"
                        >
                          <Iconify icon="eva:arrow-ios-forward-fill" />
                        </IconButton>
                      </Stack>

                      <Grid container columns={7}>
                        {WEEKDAYS.map((d) => (
                          <Grid item xs={1} key={d} sx={{ textAlign: 'center', mb: 1 }}>
                            <Typography variant="caption" sx={{ color: MUTED, fontWeight: 600 }}>
                              {d}
                            </Typography>
                          </Grid>
                        ))}
                        {calendarDays.map((day) => {
                          const key = format(day, 'yyyy-MM-dd');
                          return (
                            <Grid item xs={1} key={key}>
                              <ButtonBase
                                aria-pressed={selectedSet.has(key)}
                                aria-disabled={
                                  !!campaignInterval && !isWithinInterval(day, campaignInterval)
                                }
                                aria-label={format(day, 'EEEE d MMMM yyyy')}
                                onClick={() => handleDateClick(day)}
                                sx={getDayStyles({
                                  day,
                                  selectedSet,
                                  selectionStart,
                                  campaignInterval,
                                  currentMonth,
                                })}
                              >
                                {format(day, 'd')}
                              </ButtonBase>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Box>

                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mt: 2 }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: GREY }}>
                          {selectedDates.length
                            ? `${plural(selectedDates.length, 'day')} picked`
                            : 'No days picked'}
                        </Typography>
                        {selectedDates.length > 0 && (
                          <Button
                            onClick={handleClear}
                            size="small"
                            sx={{
                              minWidth: 0,
                              px: 0.75,
                              textTransform: 'none',
                              fontSize: 13,
                              fontWeight: 600,
                              color: '#FF5630',
                              ...hoverSx({ bgcolor: 'rgba(255, 86, 48, 0.08)' }),
                            }}
                          >
                            Clear
                          </Button>
                        )}
                      </Stack>

                      <FormControlLabel
                        disabled={!campaignInterval}
                        control={
                          <Checkbox
                            checked={
                              !!campaignInterval &&
                              selectedDates.length > 0 &&
                              selectedDates.length === eachDayOfInterval(campaignInterval).length
                            }
                            onChange={handleSelectAllDates}
                            size="small"
                            sx={checkboxSx}
                          />
                        }
                        label={
                          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>All dates</Typography>
                        }
                        sx={{ mr: 0 }}
                      />
                    </Stack>
                  </Box>

                  <Box
                    sx={{
                      p: 3,
                      width: { xs: '100%', md: '55%' },
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: { md: 500 },
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      spacing={2}
                    >
                      <Box>
                        <FormLabel sx={labelSx}>Times</FormLabel>
                        <Typography sx={{ fontSize: 13, color: GREY, mt: 0.5 }}>
                          {allDay
                            ? 'Creators can come at any time.'
                            : 'Set the hours creators can book.'}
                        </Typography>
                      </Box>
                      <FormControlLabel
                        labelPlacement="start"
                        label={
                          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>All day</Typography>
                        }
                        control={
                          <Switch
                            checked={allDay}
                            onChange={(e) => setAllDay(e.target.checked)}
                            sx={{
                              '& .Mui-checked': { color: BLUE },
                              '& .Mui-checked + .MuiSwitch-track': {
                                bgcolor: `${BLUE} !important`,
                              },
                            }}
                          />
                        }
                        sx={{ mr: 0, flexShrink: 0 }}
                      />
                    </Stack>

                    <Divider sx={{ my: 2.5 }} />

                    <Collapse in={allDay} timeout={200} easing={EASE_OUT} unmountOnExit>
                      <EmptyState icon="eva:sun-outline" title="All day">
                        The picked dates are open all day. Pick dates, then save.
                      </EmptyState>
                    </Collapse>

                    <Collapse in={!allDay} timeout={200} easing={EASE_OUT}>
                      <ThemeProvider theme={pickerTheme}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={{ xs: 1, sm: 1.5 }}
                            alignItems={{ xs: 'stretch', sm: 'center' }}
                          >
                            <DesktopTimePicker
                              {...timePickerProps(
                                startTime,
                                (value) => setStartTime(value?.getTime()),
                                'Start time'
                              )}
                            />
                            <Typography variant="body2" sx={{ color: GREY, textAlign: 'center' }}>
                              to
                            </Typography>
                            <DesktopTimePicker
                              {...timePickerProps(
                                endTime,
                                (value) => setEndTime(value?.getTime()),
                                'End time'
                              )}
                            />
                          </Stack>
                        </LocalizationProvider>
                      </ThemeProvider>
                      {timeOrderError && (
                        <FormHelperText error>
                          End time must be after the start time.
                        </FormHelperText>
                      )}

                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={intervalsChecked}
                              onChange={(e) => setIntervalsChecked(e.target.checked)}
                              size="small"
                              sx={checkboxSx}
                            />
                          }
                          label={
                            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                              Split into slots of
                            </Typography>
                          }
                          sx={{ mr: 0 }}
                        />
                        <TextField
                          select
                          size="small"
                          value={interval}
                          disabled={!intervalsChecked}
                          onChange={(e) => setInterval(e.target.value)}
                          inputProps={{ 'aria-label': 'Slot length' }}
                          SelectProps={{ MenuProps: selectMenuProps }}
                          sx={{ width: 110, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                        >
                          {intervalOptions.map((opt) => (
                            <MenuItem key={opt} value={opt} sx={{ fontSize: 14 }}>
                              {intervalLabel(opt)}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Stack>

                      <Divider sx={{ my: 2.5 }} />

                      {generatedSlots.length > 0 && (
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: GREY, mb: 1.5 }}>
                          {pickedSlotCount} of {plural(generatedSlots.length, 'slot')} picked
                        </Typography>
                      )}
                      {slotsContent}
                    </Collapse>

                    <Box sx={{ flexGrow: 1 }} />

                    {(allDay || generatedSlots.length > 0) && (
                      <Stack direction="row" justifyContent="flex-end" sx={{ pt: 3 }}>
                        <Button
                          onClick={handleSaveRule}
                          sx={{ ...PRIMARY_ACTION_SX, flexShrink: 0, px: 3 }}
                        >
                          Save slots
                        </Button>
                      </Stack>
                    )}
                  </Box>
                </Box>

                <Box
                  ref={bottomRef}
                  sx={{
                    mt: 3,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 2,
                    p: 2,
                    bgcolor: '#fff',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                    <Iconify icon="eva:calendar-outline" width={18} color={BLUE} />
                    <FormLabel sx={labelSx}>Saved reservation slots</FormLabel>
                    {savedRules.length > 0 && (
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: GREY }}>
                        {savedRules.length}
                      </Typography>
                    )}
                  </Stack>
                  <Divider />
                  {savedRules.length === 0 ? (
                    <Typography variant="body2" sx={{ color: MUTED, py: 3, textAlign: 'center' }}>
                      Pick dates and times above, then press Save slots.
                    </Typography>
                  ) : (
                    <Stack spacing={1} sx={{ pt: 1.5 }}>
                      {savedRules.map((rule, index) => (
                        <Stack
                          key={index}
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          spacing={2}
                          sx={{ p: 1.5, bgcolor: '#F9FAFB', borderRadius: 1.5 }}
                        >
                          <Stack direction="row" spacing={1.5} sx={{ minWidth: 0 }}>
                            <Iconify
                              icon={rule.allDay ? 'eva:sun-outline' : 'eva:clock-outline'}
                              color={BLUE}
                              width={18}
                              sx={{ mt: '2px', flexShrink: 0 }}
                            />
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                                {formatDatesForDisplay(rule.dates)}
                              </Typography>
                              <Typography sx={{ fontSize: 14, color: GREY, mt: 0.5 }}>
                                {rule.slots.map((slot) => slot.label).join(', ')}
                              </Typography>
                            </Box>
                          </Stack>
                          <IconButton
                            aria-label={`Remove slots for ${formatDatesForDisplay(rule.dates)}`}
                            onClick={() => handleRemoveRule(index)}
                            size="small"
                            sx={{
                              color: MUTED,
                              ...hoverSx({ color: '#FF5630', bgcolor: 'rgba(255, 86, 48, 0.08)' }),
                            }}
                          >
                            <Iconify icon="eva:trash-2-outline" width={20} />
                          </IconButton>
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </Box>
              </Box>
            </SectionIn>
          )}
        </Stack>

        {logisticsType === 'RESERVATION' && <LogisticRemarks align="left" topSpacing={0} />}
      </Box>
    </FormProvider>
  );
};

UpdateLogistics.propTypes = {
  campaign: PropTypes.object,
  campaignMutate: PropTypes.func,
  formId: PropTypes.string,
  onFormStateChange: PropTypes.func,
};

export default memo(UpdateLogistics);
