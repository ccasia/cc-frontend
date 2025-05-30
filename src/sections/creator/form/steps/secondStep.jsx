import React from 'react';
import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';

import {
  Box,
  Stack,
  FormLabel,
  ListItemText,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { primaryFont } from 'src/theme/typography';
import { countriesCities } from 'src/contants/countries';

import { RHFAutocomplete } from 'src/components/hook-form';

// Add error icon component
const ErrorIcon = () => (
  <Box
    component="img"
    src="/assets/icons/components/ic_fillpaymenterror.svg"
    sx={{
      width: 20,
      height: 20,
      ml: 1,
      flexShrink: 0,
    }}
  />
);

const SecondStep = ({ item }) => {
  const loading = useBoolean();
  const { setValue, watch, formState: { errors } } = useFormContext();

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
          fontSize: { xs: '28px', sm: '40px' },
          fontWeight: 400,
          color: '#231F20',
        }}
        secondaryTypographyProps={{
          fontFamily: 'InterDisplay',
          fontSize: { xs: '14px', sm: '16px' },
          fontWeight: 400,
          color: '#636366',
          mt: 1,
        }}
      />

      <Stack
        gap={4}
        sx={{
          width: '100%', 
          maxWidth: { xs: '100%', sm: 400 },
          mx: 'auto',
          my: { xs: 4, sm: 7 },
          px: { xs: 1, sm: 0 },
        }}
      >
        <Stack spacing={1}>
          <FormLabel
            required
            sx={{ fontWeight: 600, color: '#231F20', fontFamily: primaryFont, fontSize: '14px' }}
          >
            What is your country of residence?
          </FormLabel>
          <Stack direction="row" alignItems="center">
            <RHFAutocomplete
              name="Nationality"
              placeholder="Select Country"
              options={Object.keys(countriesCities)}
              InputLabelProps={{ shrink: false }}
              sx={{ flex: 1 }}
            />
            {errors.Nationality && <ErrorIcon />}
          </Stack>
        </Stack>

        <Stack spacing={1}>
          <FormLabel
            required
            sx={{ fontWeight: 600, color: '#231F20', fontFamily: primaryFont, fontSize: '14px' }}
          >
            Which city are you from?
          </FormLabel>
          <Stack direction="row" alignItems="center">
            <RHFAutocomplete
              name="city"
              placeholder="City"
              options={[...new Set(countriesCities[countrySelected])]}
              InputLabelProps={{ shrink: false }}
              sx={{
                flex: 1,
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
            {errors.city && <ErrorIcon />}
          </Stack>
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
