import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';
import React, { memo, useMemo, useEffect } from 'react';

import {
  Box,
  Chip,
  Stack,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  FormLabel,
  TextField,
  Typography,
  ListItemText,
  createFilterOptions,
} from '@mui/material';

import useGetCompany from 'src/hooks/use-get-company';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import {
  RHFSwitch,
  RHFSelectV2,
  RHFTextField,
  RHFMultiSelect,
  RHFAutocomplete,
} from 'src/components/hook-form';

import CreateBrand from '../brandDialog';
import { useGetAdmins } from '../hooks/get-am';
import NdaAgreementField from '../nda-agreement-field';
import PackageCreateDialog from '../../../packages/package-dialog';
import CreateCompany from '../../../brand/create/brandForms/FirstForms/create-company';

// Campaign type options (matching activate-campaign-dialog.jsx)
const campaignTypeOptions = [
  { value: 'normal', label: 'UGC (With Posting)' },
  { value: 'ugc', label: 'UGC (No Posting)' },
  { value: 'seedingCampaign', label: 'Seeding Campaign' },
];

// Deliverable options (matching activate-campaign-dialog.jsx)
const deliverableOptions = [
  { value: 'UGC_VIDEOS', label: 'UGC Videos' },
  { value: 'PHOTOS', label: 'Photos' },
  { value: 'RAW_FOOTAGES', label: 'Raw Footage' },
];

const FormField = ({ label, labelColor, children, required = true, action }) => (
  <Stack spacing={0.5}>
    <Stack direction="row" alignItems="center" spacing={0.5} mb={0.5}>
      <FormLabel
        required={required}
        sx={{
          fontWeight: 700,
          color: labelColor || ((theme) => (theme.palette.mode === 'light' ? 'black' : 'white')),
          fontSize: '0.875rem',
          '& .MuiFormLabel-asterisk': {
            color: '#FF3500',
          },
        }}
      >
        {label}
      </FormLabel>
      {action}
    </Stack>
    {children}
  </Stack>
);

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  labelColor: PropTypes.string,
  children: PropTypes.node.isRequired,
  required: PropTypes.bool,
  action: PropTypes.node,
};

const filter = createFilterOptions();

const getRemainingTime = (invoiceDate) => {
  const remainingDays = dayjs(invoiceDate).diff(dayjs(), 'days');
  return remainingDays;
};

const FinaliseCampaign = ({
  openBrand,
  openCompany,
  openPackage,
  onValidationChange,
  setBrandState,
  onPackageLinkSuccess,
}) => {
  const { data: admins } = useGetAdmins('active');
  const {
    data: companyData,
    isLoading: companyLoading,
    mutate: mutateCompanyList,
  } = useGetCompany();
  const { user } = useAuthContext();
  const {
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext();

  // Note: the client-campaign toggle (isV4Submission) no longer drives submissionVersion —
  // all new campaigns are v4; the toggle only controls client attachment.

  // Client and brand state
  const client = watch('client');
  const brand = getValues('campaignBrand');
  const campaignCredits = watch('campaignCredits');

  const creditSummary = useMemo(() => client?.creditSummary || null, [client]);

  const requestedCredits = Number(campaignCredits || 0);
  const availableCredits = creditSummary?.remainingCredits ?? 0;

  let creditError = false;
  let creditHelperText = '';

  if (requestedCredits > availableCredits) {
    creditError = true;
    creditHelperText = `Exceeds limit - credits available: ${availableCredits}`;
  }

  // Notify parent of credit validation status
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(creditError);
    }
  }, [creditError, onValidationChange]);

  // Open create company dialog when new client is typed
  useEffect(() => {
    if (client && client.inputValue) {
      openCompany.onTrue();
    }
  }, [client, openCompany]);

  // Open create brand dialog when new brand is typed
  useEffect(() => {
    if (brand?.inputValue) {
      openBrand.onTrue();
    }
  }, [brand, openBrand]);

  // Clear brand when switching to direct client
  useEffect(() => {
    if (client && client?.type === 'directClient') {
      setValue('campaignBrand', null, { shouldValidate: true });
    }
  }, [client, setValue]);

  const filteredCampaignManagers = useMemo(
    () =>
      admins?.filter((item) => item.role === 'CSM' || item.role === 'CSL').sort((a, b) => a.name.localeCompare(b.name)) ||
      [],
    [admins]
  );

  console.log(filteredCampaignManagers);

  return (
    <Stack spacing={3} sx={{ maxWidth: '800px', mx: 'auto', mt: 4, mb: 8 }}>
      {/* Client Selection */}
      <FormField label="Select/Create a Client">
        <RHFAutocomplete
          name="client"
          placeholder="Select or Create Client"
          options={companyData || []}
          loading={companyLoading}
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
      </FormField>

      {/* Brand Selection - only show for agency type or if client has brands */}
      {client && (client?.type === 'agency' || !!client?.brand?.length) && (
        <FormField label="Select/Create a Brand">
          <RHFAutocomplete
            name="campaignBrand"
            placeholder="Select or Create Brand"
            options={client?.brand || []}
            loading={companyLoading}
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
        </FormField>
      )}

      {/* Credit Summary Section */}
      {client &&
        (!creditSummary || !creditSummary.remainingCredits ? (
          <Box sx={{ textAlign: 'center', p: 3, bgcolor: '#F9F9F9', borderRadius: 1 }}>
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
              <Stack
                alignItems="center"
                spacing={1}
                sx={{ p: 3, bgcolor: '#FFF8E5', borderRadius: 1 }}
              >
                <Avatar
                  sx={{ bgcolor: (theme) => theme.palette.warning.light, width: 60, height: 60 }}
                >
                  <Iconify icon="pajamas:expire" width={26} />
                </Avatar>
                <Typography variant="subtitle2">Package has expired</Typography>
                <Button variant="outlined" sx={{ mt: 2 }} onClick={openPackage.onTrue}>
                  Renew package
                </Button>
              </Stack>
            ) : (
              <Stack direction={{ sm: 'column', md: 'row' }} spacing={1}>
                <Box flex={1}>
                  <FormField
                    label="Total Available Credits"
                    labelColor="text.disabled"
                    required={false}
                    action={
                      <Tooltip
                        title={`Total remaining credits from ${creditSummary.activePackagesCount} active package(s).`}
                      >
                        <Iconify
                          icon="material-symbols:info-outline-rounded"
                          color="text.secondary"
                          width={15}
                        />
                      </Tooltip>
                    }
                  >
                    <TextField
                      value={`${creditSummary.remainingCredits} UGC Credits`}
                      InputProps={{
                        disabled: true,
                      }}
                    />
                  </FormField>
                </Box>
                <Box flex={1} mt={{ xs: 1.5, sm: 0 }}>
                  <FormField label="Validity" labelColor="text.disabled" required={false}>
                    <TextField
                      value={`${getRemainingTime(creditSummary.nextExpiryDate)} days left`}
                      InputProps={{
                        disabled: true,
                      }}
                    />
                  </FormField>
                </Box>
                <Box flex={1} mt={{ xs: 1.5, sm: 0 }}>
                  <FormField label="Campaign Credits">
                    <RHFTextField
                      name="campaignCredits"
                      type="number"
                      placeholder="UGC Credits"
                      error={creditError || errors?.campaignCredits}
                      helperText={errors?.campaignCredits?.message || creditHelperText}
                    />
                  </FormField>
                </Box>
              </Stack>
            )}
          </>
        ))}

      {/* Submission Version Toggle */}
      <Stack>
        <Stack direction="row" alignItems="center" mb={-0.5}>
          <Typography
            sx={{
              fontWeight: 700,
              color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
              fontSize: '0.875rem',
              mr: 2,
            }}
          >
            Enable this as a client campaign?
          </Typography>
          <RHFSwitch name="isV4Submission" color="primary" />
        </Stack>
        <Typography variant="subtitle2" fontWeight={400} color="text.secondary">
          Enabling this option allows the selected client to manage the campaign.
        </Typography>
      </Stack>

      {/* Credit Tier Toggle */}
      <Stack>
        <Stack direction="row" alignItems="center" mb={-0.5}>
          <Typography
            sx={{
              fontWeight: 700,
              color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
              fontSize: '0.875rem',
              mr: 2,
            }}
          >
            Enable Credit Tier pricing?
          </Typography>
          <RHFSwitch name="isCreditTier" color="primary" />
        </Stack>
        <Typography variant="subtitle2" fontWeight={400} color="text.secondary">
          When enabled, creator costs are based on their follower count tier instead of flat 1
          credit per video.
        </Typography>
      </Stack>

      {/* Campaign Managers (left) and Campaign Type (right) */}
      <Stack direction="row" spacing={2}>
        <Stack flex={1}>
          <FormField label="Campaign Managers">
            <RHFAutocomplete
              name="campaignManager"
              multiple
              placeholder="Campaign Manager"
              options={filteredCampaignManagers}
              freeSolo
              isOptionEqualToValue={(option, value) => option.id === value.id}
              getOptionLabel={(option) => option.name}
              renderTags={(selected, getTagProps) =>
                selected.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    avatar={<Avatar src={option?.photoURL}>{option?.name?.slice(0, 1)}</Avatar>}
                    key={option?.id}
                    label={option?.id === user?.id ? 'Me' : option?.name}
                    size="small"
                    variant="outlined"
                    sx={{
                      border: 1,
                      borderColor: '#EBEBEB',
                      boxShadow: (theme) => `0px -3px 0px 0px #E7E7E7 inset`,
                      py: 2,
                      px: 1,
                    }}
                  />
                ))
              }
            />
          </FormField>
        </Stack>

        <Stack flex={1}>
          <FormField label="Campaign Type">
            <RHFSelectV2 name="campaignType" placeholder="Select campaign type">
              {campaignTypeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </RHFSelectV2>
          </FormField>
        </Stack>
      </Stack>

      {/* Deliverables (full width) */}
      <FormField label="Deliverables">
        <RHFMultiSelect
          name="deliverables"
          placeholder="Select deliverable(s)"
          chip
          checkbox
          options={deliverableOptions}
        />
      </FormField>

      <NdaAgreementField />

      {/* Create Brand Dialog */}
      <CreateBrand
        open={openBrand.value}
        onClose={() => {
          // Clear the invalid inputValue object when dialog is closed without creating
          const currentBrand = getValues('campaignBrand');
          if (currentBrand?.inputValue) {
            setValue('campaignBrand', null, { shouldValidate: false });
          }
          openBrand.onFalse();
        }}
        setBrand={async (newBrand) => {
          // Refresh company list to get updated brand data
          const updatedCompanyList = await mutateCompanyList();

          // Find the updated client with the new brand
          if (updatedCompanyList && client?.id) {
            const updatedClient = updatedCompanyList.find((c) => c.id === client.id);
            if (updatedClient) {
              // Update the client in form to include the new brand in its brand list
              setValue('client', updatedClient, { shouldValidate: true });
            }
          }

          // Set the newly created brand as selected
          setValue('campaignBrand', newBrand, { shouldValidate: true });
          if (setBrandState) setBrandState(newBrand);
        }}
        brandName={brand?.inputValue}
        client={client}
      />

      {/* Create Company Dialog */}
      <CreateCompany
        openCreate={openCompany.value}
        setOpenCreate={() => {
          // Clear the invalid inputValue object when dialog is closed without creating
          const currentClient = getValues('client');
          if (currentClient?.inputValue) {
            setValue('client', null, { shouldValidate: false });
          }
          openCompany.onFalse();
        }}
        set={setValue}
        isDialog
        isForCampaign
        companyName={client?.inputValue}
      />

      {/* Package Create Dialog - for linking package to existing company */}
      <PackageCreateDialog
        open={openPackage.value}
        onClose={openPackage.onFalse}
        clientId={client?.id}
        onRefresh={onPackageLinkSuccess}
      />
    </Stack>
  );
};

FinaliseCampaign.propTypes = {
  openBrand: PropTypes.object,
  openCompany: PropTypes.object,
  openPackage: PropTypes.object,
  onValidationChange: PropTypes.func,
  setBrandState: PropTypes.func,
  onPackageLinkSuccess: PropTypes.func,
};

export default memo(FinaliseCampaign);
