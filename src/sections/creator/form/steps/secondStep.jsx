import axios from 'axios';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { useFormContext } from 'react-hook-form';
import React, { useEffect, useCallback } from 'react';

import {
  Box,
  Stack,
  Tooltip,
  FormLabel,
  IconButton,
  ListItemText,
  InputAdornment,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { countries } from 'src/assets/data';
import { primaryFont } from 'src/theme/typography';

import Iconify from 'src/components/iconify';
import { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';
import { countriesCities } from 'src/contants/countries';

const SecondStep = ({ item }) => {
  const loading = useBoolean();
  const { setValue, watch } = useFormContext();

  const countrySelected = watch('Nationality');

  // const creatorLocation = useCallback(() => {
  //   if ('geolocation' in navigator) {
  //     navigator.geolocation.getCurrentPosition(
  //       async (position) => {
  //         const { latitude, longitude } = position.coords;
  //         loading.onTrue();
  //         try {
  //           const address = await axios.get(
  //             `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
  //           );
  //           setValue('location', address.data.display_name);
  //         } catch (error) {
  //           enqueueSnackbar('Error fetch location', {
  //             variant: 'error',
  //           });
  //         } finally {
  //           loading.onFalse();
  //         }
  //       },
  //       (error) => {
  //         console.error(`Error Code = ${error.code} - ${error.message}`);
  //         enqueueSnackbar('Error fetch location', {
  //           variant: 'error',
  //         });
  //         loading.onFalse();
  //       }
  //     );
  //   } else {
  //     console.log('Geolocation is not supported by this browser.');
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [setValue]);

  // useEffect(() => {
  //   creatorLocation();
  // }, [creatorLocation]);

  return (
    <Box>
      <ListItemText
        sx={{
          mt: 4,
          textAlign: 'center',
        }}
        primary={item.title}
        secondary={item.description}
        primaryTypographyProps={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: '40px',
          fontWeight: 400,
          color: '#231F20',
        }}
        secondaryTypographyProps={{
          fontFamily: 'InterDisplay',
          fontSize: '16px',
          fontWeight: 400,
          color: '#636366',
        }}
      />

      <Stack
        gap={4}
        sx={{
          width: { sm: 400 },
          mx: 'auto',
          my: 7,
        }}
      >
        <Stack spacing={1}>
          <FormLabel
            required
            sx={{ fontWeight: 600, color: '#231F20', fontFamily: primaryFont, fontSize: '14px' }}
          >
            What is your country of residence?
          </FormLabel>
          {/* <RHFAutocomplete
            name="Nationality"
            type="country"
            placeholder="Select Country"
            fullWidth
            options={countries.map((option) => option.label)}
            getOptionLabel={(option) => option}
          /> */}
          <RHFAutocomplete
            name="Nationality"
            placeholder="Select Country"
            options={Object.keys(countriesCities)}
            InputLabelProps={{ shrink: false }}
            // sx={{
            //   width: '100%',
            //   '& .MuiTextField-root': {
            //     bgcolor: 'white',
            //     borderRadius: 1,
            //     '& .MuiInputLabel-root': {
            //       display: 'none',
            //     },
            //     '& .MuiInputBase-input::placeholder': {
            //       color: '#B0B0B0',
            //       fontSize: { xs: '14px', sm: '16px' },
            //       opacity: 1,
            //     },
            //     '& .MuiOutlinedInput-root': {
            //       borderRadius: 1,
            //     },
            //   },
            // }}
          />
        </Stack>

        <Stack spacing={1}>
          <FormLabel
            required
            sx={{ fontWeight: 600, color: '#231F20', fontFamily: primaryFont, fontSize: '14px' }}
          >
            Which city are you from?
          </FormLabel>
          {/* <RHFTextField
            name="location"
            placeholder="Select City"
            multiline
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Get current location">
                    {!loading.value ? (
                      <IconButton
                        onClick={() => {
                          creatorLocation();
                        }}
                      >
                        <Iconify icon="mdi:location" />
                      </IconButton>
                    ) : (
                      <Iconify icon="eos-icons:bubble-loading" />
                    )}
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          /> */}
          <RHFAutocomplete
            name="city"
            placeholder="City"
            options={[...new Set(countriesCities[countrySelected])]}
            InputLabelProps={{ shrink: false }}
            sx={{
              width: '100%',
              '& .MuiTextField-root': {
                bgcolor: 'white',
                borderRadius: 1,
                '& .MuiInputLabel-root': {
                  display: 'none',
                },
                '& .MuiInputBase-input::placeholder': {
                  color: '#B0B0B0',
                  fontSize: { xs: '14px', sm: '16px' },
                  opacity: 1,
                },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                },
              },
            }}
          />
        </Stack>
      </Stack>
    </Box>
  );
};

export default SecondStep;

SecondStep.propTypes = {
  item: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
  }),
};
