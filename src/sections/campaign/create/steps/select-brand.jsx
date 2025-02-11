import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { memo, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import {
  Box,
  Stack,
  Avatar,
  FormLabel,
  TextField,
  ListItemText,
  createFilterOptions,
  Typography,
} from '@mui/material';

import useGetCompany from 'src/hooks/use-get-company';

import { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

const filter = createFilterOptions();

const packageInfo = {
  availableCredits: 10,
  validity: dayjs(),
};
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

function getRemainingTime(createdDate, months) {
  const created = new Date(createdDate);
  const expiryDate = new Date(created);
  expiryDate.setMonth(expiryDate.getMonth() + months);

  const today = new Date();
  const diffTime = expiryDate - today;

  const remainingDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return remainingDays;
}

const SelectBrand = ({ openBrand, openCompany }) => {
  const { data, isLoading } = useGetCompany();
  const {
    getValues,
    setError,
    clearErrors,
    watch,
    formState: { errors, isValid },
  } = useFormContext();
  const client = getValues('client');
  const brand = getValues('campaignBrand');
  const campaignCredits = watch('campaignCredits');
  let latestPackageItem =
    client && client?.PackagesClient ? findLatestPackage(client?.PackagesClient) : null;

  console.log('FromData', data);

  useEffect(() => {
    if (client && client.inputValue) {
      openCompany.onTrue();
    }
    console.log(client?.PackagesClient);
    latestPackageItem =
      client && client?.PackagesClient ? findLatestPackage(client?.PackagesClient) : null;
  }, [client, openCompany]);

  useEffect(() => {
    if (brand?.inputValue) {
      openBrand.onTrue();
    }
  }, [brand, openBrand]);

  useEffect(() => {
    if (
      campaignCredits > latestPackageItem?.availableCredits 
    ) {
      setError('campaignCredit', {
        type: 'onChange',
        message: 'Cannot exceeds available credits',
      });
    } else {
      clearErrors('campaignCredit');
    }
  }, [campaignCredits, setError, clearErrors]);

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
       
          <Box
            display="flex"
            mt={3}
            mb={2}
            flexDirection={{ xs: 'column', sm: 'column' }}
            justifyContent="space-between"
          >
            <Typography
              sx={{ fontFamily: (theme) => theme.typography.fontSecondaryFamily, flexGrow: 1 }}
              fontSize={30}
            >
              Package Details
            </Typography>
            {/* add invoice details here */}
            <Box
              display="flex"
              flexDirection="row"
              flexWrap="wrap" // Allow wrapping of elements
              justifyContent="start"
              alignItems="start"
              gap={2}
              sx={{ width: '100%' }} // Ensure the Box takes full width
            >
              {/* add remarks and attachments here */}
              <TextField
                label={`${latestPackageItem?.availableCredits} UGC Credits (Auto)`}
                sx={{ flex: '1 1 calc(50% - 8px)' }}
                disabled={true}
              />{' '}
              {/* 50% width with gap adjustment */}
              <TextField
                label={
                  getRemainingTime(
                    latestPackageItem?.invoiceDate,
                    latestPackageItem?.validityPeriod
                  ) &&
                  getRemainingTime(
                    latestPackageItem?.invoiceDate,
                    latestPackageItem?.validityPeriod
                  ) > 0
                    ? `${getRemainingTime(
                        latestPackageItem?.invoiceDate,
                        latestPackageItem?.validityPeriod
                      )} days Left`
                    : 'Your package Expired '
                }
                sx={{ flex: '1 1 calc(50% - 8px)' }}
                disabled={true}
              />
              <RHFTextField
                key="campaignCredits"
                name="campaignCredits"
                label="Campiagn Credits"
                sx={{ flex: '1 1 calc(50% - 8px)' }}
              />
            </Box>
          </Box>

      </Stack>

      {/* {client && <RHFCheckbox name="hasBrand" size="small" label="Is it an agency?" />} */}

      {client && client.type === 'agency' && (
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
              // freeSolo
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

      {((client && client.type === 'directClient') || brand) && (
        <Stack
          direction={{ sm: 'column', md: 'row' }}
          justifyContent="space-between"
          // spacing={2}
          gap={2}
          mt={3}
        >
          <Stack
            spacing={2}
            minWidth={1 / 2}
            // width={1 / 2}
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
                value={`${packageInfo.availableCredits} UGC Credits ( Auto )`}
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
                value={`${dayjs(latestPackageItem?.validityPeriod).add(30, 'day').diff(dayjs(), 'day')} days left ( Auto )`}
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
      )}
    </Box>
  );
};

export default memo(SelectBrand);

SelectBrand.propTypes = {
  openCompany: PropTypes.object,
  openBrand: PropTypes.object,
};
