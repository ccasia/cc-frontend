import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { keyframes } from '@emotion/react';
import { useFormContext } from 'react-hook-form';
import React, { memo, useRef, useMemo, useEffect } from 'react';

import {
  Box,
  Chip,
  Stack,
  Avatar,
  Button,
  Switch,
  Tooltip,
  MenuItem,
  FormLabel,
  TextField,
  Typography,
  ListItemText,
  FormControlLabel,
  createFilterOptions,
} from '@mui/material';

import useGetCompany from 'src/hooks/use-get-company';

import { isClientManager } from 'src/utils/campaign-flow';

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
import { getCreditLimitError } from '../utils/campaign-credits';
import PackageCreateDialog from '../../../packages/package-dialog';
import { useCampaignCreateStore } from '../store/use-campaign-create-store';
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

// Short shake drawing the eye to the package button each time Next is blocked by it
const packageNudge = keyframes`
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
`;

// Active client users belonging to the given company (from the /user/admins list)
const getCompanyClientUsers = (admins, companyId) =>
  companyId
    ? (admins || []).filter(
        (item) => isClientManager(item) && item.client?.company?.id === companyId
      )
    : [];

const getRemainingTime = (invoiceDate) => {
  const remainingDays = dayjs(invoiceDate).diff(dayjs(), 'days');
  return remainingDays;
};

const FinaliseCampaign = ({
  openBrand,
  openCompany,
  openPackage,
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
    trigger,
    setValue,
    getValues,
    getFieldState,
    formState: { errors },
  } = useFormContext();

  // Note: the client-campaign toggle (isV4Submission) no longer drives submissionVersion —
  // all new campaigns are v4; the toggle only controls client attachment.

  // Client and brand state
  const client = watch('client');
  const brand = getValues('campaignBrand');
  const campaignCredits = watch('campaignCredits');
  const isClientCampaign = watch('isV4Submission');

  const creditSummary = useMemo(() => client?.creditSummary || null, [client]);

  const creditHelperText = getCreditLimitError(client, campaignCredits);
  const creditError = Boolean(creditHelperText);
  // Without a usable package the credits field isn't shown, so its error (set when Next is
  // pressed) would be invisible — show it on the package prompt instead
  const packageError = Boolean(errors?.campaignCredits);

  // Every blocked Next press scrolls the package prompt into view and replays the nudge
  const failedNextCount = useCampaignCreateStore((s) => s.failedNextCount);
  const packagePromptRef = useRef(null);
  useEffect(() => {
    if (!failedNextCount || !packageError) return;
    packagePromptRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [failedNextCount, packageError]);
  const packageButtonSx = {
    mt: 2,
    ...(packageError && { animation: `${packageNudge} 0.45s ease-in-out` }),
  };

  const syncClientManagers = (companyId, clientCampaign) => {
    if (!admins) return;
    const companyClients = clientCampaign ? getCompanyClientUsers(admins, companyId) : [];
    const companyClientIds = companyClients.map((c) => c.id);
    const current = getValues('campaignManager') || [];
    const kept = current.filter((m) => !isClientManager(m) || companyClientIds.includes(m.id));
    const keptIds = kept.map((m) => m.id);
    const next = [...kept, ...companyClients.filter((c) => !keptIds.includes(c.id))];

    if (kept.length !== current.length || next.length !== kept.length) {
      setValue('campaignManager', next, { shouldDirty: true, shouldValidate: true });
    } else if (getFieldState('campaignManager').error) {
      // The client-manager rule depends on the toggle, so re-check to clear a stale error
      trigger('campaignManager');
    }
  };

  const handleClientCampaignToggle = (event) => {
    const { checked } = event.target;
    setValue('isV4Submission', checked, { shouldDirty: true });
    syncClientManagers(getValues('client')?.id, checked);
  };

  // Run on the admin's pick only — not on autosave restore / activate prefill (reset)
  const handleClientChange = (event, value) => {
    // A brand belongs to its client, so drop it whenever the client changes
    if (value?.id !== getValues('client')?.id) {
      setValue('campaignBrand', null, { shouldValidate: true });
    }
    setValue('client', value, { shouldValidate: true });
    syncClientManagers(value?.id, getValues('isV4Submission'));
    if (value?.inputValue) openCompany.onTrue();
  };

  const handleBrandChange = (event, value) => {
    setValue('campaignBrand', value, { shouldValidate: true });
    if (value?.inputValue) openBrand.onTrue();
  };

  // Client users of the selected client company — only these can manage a client campaign
  const companyClientManagers = useMemo(
    () => getCompanyClientUsers(admins, client?.id),
    [admins, client?.id]
  );

  // Client users first on a client campaign, then CSM/CSL staff — each group A–Z
  const filteredCampaignManagers = useMemo(() => {
    const byName = (a, b) => a.name.localeCompare(b.name);
    const staff = (admins || [])
      .filter((item) => item.role === 'CSM' || item.role === 'CSL')
      .sort(byName);
    return isClientCampaign ? [...[...companyClientManagers].sort(byName), ...staff] : staff;
  }, [admins, isClientCampaign, companyClientManagers]);

  // Warn up front — no client user can be picked, so the client-manager rule can't be met
  let managerHelperText;
  if (isClientCampaign && client?.id && !companyClientManagers.length) {
    managerHelperText =
      'This client has no user accounts yet. Invite a client user before enabling client campaign.';
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: '800px', mx: 'auto', mt: 4, mb: 8 }}>
      {/* Client Selection */}
      <FormField label="Select/Create a Client">
        <RHFAutocomplete
          name="client"
          placeholder="Select or Create Client"
          options={companyData || []}
          loading={companyLoading}
          onChange={handleClientChange}
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
            onChange={handleBrandChange}
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
          <Box
            ref={packagePromptRef}
            sx={{
              textAlign: 'center',
              p: 3,
              bgcolor: '#F9F9F9',
              borderRadius: 1,
              border: 1,
              borderColor: packageError ? 'error.main' : 'transparent',
            }}
          >
            <Typography variant="subtitle1" color="text.secondary">
              No active package found
            </Typography>
            <Button
              // New key per blocked Next press, so the nudge animation plays again
              key={failedNextCount}
              variant={packageError ? 'contained' : 'outlined'}
              color={packageError ? 'error' : 'primary'}
              sx={packageButtonSx}
              onClick={openPackage.onTrue}
            >
              Link a package
            </Button>
            {packageError && (
              <Typography variant="caption" color="error" component="p" sx={{ mt: 1 }}>
                Link a package to set campaign credits before continuing.
              </Typography>
            )}
          </Box>
        ) : (
          <>
            {dayjs(creditSummary.nextExpiryDate).isBefore(dayjs(), 'date') ? (
              <Stack
                ref={packagePromptRef}
                alignItems="center"
                spacing={1}
                sx={{
                  p: 3,
                  bgcolor: '#FFF8E5',
                  borderRadius: 1,
                  border: 1,
                  borderColor: packageError ? 'error.main' : 'transparent',
                }}
              >
                <Avatar
                  sx={{ bgcolor: (theme) => theme.palette.warning.light, width: 60, height: 60 }}
                >
                  <Iconify icon="pajamas:expire" width={26} />
                </Avatar>
                <Typography variant="subtitle2">Package has expired</Typography>
                <Button
                  key={failedNextCount}
                  variant={packageError ? 'contained' : 'outlined'}
                  color={packageError ? 'error' : 'primary'}
                  sx={packageButtonSx}
                  onClick={openPackage.onTrue}
                >
                  Renew package
                </Button>
                {packageError && (
                  <Typography variant="caption" color="error">
                    Renew the package to set campaign credits before continuing.
                  </Typography>
                )}
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
          {/* Plain Switch (not RHFSwitch) so turning it on can fill in the client managers */}
          <FormControlLabel
            control={
              <Switch
                checked={!!isClientCampaign}
                onChange={handleClientCampaignToggle}
                color="primary"
              />
            }
          />
        </Stack>
        <Typography variant="subtitle2" fontWeight={400} color="text.secondary">
          Enabling this option allows the selected client to manage the campaign.
        </Typography>
        {!isClientCampaign && companyClientManagers.length > 0 && (
          <Typography variant="subtitle2" fontWeight={400} sx={{ color: 'warning.dark', mt: 0.5 }}>
            {client?.name} has {companyClientManagers.length} client account
            {companyClientManagers.length === 1 ? '' : 's'}. With this off, creators you
            shortlist are approved without client review.
          </Typography>
        )}
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
              helperText={managerHelperText}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              getOptionLabel={(option) =>
                isClientManager(option) ? `${option.name} (Client)` : option.name
              }
              renderTags={(selected, getTagProps) =>
                selected.map((option, index) => {
                  const isClient = isClientManager(option);
                  return (
                    <Chip
                      {...getTagProps({ index })}
                      avatar={<Avatar src={option?.photoURL}>{option?.name?.slice(0, 1)}</Avatar>}
                      key={option?.id}
                      label={
                        option?.id === user?.id
                          ? 'Me'
                          : `${option?.name}${isClient ? ' (Client)' : ''}`
                      }
                      size="small"
                      variant="outlined"
                      sx={{
                        border: 1,
                        borderColor: isClient ? '#1340FF' : '#EBEBEB',
                        boxShadow: (theme) => `0px -3px 0px 0px #E7E7E7 inset`,
                        py: 2,
                        px: 1,
                        ...(isClient && { bgcolor: 'rgba(19, 64, 255, 0.08)' }),
                      }}
                    />
                  );
                })
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
  setBrandState: PropTypes.func,
  onPackageLinkSuccess: PropTypes.func,
};

export default memo(FinaliseCampaign);
