import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';
import { Page, pdfjs, Document } from 'react-pdf';
import React, { memo, lazy, useMemo, useState, useEffect } from 'react';

// Loading spinner
import CircularProgress from '@mui/material/CircularProgress';
import {
  Box,
  Chip,
  Stack,
  Radio,
  Paper,
  Alert,
  Avatar,
  Button,
  Dialog,
  Tooltip,
  MenuItem,
  FormLabel,
  TextField,
  Typography,
  DialogTitle,
  ListItemText,
  DialogContent,
  DialogActions,
  createFilterOptions,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import useGetCompany from 'src/hooks/use-get-company';
import { useResponsive } from 'src/hooks/use-responsive';
import { useGetTemplate } from 'src/hooks/use-get-template';

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
import PackageCreateDialog from '../../../packages/package-dialog';
import CreateCompany from '../../../brand/create/brandForms/FirstForms/create-company';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.mjs`;

// Campaign type options (matching activate-campaign-dialog.jsx)
const campaignTypeOptions = [
  { value: 'normal', label: 'UGC (With Posting)' },
  { value: 'ugc', label: 'UGC (No Posting)' },
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

const PDFEditor = lazy(() => import('../pdf-editor'));

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
  const { data: companyData, isLoading: companyLoading, mutate: mutateCompanyList } = useGetCompany();
  const { user } = useAuthContext();
  const { watch, setValue, getValues, formState: { errors } } = useFormContext();
  const lgUp = useResponsive('up', 'lg');

  const isV4Submission = watch('isV4Submission');
  useEffect(() => {
    setValue('submissionVersion', isV4Submission ? 'v4' : 'v2');
  }, [isV4Submission, setValue]);

  // Template dialog state
  const templateModal = useBoolean();
  const [pages, setPages] = useState(0);

  // Agreement templates via SWR hook
  const { data: agreementTemplates = [], mutate: mutateTemplates } = useGetTemplate(user?.id);

  const pdfModal = useBoolean();

  // Use agreementFrom from form state for selection
  const currentAgreement = watch('agreementFrom');

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

  // Auto-select first template if none selected and templates exist
  useEffect(() => {
    if (
      agreementTemplates?.template?.length > 0 &&
      (!currentAgreement || !currentAgreement.id)
    ) {
      setValue('agreementFrom', agreementTemplates.template[0], { shouldValidate: true });
    }
  }, [agreementTemplates, currentAgreement, setValue]);

  // Handle template selection
  const onSelectTemplate = (template) => {
    setValue('agreementFrom', template, { shouldValidate: true });
    templateModal.onFalse();
  };

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
      admins
        ?.filter((item) => item.role === 'CSM')
        .sort((a, b) => a.name.localeCompare(b.name)) || [],
    [admins]
  );

  console.log(filteredCampaignManagers)

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
              <Stack alignItems="center" spacing={1} sx={{ p: 3, bgcolor: '#FFF8E5', borderRadius: 1 }}>
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
              <Stack
                direction={{ sm: 'column', md: 'row' }}
                spacing={1}
              >
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
                <Box flex={1}>
                  <FormField label="Validity" labelColor="text.disabled" required={false}>
                    <TextField
                      value={`${getRemainingTime(creditSummary.nextExpiryDate)} days left`}
                      InputProps={{
                        disabled: true,
                      }}
                    />
                  </FormField>
                </Box>
                <Box flex={1}>
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

      {/* Agreement Template */}
      <FormField label="Agreement Template">
        {agreementTemplates?.template?.length < 1 ? (
          <Stack spacing={2} alignItems="center">
            <Alert severity="warning" variant="outlined" sx={{ width: '100%' }}
              action={
                <Button color="inherit" size="small" onClick={() => mutateTemplates()}>
                  Refresh
                </Button>
              }
            >
              Template Not found
            </Alert>
            <Button
              size="medium"
              variant="contained"
              sx={{ width: '100%' }}
              onClick={pdfModal.onTrue}
              startIcon={<Iconify icon="icon-park-outline:agreement" width={20} />}
            >
              Create new agreement template
            </Button>
          </Stack>
        ) : (
          <Stack spacing={1}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1, bgcolor: '#F5F5F5' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Iconify
                  icon="mdi:file-document-check"
                  width={32}
                  height={32}
                  color="success.main"
                />
                <Stack flex={1}>
                  <Typography variant="subtitle2">
                    {currentAgreement?.adminName || agreementTemplates?.template?.[0]?.adminName || 'Agreement Template'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Template selected
                  </Typography>
                </Stack>
                <Button
                  size="small"
                  variant="text"
                  onClick={templateModal.onTrue}
                  sx={{ color: 'primary.main' }}
                >
                  Change
                </Button>
              </Stack>
            </Paper>
            <Button
              size="medium"
              variant="contained"
              sx={{ width: '100%' }}
              onClick={pdfModal.onTrue}
              startIcon={<Iconify icon="icon-park-outline:agreement" width={20} />}
            >
              Create new agreement template
            </Button>
          </Stack>
        )}
      </FormField>

      {/* Template Selection Dialog */}
      <Dialog open={templateModal.value} fullWidth maxWidth="md" onClose={templateModal.onFalse}>
        <DialogTitle>
          <Typography variant="h5" sx={{ fontFamily: 'Instrument Serif', mb: 0.5 }}>
            Select Agreement Template
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose one template to use for this campaign
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(1, 1fr)',
                md: 'repeat(2, 1fr)',
              },
              gap: 2,
              justifyItems: 'center',
              alignItems: 'center',
              py: 2,
            }}
          >
            {agreementTemplates.template?.length > 0 &&
              agreementTemplates.template.map((t) => {
                const isSelected = currentAgreement?.id === t?.id;
                return (
                  <Box
                    key={t?.id}
                    sx={{
                      border: isSelected ? '3px solid #1340ff' : '1px solid #e0e0e0',
                      borderRadius: 2,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease-in-out',
                      position: 'relative',
                      height: 400,
                      width: '100%',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)',
                      },
                    }}
                    onClick={() => onSelectTemplate(t)}
                  >
                    <Radio
                      checked={isSelected}
                      onChange={() => onSelectTemplate(t)}
                      value={t?.id}
                      name="template-selection"
                      sx={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        zIndex: 100,
                      }}
                    />

                    <Box
                      sx={{ width: '100%', height: '100%', overflow: 'auto', scrollbarWidth: 'none' }}
                    >
                      <Document
                        file={t?.url}
                        loading={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}><CircularProgress size={24} /><Typography sx={{ ml: 2 }}>Loading document...</Typography></Box>}
                        onLoadSuccess={({ numPages }) => {
                          setPages(numPages);
                        }}
                      >
                        <Stack spacing={1}>
                          {Array.from({ length: pages }, (_, index) => (
                            <Page
                              key={index}
                              pageIndex={index}
                              renderTextLayer={false}
                              pageNumber={index + 1}
                              scale={1}
                              width={lgUp ? 400 : 300}
                            />
                          ))}
                        </Stack>
                      </Document>
                    </Box>
                  </Box>
                );
              })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={templateModal.onFalse}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <PDFEditor
        open={pdfModal.value}
        onClose={() => {
          pdfModal.onFalse();
        }}
        user={user}
        setAgreementForm={setValue}
        onTemplateCreated={async (newTemplate) => {
          await mutateTemplates();
          if (newTemplate) setValue('agreementFrom', newTemplate, { shouldValidate: true });
        }}
      />

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
