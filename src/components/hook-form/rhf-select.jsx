import PropTypes from 'prop-types';
import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';

// ----------------------------------------------------------------------

export function RHFSelect({
  name,
  label,
  native,
  maxHeight = 220,
  helperText,
  children,
  PaperPropsSx,
  multiple,
  ...other
}) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          label={label}
          select
          fullWidth
          value={multiple ? field.value || [''] : field.value || ''}
          SelectProps={{
            native,
            multiple,
            MenuProps: {
              PaperProps: {
                sx: {
                  ...(!native && {
                    maxHeight: typeof maxHeight === 'number' ? maxHeight : 'unset',
                  }),
                  ...PaperPropsSx,
                },
              },
            },
            sx: { textTransform: 'capitalize' },
          }}
          error={!!error}
          helperText={error ? error?.message : helperText}
          {...other}
        >
          {children}
        </TextField>
      )}
    />
  );
}

RHFSelect.propTypes = {
  PaperPropsSx: PropTypes.object,
  children: PropTypes.node,
  helperText: PropTypes.string,
  maxHeight: PropTypes.number,
  name: PropTypes.string,
  native: PropTypes.bool,
  multiple: PropTypes.bool,
  label: PropTypes.string,
};

// ----------------------------------------------------------------------

export function RHFMultiSelect({
  name,
  chip,
  label,
  options,
  checkbox,
  placeholder,
  helperText,
  ...other
}) {
  const { control } = useFormContext();

  const renderValues = (selectedIds) => {
    const selectedItems = options?.filter((item) => selectedIds.includes(item.value));

    if (!selectedItems.length && placeholder) {
      return <Box sx={{ color: 'text.disabled' }}>{placeholder}</Box>;
    }

    if (chip) {
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {selectedItems.map((item) => (
            <Chip
              key={item.value}
              size="small"
              variant="outlined"
              label={item.label}
              sx={{
                border: 1,
                borderColor: '#EBEBEB',
                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                py: 2,
              }}
            />
          ))}
        </Box>
      );
    }

    return selectedItems.map((item) => item.label).join(', ');
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormControl error={!!error} {...other}>
          {label && <InputLabel id={name}> {label} </InputLabel>}

          <Select
            {...field}
            multiple
            displayEmpty={!!placeholder}
            id={`multiple-${name}`}
            labelId={name}
            label={label}
            renderValue={renderValues}
          >
            {options.map((option) => {
              const selected = field.value.includes(option.value);

              return (
                <MenuItem key={option.value} value={option.value}>
                  {checkbox && <Checkbox size="small" disableRipple checked={selected} />}

                  {option.label}
                </MenuItem>
              );
            })}
          </Select>

          {(!!error || helperText) && (
            <FormHelperText error={!!error}>{error ? error?.message : helperText}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
}

RHFMultiSelect.propTypes = {
  checkbox: PropTypes.bool,
  chip: PropTypes.bool,
  helperText: PropTypes.string,
  label: PropTypes.string,
  name: PropTypes.string,
  options: PropTypes.array,
  placeholder: PropTypes.string,
};
