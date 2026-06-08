import PropTypes from 'prop-types';
import { Controller, useFormContext } from 'react-hook-form';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

export default function RHFDatePicker({
  name,
  helperText,
  type,
  label,
  disabled,
  minDate,
  maxDate,
  sx,
  slots,
  slotProps,
  onClose,
}) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label={label}
            disabled={disabled}
            format="DD/MM/YYYY"
            {...field}
            onClose={onClose}
            slots={slots}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !!error,
                helperText: error?.message,
                ...(slotProps?.textField || {}),
              },
              ...(slotProps || {}),
            }}
            minDate={minDate}
            maxDate={maxDate}
            sx={sx}
          />
          {/* </DemoContainer> */}
        </LocalizationProvider>
      )}
    />
  );
}

RHFDatePicker.propTypes = {
  name: PropTypes.string,
  helperText: PropTypes.string,
  type: PropTypes.string,
  label: PropTypes.string,
  disabled: PropTypes.bool,
  minDate: PropTypes.any,
  maxDate: PropTypes.any,
  sx: PropTypes.any,
  slots: PropTypes.object,
  slotProps: PropTypes.object,
  onClose: PropTypes.func,
};
