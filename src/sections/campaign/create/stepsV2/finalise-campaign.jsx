import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';
import React, { memo, useRef, useMemo, useState } from 'react';

import {
  Box,
  Chip,
  Stack,
  Avatar,
  Tooltip,
  Collapse,
  FormLabel,
  TextField,
  ButtonBase,
  Typography,
  useMediaQuery,
  FormHelperText,
  InputAdornment,
  createFilterOptions,
} from '@mui/material';

import useGetCompany from 'src/hooks/use-get-company';

import { isClientManager } from 'src/utils/campaign-flow';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import BrandLogoAvatar from 'src/components/brand-logo-avatar';
import { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';
import { PRIMARY_ACTION_SX } from 'src/components/campaign/action-button-styles';

import CreateBrand from '../brandDialog';
import { useGetAdmins } from '../hooks/get-am';
import StatTile from '../components/stat-tile';
import { EASE_OUT } from '../components/motion';
import NdaAgreementField from '../nda-agreement-field';
import useChipMotion from '../components/use-chip-motion';
import { getCreditLimitError } from '../utils/campaign-credits';
import SectionIn, { useEntrance } from '../components/section-in';
import PackageCreateDialog from '../../../packages/package-dialog';
import { BLUE, ToggleRow, SettingNote } from '../components/option-card';
import useScrollToFirstError from '../components/use-scroll-to-first-error';
import { FIELD_HEIGHT, singleLineSx, helperTextSx } from '../components/field-styles';
import ChipSelect, { tagSx, CloseGlyph, menuPaperSx } from '../components/chip-select';
import CreateCompany from '../../../brand/create/brandForms/FirstForms/create-company';

// A full-width line between groups of fields. The theme gives every Stack a 24px gap,
// so negative margins trim it to 16px on each side of the line.
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
// A loaded campaign can also carry these older deliverables
const deliverableTitle = (value) =>
  DELIVERABLES[value] ?? { ADS: 'Ads', CROSS_POSTING: 'Cross Posting' }[value] ?? value;

const FormField = ({ label, hint, children, required = true, action }) => (
  <Stack spacing={0.75}>
    <Stack spacing={0.25}>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <FormLabel
          required={required}
          sx={{
            fontWeight: 700,
            color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
            fontSize: '0.875rem',
            '& .MuiFormLabel-asterisk': { color: '#FF3500' },
          }}
        >
          {label}
        </FormLabel>
        {action}
      </Stack>
      {hint && (
        <Typography variant="caption" color="#8E8E93">
          {hint}
        </Typography>
      )}
    </Stack>
    {children}
  </Stack>
);

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  hint: PropTypes.node,
  children: PropTypes.node.isRequired,
  required: PropTypes.bool,
  action: PropTypes.node,
};

// A short shake that draws the eye to the package button each time Next is blocked by it
const nudgeSx = {
  '@keyframes packageNudge': {
    '0%, 100%': { transform: 'translateX(0)' },
    '20%, 60%': { transform: 'translateX(-4px)' },
    '40%, 80%': { transform: 'translateX(4px)' },
  },
  animation: `packageNudge 300ms ${EASE_OUT}`,
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
};

// The lower half of the client field when the client has no usable package. It sits in
// the same box as the field, so the two read as one piece.
const PROMPT_IN_MS = 240;
// Leaving is a response, not news, so it is quicker than arriving
const PROMPT_OUT_MS = 180;

// The content drops in from under the field while its row opens
const promptInSx = {
  '@keyframes packagePromptIn': {
    from: { opacity: 0, transform: 'translateY(-6px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  '@keyframes packagePromptFade': { from: { opacity: 0 }, to: { opacity: 1 } },
  animation: `packagePromptIn ${PROMPT_IN_MS}ms ${EASE_OUT}`,
  '@media (prefers-reduced-motion: reduce)': { animation: 'packagePromptFade 200ms ease' },
};

function PackagePrompt({ open, expired, nudgeKey, error, onClick }) {
  const entrance = useEntrance(promptInSx);
  return (
    <Stack
      role="alert"
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      spacing={1.5}
      sx={{
        ...entrance,
        // Fades while its row closes
        opacity: open ? 1 : 0,
        transition: `opacity ${PROMPT_OUT_MS}ms ease`,
        p: '12px 12px 12px 14px',
        borderTop: '1px solid #F0F0F0',
        bgcolor: '#FAFAFA',
      }}
    >
      <Stack direction="row" spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
        <Iconify
          icon={expired ? 'solar:clock-circle-linear' : 'solar:danger-circle-linear'}
          width={20}
          sx={{ flexShrink: 0, color: '#FFAB00' }}
        />
        <Box>
          <Typography sx={{ fontSize: 14, fontWeight: 600, lineHeight: '20px', color: '#231F20' }}>
            {expired ? "This client's package has expired" : 'This client has no active package'}
          </Typography>
          <Typography sx={{ fontSize: 13, lineHeight: '18px', mt: 0.25, color: '#8E8E93' }}>
            {expired
              ? 'Renew it to set the credits and fill in the rest of the campaign.'
              : 'Link one to set the credits and fill in the rest of the campaign.'}
          </Typography>
        </Box>
      </Stack>
      <ButtonBase
        // A new key per blocked Next press, so the nudge plays again
        key={nudgeKey}
        onClick={onClick}
        sx={{
          ...PRIMARY_ACTION_SX,
          flexShrink: 0,
          height: 36,
          px: 1.5,
          pt: '7px',
          pb: '10px',
          fontSize: 14,
          lineHeight: '18px',
          ...(error && nudgeSx),
        }}
      >
        {expired ? 'Renew package' : 'Link a package'}
      </ButtonBase>
    </Stack>
  );
}

PackagePrompt.propTypes = {
  open: PropTypes.bool,
  expired: PropTypes.bool,
  error: PropTypes.bool,
  nudgeKey: PropTypes.number,
  onClick: PropTypes.func,
};

const filter = createFilterOptions();

// Logo or "add" mark at the start of each client and brand option
const optionLeadSx = {
  width: 24,
  height: 24,
  mr: 1.25,
  flexShrink: 0,
  display: 'grid',
  placeItems: 'center',
  borderRadius: '6px',
  fontSize: 12,
  fontWeight: 600,
  // Only the letter fallback gets a fill; logos keep their own background
  '&.MuiAvatar-colorDefault': { bgcolor: '#EBEBEB', color: '#636366' },
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
  // Only the letter fallback gets a fill; logos keep their own background
  '&.MuiAvatar-colorDefault': { bgcolor: '#EBEBEB', color: '#636366 !important' },
};

// A small tag, so client users stand out without a longer name
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

// Name, "(you)" and the Client tag on one centre line; only the name shortens
const managerLabelSx = {
  '& .MuiChip-label': { display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 },
};

// Managers menu: the shared menu look, plus quiet group titles
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
  const creditsLeft = (creditSummary?.remainingCredits ?? 0) - Number(campaignCredits || 0);
  const showCreditsLeft = Number(campaignCredits) > 0 && !creditError;
  const creditMessage = errors?.campaignCredits?.message || creditHelperText;
  // Without a usable package the credits field isn't shown, so its error (set when Next is
  // pressed) would be invisible — show it on the package prompt instead
  const packageError = Boolean(errors?.campaignCredits);

  // A blocked Next press scrolls to the first error (the package prompt included) and
  // replays the package nudge
  const containerRef = useRef(null);
  const failedNextCount = useScrollToFirstError(containerRef);
  const managersRef = useRef(null);
  const managers = watch('campaignManager') || [];
  const withManagerGhosts = useChipMotion(managersRef, managers, (m) => m?.id ?? m);

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
    // Clearing the pick is not a mistake yet, so "required" waits for Next
    setValue('client', value, { shouldValidate: !!value });
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
    if (!isClientCampaign) return staff;
    // Client users stay together, so each menu group shows once
    return [...[...companyClientManagers].sort(byName), ...staff].sort(
      (a, b) => Number(isClientManager(b)) - Number(isClientManager(a))
    );
  }, [admins, isClientCampaign, companyClientManagers]);

  // Warn up front: with no client user, the client-manager rule cannot be met; and with
  // the toggle off, existing client users are skipped
  let clientNote = null;
  if (isClientCampaign && client?.id && !companyClientManagers.length) {
    clientNote = {
      title: 'No client accounts yet.',
      body: 'Invite a client user, or turn this off.',
    };
  } else if (!isClientCampaign && companyClientManagers.length > 0) {
    const count = companyClientManagers.length;
    clientNote = {
      title: `${client?.name} has ${count} client account${count === 1 ? '' : 's'}.`,
      body: 'Creators skip client review while this is off.',
    };
  }
  // Keep the last note while it slides out
  const shownNote = useRef(clientNote);
  if (clientNote) shownNote.current = clientNote;

  const packageState = (() => {
    if (!client) return null;
    if (!creditSummary?.remainingCredits) return 'none';
    if (dayjs(creditSummary.nextExpiryDate).isBefore(dayjs(), 'date')) return 'expired';
    return 'active';
  })();
  const daysLeft = creditSummary ? getRemainingTime(creditSummary.nextExpiryDate) : 0;
  // Without a usable package the campaign cannot be created, so everything after the
  // client waits until one is linked
  const needsPackage = packageState === 'none' || packageState === 'expired';
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  // The field keeps the shared border, and the prompt its last text, until the prompt
  // has finished closing
  const [promptFramed, setPromptFramed] = useState(needsPackage);
  if (needsPackage && !promptFramed) setPromptFramed(true);
  const promptExpired = useRef(false);
  if (needsPackage) promptExpired.current = packageState === 'expired';

  const setFlag = (name) => (checked) => setValue(name, checked, { shouldDirty: true });

  const companyPicker = (name, placeholder, options, onChange) => (
    <RHFAutocomplete
      name={name}
      placeholder={placeholder}
      options={options}
      loading={companyLoading}
      onChange={onChange}
      getOptionLabel={(option) => option.inputValue || option.name}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      selectOnFocus
      clearOnBlur
      disableClearable
      slotProps={{ paper: { sx: menuPaperSx } }}
      renderInput={(params) => {
        const picked = watch(name);
        // The pick shows as a chip, like the other pickers. Typing hides it and searches;
        // leaving the field brings it back.
        const showChip =
          !!picked?.name && !picked.inputValue && params.inputProps.value === picked.name;
        return (
          <TextField
            {...params}
            placeholder={showChip ? '' : placeholder}
            error={!!errors?.[name]}
            helperText={errors?.[name]?.message}
            inputProps={{
              ...params.inputProps,
              ...(showChip && { value: '' }),
              autoComplete: 'new-password',
              onKeyDown: (event) => {
                if (showChip && event.key === 'Backspace') onChange(event, null);
                params.inputProps.onKeyDown?.(event);
              },
            }}
            InputProps={{
              ...params.InputProps,
              startAdornment: showChip ? (
                <Chip
                  label={picked.name}
                  avatar={
                    <BrandLogoAvatar
                      src={picked.logo}
                      alt=""
                      sx={{ ...chipAvatarSx, borderRadius: '4px' }}
                    >
                      {picked.name.charAt(0)}
                    </BrandLogoAvatar>
                  }
                  onDelete={(event) => onChange(event, null)}
                  deleteIcon={<CloseGlyph aria-label={`Remove ${picked.name}`} />}
                  sx={{ ...tagSx, borderRadius: '8px', maxWidth: 'calc(100% - 48px)' }}
                />
              ) : null,
            }}
          />
        );
      }}
      renderOption={({ key, ...props }, option) => (
        <li key={option?.id ?? `new-${option.inputValue}`} {...props}>
          {option.inputValue ? (
            <Box sx={{ ...optionLeadSx, color: BLUE, bgcolor: '#F5F7FF' }}>
              <Iconify icon="eva:plus-fill" width={16} />
            </Box>
          ) : (
            <BrandLogoAvatar src={option?.logo} alt={option.name} sx={optionLeadSx}>
              {option.name?.charAt(0)}
            </BrandLogoAvatar>
          )}
          <Box
            component="span"
            sx={{ ...optionNameSx, ...(option.inputValue && { color: BLUE, fontWeight: 600 }) }}
          >
            {option.name}
          </Box>
        </li>
      )}
      filterOptions={(list, params) => {
        const { inputValue } = params;
        const filtered = filter(list, params);
        const isExisting = list.some(
          (option) => option.name.toLowerCase() === inputValue.toLowerCase()
        );
        if (inputValue !== '' && !isExisting) {
          filtered.push({ inputValue, name: `Add "${inputValue}"` });
        }
        return filtered;
      }}
      sx={singleLineSx}
    />
  );

  return (
    <Stack
      ref={containerRef}
      spacing={3}
      sx={{ maxWidth: 600, mx: 'auto', px: { xs: 0, sm: 3 }, pt: 3, mb: 10, ...helperTextSx }}
    >
      <FormField label="Client" hint="Pick a client, or type a name to add a new one.">
        {/* With no package the field and its prompt share one border */}
        <Box
          sx={
            promptFramed
              ? {
                  border: '1px solid',
                  borderColor: packageError ? 'error.main' : '#E8E8E8',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  bgcolor: '#FFFFFF',
                  transition: 'border-color 150ms ease',
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  // A client is picked here, so a field message would only be stale and
                  // would push the prompt around
                  '& .MuiFormHelperText-root': { display: 'none' },
                  '&:has(.MuiOutlinedInput-root.Mui-focused)': { borderColor: '#231F20' },
                }
              : undefined
          }
        >
          {companyPicker(
            'client',
            'Select or create a client',
            companyData || [],
            handleClientChange
          )}
          <Collapse
            in={needsPackage}
            timeout={reduceMotion ? 0 : { enter: PROMPT_IN_MS, exit: PROMPT_OUT_MS }}
            easing={EASE_OUT}
            onExited={() => setPromptFramed(false)}
            unmountOnExit
          >
            <PackagePrompt
              open={needsPackage}
              expired={promptExpired.current}
              error={packageError}
              nudgeKey={failedNextCount}
              onClick={openPackage.onTrue}
            />
          </Collapse>
        </Box>
        {needsPackage && packageError && (
          <FormHelperText error>
            {packageState === 'expired'
              ? 'Renew the package before you continue.'
              : 'Link a package before you continue.'}
          </FormHelperText>
        )}
      </FormField>

      <Stack
        spacing={3}
        inert={needsPackage ? '' : undefined}
        aria-disabled={needsPackage || undefined}
        sx={{
          transition: 'opacity 200ms ease',
          ...(needsPackage && { opacity: 0.4, pointerEvents: 'none', userSelect: 'none' }),
        }}
      >
        {client && (client?.type === 'agency' || !!client?.brand?.length) && (
          <SectionIn>
            <FormField label="Brand" hint="Pick a brand, or type a name to add a new one.">
              {companyPicker(
                'campaignBrand',
                'Select or create a brand',
                client?.brand || [],
                handleBrandChange
              )}
            </FormField>
          </SectionIn>
        )}

        {packageState === 'active' && (
          // Lands just after Brand, so the two read top to bottom, not as one jump
          <SectionIn sx={{ animationDelay: '50ms', animationFillMode: 'backwards' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Box flex={1}>
                <FormField
                  label="Available"
                  required={false}
                  action={
                    <Tooltip
                      title={`Remaining credits from ${creditSummary.activePackagesCount} active package(s).`}
                    >
                      <Iconify icon="eva:info-outline" width={15} sx={{ color: '#8E8E93' }} />
                    </Tooltip>
                  }
                >
                  <StatTile
                    icon="solar:wallet-money-linear"
                    value={creditSummary.remainingCredits}
                    unit="UGC credits"
                  />
                </FormField>
              </Box>
              <Box flex={1}>
                <FormField label="Validity" required={false}>
                  <StatTile
                    icon="solar:clock-circle-linear"
                    value={daysLeft}
                    unit={`day${daysLeft === 1 ? '' : 's'} left`}
                    warning={daysLeft <= 14}
                  />
                </FormField>
              </Box>
              <Box flex={1}>
                <FormField label="Campaign Credits">
                  <RHFTextField
                    name="campaignCredits"
                    type="number"
                    placeholder="UGC credits"
                    error={creditError || !!errors?.campaignCredits}
                    inputProps={{
                      'aria-describedby': creditMessage ? 'campaign-credits-error' : undefined,
                    }}
                    InputProps={{
                      endAdornment: showCreditsLeft && (
                        <InputAdornment position="end" className="credits-left" sx={{ ml: 1 }}>
                          <Typography
                            component="span"
                            sx={{ fontSize: 13, color: '#8E8E93', whiteSpace: 'nowrap' }}
                          >
                            {creditsLeft} left
                          </Typography>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      ...singleLineSx,
                      // The message shows under the whole row instead
                      '& .MuiFormHelperText-root': { display: 'none' },
                      '& .credits-left': { display: 'none' },
                      '& .Mui-focused .credits-left': { display: 'flex' },
                    }}
                  />
                </FormField>
              </Box>
            </Stack>
            {creditMessage && (
              <FormHelperText error id="campaign-credits-error">
                {creditMessage}
              </FormHelperText>
            )}
          </SectionIn>
        )}

        <Box aria-hidden sx={sectionBreakSx} />

        {/* Plain rows, like the form fields around them */}
        <Stack spacing={2}>
          {/* Plain toggle (not RHFSwitch) so turning it on can fill in the client managers */}
          <ToggleRow
            title="Client campaign"
            description="The client can manage this campaign and review creators."
            checked={!!isClientCampaign}
            onChange={(checked) => handleClientCampaignToggle({ target: { checked } })}
            footerOpen={!!clientNote}
          >
            {shownNote.current && (
              <SettingNote title={shownNote.current.title}>{shownNote.current.body}</SettingNote>
            )}
          </ToggleRow>
          <ToggleRow
            title="Credit tier pricing"
            description="Creator cost follows their follower tier, not a flat 1 credit per video."
            checked={!!watch('isCreditTier')}
            onChange={setFlag('isCreditTier')}
          />
        </Stack>

        <Box aria-hidden sx={sectionBreakSx} />

        <FormField
          label="Campaign Managers"
          hint="Who runs this campaign. Include at least one CSM or CSL."
        >
          <Box ref={managersRef}>
            <RHFAutocomplete
              name="campaignManager"
              multiple
              placeholder={watch('campaignManager')?.length ? '' : 'Add managers'}
              options={filteredCampaignManagers}
              freeSolo
              disableCloseOnSelect
              isOptionEqualToValue={(option, value) => option.id === value.id}
              getOptionLabel={(option) =>
                isClientManager(option) ? `${option.name} (Client)` : option.name
              }
              groupBy={
                isClientCampaign
                  ? (option) => (isClientManager(option) ? 'Client users' : 'Cult Creative team')
                  : undefined
              }
              slotProps={{
                paper: { sx: managersPaperSx },
                popper: { placement: 'bottom-start', sx: { minWidth: 300 } },
              }}
              renderOption={({ key, ...props }, option, { selected }) => (
                <li key={option?.id ?? key} {...props}>
                  <Avatar
                    src={option?.photoURL}
                    alt={option?.name}
                    sx={{
                      ...optionLeadSx,
                      borderRadius: '50%',
                      bgcolor: '#EBEBEB',
                      color: '#636366',
                    }}
                  >
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
                        <Box component="span" sx={{ minWidth: 0, ...optionNameSx }}>
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
                // A manager the form adds or drops (Client campaign, client change) fades in
                // or out in place, so the change shows
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

        <FormField label="Campaign Type">
          <ChipSelect
            single
            name="campaignType"
            options={CAMPAIGN_TYPE_OPTIONS}
            getTitle={campaignTypeTitle}
            placeholder="Select campaign type"
          />
        </FormField>

        <FormField label="Deliverables">
          <ChipSelect
            name="deliverables"
            options={DELIVERABLE_OPTIONS}
            getTitle={deliverableTitle}
            placeholder="Select deliverables"
          />
        </FormField>

        <NdaAgreementField row />
      </Stack>

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
