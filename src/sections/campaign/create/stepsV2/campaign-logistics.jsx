import { memo, useState, useEffect } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import {
  Box,
  Stack,
  Radio,
  Switch,
  MenuItem,
  FormLabel,
  Typography,
  IconButton,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import { RHFSelect, RHFTextField } from 'src/components/hook-form';

const CampaignLogistics = () => {
  const {
    watch,
    setValue,
    control,
    getValues,
    trigger,
    formState: { errors },
  } = useFormContext();
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editValue, setEditValue] = useState('');
  const [lastAddedIndex, setLastAddedIndex] = useState(0);

  const logisticsType = watch('logisticsType');
  const schedulingOption = watch('schedulingOption');
  const allowMultipleBookings = watch('allowMultipleBookings');

  // For product delivery - multiple products
  const {
    fields: productFields,
    append: appendProduct,
    remove: removeProduct,
  } = useFieldArray({
    control,
    name: 'products',
  });

  // For reservation - multiple locations
  const {
    fields: locationFields,
    append: appendLocation,
    remove: removeLocation,
  } = useFieldArray({
    control,
    name: 'locations',
  });

  // Initialize arrays if needed
  useEffect(() => {
    if (logisticsType === 'PRODUCT_DELIVERY' && productFields.length === 0) {
      appendProduct({ name: '' });
      // setLastAddedIndex(0);
    }
    if (logisticsType === 'RESERVATION' && locationFields.length === 0) {
      appendLocation({ name: '' });
      // setValue('schedulingOption', 'confirmation');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logisticsType]);

  const handleEdit = (index, value) => {
    setEditingIndex(index);
    setEditValue(value);
  };

  const handleSave = (index) => {
    setValue(`products.${index}.name`, editValue);
    setEditingIndex(-1);
  };

  const handleCancel = () => {
    setEditingIndex(-1);
  };

  const handleAddProduct = () => {
    appendProduct({ name: '' });
    setLastAddedIndex(productFields.length);
    setEditingIndex(-1);
  };

  useEffect(() => {
    console.log('allowMultipleBookings status', allowMultipleBookings);
  }, [allowMultipleBookings]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignContent: 'center',
        gap: 3,
        p: 3,
        maxWidth: 600,
        mx: 'auto',
      }}
    >
      <Typography
        textAlign="center"
        sx={{
          mb: 2,
          fontFamily: 'Inter Display, sans-serif',
          fontWeight: 400,
          fontSize: '16px',
          lineHeight: '20px',
          letterSpacing: '0%',
          color: '#231F20',
        }}
      >
        This includes examples like sending products to creators through a courier service, or
        setting a reservation for a restaurant
      </Typography>

      <Stack spacing={2} mb={10}>
        <Stack spacing={1}>
          <FormLabel
            sx={{
              fontWeight: 600,
              fontSize: '14px',
              color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
            }}
          >
            Logistics Type
          </FormLabel>
          <RHFSelect
            name="logisticsType"
            placeholder="Select logistics type"
            sx={{ boxShadow: 'none' }}
            onChange={(e) => {
              setValue('logisticsType', e.target.value);
              // Reset fields when logistics type changes
              if (e.target.value === 'PRODUCT_DELIVERY') {
                setValue('schedulingOption', '');
                if (getValues('products').length === 0) setValue('products', [{ name: '' }]);
              } else if (e.target.value === 'RESERVATION') {
                // Initialize reservation fields
                setValue('schedulingOption', 'confirmation');
                if (getValues('locations').length === 0) setValue('locations', [{ name: '' }]);
              } else {
                // We clear the data and the scheduling option
                setValue('schedulingOption', '');
                setValue('products', [{ name: '' }]);
                setValue('locations', [{ name: '' }]);
              }
            }}
          >
            <MenuItem value="">Select logistics type</MenuItem>
            <MenuItem value="PRODUCT_DELIVERY">Product Delivery</MenuItem>
            <MenuItem value="RESERVATION">Reservation</MenuItem>
          </RHFSelect>
        </Stack>

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

                <Stack direction="row" spacing={1} sx={{ display: 'flex', alignItems: 'center' }}>
                  <RHFTextField
                    fullWidth
                    placeholder="Product Name"
                    name={`products.${index}.name`}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                      },
                    }}
                  />

                  <IconButton
                    onClick={() => removeProduct(index)}
                    disabled={productFields.length === 1}
                    sx={{
                      width: 50,
                      height: 50,
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
              </Stack>
            ))}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <IconButton
                onClick={handleAddProduct}
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
        )}

        {logisticsType === 'RESERVATION' && (
          <>
            <Stack spacing={1}>
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
                  onClick={() => setValue('schedulingOption', 'confirmation')}
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
                  onClick={() => setValue('schedulingOption', 'auto')}
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

            <Stack spacing={0}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Allow multiple creators to book the same timeslot
                </Typography>
                <Switch
                  checked={watch('allowMultipleBookings')}
                  onChange={(e) =>
                    setValue('allowMultipleBookings', e.target.checked, { shouldValidate: true })
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
                  Contact Number{' '}
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
                      onChange={(e) => {
                        setValue(`locations.${index}.name`, e.target.value, {
                          shouldValidate: true,
                        });
                        trigger('locations');
                      }}
                      error={
                        index === 0
                          ? !!errors.locations && !Array.isArray(errors.locations)
                          : !!errors?.locations?.[index]?.name
                      }
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

              {errors.locations && !Array.isArray(errors.locations) && (
                <Typography variant="caption" color="error" sx={{ fontWeight: 400 }}>
                  {errors.locations.message}
                </Typography>
              )}

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
          </>
        )}
      </Stack>
    </Box>
  );
};

export default memo(CampaignLogistics);
