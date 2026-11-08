import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { useDropzone } from 'react-dropzone';
import { useFormContext } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';
import { useRef, useState, useEffect, useCallback } from 'react';

import {
  Box,
  Stack,
  Avatar,
  Button,
  FormLabel,
  TextField,
  ButtonBase,
  IconButton,
  Typography,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import { RHFTextField, RHFDatePicker } from 'src/components/hook-form';
import { SECONDARY_ACTION_SX } from 'src/components/campaign/action-button-styles';

import ChipSelect from 'src/sections/campaign/create/components/chip-select';
import { EASE_OUT, sectionInSx } from 'src/sections/campaign/create/components/motion';
import {
  multiLineSx,
  singleLineSx,
  helperTextSx,
} from 'src/sections/campaign/create/components/field-styles';

// The Create company dialog in the look of the create-campaign modal: labels above
// the fields, 50px fields, chip pickers and the same blue for progress.

export const companyDialogPaperSx = {
  width: 640,
  maxWidth: '100%',
  m: 2,
  p: 3,
  bgcolor: '#FFFFFF',
  borderRadius: '12px',
  boxShadow: '0px 24px 48px rgba(35, 31, 32, 0.16)',
  ...helperTextSx,
};

export const closeButtonSx = {
  position: 'absolute',
  top: 12,
  right: 12,
  zIndex: 1,
  width: 40,
  height: 40,
  color: '#636366',
  transition: `color 140ms ease, background-color 140ms ease, transform 140ms ${EASE_OUT}`,
  '@media (hover: hover) and (pointer: fine)': {
    '&:hover': { bgcolor: 'rgba(35, 31, 32, 0.06)', color: '#231F20' },
  },
  '@media (prefers-reduced-motion: no-preference)': { '&:active': { transform: 'scale(0.92)' } },
};

const twoColumnSx = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
  columnGap: 2,
  rowGap: 2.5,
};

const fullRowSx = { gridColumn: '1 / -1' };

export const COMPANY_STEP_LABELS = ['Company', 'Person in charge', 'Package'];

const STEP_ICONS = ['solar:buildings-2-linear', 'solar:user-linear', 'solar:box-linear'];

const CLIENT_TYPES = { agency: 'Agency', directClient: 'Direct Client' };
const CURRENCIES = ['MYR', 'SGD'];

function FormField({ label, icon, hint, required = true, children, sx }) {
  return (
    <Stack spacing={0.75} sx={{ minWidth: 0, ...sx }}>
      <Stack spacing={0.25}>
        <FormLabel
          required={required}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            fontWeight: 700,
            color: 'black',
            fontSize: '0.875rem',
            // The gap is for the icon; the asterisk stays tight to the title
            '& .MuiFormLabel-asterisk': {
              display: required ? 'inline-block' : 'none',
              ml: -0.5,
              color: '#FF3500',
            },
          }}
        >
          {icon && (
            <Iconify icon={icon} width={14} sx={{ color: 'inherit', flexShrink: 0 }} />
          )}
          {label}
        </FormLabel>
        {hint && (
          <Typography variant="caption" color="#8E8E93">
            {hint}
          </Typography>
        )}
      </Stack>
      {children}
    </Stack>
  );
}

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.string,
  hint: PropTypes.string,
  required: PropTypes.bool,
  children: PropTypes.node,
  sx: PropTypes.object,
};

const field = (name, placeholder, extra = {}) => (
  <RHFTextField name={name} placeholder={placeholder} size="small" sx={singleLineSx} {...extra} />
);

const longField = (name, placeholder, minRows) => (
  <RHFTextField
    name={name}
    placeholder={placeholder}
    size="small"
    multiline
    minRows={minRows}
    maxRows={6}
    sx={multiLineSx}
  />
);

const BLUE = '#1340FF';

const stepCircleSx = (state) => ({
  display: 'grid',
  placeItems: 'center',
  width: 22,
  height: 22,
  flexShrink: 0,
  borderRadius: '50%',
  transition: 'background-color 200ms ease, border-color 200ms ease, color 200ms ease',
  ...(state === 'done' && { bgcolor: BLUE, color: '#FFFFFF', border: `1.5px solid ${BLUE}` }),
  ...(state === 'current' && { bgcolor: '#FFFFFF', color: BLUE, border: `1.5px solid ${BLUE}` }),
  ...(state === 'upcoming' && {
    bgcolor: '#F4F4F4',
    color: '#8E8E93',
    border: '1.5px solid #E7E7E7',
  }),
});

const stepLabelColor = { done: '#231F20', current: BLUE, upcoming: '#8E8E93' };

// A bar per step that fills blue as you reach it, with an icon and label under it.
// A done step's icon sits on a filled blue circle.
// Done steps can be clicked to go back; later steps open only through Next.
export function CompanyDialogSteps({ activeStep, onStepClick }) {
  return (
    <Box
      component="ol"
      aria-label="Steps"
      sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1, m: 0, p: 0 }}
    >
      {COMPANY_STEP_LABELS.map((label, index) => {
        let state = 'upcoming';
        if (index < activeStep) state = 'done';
        if (index === activeStep) state = 'current';
        const done = state === 'done';
        return (
          <Box component="li" key={label} sx={{ listStyle: 'none', minWidth: 0 }}>
            <ButtonBase
              disabled={!done}
              onClick={() => onStepClick(index)}
              aria-current={state === 'current' ? 'step' : undefined}
              aria-label={`${label}${done ? ', done' : ''}`}
              sx={{
                display: 'block',
                width: 1,
                textAlign: 'left',
                borderRadius: '6px',
                '&:focus-visible': { outline: `2px solid ${BLUE}`, outlineOffset: 3 },
                '@media (hover: hover) and (pointer: fine)': {
                  '&:hover .step-label': { textDecoration: done ? 'underline' : 'none' },
                },
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  height: 4,
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: '#E7E7E7',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    bgcolor: BLUE,
                    transformOrigin: 'left',
                    transform: state === 'upcoming' ? 'scaleX(0)' : 'scaleX(1)',
                    transition: `transform 300ms ${EASE_OUT}`,
                    '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                  },
                }}
              />
              <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 1 }}>
                <Box component="span" sx={stepCircleSx(state)}>
                  <Iconify icon={STEP_ICONS[index]} width={13} />
                </Box>
                <Typography
                  component="span"
                  className="step-label"
                  noWrap
                  sx={{
                    fontSize: 13,
                    lineHeight: '18px',
                    fontWeight: state === 'upcoming' ? 500 : 600,
                    color: stepLabelColor[state],
                    transition: 'color 200ms ease',
                  }}
                >
                  {label}
                </Typography>
              </Stack>
            </ButtonBase>
          </Box>
        );
      })}
    </Box>
  );
}

CompanyDialogSteps.propTypes = {
  activeStep: PropTypes.number.isRequired,
  onStepClick: PropTypes.func.isRequired,
};

// The step body keeps the tallest height it has had, so a shorter step does not
// shrink the dialog and move the buttons. It resets when the dialog closes. A callback
// ref, because the dialog draws its content after this component's own effects run,
// and each step is a new node.
export function useSteadyHeight(open) {
  const [minHeight, setMinHeight] = useState(0);
  const observer = useRef(null);

  useEffect(() => {
    if (!open) setMinHeight(0);
  }, [open]);

  useEffect(() => () => observer.current?.disconnect(), []);

  const ref = useCallback((node) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!node) return;
    const grow = () => setMinHeight((current) => Math.max(current, node.offsetHeight));
    grow();
    observer.current = new ResizeObserver(grow);
    observer.current.observe(node);
  }, []);

  return [ref, minHeight];
}

const compactButtonSx = {
  ...SECONDARY_ACTION_SX,
  height: 32,
  px: 1.25,
  pt: '5px',
  pb: '8px',
  fontSize: 13,
  lineHeight: '18px',
  '& .MuiButton-startIcon': { mr: 0.5 },
};

// With no logo the whole row takes a click or a dropped image. With one, the row
// shows it and offers Edit (crop again from the original), Replace and Remove.
function LogoPicker({ image, onPick, onEdit, onRemove }) {
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: (files) => files[0] && onPick(files[0]),
    multiple: false,
    noClick: !!image,
    noKeyboard: !!image,
    accept: { 'image/*': [] },
  });

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={2}
      {...getRootProps()}
      sx={{
        p: 1.5,
        borderRadius: '12px',
        border: '1px dashed',
        borderColor: isDragActive ? BLUE : '#E0E0E0',
        bgcolor: isDragActive ? '#F5F7FF' : '#FAFAFA',
        cursor: image ? 'default' : 'pointer',
        transition: 'border-color 150ms ease, background-color 150ms ease',
        ...(!image && {
          '@media (hover: hover) and (pointer: fine)': {
            '&:hover': { borderColor: '#BDBDBD', bgcolor: '#F5F5F5' },
          },
        }),
        '&:focus-visible': { outline: `2px solid ${BLUE}`, outlineOffset: 2 },
      }}
    >
      <input {...getInputProps()} />
      <Avatar
        src={image || undefined}
        variant="rounded"
        alt={image ? 'Company logo' : undefined}
        sx={{
          width: 56,
          height: 56,
          borderRadius: '10px',
          bgcolor: '#FFFFFF',
          color: '#8E8E93',
          border: '1px solid #EBEBEB',
        }}
      >
        <Iconify icon="solar:gallery-add-linear" width={24} />
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, lineHeight: '20px', color: '#231F20' }}>
          {image ? 'Company logo' : 'Upload company logo'}
        </Typography>
        <Typography sx={{ fontSize: 13, lineHeight: '18px', color: '#8E8E93' }}>
          {image
            ? 'Drop a new image here to replace it.'
            : 'Click or drop an image. You can crop it next.'}
        </Typography>
      </Box>
      {image && (
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ flexShrink: 0 }}>
          <Button
            onClick={onEdit}
            startIcon={<Iconify icon="solar:crop-linear" width={16} />}
            sx={compactButtonSx}
          >
            Edit
          </Button>
          <Button onClick={open} sx={compactButtonSx}>
            Replace
          </Button>
          <IconButton
            aria-label="Remove logo"
            onClick={onRemove}
            sx={{
              width: 32,
              height: 32,
              color: '#8E8E93',
              '@media (hover: hover) and (pointer: fine)': {
                '&:hover': { color: '#FF5630', bgcolor: 'rgba(255, 86, 48, 0.08)' },
              },
            }}
          >
            <Iconify icon="solar:trash-bin-trash-linear" width={18} />
          </IconButton>
        </Stack>
      )}
    </Stack>
  );
}

LogoPicker.propTypes = {
  image: PropTypes.string,
  onPick: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

export function CompanyDetailsStep({ image, onPickLogo, onEditLogo, onRemoveLogo }) {
  return (
    <Stack spacing={2.5} sx={sectionInSx}>
      <LogoPicker image={image} onPick={onPickLogo} onEdit={onEditLogo} onRemove={onRemoveLogo} />
      <Box sx={twoColumnSx}>
        <FormField label="Company Name" icon="solar:buildings-2-linear">{field('companyName', 'Company name')}</FormField>
        <FormField label="Client Type" icon="solar:tag-horizontal-linear">
          <ChipSelect
            single
            name="type"
            options={Object.keys(CLIENT_TYPES)}
            getTitle={(value) => CLIENT_TYPES[value] ?? value}
            placeholder="Select client type"
          />
        </FormField>
        <FormField label="Phone" icon="solar:phone-linear">{field('companyPhone', 'Phone number')}</FormField>
        <FormField label="Website" icon="solar:global-linear" required={false}>
          {field('companyWebsite', 'https://')}
        </FormField>
        <FormField label="Registration Number" icon="solar:document-text-linear" required={false}>
          {field('companyRegistrationNumber', 'Registration number')}
        </FormField>
        <FormField label="Address" icon="solar:map-point-linear" required={false}>
          {longField('companyAddress', 'Company address', 1)}
        </FormField>
        <FormField label="About" icon="solar:notes-linear" required={false} sx={fullRowSx}>
          {longField('companyAbout', 'What the company does', 3)}
        </FormField>
      </Box>
    </Stack>
  );
}

CompanyDetailsStep.propTypes = {
  image: PropTypes.string,
  onPickLogo: PropTypes.func.isRequired,
  onEditLogo: PropTypes.func.isRequired,
  onRemoveLogo: PropTypes.func.isRequired,
};

export function PersonInChargeStep() {
  return (
    <Box sx={{ ...twoColumnSx, ...sectionInSx }}>
      <FormField label="Name" icon="solar:user-linear">{field('personInChargeName', 'Full name')}</FormField>
      <FormField label="Designation" icon="solar:case-minimalistic-linear">
        {field('personInChargeDesignation', 'e.g. Marketing Manager')}
      </FormField>
      <FormField label="Email" icon="solar:letter-linear" sx={fullRowSx}>
        {field('personInChargeEmail', 'name@company.com', { type: 'email' })}
      </FormField>
    </Box>
  );
}

const blockSignsAndExponent = (event) => {
  if (event.key === '-' || event.key === 'e') event.preventDefault();
};

export function PackageStep({ packages }) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();
  const packageType = watch('packageType');
  const currency = watch('currency');
  const invoiceDate = watch('invoiceDate');
  const validityPeriod = watch('validityPeriod');
  const packageValue = watch('packageValue');
  const isCustom = packageType === 'Custom';

  // Basic is retired, so it is not offered
  const packageOptions = [
    ...(packages || [])
      .filter((item) => !['custom', 'basic'].includes(item.name?.toLowerCase()))
      .map((item) => item.id),
    'Custom',
  ];
  const packageTitle = (id) =>
    id === 'Custom' ? 'Custom' : ((packages || []).find((item) => item.id === id)?.name ?? id);

  return (
    <Box sx={{ ...twoColumnSx, ...sectionInSx }}>
      <FormField label="Package Type" icon="solar:box-linear">
        <ChipSelect
          single
          name="packageType"
          options={packageOptions}
          getTitle={packageTitle}
          placeholder="Select package"
        />
      </FormField>
      <FormField label="Currency" icon="solar:dollar-minimalistic-linear">
        <ChipSelect
          single
          name="currency"
          options={CURRENCIES}
          placeholder="Select currency"
        />
      </FormField>

      {packageType && currency && (
        <>
          <FormField label="Package ID" icon="solar:hashtag-linear" required={false} sx={sectionInSx}>
            {field('subsID', 'Package ID', { disabled: !isCustom })}
          </FormField>
          <FormField label="Package Value" icon="solar:wallet-money-linear" sx={sectionInSx}>
            <NumericFormat
              value={packageValue}
              disabled={!isCustom}
              customInput={TextField}
              thousandSeparator
              prefix={currency === 'MYR' ? 'RM ' : '$ '}
              decimalScale={2}
              fixedDecimalScale
              allowNegative={false}
              onValueChange={(items) => setValue('packageValue', items.value)}
              placeholder={`Price in ${currency}`}
              size="small"
              fullWidth
              error={!!errors.packageValue}
              helperText={errors.packageValue?.message}
              sx={singleLineSx}
            />
          </FormField>
          <FormField label="Total UGC Credits" icon="solar:ticket-linear" sx={sectionInSx}>
            {field('totalUGCCredits', 'UGC credits', {
              disabled: !isCustom,
              type: isCustom ? 'number' : 'text',
              onKeyDown: blockSignsAndExponent,
              InputProps: { inputProps: { min: 1 } },
            })}
          </FormField>
          <FormField label="Validity Period" icon="solar:clock-circle-linear" sx={sectionInSx}>
            {field('validityPeriod', 'Months', {
              disabled: !isCustom,
              type: isCustom ? 'number' : 'text',
              onKeyDown: blockSignsAndExponent,
              InputProps: { inputProps: { min: 1 } },
              helperText:
                invoiceDate && validityPeriod
                  ? `Valid until ${dayjs(invoiceDate).add(validityPeriod, 'month').format('LL')}`
                  : '',
            })}
          </FormField>
          <FormField label="Invoice Date" icon="solar:calendar-linear" sx={sectionInSx}>
            <RHFDatePicker name="invoiceDate" sx={singleLineSx} />
          </FormField>
        </>
      )}
    </Box>
  );
}

PackageStep.propTypes = {
  packages: PropTypes.array,
};
