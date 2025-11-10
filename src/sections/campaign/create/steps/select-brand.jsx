import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';
import React, { memo, useMemo, useEffect } from 'react';

import {
  Box,
  Stack,
  Avatar,
  Button,
  Tooltip,
  FormLabel,
  TextField,
  Typography,
  ListItemText,
  createFilterOptions,
} from '@mui/material';

import useGetCompany from 'src/hooks/use-get-company';

import Iconify from 'src/components/iconify';
import { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

const filter = createFilterOptions();

// const findLatestPackage = (packages) => {
//   if (packages.length === 0) {
//     return null; // Return null if the array is empty
//   }

//   const latestPackage = packages.reduce((latest, current) => {
//     const latestDate = new Date(latest.createdAt);
//     const currentDate = new Date(current.createdAt);

//     return currentDate > latestDate ? current : latest;
//   });

//   return latestPackage;
// };

const getRemainingTime = (invoiceDate) => {
  const remainingDays = dayjs(invoiceDate).diff(dayjs(), 'days');

  return remainingDays;
};

const SelectBrand = ({ openBrand, openCompany, openPackage, onValidationChange }) => {
  const { data, isLoading } = useGetCompany();

  const {
    getValues,
    setError,
    clearErrors,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const client = watch('client');
  const brand = getValues('campaignBrand');
  const campaignCredits = watch('campaignCredits');

  const creditSummary = useMemo(() => {
    return client?.creditSummary || null;
  }, [client])

  const requestedCredits = Number(campaignCredits || 0);
  const availableCredits = creditSummary?.remainingCredits ?? 0;

  let creditError = false;
  let creditHelperText = '';

  if (requestedCredits <= 0) {
  } else if (requestedCredits > availableCredits) {
    creditError = true;
    creditHelperText = `Exceeds limit - credits available: ${availableCredits}`;
  }

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(creditError);
    }
  }, [creditError, onValidationChange]); 

  // const latestPackageItem = useMemo(() => {
  //   if (client?.id && client?.subscriptions.length) {
  //     let packageItem = findLatestPackage(client?.subscriptions);
  //     packageItem = {
  //       ...packageItem,
  //       totalCredits:
  //         packageItem.totalCredits ||
  //         packageItem.package.credits ||
  //         packageItem.customPackage.customCredits,
  //       availableCredits:
  //         (packageItem.totalCredits ||
  //           packageItem.package.credits ||
  //           packageItem.customPackage.customCredits) - packageItem.creditsUsed,
  //     };
  //     return packageItem;
  //   }
  //   return null;
  // }, [client]);

  // const availabilityCredits = useMemo(() => {
  //   let campaigns;
  //   if ((client?.type && client?.type === 'directClient') || !client?.brand?.length) {
  //     campaigns = client?.campaign;
  //   } else {
  //     campaigns = client?.brand?.flatMap((a) => a.campaign);
  //   }

  //   campaigns = campaigns?.filter(
  //     (campaign) =>
  //       campaign?.subscriptionId != null && campaign?.subscriptionId === latestPackageItem?.id
  //   );

  //   return campaigns?.reduce((acc, sum) => acc + sum.campaignCredits, 0);
  // }, [client, latestPackageItem]);

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

  // useEffect(() => {
  //   if (
  //     (latestPackageItem &&
  //       campaignCredits > latestPackageItem.totalCredits - availabilityCredits) ||
  //     !latestPackageItem
  //   ) {
  //     setError('campaignCredit', {
  //       type: 'onChange',
  //       message: 'Cannot exceeds available credits',
  //     });
  //   } else {
  //     clearErrors('campaignCredit');
  //   }
  // }, [campaignCredits, setError, clearErrors, latestPackageItem, availabilityCredits]);

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

      {client && (client?.type === 'agency' || !!client?.brand?.length) && (
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
        (!creditSummary || !creditSummary.remainingCredits ? (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="subtitle1" color="text.secondary">
              No active package found
            </Typography>
            <Button variant="outlined" sx={{ mt: 2 }} onClick={openPackage.onTrue}>
              Link a package
            </Button>
          </Box>
        ) : (
          <>
            {dayjs(creditSummary.nextExpiryDate).isBefore(dayjs(), 'date') ? (
              <Stack mt={2} alignItems="center" spacing={1}>
                <Avatar
                  sx={{ bgcolor: (theme) => theme.palette.warning.light, width: 60, height: 60 }}
                >
                  <Iconify icon="pajamas:expire" width={26} />
                </Avatar>
                <Typography variant="subtitle2">
                  Package has expired
                </Typography>
                <Button variant="outlined" sx={{ mt: 2 }} onClick={openPackage.onTrue}>
                  Renew package
                </Button>
              </Stack>
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
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <FormLabel
                        sx={{
                          fontWeight: 600,
                          color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
                        }}
                      >
                        Total Available Credits
                      </FormLabel>

                      <Tooltip title={`Total remaining credits from ${creditSummary.activePackagesCount} active package(s).`}>
                        <Iconify
                          icon="material-symbols:info-outline-rounded"
                          width="24"
                          color="text.secondary"
                          sx={{
                            cursor: 'pointer',
                          }}
                        />
                      </Tooltip>
                    </Stack>
                    <TextField
                      value={`${creditSummary.remainingCredits} UGC Credits`}
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
                      value={`${getRemainingTime(creditSummary.nextExpiryDate)} days left`}
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
                    error={creditError || errors?.campaignCredits}
                    helperText={errors?.campaignCredits?.message || creditHelperText}
                  />
                </Stack>
              </Stack>
            )}
          </>
        ))}
    </Box>
  );
};

export default memo(SelectBrand);

SelectBrand.propTypes = {
  openCompany: PropTypes.object,
  openBrand: PropTypes.object,
  openPackage: PropTypes.object,
  onValidationChange: PropTypes.func,
};
