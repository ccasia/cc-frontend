import React, { memo, useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';

import { 
  Box, 
  Stack, 
  Radio,
  Button,
  MenuItem,
  TextField, 
  FormLabel,
  RadioGroup,
  Typography,
  IconButton,
  FormControl,
  FormControlLabel
} from '@mui/material';

import Iconify from 'src/components/iconify';
import { RHFSelect, RHFTextField, RHFRadioGroup } from 'src/components/hook-form';

const CampaignLogistics = () => {
  const { watch, setValue, control } = useFormContext();
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editValue, setEditValue] = useState('');
  const [lastAddedIndex, setLastAddedIndex] = useState(0);

  const logisticsType = watch('logisticsType');
  const schedulingOption = watch('schedulingOption');

  // For product delivery - multiple products
  const { fields: productFields, append: appendProduct, remove: removeProduct } = useFieldArray({
    control,
    name: 'products'
  });

  // For reservation - multiple locations
  const { fields: locationFields, append: appendLocation, remove: removeLocation } = useFieldArray({
    control,
    name: 'locations'
  });

  // Initialize arrays if needed
  React.useEffect(() => {
    if (logisticsType === 'product_delivery' && (!productFields || productFields.length === 0)) {
      appendProduct({ name: '' });
      setLastAddedIndex(0);
    }
    if (logisticsType === 'reservation' && (!locationFields || locationFields.length === 0)) {
      appendLocation({ name: '' });
      setValue('schedulingOption', 'confirmation');
    }
  }, [logisticsType, productFields, locationFields, appendProduct, appendLocation, setValue]);
  
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
        mx: 'auto'
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
          color: '#231F20'
        }}
      >
        This includes examples like sending products to creators through a courier service, 
        or setting a reservation for a restaurant
      </Typography>

      <Stack spacing={3}>
        <Stack spacing={1}>
          <FormLabel
            sx={{
              fontWeight: 600,
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
              if (e.target.value === 'product_delivery') {
                setValue('schedulingOption', '');
              } else if (e.target.value === 'reservation') {
                // Initialize reservation fields
                setValue('schedulingOption', 'confirmation');
              }
            }}
          >
            <MenuItem value="">Select logistics type</MenuItem>
            <MenuItem value="product_delivery">Product Delivery</MenuItem>
            <MenuItem value="reservation">Reservation</MenuItem>
          </RHFSelect>
        </Stack>

        {logisticsType === 'product_delivery' && (
          <Stack spacing={3}>
            {productFields.map((field, index) => (
              <Stack key={field.id} spacing={1}>
                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ 
                    fontWeight: 600,
                    color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
                    mb: 1
                  }}>
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
                        mb: 1
                      }}
                      autoFocus
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Button
                        onClick={() => handleCancel()}
                        sx={{ 
                          height: 38, 
                          borderRadius: '8px',
                          padding: '8px 12px',
                          background: '#FFFFFF',
                          border: '1px solid #E7E7E7',
                          boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                          color: 'text.primary',
                          '&:hover': { bgcolor: '#f5f5f5' }
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleSave(index)}
                        sx={{ 
                          height: 38, 
                          borderRadius: '8px',
                          padding: '8px 12px',
                          background: '#FFFFFF',
                          border: '1px solid #E7E7E7',
                          boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                          color: 'text.primary',
                          '&:hover': { bgcolor: '#f5f5f5' }
                        }}
                      >
                        Save
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TextField
                      fullWidth
                      placeholder="Product Name"
                      value={field.name}
                      disabled={index !== lastAddedIndex && editingIndex !== index}
                      onChange={(e) => {
                        const newProducts = [...productFields];
                        newProducts[index].name = e.target.value;
                        setValue(`products.${index}.name`, e.target.value);
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                        }
                      }}
                    />
                    {index !== lastAddedIndex && (
                      <IconButton 
                        onClick={() => handleEdit(index, field.name)}
                        sx={{ ml: 1 }}
                      >
                        <Iconify icon="eva:edit-fill" />
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
                    height: 38, 
                    borderRadius: '8px',
                    padding: '8px 12px',
                    background: '#FFFFFF',
                    border: '1px solid #E7E7E7',
                    boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                    color: '#FF3030',
                    '&:hover': { bgcolor: '#f5f5f5' }
                  }}
                >
                  Remove
                </Button>
              )}
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
                  '&:hover': { bgcolor: '#f5f5f5' }
                }}
              >
                <Iconify icon="eva:plus-fill" sx={{ color: '#1340FF' }} />
              </IconButton>
            </Box>
          </Stack>
        )}

        {logisticsType === 'reservation' && (
          <>
            <Stack spacing={2}>
              <FormLabel
                sx={{
                  fontWeight: 600,
                  color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
                }}
              >
                Scheduling Option <Typography component="span" color="error">*</Typography>
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
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: schedulingOption === 'confirmation' ? '#1340FF' : 'text.primary' }}>
                        Ask for my confirmation
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '14px', color: schedulingOption === 'confirmation' ? '#1340FF' : 'text.secondary' }}>
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
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: schedulingOption === 'auto' ? '#1340FF' : 'text.primary' }}>
                        Auto-Schedule
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '14px', color: schedulingOption === 'auto' ? '#1340FF' : 'text.secondary' }}>
                        Allow creators to schedule their time slots without needing confirmation.
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Stack>
            
            <Stack spacing={2}>
              <FormLabel
                sx={{
                  fontWeight: 600,
                  color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
                }}
              >
                Location
              </FormLabel>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {locationFields.map((field, index) => (
                  <Box 
                    key={field.id} 
                    sx={{ 
                      width: { xs: '100%', sm: 'calc(50% - 8px)' },
                    }}
                  >
                    <TextField
                      fullWidth
                      placeholder={index === locationFields.length - 1 && locationFields.length % 2 === 0 ? "Add an outlet" : ""}
                      value={field.name}
                      onChange={(e) => {
                        const newLocations = [...locationFields];
                        newLocations[index].name = e.target.value;
                        setValue(`locations.${index}.name`, e.target.value);
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                        }
                      }}
                    />
                  </Box>
                ))}
              </Box>
              
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
                    '&:hover': { bgcolor: '#f5f5f5' }
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
