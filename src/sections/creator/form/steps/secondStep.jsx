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

import Iconify from 'src/components/iconify';
import { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

const SecondStep = ({ item }) => {
  const loading = useBoolean();
  const { setValue } = useFormContext();

  const creatorLocation = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          loading.onTrue();
          try {
            const address = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
            );
            setValue('location', address.data.display_name);
          } catch (error) {
            enqueueSnackbar('Error fetch location', {
              variant: 'error',
            });
          } finally {
            loading.onFalse();
          }
        },
        (error) => {
          console.error(`Error Code = ${error.code} - ${error.message}`);
          enqueueSnackbar('Error fetch location', {
            variant: 'error',
          });
          loading.onFalse();
        }
      );
    } else {
      console.log('Geolocation is not supported by this browser.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setValue]);

  useEffect(() => {
    creatorLocation();
  }, [creatorLocation]);

  return (
    <Box>
      <ListItemText
        sx={{
          mt: 2,
          textAlign: 'center',
        }}
        primary={item.title}
        secondary={item.description}
        primaryTypographyProps={{
          fontFamily: (theme) => theme.typography.fontSecondaryFamily,
          variant: 'h3',
          fontWeight: 400,
        }}
        secondaryTypographyProps={{
          variant: 'subtitle2',
        }}
      />

      <Stack
        gap={4}
        sx={{
          width: { sm: 400 },
          mx: 'auto',
          my: 10,
        }}
      >
        <Stack spacing={1}>
          <FormLabel required sx={{ fontWeight: 600, color: 'black' }}>
            What is your nationality?
          </FormLabel>
          <RHFAutocomplete
            name="Nationality"
            type="country"
            placeholder="Select Nationality"
            fullWidth
            options={countries.map((option) => option.label)}
            getOptionLabel={(option) => option}
          />
        </Stack>

        <Stack spacing={1}>
          <FormLabel required sx={{ fontWeight: 600, color: 'black' }}>
            Which city are you from?
          </FormLabel>
          <RHFTextField
            name="location"
            label="Select City"
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
