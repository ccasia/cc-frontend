import PropTypes from 'prop-types';
import { Page, pdfjs, Document } from 'react-pdf';
import { useFieldArray, useFormContext } from 'react-hook-form';
import React, { memo, lazy, useMemo, useState, useEffect, useCallback } from 'react';

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
  MenuItem,
  FormLabel,
  IconButton,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import { useGetTemplate } from 'src/hooks/use-get-template';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import {
  RHFUpload,
  RHFSwitch,
  RHFSelectV2,
  RHFTextField,
  RHFMultiSelect,
  RHFAutocomplete,
} from 'src/components/hook-form';

import { useGetAdmins } from '../hooks/get-am';

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

const FormField = ({ label, children, required = true }) => (
  <Stack spacing={0.5}>
    <FormLabel
      required={required}
      sx={{
        fontWeight: 700,
        color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
        fontSize: '0.875rem',
        mb: 0.5,
        '& .MuiFormLabel-asterisk': {
          color: '#FF3500',
        },
      }}
    >
      {label}
    </FormLabel>
    {children}
  </Stack>
);

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  required: PropTypes.bool,
};

const PDFEditor = lazy(() => import('../pdf-editor'));

const FinaliseCampaign = () => {
  // Loading state for template dialog document loading
  const { data: admins } = useGetAdmins('active');
  const { user } = useAuthContext();
  const { control, watch, setValue } = useFormContext();
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

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'referencesLinks',
  });

  const filteredCampaignManagers = useMemo(
    () =>
      admins
        ?.filter((item) => item.role === 'CSM')
        .sort((a, b) => a.name.localeCompare(b.name)) || [],
    [admins]
  );

  const images = watch('campaignImages');

  const handleDropCampaignImages = useCallback(
    (acceptedFiles) => {
      const files = images || [];

      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      setValue('campaignImages', [...files, ...newFiles], { shouldValidate: true });
    },
    [setValue, images]
  );

  const handleDropOtherAttachments = useCallback(
    (acceptedFiles) => {
      const files = watch('otherAttachments') || [];

      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      setValue('otherAttachments', [...files, ...newFiles]);
    },
    [setValue, watch]
  );

  return (
    <Stack spacing={3} sx={{ maxWidth: '800px', mx: 'auto', mt: 4 }}>
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

      <Stack direction="row" spacing={2}>
        {/* Left grid */}
        <Stack flex={1} spacing={2}>
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

        {/* Right grid */}
        <Stack flex={1} spacing={2}>
          <FormField label="Deliverables">
            <RHFMultiSelect
              name="deliverables"
              placeholder="Select deliverable(s)"
              chip
              checkbox
              options={deliverableOptions}
            />
          </FormField>

          <FormField label="References (Optional)" required={false}>
            <Stack direction="column" spacing={1}>
              {fields.map((field, index) => {
                const fieldName = `referencesLinks.${index}.value`;
                return (
                  <Stack alignItems="center" direction="row" spacing={1} key={field.id}>
                    <RHFTextField name={fieldName} placeholder="Insert References Link" />
                    {/* Trash button for all fields except the first one */}
                    {index !== 0 && (
                      <IconButton color="error" onClick={() => remove(index)}>
                        <Iconify icon="mdi:trash-outline" />
                      </IconButton>
                    )}
                  </Stack>
                );
              })}
              <Button onClick={() => append({ value: '' })} variant="outlined">
                Add link
              </Button>
            </Stack>
          </FormField>
        </Stack>
      </Stack>

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

      <Stack direction="row" spacing={2}>
        <Box
          sx={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
              fontSize: '0.875rem',
              mb: 1,
            }}
          >
            Campaign Cover Photo <span style={{ color: '#FF3500' }}>*</span>
          </Typography>

          <RHFUpload
            multiple
            thumbnail
            type="file"
            name="campaignImages"
            maxSize={3145728}
            onDrop={handleDropCampaignImages}
            onRemove={(inputFile) =>
              setValue('campaignImages', images && images?.filter((file) => file !== inputFile), {
                shouldValidate: true,
              })
            }
            onRemoveAll={() => setValue('campaignImages', [], { shouldValidate: true })}
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
              fontSize: '0.875rem',
              mb: 1,
            }}
          >
            Attachments (Optional)
          </Typography>
          <RHFUpload
            name="otherAttachments"
            multiple
            type="doc"
            onDrop={handleDropOtherAttachments}
            onRemove={(inputFile) =>
              setValue(
                'otherAttachments',
                watch('otherAttachments') &&
                  watch('otherAttachments')?.filter((file) => file !== inputFile),
                { shouldValidate: true }
              )
            }
            onRemoveAll={() => setValue('otherAttachments', [], { shouldValidate: true })}
          />
        </Box>
      </Stack>

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
    </Stack>
  );
};

export default memo(FinaliseCampaign);
