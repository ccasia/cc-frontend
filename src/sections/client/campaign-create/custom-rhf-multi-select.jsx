import { useState } from 'react';
import PropTypes from 'prop-types';
import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';

// ----------------------------------------------------------------------

export function CustomRHFMultiSelect({
  name,
  label,
  options,
  checkbox,
  placeholder,
  helperText,
  chipColor = '#8E8E93',
  ...other
}) {
  const { control, setValue } = useFormContext();
  const [open, setOpen] = useState(false);

  const handleRemoveItem = (e, itemValue) => {
    // Stop event from propagating to parent elements
    e.preventDefault();
    e.stopPropagation();
    
    // Get the current field value
    const currentValue = control._formValues[name] || [];
    
    // Filter out the item to remove
    const newValue = currentValue.filter(val => val !== itemValue);
    
    // Update the field value directly
    setValue(name, newValue, { shouldValidate: true });
    
    // Prevent dropdown from opening
    setTimeout(() => {
      setOpen(false);
    }, 0);
    
    return false;
  };

  const renderValues = (selectedIds) => {
    const selectedItems = options?.filter((item) => selectedIds.includes(item.value));

    if (!selectedItems.length && placeholder) {
      return <Box sx={{ color: 'text.disabled' }}>{placeholder}</Box>;
    }

    return (
      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.8,
        maxWidth: '100%',
        overflowX: 'auto',
        pb: 1,
        '@media (max-width: 600px)': {
          gap: 0.5,
        },
      }}>
        {selectedItems.map((item) => (
          <Box
            key={item.value}
            sx={{
              bgcolor: '#FFFFFF',
              color: chipColor,
              border: '1.5px solid',
              borderColor: '#e7e7e7',
              borderBottom: 3,
              borderBottomColor: '#e7e7e7',
              borderRadius: 1.15,
              py: 0.6,
              px: 1.2,
              fontWeight: 600,
              fontSize: '0.75rem',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              position: 'relative',
              paddingRight: '24px',
              mb: 0.5,
            }}
          >
            {item.label}
            <Box
              onClick={(e) => handleRemoveItem(e, item.value)}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              sx={{
                position: 'absolute',
                right: 4,
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 20, // Increased click area
                height: 20, // Increased click area
                borderRadius: '50%',
                cursor: 'pointer',
                color: '#8E8E93',
                '&:hover': {
                  color: '#666',
                },
                zIndex: 10, // Ensure it's above other elements
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormControl error={!!error} fullWidth {...other}>
          {label && <InputLabel id={name}> {label} </InputLabel>}

          <Select
            {...field}
            multiple
            displayEmpty={!!placeholder}
            id={`multiple-${name}`}
            labelId={name}
            label={label}
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            renderValue={(selected) => renderValues(selected)}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 300,
                  width: 250,
                },
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                minHeight: '40px',
                height: 'auto',
              },
              ...other.sx,
            }}
            onChange={(event) => {
              const newValue = event.target.value;
              field.onChange(newValue);
              setOpen(false); // Close dropdown after selection
            }}
          >
            {options.map((option) => {
              const selected = field.value?.includes(option.value);

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

CustomRHFMultiSelect.propTypes = {
  checkbox: PropTypes.bool,
  chipColor: PropTypes.string,
  helperText: PropTypes.string,
  label: PropTypes.string,
  name: PropTypes.string,
  options: PropTypes.array,
  placeholder: PropTypes.string,
}; 

export default CustomRHFMultiSelect; 