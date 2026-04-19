import { Controller, useFormContext } from 'react-hook-form';

import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { useAuthContext } from 'src/auth/hooks';

import { RHFSelect, RHFTextField } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export default function InvoiceNewEditStatusDate() {
  const { control, watch } = useFormContext();
  const { user } = useAuthContext();

  const values = watch();

  const canChangeStatus =
    user?.role === 'superadmin' ||
    user?.admin?.mode === 'god' ||
    user?.admin?.role?.name === 'Finance';

  return (
    <Stack
      spacing={2}
      direction={{ xs: 'column', sm: 'row' }}
      sx={{ p: 3, bgcolor: 'background.neutral', borderRadius: '10px' }}
    >
      <RHFTextField
        disabled
        name="invoiceNumber"
        label="Invoice number"
        value={values.invoiceNumber}
      />

      <RHFSelect
        fullWidth
        name="status"
        label="Status"
        InputLabelProps={{ shrink: true }}
        PaperPropsSx={{ textTransform: 'capitalize' }}
        disabled={!canChangeStatus}
      >
        {['approved', 'paid', 'draft', 'rejected'].map((option) => (
          <MenuItem
            key={option}
            value={option}
            sx={{
              textTransform: 'capitalize',
              color: (theme) => option === 'rejected' && theme.palette.error.main,
            }}
          >
            {option}
          </MenuItem>
        ))}
      </RHFSelect>

      <Controller
        name="createDate"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <DatePicker
            disabled
            label="Invoice Date"
            value={field.value}
            format="dd/MM/yyyy"
            onChange={(newValue) => {
              field.onChange(newValue);
            }}
            slotProps={{
              openPickerButton: {
                sx: {
                  color: '#1340FF',
                },
              },
              textField: {
                fullWidth: true,
                error: !!error,
                helperText: error?.message,
              },
            }}
          />
        )}
      />

      <Controller
        name="dueDate"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <DatePicker
            label="Due date"
            value={field.value}
            format="dd/MM/yyyy"
            onChange={(newValue) => {
              field.onChange(newValue);
            }}
            slotProps={{
              openPickerButton: {
                sx: {
                  color: '#1340FF',
                },
              },
              textField: {
                fullWidth: true,
                error: !!error,
                helperText: error?.message,
              },
            }}
          />
        )}
      />
    </Stack>
  );
}
