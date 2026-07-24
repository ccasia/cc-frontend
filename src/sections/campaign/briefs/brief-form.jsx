import dayjs from 'dayjs';
import * as yup from 'yup';
import PropTypes from 'prop-types';
import { keyframes } from '@emotion/react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';

import FormProvider, {
  RHFSelect,
  RHFTextField,
  RHFDatePicker,
  RHFMultiSelect,
} from 'src/components/hook-form';
import { langList } from 'src/contants/language';
import { interestsLists } from 'src/contants/interestLists';
import { secondaryObjectivesByPrimary } from 'src/contants/campaign-objectives';

import Iconify from 'src/components/iconify';

import OptionCardGrid from './form-fields/option-card-grid';
import ChipMultiSelect from './form-fields/chip-multi-select';
import { countriesCities } from 'src/contants/countries';

// ---------------------------------------------------------------------------
// Schema and constants mirror src/sections/public-access/bd-brief-form.jsx so
// the brief payload is interchangeable with the existing public BD invite flow.
// ---------------------------------------------------------------------------

const schema = yup.object({
  brandName: yup.string().trim(),
  industry: yup.string(),
  campaignName: yup.string(),
  dateFrom: yup.mixed().nullable(),
  dateTo: yup.mixed().nullable(),
  secondaryObjectives: yup.array().of(yup.string()).default([]),
  kpis: yup.array().of(yup.string()).default([]),
  kpiNotes: yup.string().max(500),
  extraNotes: yup.string().max(500),
  audienceGender: yup.array().of(yup.string()).default([]),
  audienceAge: yup.array().of(yup.string()).default([]),
  country: yup.string(),
  audienceLanguage: yup.array().of(yup.string()).default([]),
  audienceCreatorPersona: yup.array().of(yup.string()).default([]),
  audienceUserPersona: yup.string().max(500),
  geographicFocus: yup.string().max(200),
  geographicFocusOthers: yup.string().max(200),
});

// Public single-submit flow. Prospects may send an incomplete brief, so the
// only required field is the brand name (matching the relaxed server-side
// validation in bdSubmitDraft) — everything else is optional.
const submitSchema = schema.shape({
  brandName: yup.string().trim().required('Brand name is required'),
});

const COUNTRY_OPTIONS = Object.keys(countriesCities).sort((a, b) => a.localeCompare(b));
const GEO_FOCUS_OPTIONS = [
  { value: 'SEAregion', label: 'SEA Region' },
  { value: 'global', label: 'Global' },
  { value: 'others', label: 'Others' },
];

const OBJECTIVE_CARD_COPY = {
  'Brand Awareness (Introduce brands to new audiences)': {
    title: 'Brand Awareness',
    subtitle: 'Get in front of a new audience',
  },
  'Product Launch (Generate buzz for new product/service)': {
    title: 'Product/Service Launch',
    subtitle: 'Build buzz around something new',
  },
  'Education (Educate audiences about product category)': {
    title: 'Education',
    subtitle: 'Help audiences understand what you do',
  },
  'Community Building (Foster a loyal community around the brand’s values or lifestyle)': {
    title: 'Community Building',
    subtitle: 'Deepen loyalty around your brand values',
  },
};

const OBJECTIVES = (secondaryObjectivesByPrimary.Awareness || []).map((value) => ({
  value,
  title: OBJECTIVE_CARD_COPY[value]?.title || value,
  subtitle: OBJECTIVE_CARD_COPY[value]?.subtitle || '',
}));

const KPI_OPTIONS = [
  'Views',
  'Reach & impressions',
  'Engagement rate',
  'Link clicks',
  'Foot traffic',
  'App downloads',
  'Sales / conversions',
  'Follower growth',
];

const GENDERS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'nonbinary', label: 'Non-Binary' },
];
const AGE_OPTIONS = [
  { value: '18-25', label: '18 - 25' },
  { value: '26-34', label: '26 - 34' },
  { value: '35-40', label: '35 - 40' },
  { value: '>40', label: '40 >' },
];

const noBoxSx = {
  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
  '& .MuiOutlinedInput-root': {
    borderRadius: 0,
    fontSize: 16,
    color: '#0A0910',
    padding: 0,
    background: 'transparent',
  },
  '& .MuiOutlinedInput-input': {
    padding: '10px 0 12px',
    fontSize: 16,
    color: '#0A0910',
    '&::placeholder': { color: '#9896A8', fontWeight: 300, opacity: 1 },
  },
  '& .MuiInputBase-inputMultiline': {
    padding: '10px 0 12px',
    '&::placeholder': { color: '#9896A8', fontWeight: 300, opacity: 1 },
  },
  '& .MuiSelect-select:has(em)': { color: '#9896A8', fontWeight: 300 },
  '& .MuiSelect-select em': { color: '#9896A8', fontWeight: 300, fontStyle: 'normal' },
  '& .MuiSelect-icon': { right: 0 },
};

const MULTISELECT_MENU_PROPS = {
  PaperProps: {
    sx: {
      maxHeight: 320,
      '& .MuiCheckbox-root.Mui-checked': { color: '#1340FF' },
      '& .MuiCheckbox-root:not(.Mui-checked)': { color: '#9CA3AF' },
    },
  },
};

const DATEPICKER_SLOT_PROPS = {
  desktopPaper: {
    sx: {
      '& .MuiPickersDay-root.Mui-selected': {
        bgcolor: '#1340FF',
        '&:hover': { bgcolor: '#0F33CC' },
        '&:focus': { bgcolor: '#1340FF' },
      },
      '& .MuiPickersDay-today': { borderColor: '#1340FF' },
      '& .MuiPickersYear-yearButton.Mui-selected': {
        bgcolor: '#1340FF',
        '&:hover': { bgcolor: '#0F33CC' },
      },
      '& .MuiPickersMonth-monthButton.Mui-selected': {
        bgcolor: '#1340FF',
        '&:hover': { bgcolor: '#0F33CC' },
      },
    },
  },
};

const noBoxMultiSelectSx = {
  width: '100%',
  ...noBoxSx,
  '& .MuiOutlinedInput-root': { ...noBoxSx['& .MuiOutlinedInput-root'], width: '100%' },
  '& .MuiSelect-select': {
    padding: '10px 0 12px',
    minHeight: 'auto',
    fontSize: 16,
    color: '#0A0910',
    fontWeight: 400,
    // Let long selections wrap onto multiple lines instead of being truncated
    // with an ellipsis, while the field/column keeps its flex:1 width.
    whiteSpace: 'normal',
    overflow: 'visible',
    textOverflow: 'clip',
    overflowWrap: 'anywhere',
  },
  '& .MuiSelect-select > .MuiBox-root': { color: '#9896A8', fontWeight: 300 },
};

const selectPlaceholder = (placeholder) => (selected) => {
  if (!selected) {
    return (
      <Box component="span" sx={{ color: '#9896A8', fontWeight: 300 }}>
        {placeholder}
      </Box>
    );
  }
  return selected;
};

const selectPlaceholderLabel = (placeholder, options) => (selected) => {
  if (!selected) {
    return (
      <Box component="span" sx={{ color: '#9896A8', fontWeight: 300 }}>
        {placeholder}
      </Box>
    );
  }
  return options.find((o) => o.value === selected)?.label || selected;
};

const CREATOR_NICHE_OPTIONS = interestsLists.map((item) => ({
  value: item.toLowerCase(),
  label: item,
}));

const LANGUAGE_OPTIONS = (() => {
  const preferred = ['Malay', 'English'];
  const rest = [...langList]
    .filter((l) => !preferred.includes(l))
    .sort((a, b) => a.localeCompare(b));
  return [...preferred, ...rest];
})();

// ---------------------------------------------------------------------------
// Section header — numbered "01. Brand Info" with the side line and a small
// purple/blue gradient blob, matching the design.
// ---------------------------------------------------------------------------

function SectionHeader({ number, title, optional }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={{ xs: 1, sm: 2 }}
      sx={{ mb: 2, minWidth: 0 }}
    >
      <Box
        sx={{
          position: 'relative',
          width: { xs: 48, sm: 80 },
          height: { xs: 44, sm: 64 },
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: { xs: 8, sm: 15 },
            left: { xs: 6, sm: 17 },
            width: { xs: 48, sm: 71 },
            height: { xs: 48, sm: 71 },
            borderRadius: '50%',
            background: 'linear-gradient(180deg, #8A5AFE 0%, rgba(167, 139, 250, 0) 60%)',
            zIndex: 0,
          }}
        />
        <Typography
          sx={{
            position: 'relative',
            zIndex: 1,
            fontFamily: '"Times New Roman", serif',
            fontWeight: 400,
            fontStyle: 'italic',
            fontSize: { xs: '40px', sm: '64px' },
            lineHeight: { xs: '44px', sm: '70.06px' },
            letterSpacing: '-0.04em',
            textAlign: 'center',
            color: '#0F172A',
          }}
        >
          {number}.
        </Typography>
      </Box>
      {optional ? (
        <>
          <Box
            sx={{
              flex: 1,
              height: '1px',
              background: 'linear-gradient(90deg, #8A5AFE 0%, #1340FF 100%)',
            }}
          />
          <Typography variant="caption" sx={{ color: '#9CA3AF', letterSpacing: 1, fontSize: 11 }}>
            {optional}
          </Typography>
          <Box
            sx={{
              flex: 1,
              height: '1px',
              background: 'linear-gradient(90deg, #1340FF 0%, #8A5AFE 100%)',
            }}
          />
        </>
      ) : (
        <Box
          sx={{
            flex: 1,
            height: '1px',
            background: 'linear-gradient(90deg, #8A5AFE 0%, #1340FF 100%)',
          }}
        />
      )}
      <Typography
        sx={{
          fontFamily: '"Times New Roman", serif',
          fontWeight: 400,
          fontStyle: 'italic',
          fontSize: { xs: '28px', sm: '48px' },
          lineHeight: 1.05,
          letterSpacing: '-0.04em',
          color: '#0F172A',
          minWidth: 0,
          overflowWrap: 'anywhere',
        }}
      >
        {title}
      </Typography>
    </Stack>
  );
}
SectionHeader.propTypes = {
  number: PropTypes.string,
  title: PropTypes.string,
  optional: PropTypes.string,
};

// FieldWrap — gray underline that animates to a purple→blue gradient on
// focus-within. Borrowed from src/sections/public-access/bd-brief-form.jsx
// so the two forms share the same input look-and-feel.
function FieldWrap({ children }) {
  return (
    <Box
      sx={{
        position: 'relative',
        borderBottom: '1px solid #E5E7EB',
        transition: 'border-color 0.2s',
        '&:focus-within': { borderBottomColor: 'transparent' },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '-1px',
          left: '50%',
          right: '50%',
          height: '2px',
          background: 'linear-gradient(135deg, #8A5AFE, #1340FF)',
          transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1), right 0.3s cubic-bezier(0.4,0,0.2,1)',
          borderRadius: '2px',
          pointerEvents: 'none',
        },
        '&:focus-within::after': { left: 0, right: 0 },
      }}
    >
      {children}
    </Box>
  );
}
FieldWrap.propTypes = { children: PropTypes.node };

// Indeterminate sweep for the attachment upload, reusing FieldWrap's gradient
// underline so the loading state reads as part of the same field family.
const uploadSweep = keyframes`
  0%   { left: -40%; right: 100%; }
  60%  { left: 0%;   right: 0%; }
  100% { left: 100%; right: -40%; }
`;

function UploadProgressBar() {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'relative',
        height: '2px',
        mt: 1,
        borderRadius: '2px',
        bgcolor: '#E5E7EB',
        overflow: 'hidden',
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #8A5AFE, #1340FF)',
          borderRadius: '2px',
          animation: `${uploadSweep} 1.1s cubic-bezier(0.4,0,0.2,1) infinite`,
        },
      }}
    />
  );
}

function EditedIndicator({ shown }) {
  if (!shown) return null;
  return (
    <Typography
      component="span"
      sx={{ ml: 1, fontStyle: 'italic', color: '#F97316', fontWeight: 600, fontSize: 13 }}
    >
      Edited by Client
    </Typography>
  );
}
EditedIndicator.propTypes = { shown: PropTypes.bool };

// Empty form state — keys mirror the brief-derived defaultValues below. Used by
// the BD/admin RESET FORM action to wipe the form rather than reload it.
const EMPTY_VALUES = {
  brandName: '',
  industry: '',
  campaignName: '',
  dateFrom: null,
  dateTo: null,
  secondaryObjectives: [],
  kpis: [],
  kpiNotes: '',
  extraNotes: '',
  audienceGender: [],
  audienceAge: [],
  country: '',
  audienceLanguage: [],
  audienceCreatorPersona: [],
  audienceUserPersona: '',
  geographicFocus: '',
  geographicFocusOthers: '',
};

// ---------------------------------------------------------------------------
// Brief form
// ---------------------------------------------------------------------------

export default function BriefForm({
  brief,
  mode = 'bd-author',
  onSavePatch,
  onSubmit,
  submitting = false,
  onUploadAttachment,
  onDeleteAttachment,
  readOnly = false,
  clearSignal = 0,
  resetSignal = 0,
}) {
  // Public single-submit flow (invite link): no per-field autosave; the form
  // collects values and emits the whole payload once via onSubmit, validated
  // against the stricter submitSchema.
  const isSubmitMode = mode === 'public-submit';
  // The backend stores brief data spread across Campaign / CampaignBrief /
  // CampaignRequirement / CampaignAdditionalDetails. We reconstruct the
  // bd-brief-form payload shape from those nested records.
  const defaultValues = useMemo(() => {
    const specialNotes = brief?.campaignAdditionalDetails?.specialNotesInstructions || '';
    // The legacy flow stuffs "KPIs: ..." and "KPI notes: ..." into one string.
    // Try to round-trip them when present; otherwise leave empty.
    const kpiLine = /KPIs:\s*(.+)/.exec(specialNotes);
    const kpiNotesLine = /KPI notes:\s*([\s\S]+)/.exec(specialNotes);
    const kpis = kpiLine
      ? kpiLine[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    // The objectives grid only offers the OBJECTIVES card values. The backend
    // stores those in `secondaryObjectives` and a fixed `objectives='Awareness'`
    // primary alongside (see bd-brief-form / bdSubmitDraft). We must NOT fold the
    // primary into the grid array — it isn't a selectable card and would silently
    // consume one of the 2 `max` slots, blocking new selections.
    const combinedObjectives = brief?.campaignBrief?.secondaryObjectives || [];

    return {
      brandName: brief?.brandName || '',
      industry: brief?.campaignBrief?.industries || '',
      campaignName: brief?.name || '',
      dateFrom: brief?.campaignBrief?.postingStartDate
        ? dayjs(brief.campaignBrief.postingStartDate)
        : null,
      dateTo: brief?.campaignBrief?.postingEndDate
        ? dayjs(brief.campaignBrief.postingEndDate)
        : null,
      secondaryObjectives: combinedObjectives,
      kpis,
      kpiNotes: kpiNotesLine ? kpiNotesLine[1].trim() : '',
      extraNotes: brief?.description || '',
      audienceGender: brief?.campaignRequirement?.gender || [],
      audienceAge: brief?.campaignRequirement?.age || [],
      country: brief?.campaignRequirement?.country || '',
      audienceLanguage: brief?.campaignRequirement?.language || [],
      audienceCreatorPersona: brief?.campaignRequirement?.creator_persona || [],
      audienceUserPersona: brief?.campaignRequirement?.user_persona || '',
      geographicFocus: brief?.campaignRequirement?.geographic_focus || '',
      geographicFocusOthers: brief?.campaignRequirement?.geographicFocusOthers || '',
    };
  }, [brief]);

  const methods = useForm({
    resolver: yupResolver(isSubmitMode ? submitSchema : schema),
    defaultValues,
    mode: 'onBlur',
  });

  const { reset, getValues, setValue, watch, handleSubmit } = methods;

  // "Edited by Client" badge. The backend recomputes editedByClientFields on
  // every client patch by comparing each field against the snapshot taken when
  // the brief was sent — so a field reverted to its sent value is dropped, and
  // the result is stable across refreshes (the snapshot is the source of truth).
  // We just reflect that server-derived list here. Autosave runs on blur, so the
  // badge updates once the edited field loses focus.
  const editedFields = useMemo(
    () => new Set(brief?.editedByClientFields || []),
    [brief?.editedByClientFields]
  );

  useEffect(() => {
    reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brief?.draftStatus, brief?.id, reset]);

  // Explicit clear trigger (BD/admin RESET FORM): the parent bumps `clearSignal`
  // to wipe the form back to an empty state. Unlike the brief-id reseed above,
  // this empties every field rather than reloading the persisted values.
  useEffect(() => {
    if (clearSignal) reset(EMPTY_VALUES);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearSignal]);

  // Explicit reseed trigger (client RESET FORM): the parent reverts the brief to
  // the BD-sent snapshot, refreshes `brief`, then bumps `resetSignal` so the form
  // reseeds to those values (brief id is unchanged, so the id effect won't fire).
  useEffect(() => {
    if (resetSignal) reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  // Autosave: on blur, PATCH only the field that changed. Chip toggles flush
  // immediately too.
  const saveField = useCallback(
    (field) => {
      if (readOnly || !onSavePatch) return;
      const value = getValues(field);
      onSavePatch({ [field]: value });
    },
    [getValues, onSavePatch, readOnly]
  );

  const onBlurHandler = (field) => () => saveField(field);

  const toggleArrayField = (field, value, opts = {}) => {
    if (readOnly) return;
    const current = getValues(field) || [];
    let next;
    if (current.includes(value)) {
      next = current.filter((v) => v !== value);
    } else if (opts.max && current.length >= opts.max) {
      next = current;
    } else {
      next = [...current, value];
    }
    setValue(field, next, { shouldDirty: true });
    saveField(field);
  };

  const MAX_ATTACHMENTS = 3;
  const [uploading, setUploading] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState(null);
  // Public-submit mode has no brief yet, so files are held locally and sent
  // with the create request. Each entry: { id, file }.
  const [pendingFiles, setPendingFiles] = useState([]);

  // Persisted attachments (URL list on the brief). In submit mode there are
  // none yet — the local pendingFiles drive the UI instead.
  const attachments = Array.isArray(brief?.campaignBrief?.otherAttachments)
    ? brief.campaignBrief.otherAttachments
    : [];
  const attachmentCount = isSubmitMode ? pendingFiles.length : attachments.length;
  const atAttachmentLimit = attachmentCount >= MAX_ATTACHMENTS;

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset so re-selecting the same file still fires change
    if (!file || readOnly || atAttachmentLimit) return;

    // Submit mode: stash locally, upload happens on submit.
    if (isSubmitMode) {
      setPendingFiles((prev) => [...prev, { id: `${Date.now()}-${file.name}`, file }]);
      return;
    }

    if (!onUploadAttachment) return;
    setUploading(true);
    try {
      await onUploadAttachment(file);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (url) => {
    if (readOnly || !onDeleteAttachment || deletingUrl) return;
    setDeletingUrl(url);
    try {
      await onDeleteAttachment(url);
    } finally {
      setDeletingUrl(null);
    }
  };

  const handleRemovePending = (id) => {
    setPendingFiles((prev) => prev.filter((p) => p.id !== id));
  };

  // Derive a friendly label from a stored URL (the GCS object name).
  const attachmentLabel = (url, idx) => {
    try {
      const path = decodeURIComponent(new URL(url).pathname);
      const base = path.slice(path.lastIndexOf('/') + 1);
      return base || `Attachment ${idx + 1}`;
    } catch {
      return `Attachment ${idx + 1}`;
    }
  };

  // Public submit: validate the whole form, then hand the values to the parent
  // which maps them to the public-invite payload and POSTs.
  const submit = handleSubmit((values) => {
    if (onSubmit)
      onSubmit(
        values,
        pendingFiles.map((p) => p.file)
      );
  });

  return (
    <FormProvider methods={methods}>
      <Stack spacing={6} sx={{ minWidth: 0, maxWidth: '100%' }}>
        {/* 01. Brand Info */}
        <Box>
          <SectionHeader number="01" title="Brand Info" />
          <Typography variant="body2" sx={{ color: '#6B7280', mb: 3 }}>
            Tell us about your brand so we can find creators who actually fit.
          </Typography>
          <Stack spacing={3}>
            <Box>
              <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 500 }}>
                Brand Name <EditedIndicator shown={editedFields.has('brandName')} />
              </Typography>
              <FieldWrap>
                <RHFTextField
                  name="brandName"
                  placeholder="Your Brand Name"
                  size="small"
                  sx={noBoxSx}
                  onBlur={onBlurHandler('brandName')}
                  disabled={readOnly}
                  fullWidth
                />
              </FieldWrap>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 500 }}>
                Industry <EditedIndicator shown={editedFields.has('industry')} />
              </Typography>
              <FieldWrap>
                <RHFSelect
                  name="industry"
                  size="small"
                  SelectProps={{
                    displayEmpty: true,
                    sx: { textTransform: 'none' },
                    MenuProps: { PaperProps: { sx: { maxHeight: 320 } } },
                    renderValue: selectPlaceholder('Select your Industry'),
                  }}
                  sx={noBoxSx}
                  onBlur={onBlurHandler('industry')}
                  disabled={readOnly}
                >
                  {interestsLists.map((i) => (
                    <MenuItem key={i} value={i}>
                      {i}
                    </MenuItem>
                  ))}
                </RHFSelect>
              </FieldWrap>
            </Box>
          </Stack>
        </Box>

        {/* 02. Timeline */}
        <Box>
          <SectionHeader number="02" title="Campaign Timeline" />
          <Typography variant="body2" sx={{ color: '#6B7280', mb: 2 }}>
            Tell us what to call your campaign and when does it go live?
          </Typography>
          <Stack spacing={3}>
            <Box>
              <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 500 }}>
                Campaign Name <EditedIndicator shown={editedFields.has('campaignName')} />
              </Typography>
              <FieldWrap>
                <RHFTextField
                  name="campaignName"
                  placeholder="Your Campaign Name"
                  size="small"
                  sx={noBoxSx}
                  onBlur={onBlurHandler('campaignName')}
                  disabled={readOnly}
                  fullWidth
                />
              </FieldWrap>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 500 }}>
                  Start Date <EditedIndicator shown={editedFields.has('dateFrom')} />
                </Typography>
                <FieldWrap>
                  <RHFDatePicker
                    name="dateFrom"
                    disabled={readOnly}
                    maxDate={watch('dateTo') ? dayjs(watch('dateTo')) : undefined}
                    slots={{ openPickerIcon: CalendarTodayOutlinedIcon }}
                    slotProps={DATEPICKER_SLOT_PROPS}
                    sx={noBoxSx}
                    onClose={() => {
                      saveField('dateFrom');
                      const from = getValues('dateFrom');
                      const to = getValues('dateTo');
                      if (from && to && new Date(from) > new Date(to)) {
                        setValue('dateTo', null, { shouldDirty: true });
                        saveField('dateTo');
                      }
                    }}
                  />
                </FieldWrap>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 500 }}>
                  End Date <EditedIndicator shown={editedFields.has('dateTo')} />
                </Typography>
                <FieldWrap>
                  <RHFDatePicker
                    name="dateTo"
                    disabled={readOnly}
                    minDate={watch('dateFrom') ? dayjs(watch('dateFrom')) : undefined}
                    slots={{ openPickerIcon: CalendarTodayOutlinedIcon }}
                    slotProps={DATEPICKER_SLOT_PROPS}
                    sx={noBoxSx}
                    onClose={() => saveField('dateTo')}
                  />
                </FieldWrap>
              </Box>
            </Stack>
          </Stack>
        </Box>

        {/* 03. Objectives — exactly 2 selections */}
        <Box>
          <SectionHeader number="03" title="Objectives" />
          <Typography variant="body2" sx={{ color: '#6B7280', mb: 3 }}>
            What&apos;s this campaign for? Pick up to 2 goals.{' '}
            <EditedIndicator shown={editedFields.has('secondaryObjectives')} />
          </Typography>
          <OptionCardGrid
            options={OBJECTIVES.map((o) => ({
              value: o.value,
              title: o.title,
              subtitle: o.subtitle,
            }))}
            selected={watch('secondaryObjectives') || []}
            onToggle={(value) => toggleArrayField('secondaryObjectives', value, { max: 2 })}
            disabled={readOnly}
          />
        </Box>

        {/* 04. KPIs / Success Metrics */}
        <Box>
          <SectionHeader number="04" title="Success Metrics" />
          <Typography variant="body2" sx={{ color: '#6B7280', mb: 3 }}>
            What does success look like? Select all that apply - this shapes how we build your
            campaign. <EditedIndicator shown={editedFields.has('kpis')} />
          </Typography>
          <ChipMultiSelect
            grid
            columns={4}
            options={KPI_OPTIONS}
            value={watch('kpis') || []}
            onToggle={(v) => toggleArrayField('kpis', v)}
            disabled={readOnly}
            sx={{ mb: 2 }}
          />
          <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 500 }}>
            Notes <EditedIndicator shown={editedFields.has('kpiNotes')} />
          </Typography>
          <FieldWrap>
            <RHFTextField
              name="kpiNotes"
              placeholder="Got specific numbers in mind? Drop them here · Optional."
              size="small"
              sx={noBoxSx}
              disabled={readOnly}
              onBlur={onBlurHandler('kpiNotes')}
              multiline
              fullWidth
            />
          </FieldWrap>
        </Box>

        {/* 05. Target Audience */}
        <Box>
          <SectionHeader number="05" title="Target Audience" />
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 500 }}>
                  Gender <EditedIndicator shown={editedFields.has('audienceGender')} />
                </Typography>
                <ChipMultiSelect
                  options={GENDERS.map((g) => g.label)}
                  value={(watch('audienceGender') || []).map(
                    (v) => GENDERS.find((g) => g.value === v)?.label || v
                  )}
                  onToggle={(label) => {
                    const opt = GENDERS.find((g) => g.label === label);
                    if (opt) toggleArrayField('audienceGender', opt.value);
                  }}
                  pill
                  disabled={readOnly}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 500 }}>
                  Age Range <EditedIndicator shown={editedFields.has('audienceAge')} />
                </Typography>
                <ChipMultiSelect
                  options={AGE_OPTIONS.map((o) => o.label)}
                  value={(watch('audienceAge') || []).map(
                    (v) => AGE_OPTIONS.find((o) => o.value === v)?.label || v
                  )}
                  onToggle={(label) => {
                    const opt = AGE_OPTIONS.find((o) => o.label === label);
                    if (opt) toggleArrayField('audienceAge', opt.value);
                  }}
                  pill
                  disabled={readOnly}
                />
              </Box>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 500 }}>
                  Country <EditedIndicator shown={editedFields.has('country')} />
                </Typography>
                <FieldWrap>
                  <RHFSelect
                    name="country"
                    size="small"
                    SelectProps={{
                      displayEmpty: true,
                      sx: { textTransform: 'none' },
                      MenuProps: { PaperProps: { sx: { maxHeight: 320 } } },
                      renderValue: selectPlaceholder('Select a country'),
                    }}
                    sx={noBoxSx}
                    onBlur={onBlurHandler('country')}
                    disabled={readOnly}
                  >
                    {COUNTRY_OPTIONS.map((c) => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))}
                  </RHFSelect>
                </FieldWrap>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 500 }}>
                  Language <EditedIndicator shown={editedFields.has('audienceLanguage')} />
                </Typography>
                <FieldWrap>
                  <RHFMultiSelect
                    name="audienceLanguage"
                    checkbox
                    size="small"
                    placeholder="Select one or more languages"
                    options={LANGUAGE_OPTIONS.map((l) => ({ value: l, label: l }))}
                    MenuProps={MULTISELECT_MENU_PROPS}
                    onBlur={onBlurHandler('audienceLanguage')}
                    disabled={readOnly}
                    sx={noBoxMultiSelectSx}
                  />
                </FieldWrap>
              </Box>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 500 }}>
                  Creator Niche{' '}
                  <EditedIndicator shown={editedFields.has('audienceCreatorPersona')} />
                </Typography>
                <FieldWrap>
                  <RHFMultiSelect
                    name="audienceCreatorPersona"
                    checkbox
                    size="small"
                    placeholder="What space should your Creators be in?"
                    options={CREATOR_NICHE_OPTIONS}
                    MenuProps={MULTISELECT_MENU_PROPS}
                    onBlur={onBlurHandler('audienceCreatorPersona')}
                    disabled={readOnly}
                    sx={noBoxMultiSelectSx}
                  />
                </FieldWrap>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 500 }}>
                  User Persona <EditedIndicator shown={editedFields.has('audienceUserPersona')} />
                </Typography>
                <FieldWrap>
                  <RHFTextField
                    name="audienceUserPersona"
                    placeholder="Describe your ideal customer"
                    size="small"
                    sx={noBoxSx}
                    onBlur={onBlurHandler('audienceUserPersona')}
                    disabled={readOnly}
                    fullWidth
                    multiline
                  />
                </FieldWrap>
              </Box>
            </Stack>
          </Stack>
        </Box>

        {/* 06. Additional Information */}
        <Box>
          <SectionHeader number="06" title="Additional Information" optional="OPTIONAL" />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 500 }}>
                Attachments
              </Typography>
              {/* Existing attachments (up to 3) */}
              {attachments.map((url, idx) => {
                const isDeleting = deletingUrl === url;
                return (
                  <Stack
                    key={url}
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mt: 1 }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                      <Iconify
                        icon="solar:document-bold"
                        width={18}
                        sx={{ color: '#1340FF', flexShrink: 0 }}
                      />
                      <Typography
                        component="a"
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          fontSize: 13,
                          color: '#1340FF',
                          textDecoration: 'underline',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {attachmentLabel(url, idx)}
                      </Typography>
                    </Stack>
                    {!readOnly && onDeleteAttachment && (
                      <Box
                        component="button"
                        type="button"
                        onClick={() => handleDeleteAttachment(url)}
                        disabled={isDeleting}
                        sx={{
                          border: 'none',
                          background: 'none',
                          p: 0,
                          fontFamily: 'inherit',
                          lineHeight: 'inherit',
                          letterSpacing: 'inherit',
                          cursor: isDeleting ? 'default' : 'pointer',
                          color: 'error.main',
                          fontWeight: 600,
                          fontSize: 12,
                          opacity: isDeleting ? 0.5 : 1,
                          flexShrink: 0,
                        }}
                      >
                        {isDeleting ? 'DELETING…' : 'DELETE'}
                      </Box>
                    )}
                  </Stack>
                );
              })}

              {/* Pending local files (public-submit mode — not yet uploaded) */}
              {pendingFiles.map(({ id, file }) => (
                <Stack
                  key={id}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mt: 1 }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                    <Iconify
                      icon="solar:document-bold"
                      width={18}
                      sx={{ color: '#1340FF', flexShrink: 0 }}
                    />
                    <Typography
                      sx={{
                        fontSize: 13,
                        color: '#0F172A',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {file.name}
                    </Typography>
                  </Stack>
                  {!readOnly && (
                    <Box
                      component="button"
                      type="button"
                      onClick={() => handleRemovePending(id)}
                      sx={{
                        border: 'none',
                        background: 'none',
                        p: 0,
                        fontFamily: 'inherit',
                        lineHeight: 'inherit',
                        letterSpacing: 'inherit',
                        cursor: 'pointer',
                        color: 'error.main',
                        fontWeight: 600,
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                    >
                      REMOVE
                    </Box>
                  )}
                </Stack>
              ))}

              {uploading && (
                <Box sx={{ mt: 1 }}>
                  <Typography sx={{ fontSize: 13, color: '#1340FF', fontWeight: 600 }}>
                    Uploading…
                  </Typography>
                  <UploadProgressBar />
                </Box>
              )}

              {/* Add control — shown until the limit is reached. Wired uploads
                  (BD/client edit) or local staging (public submit). */}
              {!uploading &&
                !readOnly &&
                (onUploadAttachment || isSubmitMode) &&
                (atAttachmentLimit ? (
                  <Typography sx={{ mt: 1, fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>
                    Maximum of {MAX_ATTACHMENTS} attachments reached.
                  </Typography>
                ) : (
                  <Box
                    component="label"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      mt: 1,
                      cursor: 'pointer',
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: 'Aileron, sans-serif',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '14px',
                        lineHeight: 1,
                        letterSpacing: '0em',
                        verticalAlign: 'middle',
                        color: '#9CA3AF',
                      }}
                    >
                      {attachmentCount > 0
                        ? `Add another file (${attachmentCount}/${MAX_ATTACHMENTS}) — PDF, JPG, PNG up to 25MB`
                        : 'Click to choose a file — PDF, JPG, PNG up to 25MB'}
                    </Typography>
                    <Box
                      component="span"
                      sx={{ color: '#1340FF', fontWeight: 600, fontSize: 12, flexShrink: 0 }}
                    >
                      BROWSE
                    </Box>
                    <input
                      type="file"
                      hidden
                      accept="application/pdf,image/jpeg,image/jpg,image/png"
                      onChange={handleFileSelect}
                    />
                  </Box>
                ))}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 500 }}>
                Geographic Focus <EditedIndicator shown={editedFields.has('geographicFocus')} />
              </Typography>
              <FieldWrap>
                <RHFSelect
                  name="geographicFocus"
                  size="small"
                  SelectProps={{
                    displayEmpty: true,
                    sx: { textTransform: 'none' },
                    MenuProps: { PaperProps: { sx: { maxHeight: 320 } } },
                    renderValue: selectPlaceholderLabel(
                      'Which geographic location would you like to focus on?',
                      GEO_FOCUS_OPTIONS
                    ),
                  }}
                  sx={noBoxSx}
                  onBlur={onBlurHandler('geographicFocus')}
                  disabled={readOnly}
                >
                  {GEO_FOCUS_OPTIONS.map((g) => (
                    <MenuItem key={g.value} value={g.value}>
                      {g.label}
                    </MenuItem>
                  ))}
                </RHFSelect>
              </FieldWrap>
              {watch('geographicFocus') === 'others' && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 500 }}>
                    Geographic Focus (Others){' '}
                    <EditedIndicator shown={editedFields.has('geographicFocusOthers')} />
                  </Typography>
                  <FieldWrap>
                    <RHFTextField
                      name="geographicFocusOthers"
                      placeholder="Specify your geographic focus"
                      size="small"
                      sx={noBoxSx}
                      onBlur={onBlurHandler('geographicFocusOthers')}
                      disabled={readOnly}
                      fullWidth
                      inputProps={{ maxLength: 200 }}
                    />
                  </FieldWrap>
                </Box>
              )}
            </Box>
          </Stack>
          <Box>
            <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 500 }}>
              Notes <EditedIndicator shown={editedFields.has('extraNotes')} />
            </Typography>
            <FieldWrap>
              <RHFTextField
                name="extraNotes"
                placeholder="Anything else we should know?"
                size="small"
                sx={noBoxSx}
                onBlur={onBlurHandler('extraNotes')}
                disabled={readOnly}
                fullWidth
                multiline
              />
            </FieldWrap>
          </Box>
        </Box>

        {isSubmitMode && (
          <Box>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Button
                onClick={() => reset(EMPTY_VALUES)}
                disabled={submitting}
                sx={{
                  // Shrink on mobile so it shares space with Submit instead of
                  // forcing the row to overflow; keeps its width on larger screens.
                  flexShrink: { xs: 1, sm: 0 },
                  minWidth: 0,
                  py: 1.5,
                  px: { xs: 2, sm: 6 },
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: 15,
                  color: '#0F172A',
                  bgcolor: '#FFFFFF',
                  border: '1px solid #E7E7E7',
                  boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                  '&:hover': {
                    bgcolor: '#FFFFFF',
                    border: '1px solid #E7E7E7',
                    boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                  },
                }}
              >
                Reset form
              </Button>
              <Button
                onClick={submit}
                disabled={submitting}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  whiteSpace: 'nowrap',
                  py: 1.5,
                  px: { xs: 1, sm: 2 },
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: 15,
                  color: '#FFFFFF',
                  bgcolor: '#1340FF',
                  boxShadow: '0px -3px 0px 0px rgba(0,0,0,0.25) inset',
                  '&:hover': {
                    bgcolor: '#0F33CC',
                    boxShadow: '0px -3px 0px 0px rgba(0,0,0,0.25) inset',
                  },
                  '&.Mui-disabled': { bgcolor: '#1340FF', color: '#FFFFFF', opacity: 0.5 },
                }}
              >
                {submitting ? 'Submitting…' : 'Submit brief'}
              </Button>
            </Stack>
          </Box>
        )}
      </Stack>
    </FormProvider>
  );
}

BriefForm.propTypes = {
  brief: PropTypes.object,
  mode: PropTypes.oneOf(['bd-author', 'client-public', 'bd-review', 'public-submit']),
  onSavePatch: PropTypes.func,
  onSubmit: PropTypes.func,
  submitting: PropTypes.bool,
  onUploadAttachment: PropTypes.func,
  onDeleteAttachment: PropTypes.func,
  readOnly: PropTypes.bool,
  clearSignal: PropTypes.number,
  resetSignal: PropTypes.number,
};
