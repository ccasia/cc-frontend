import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';
import React, { memo, useMemo, useEffect } from 'react';

import {
  Box,
  Stack,
  Avatar,
  Button,
  FormLabel,
  TextField,
  Typography,
  ListItemText,
  createFilterOptions,
} from '@mui/material';

import useGetCompany from 'src/hooks/use-get-company';

import { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

const filter = createFilterOptions();

const findLatestPackage = (packages) => {
  if (packages.length === 0) {
    return null; // Return null if the array is empty
  }

  const latestPackage = packages.reduce((latest, current) => {
    const latestDate = new Date(latest.createdAt);
    const currentDate = new Date(current.createdAt);

    return currentDate > latestDate ? current : latest;
  });

  return latestPackage;
};

const getRemainingTime = (invoiceDate) => {
  const remainingDays = dayjs(invoiceDate).diff(dayjs(), 'days');

  return remainingDays;
};

const SelectBrand = ({ openBrand, openCompany, openPackage }) => {
  const { data, isLoading } = useGetCompany();

  const {
    getValues,
    setError,
    clearErrors,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const client = getValues('client');
  const brand = getValues('campaignBrand');
  const campaignCredits = watch('campaignCredits');

  const latestPackageItem = useMemo(() => {
    if (client?.id && client?.subscriptions.length) {
      let packageItem = findLatestPackage(client?.subscriptions);
      packageItem = {
        ...packageItem,
        totalCredits:
          packageItem.totalCredits ||
          packageItem.package.credits ||
          packageItem.customPackage.customCredits,
        availableCredits:
          (packageItem.totalCredits ||
            packageItem.package.credits ||
            packageItem.customPackage.customCredits) - packageItem.creditsUsed,
      };
      return packageItem;
    }

    return null;
  }, [client]);

  // useEffect(() => {
  //   if (client && !latestPackageItem) {
  //     openPackage.onTrue();
  //   }
  // }, [latestPackageItem, openPackage, client]);

  useEffect(() => {
    if (client && client.inputValue) {
      openCompany.onTrue();
    }
  }, [client, openCompany]);

  useEffect(() => {
    if (brand?.inputValue) {
      openBrand.onTrue();
    }
  }, [brand, openBrand]);

  useEffect(() => {
    if (campaignCredits > latestPackageItem?.availableCredits || !latestPackageItem) {
      setError('campaignCredit', {
        type: 'onChange',
        message: 'Cannot exceeds available credits',
      });
    } else {
      clearErrors('campaignCredit');
    }
  }, [campaignCredits, setError, clearErrors, latestPackageItem]);

  useEffect(() => {
    if (client && client?.type === 'directClient') {
      setValue('campaignBrand', null, { shouldValidate: true });
    }
  }, [client, setValue]);

  return (
    <Box
      sx={{
        p: 2,
      }}
    >
      <Stack spacing={1}>
        <FormLabel
          required
          sx={{
            fontWeight: 600,
            color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
          }}
        >
          Select client or agency
        </FormLabel>

        <RHFAutocomplete
          name="client"
          placeholder="Select or Create Client"
          options={data || []}
          loading={isLoading}
          getOptionLabel={(option) => {
            if (option.inputValue) {
              return option.inputValue;
            }
            return option.name;
          }}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          selectOnFocus
          clearOnBlur
          renderOption={(props, option) => {
            const { ...optionProps } = props;

            return (
              <Stack
                component="li"
                direction="row"
                spacing={1}
                p={1}
                {...optionProps}
                key={option?.id}
              >
                <Avatar src={option?.logo} sx={{ width: 35, height: 35 }} />
                <ListItemText primary={option.name} />
              </Stack>
            );
          }}
          filterOptions={(options, params) => {
            const { inputValue } = params;

            const filtered = filter(options, params);

            const isExisting = options.some(
              (option) => option.name.toLowerCase() === inputValue.toLowerCase()
            );

            if (inputValue !== '' && !isExisting) {
              filtered.push({
                inputValue,
                name: `Add "${inputValue}"`,
              });
            }

            return filtered;
          }}
        />
      </Stack>

      {client && (client.type === 'agency' || !!client.brand.length) && (
        <Box mt={2}>
          <Stack spacing={1}>
            <FormLabel
              required
              sx={{
                fontWeight: 600,
                color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
              }}
            >
              Select or create brand
            </FormLabel>
            <RHFAutocomplete
              name="campaignBrand"
              placeholder="Select or Create Brand"
              options={client?.brand || []}
              loading={isLoading}
              getOptionLabel={(option) => {
                // Add "xxx" option created dynamically
                if (option.inputValue) {
                  return option.inputValue;
                }
                // Regular option
                return option.name;
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              selectOnFocus
              clearOnBlur
              renderOption={(props, option) => {
                //   eslint-disable-next-line react/prop-types
                const { ...optionProps } = props;

                return (
                  <Stack
                    component="li"
                    direction="row"
                    spacing={1}
                    p={1}
                    {...optionProps}
                    key={option?.id}
                  >
                    <Avatar src={option?.logo} sx={{ width: 35, height: 35 }} />
                    <ListItemText primary={option.name} />
                  </Stack>
                );
              }}
              filterOptions={(options, params) => {
                const { inputValue } = params;

                const filtered = filter(options, params);

                // Suggest the creation of a new value
                const isExisting = options.some(
                  (option) => option.name.toLowerCase() === inputValue.toLowerCase()
                );

                if (inputValue !== '' && !isExisting) {
                  filtered.push({
                    inputValue,
                    name: `Add "${inputValue}"`,
                  });
                }

                return filtered;
              }}
            />
          </Stack>
        </Box>
      )}

      {client &&
        (!latestPackageItem ? (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="subtitle1" color="text.secondary">
              Package not found
            </Typography>
            <Button variant="outlined" sx={{ mt: 2 }} onClick={openPackage.onTrue}>
              Link a package
            </Button>
          </Box>
        ) : (
          <Stack
            direction={{ sm: 'column', md: 'row' }}
            justifyContent="space-between"
            gap={2}
            mt={3}
          >
            <Stack
              spacing={2}
              minWidth={1 / 2}
              sx={{
                position: 'relative',
                border: 1,
                p: 2,
                borderRadius: 1,
                borderColor: (theme) => theme.palette.divider,
                ':before': {
                  content: "'Package Information'",
                  position: 'absolute',
                  top: -18,
                  fontFamily: (theme) => theme.typography.fontSecondaryFamily,
                  letterSpacing: 0.7,
                  fontWeight: 600,
                  fontSize: 20,
                  bgcolor: 'white',
                },
              }}
            >
              <Stack>
                <FormLabel
                  sx={{
                    fontWeight: 600,
                    color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
                  }}
                >
                  Available Credits
                </FormLabel>
                <TextField
                  value={`${latestPackageItem?.availableCredits} UGC Credits`}
                  InputProps={{
                    disabled: true,
                  }}
                />
              </Stack>

              <Stack>
                <FormLabel
                  sx={{
                    fontWeight: 600,
                    color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
                  }}
                >
                  Validity
                </FormLabel>
                <TextField
                  value={`${getRemainingTime(latestPackageItem?.expiredAt)} days left`}
                  InputProps={{
                    disabled: true,
                  }}
                />
              </Stack>
            </Stack>
            <Stack spacing={1} minWidth={1 / 2}>
              <FormLabel
                required
                sx={{
                  fontWeight: 600,
                  color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
                }}
              >
                Campaign Credits
              </FormLabel>
              <RHFTextField
                name="campaignCredits"
                type="number"
                placeholder="UGC Credits"
                error={errors?.campaignCredit || errors?.campaignCredits}
                helperText={errors?.campaignCredit?.message}
              />
            </Stack>
          </Stack>
        ))}
    </Box>
  );
};

export default memo(SelectBrand);

SelectBrand.propTypes = {
  openCompany: PropTypes.object,
  openBrand: PropTypes.object,
  openPackage: PropTypes.object,
};
