import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRef, useMemo, useState, useEffect } from 'react';

import {
  Box,
  Chip,
  Stack,
  Avatar,
  Dialog,
  Button,
  Switch,
  Typography,
  DialogContent,
} from '@mui/material';

import useGetClients from 'src/hooks/use-get-clients';

import axiosInstance, { endpoints } from 'src/utils/axios';
import {
  isCsManager,
  isClientManager,
  campaignHasClient,
  CS_MANAGER_REQUIRED_MESSAGE,
} from 'src/utils/campaign-flow';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFSwitch, RHFAutocomplete } from 'src/components/hook-form';

import FormField from './components/form-field';
import { useGetAdmins } from '../../create/hooks/get-am';
import NdaAgreementField from '../../create/nda-agreement-field';
import useChipMotion from '../../create/components/use-chip-motion';
import { BLUE, SettingNote } from '../../create/components/option-card';
import { FIELD_HEIGHT, helperTextSx } from '../../create/components/field-styles';
import ChipSelect, { tagSx, CloseGlyph, menuPaperSx } from '../../create/components/chip-select';

const sectionBreakSx = {
  height: '1px',
  flexShrink: 0,
  bgcolor: '#E0E0E0',
  my: '-8px',
};

// Campaign types and deliverables (matching activate-campaign-dialog.jsx)
const CAMPAIGN_TYPES = {
  normal: 'UGC (With Posting)',
  ugc: 'UGC (No Posting)',
  seedingCampaign: 'Seeding Campaign',
};
const CAMPAIGN_TYPE_OPTIONS = Object.keys(CAMPAIGN_TYPES);
const campaignTypeTitle = (value) => CAMPAIGN_TYPES[value] ?? value;

const DELIVERABLES = {
  UGC_VIDEOS: 'UGC Videos',
  PHOTOS: 'Photos',
  RAW_FOOTAGES: 'Raw Footage',
};
const DELIVERABLE_OPTIONS = Object.keys(DELIVERABLES);
const deliverableTitle = (value) =>
  DELIVERABLES[value] ?? { ADS: 'Ads', CROSS_POSTING: 'Cross Posting' }[value] ?? value;

const optionLeadSx = {
  width: 24,
  height: 24,
  mr: 1.25,
  flexShrink: 0,
  borderRadius: '50%',
  fontSize: 12,
  fontWeight: 600,
  bgcolor: '#EBEBEB',
  color: '#636366',
};

const optionNameSx = {
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const chipAvatarSx = {
  width: '20px !important',
  height: '20px !important',
  ml: '5px !important',
  fontSize: '11px !important',
  '&.MuiAvatar-colorDefault': { bgcolor: '#EBEBEB', color: '#636366 !important' },
};

const clientBadgeSx = {
  flexShrink: 0,
  px: 0.75,
  borderRadius: '4px',
  bgcolor: '#EEF2FF',
  color: BLUE,
  fontSize: 11,
  fontWeight: 600,
  lineHeight: '18px',
};

const managerLabelSx = {
  '& .MuiChip-label': { display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 },
};

const managersPaperSx = {
  ...menuPaperSx,
  '& .MuiAutocomplete-groupLabel': {
    px: 1,
    lineHeight: '28px',
    fontSize: 12,
    fontWeight: 600,
    color: '#8E8E93',
    bgcolor: '#FFFFFF',
  },
  '& .MuiAutocomplete-groupUl .MuiAutocomplete-option': { pl: 1 },
  '& .MuiAutocomplete-listbox > li + li': { mt: 0.5 },
};

// The create step's ToggleRow look, with room for a locked switch
const SettingRow = ({ title, description, control, disabled = false, children }) => (
  <Box>
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '0.875rem',
            lineHeight: '22px',
            color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
            ...(disabled && { opacity: 0.6 }),
          }}
        >
          {title}
        </Typography>
        {description && (
          <Typography sx={{ fontSize: 13, lineHeight: '18px', color: '#8E8E93' }}>
            {description}
          </Typography>
        )}
      </Box>
      <Box sx={{ my: -0.75, mr: -1, flexShrink: 0 }}>{control}</Box>
    </Stack>
    {children && <Box sx={{ pt: 1 }}>{children}</Box>}
  </Box>
);

SettingRow.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.node,
  control: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
  children: PropTypes.node,
};

// Validation schema
const UpdateFinaliseCampaignSchema = Yup.object().shape({
  campaignManager: Yup.array()
    .min(1, 'At least one campaign manager is required')
    .test(
      'client-manager',
      'Client campaigns need at least one client user as a campaign manager.',
      (managers, ctx) => !ctx.parent.isV4Submission || (managers || []).some(isClientManager)
    )
    .test('cs-manager', CS_MANAGER_REQUIRED_MESSAGE, (managers) =>
      (managers || []).some(isCsManager)
    ),
  campaignType: Yup.string().required('Campaign type is required'),
  deliverables: Yup.array().min(1, 'At least one deliverable is required'),
  isNdaRequired: Yup.boolean(),
});

const UpdateFinaliseCampaign = ({ campaign, campaignMutate, formId, onFormStateChange }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();
  const { data: admins } = useGetAdmins('active');

  const companyId = campaign?.company?.id || campaign?.brand?.company?.id;
  const companyName = campaign?.company?.name || campaign?.brand?.company?.name || 'This company';

  // Fetch clients for this company using the new hook
  const { clients: campaignClients, isLoading: clientsLoading } = useGetClients(companyId);

  // Warning dialog state for v4 submission toggle
  const [v4WarningOpen, setV4WarningOpen] = useState(false);
  const [pendingV4Value, setPendingV4Value] = useState(null);

  // Get existing campaign managers from campaignAdmin (includes both CSM and Client users)
  const existingManagers = useMemo(() => {
    if (!campaign?.campaignAdmin) return [];
    return campaign.campaignAdmin
      .filter(
        (ca) =>
          ca.admin?.role?.name === 'CSM' ||
          ca.admin?.role?.name === 'CSL' ||
          ca.admin?.role?.name === 'Client' ||
          ca.admin?.user?.role === 'client'
      )
      .map((ca) => ({
        id: ca.admin?.userId,
        name: ca.admin?.user?.name || ca.admin?.name,
        photoURL: ca.admin?.user?.photoURL,
        role: ca.admin?.role?.name || ca.admin?.user.role,
      }));
  }, [campaign?.campaignAdmin]);

  // UGC_VIDEOS is the default/base deliverable
  const existingDeliverables = useMemo(() => {
    const delivs = ['UGC_VIDEOS']; // UGC_VIDEOS is always included as the base
    if (campaign?.rawFootage) delivs.push('RAW_FOOTAGES');
    if (campaign?.photos) delivs.push('PHOTOS');
    if (campaign?.ads) delivs.push('ADS');
    if (campaign?.crossPosting) delivs.push('CROSS_POSTING');
    return delivs;
  }, [campaign?.rawFootage, campaign?.photos, campaign?.ads, campaign?.crossPosting]);

  const defaultValues = useMemo(
    () => ({
      campaignManager: existingManagers,
      campaignType: campaign?.campaignType || 'normal',
      deliverables: existingDeliverables,
      // Reflects client attachment, not the (immutable) submissionVersion
      isV4Submission: campaignHasClient(campaign),
      isCreditTier: campaign?.isCreditTier || false,
      isNdaRequired: !!campaign?.isNdaRequired,
    }),
    [existingManagers, campaign, existingDeliverables]
  );

  const methods = useForm({
    resolver: yupResolver(UpdateFinaliseCampaignSchema),
    defaultValues,
    mode: 'onChange',
  });

  const {
    handleSubmit,
    reset,
    watch,
    trigger,
    setValue,
    getFieldState,
    formState: { isSubmitting, isDirty },
  } = methods;

  useEffect(() => {
    onFormStateChange?.({ isDirty, isSubmitting });
  }, [isDirty, isSubmitting, onFormStateChange]);

  const isV4Submission = watch('isV4Submission');
  const currentManagers = watch('campaignManager');

  const managersRef = useRef(null);
  const withManagerGhosts = useChipMotion(managersRef, currentManagers || [], (m) => m?.id ?? m);

  // Client users of this campaign's company first on a client campaign, then CSM/CSL staff —
  // each group A–Z
  const managerOptions = useMemo(() => {
    const byName = (a, b) => (a.name || '').localeCompare(b.name || '');
    const staff = (admins || [])
      .filter((item) => item.role === 'CSM' || item.role === 'CSL')
      .sort(byName);
    return isV4Submission ? [...[...campaignClients].sort(byName), ...staff] : staff;
  }, [admins, campaignClients, isV4Submission]);

  // Warn up front — no client user can be picked, so the client-manager rule can't be met
  const managerHelperText =
    isV4Submission && !clientsLoading && !campaignClients.length
      ? 'This client has no user accounts yet. Invite a client user before enabling client campaign.'
      : undefined;

  let clientCampaignDescription = 'Legacy campaign — client involvement cannot be changed here.';
  if (campaign?.submissionVersion === 'v4') {
    clientCampaignDescription = isV4Submission
      ? 'Client users are attached as campaign managers and review approvals. Disabling removes them.'
      : "Enabling this attaches the campaign's client users as managers — approvals will route through them.";
  }

  // Handle v4 toggle change with warning dialog
  const handleV4ToggleChange = (event) => {
    const newValue = event.target.checked;
    // Show warning for both enabling and disabling
    setPendingV4Value(newValue);
    setV4WarningOpen(true);
  };

  const handleV4WarningConfirm = () => {
    const newValue = pendingV4Value;
    setValue('isV4Submission', newValue, { shouldDirty: true });

    if (newValue) {
      // Enabling v4: Add all client users to campaign managers
      const currentManagerIds = currentManagers?.map((m) => m.id) || [];
      const clientsToAdd = campaignClients.filter((c) => !currentManagerIds.includes(c.id));
      if (clientsToAdd.length > 0) {
        setValue('campaignManager', [...(currentManagers || []), ...clientsToAdd], {
          shouldDirty: true,
        });
      }
    } else {
      // Disabling v4: Remove all client users from campaign managers
      const nonClientManagers = (currentManagers || []).filter(
        (m) => m.role !== 'Client' && m.role !== 'client'
      );
      setValue('campaignManager', nonClientManagers, { shouldDirty: true });
    }

    // The client-manager rule depends on the toggle, so re-check to clear a stale error
    if (getFieldState('campaignManager').error) trigger('campaignManager');

    setV4WarningOpen(false);
    setPendingV4Value(null);
  };

  const handleV4WarningCancel = () => {
    setV4WarningOpen(false);
    setPendingV4Value(null);
  };

  // Reset form only when the campaign ID changes (new campaign loaded)
  useEffect(() => {
    if (campaign?.id) {
      reset(defaultValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign?.id]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await axiosInstance.patch(endpoints.campaign.editCampaignFinalise, {
        campaignId: campaign?.id,
        campaignManagers: data.campaignManager,
        campaignType: data.campaignType,
        deliverables: data.deliverables,
        isCreditTier: data.isCreditTier,
        isNdaRequired: data.isNdaRequired,
        isClientCampaign: !!data.isV4Submission,
      });

      enqueueSnackbar('Campaign finalise settings updated successfully');
      campaignMutate();
    } catch (error) {
      console.error('Error updating campaign finalise settings:', error);
      enqueueSnackbar(error?.message || 'Failed to update campaign', { variant: 'error' });
    }
  });

  return (
    <FormProvider id={formId} methods={methods} onSubmit={onSubmit}>
      <Stack spacing={3} sx={{ maxWidth: 800, ...helperTextSx }}>
        <Stack spacing={2}>
          <SettingRow
            title="Client campaign"
            disabled={campaign?.submissionVersion !== 'v4'}
            description={clientCampaignDescription}
            control={
              <Switch
                checked={isV4Submission || false}
                onChange={handleV4ToggleChange}
                color="primary"
                disabled={campaign?.submissionVersion !== 'v4'}
              />
            }
          >
            {campaign?.submissionVersion === 'v4' &&
              !isV4Submission &&
              campaignClients.length > 0 && (
                <SettingNote
                  title={`${companyName} has ${campaignClients.length} client account${
                    campaignClients.length === 1 ? '' : 's'
                  }.`}
                >
                  With this off, creators you shortlist are approved without client review.
                </SettingNote>
              )}
          </SettingRow>

          <SettingRow
            title="Credit tier pricing"
            disabled={!!campaign?.isCreditTier}
            description={
              campaign?.isCreditTier
                ? 'Credit tier pricing is enabled for this campaign and cannot be disabled.'
                : 'When enabled, creator costs are based on their follower count tier instead of flat 1 credit per video.'
            }
            control={
              <RHFSwitch
                name="isCreditTier"
                label=""
                color="primary"
                disabled={!!campaign?.isCreditTier}
                sx={{
                  m: 0,
                  ...(campaign?.isCreditTier && {
                    cursor: 'not-allowed',
                    '& .MuiSwitch-switchBase.Mui-disabled': {
                      cursor: 'not-allowed',
                      pointerEvents: 'auto',
                    },
                    '& .MuiSwitch-track': {
                      cursor: 'not-allowed',
                    },
                  }),
                }}
              />
            }
          />
        </Stack>

        <Box aria-hidden sx={sectionBreakSx} />

        <FormField
          required
          label="Campaign Managers"
          hint="Who runs this campaign. Include at least one CSM or CSL."
        >
          <Box ref={managersRef}>
            <RHFAutocomplete
              name="campaignManager"
              multiple
              placeholder={currentManagers?.length ? '' : 'Add managers'}
              options={managerOptions}
              freeSolo
              disableCloseOnSelect
              helperText={managerHelperText}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              getOptionLabel={(option) =>
                isClientManager(option) ? `${option.name || ''} (Client)` : option.name || ''
              }
              groupBy={
                isV4Submission
                  ? (option) => (isClientManager(option) ? 'Client users' : 'Cult Creative team')
                  : undefined
              }
              slotProps={{
                paper: { sx: managersPaperSx },
                popper: { placement: 'bottom-start', sx: { minWidth: 300 } },
              }}
              renderOption={({ key, ...props }, option, { selected }) => (
                <li key={option?.id ?? key} {...props}>
                  <Avatar src={option?.photoURL} alt={option?.name} sx={optionLeadSx}>
                    {option?.name?.charAt(0)}
                  </Avatar>
                  <Box component="span" sx={optionNameSx}>
                    {option?.name}
                    {option?.id === user?.id && (
                      <Box component="span" sx={{ color: '#8E8E93', fontWeight: 400 }}>
                        {' '}
                        (you)
                      </Box>
                    )}
                  </Box>
                  {selected && (
                    <Iconify
                      icon="eva:checkmark-fill"
                      width={16}
                      sx={{ ml: 1, color: BLUE, flexShrink: 0 }}
                    />
                  )}
                </li>
              )}
              renderTags={(selected, getTagProps) => {
                const renderChip = (option, key, chipProps) => (
                  <Chip
                    key={key}
                    {...chipProps}
                    avatar={
                      <Avatar src={option?.photoURL} alt={option?.name} sx={chipAvatarSx}>
                        {option?.name?.charAt(0)}
                      </Avatar>
                    }
                    label={
                      <>
                        <Box component="span" sx={optionNameSx}>
                          {option?.name}
                          {option?.id === user?.id && (
                            <Box component="span" sx={{ color: '#8E8E93' }}>
                              {' '}
                              (you)
                            </Box>
                          )}
                        </Box>
                        {isClientManager(option) && (
                          <Box component="span" sx={clientBadgeSx}>
                            Client
                          </Box>
                        )}
                      </>
                    }
                    deleteIcon={<CloseGlyph aria-label={`Remove ${option?.name}`} />}
                    sx={{ ...tagSx, ...managerLabelSx, borderRadius: '8px', maxWidth: 1 }}
                  />
                );
                return withManagerGhosts(
                  selected.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return renderChip(option, option?.id ?? key, {
                      ...tagProps,
                      'data-chip': option?.id ?? option,
                    });
                  }),
                  (option) =>
                    renderChip(option, `ghost-${option?.id ?? option}`, {
                      'aria-hidden': true,
                      tabIndex: -1,
                      'data-chip-ghost': true,
                      onDelete: () => {},
                      style: { pointerEvents: 'none' },
                    })
                );
              }}
              sx={{
                '& .MuiOutlinedInput-root': { minHeight: FIELD_HEIGHT, py: '6px', gap: 0.75 },
                '& .MuiAutocomplete-tag': { m: 0 },
              }}
            />
          </Box>
        </FormField>

        <FormField required label="Campaign Type">
          <ChipSelect
            single
            name="campaignType"
            options={CAMPAIGN_TYPE_OPTIONS}
            getTitle={campaignTypeTitle}
            placeholder="Select campaign type"
          />
        </FormField>

        <FormField required label="Additional Deliverables">
          <ChipSelect
            name="deliverables"
            options={DELIVERABLE_OPTIONS}
            getTitle={deliverableTitle}
            placeholder="Select deliverables"
          />
        </FormField>

        <NdaAgreementField row isForSurfShark={!!campaign?.isForSurfShark} />
      </Stack>

      {/* V4 Submission Warning Dialog */}
      <Dialog
        open={v4WarningOpen}
        onClose={handleV4WarningCancel}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
          },
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          {/* Icon Circle */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: pendingV4Value ? '#1340FF' : '#2C2C2C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <Typography sx={{ fontSize: 40 }}>{pendingV4Value ? '🔄' : '⚠️'}</Typography>
          </Box>

          {/* Title */}
          <Typography
            sx={{
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
              fontSize: 36,
              fontWeight: 400,
              mb: 1,
              lineHeight: 1.2,
            }}
          >
            {pendingV4Value ? 'Enable Client Campaign?' : 'Disable Client Campaign?'}
          </Typography>

          {/* Info Statement */}
          <Typography
            sx={{
              color: '#636366',
              fontSize: '0.875rem',
              mb: 3,
              mt: 1,
              lineHeight: 1.5,
            }}
          >
            {pendingV4Value
              ? 'Future pitch and submission approvals will route through the client for review. Items already approved stay approved.'
              : 'Anything currently waiting on client review will be returned to admin review, and admin approvals become final.'}
          </Typography>

          {/* Buttons */}
          <Stack spacing={1.5}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleV4WarningConfirm}
              sx={{
                bgcolor: pendingV4Value ? '#1340FF' : '#3A3A3C',
                borderBottom: pendingV4Value ? '3px solid #0d2db3' : '3px solid #00000073',
                color: '#fff',
                py: 1,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 1.5,
                textTransform: 'none',
                '&:hover': {
                  bgcolor: pendingV4Value ? '#0d2db3' : '#2C2C2C',
                },
              }}
            >
              Confirm
            </Button>
            <Button
              fullWidth
              onClick={handleV4WarningCancel}
              sx={{
                color: '#3A3A3C',
                border: '1px solid #E7E7E7',
                borderBottom: '3px solid #e7e7e7',
                py: 1,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 1.5,
                bgcolor: 'transparent',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'transparent',
                },
              }}
            >
              Cancel
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </FormProvider>
  );
};

UpdateFinaliseCampaign.propTypes = {
  campaign: PropTypes.object,
  campaignMutate: PropTypes.func,
  formId: PropTypes.string,
  onFormStateChange: PropTypes.func,
};

export default UpdateFinaliseCampaign;
