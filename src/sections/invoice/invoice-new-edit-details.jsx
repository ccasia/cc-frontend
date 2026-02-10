import sum from 'lodash/sum';
import React, { useState, useEffect, useCallback } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import { inputBaseClasses } from '@mui/material/InputBase';

import Iconify from 'src/components/iconify';
import { RHFTextField } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export default function InvoiceNewEditDetails() {
  const { control, setValue, watch, getValues } = useFormContext();

  const { fields } = useFieldArray({
    control,
    name: 'items',
  });

  const values = watch();

  // Parse existing services from the invoice data
  const parseExistingServices = () => {
    const items = getValues('items') || [];
    if (!items.length) return [];

    const item = items[0];
    if (!item) return [];

    // Check if service is a string that might contain multiple services
    if (item.service && typeof item.service === 'string') {
      // Split by comma and trim each service
      return item.service.split(',').map((s) => s.trim());
    }

    return [];
  };

  // Get the list of selected services
  const selectedServices = parseExistingServices();

  // State to track selected services
  const [selectedServicesList, setSelectedServicesList] = useState(selectedServices);

  // State to control dropdown visibility
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const totalOnRow = values.items.map((item) => item?.price);

  // Get currency from the first item or use a default
  const getCurrencySymbol = (currencyCode) => {
    const currencySymbols = {
      MYR: 'RM',
      SGD: 'S$',
      USD: '$',
      AUD: 'A$',
      JPY: '¥',
      IDR: 'Rp',
    };
    return currencySymbols[currencyCode] || currencyCode || '';
  };

  // Get the currency code and symbol
  const currencyCode = values.items[0]?.currency || values.currency || 'MYR';
  const currencySymbol = values.items[0]?.currencySymbol || getCurrencySymbol(currencyCode);

  // For display in the UI
  const displayCurrency = currencySymbol || currencyCode || '';

  const subTotal = sum(totalOnRow);

  const totalAmount = subTotal;

  useEffect(() => {
    setValue('totalAmount', totalAmount);
  }, [setValue, totalAmount]);

  // Initialize selectedServicesList with the parsed services when component mounts
  useEffect(() => {
    setSelectedServicesList(selectedServices);
  }, [selectedServices]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = () => {
      if (dropdownOpen) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Handle toggling a service on/off

  const handleChangePrice = useCallback(
    (event, index) => {
      setValue(`items[${index}].price`, Number(event.target.value));
      setValue(
        `items[${index}].total`,
        values.items.map((item) => item.quantity * item.price)[index]
      );
    },
    [setValue, values.items]
  );

  const renderTotal = (
    <Stack
      spacing={2}
      alignItems="flex-end"
      sx={{ mt: 3, textAlign: 'right', typography: 'body2' }}
    >
      <Stack direction="row" sx={{ typography: 'subtitle1' }}>
        <Box>Total</Box>
        <Box sx={{ width: 160 }}>
          {totalAmount !== undefined && totalAmount !== null
            ? `${displayCurrency} ${Number(totalAmount).toFixed(2)}`
            : '-'}
        </Box>
      </Stack>
    </Stack>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ color: 'text.disabled', mb: 3 }}>
        Details:
      </Typography>

      <Stack divider={<Divider flexItem sx={{ borderStyle: 'dashed' }} />} spacing={3}>
        {fields.map((item, index) => (
          <Stack key={item.id} alignItems="flex-end" spacing={1.5}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ width: 1 }}>
              <RHFTextField
                size="small"
                name={`items[${index}].clientName`}
                label="Client Name"
                InputLabelProps={{ shrink: true }}
              />

              <RHFTextField
                size="small"
                name={`items[${index}].campaignName`}
                label="Campaign Name"
                InputLabelProps={{ shrink: true }}
              />

              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id={`service-label-${index}`}>Service</InputLabel>
                <Select
                  labelId={`service-label-${index}`}
                  multiple
                  value={selectedServicesList}
                  onChange={(e) => {
                    const newValues = e.target.value;
                    setSelectedServicesList(newValues);
                    setValue(`items[${index}].service`, newValues.join(', '));

                    // If Others is selected, make sure the description field is visible
                    // Otherwise, clear the description field
                    if (!newValues.includes('Others')) {
                      setValue(`items[${index}].description`, '');
                    }
                  }}
                  renderValue={(selected) => selected.join(', ')}
                  size="small"
                  sx={{
                    minWidth: 200,
                    '& .MuiSelect-select': {
                      display: 'flex',
                      alignItems: 'center',
                    },
                  }}
                >
                  {[
                    { id: 1, name: 'CGC Video', price: 200 },
                    { id: 2, name: 'Ads', price: 0 },
                    { id: 3, name: 'Cross Posting', price: 0 },
                    { id: 4, name: 'Reimbursement', price: 0 },
                    { id: 5, name: 'Others', price: 0 },
                  ].map((service) => (
                    <MenuItem key={service.id} value={service.name}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                        }}
                      >
                        {service.name}
                        {selectedServicesList.includes(service.name) && (
                          <Box
                            component="span"
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: 'success.main',
                              ml: 1,
                            }}
                          >
                            <Iconify
                              icon="eva:checkmark-fill"
                              width={16}
                              sx={{ color: 'common.white' }}
                            />
                          </Box>
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Hidden field to store the actual value */}
              <input
                type="hidden"
                name={`items[${index}].service`}
                value={selectedServicesList.join(', ')}
              />

              {(values.items[index]?.service?.includes('Others') ||
                selectedServicesList.includes('Others')) && (
                <RHFTextField
                  size="small"
                  name={`items[${index}].description`}
                  label="Specify Others"
                  placeholder="Enter details for Others"
                  InputLabelProps={{ shrink: true }}
                  sx={{ maxWidth: { md: 200 } }}
                />
              )}

              <RHFTextField
                size="small"
                type="number"
                name={`items[${index}].price`}
                label="Price"
                placeholder="0.00"
                onChange={(event) => handleChangePrice(event, index)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={{ typography: 'subtitle2', color: 'text.disabled' }}>
                        {displayCurrency}
                      </Box>
                    </InputAdornment>
                  ),
                }}
                sx={{ maxWidth: { md: 100 } }}
              />

              <RHFTextField
                disabled
                size="small"
                type="number"
                name={`items[${index}].total`}
                label="Total"
                placeholder="0.00"
                value={
                  Number(values.items[index]?.total) === 0
                    ? ''
                    : Number(values.items[index]?.total)?.toFixed(2)
                }
                onChange={(event) => handleChangePrice(event, index)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={{ typography: 'subtitle2', color: 'text.disabled' }}>
                        {displayCurrency}
                      </Box>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  maxWidth: { md: 120 },
                  [`& .${inputBaseClasses.input}`]: {
                    textAlign: { md: 'right' },
                  },
                }}
              />
            </Stack>
          </Stack>
        ))}
      </Stack>

      {renderTotal}
    </Box>
  );
}
