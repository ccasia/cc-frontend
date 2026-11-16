import PropTypes from 'prop-types';
import { memo, useRef, useEffect } from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { useFieldArray, useFormContext } from 'react-hook-form';

import {
  Box,
  Stack,
  FormLabel,
  ButtonBase,
  Typography,
  IconButton,
  useMediaQuery,
  FormHelperText,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import { RHFTextField } from 'src/components/hook-form';
import { SECONDARY_ACTION_SX } from 'src/components/campaign/action-button-styles';

import { EASE_OUT } from '../components/motion';
import SectionIn from '../components/section-in';
import ChipSelect from '../components/chip-select';
import useScrollToFirstError from '../components/use-scroll-to-first-error';
import { FIELD_HEIGHT, singleLineSx, helperTextSx } from '../components/field-styles';
import {
  BLUE,
  cardSx,
  titleSx,
  ToggleCard,
  cardIconSx,
  descriptionSx,
} from '../components/option-card';

const LOGISTICS_TYPES = {
  PRODUCT_DELIVERY: {
    title: 'Product Delivery',
    description: 'Send products to creators by courier.',
  },
  RESERVATION: {
    title: 'Reservation',
    description: 'Creators book a time slot to visit your outlet.',
  },
};
const TYPE_OPTIONS = Object.keys(LOGISTICS_TYPES);
const typeTitle = (type) => LOGISTICS_TYPES[type]?.title ?? type;
const typeDescription = (type) => LOGISTICS_TYPES[type]?.description;

const SCHEDULING_OPTIONS = [
  {
    value: 'confirmation',
    icon: 'eva:person-done-outline',
    title: 'Ask for my confirmation',
    description: 'I approve each time a creator asks to reschedule.',
  },
  {
    value: 'auto',
    icon: 'eva:flash-outline',
    title: 'Auto-schedule',
    description: 'Creators book their time slots with no approval needed.',
  },
];

const LOCATION_COLUMNS = [
  { key: 'name', title: 'Outlet', placeholder: 'e.g. Pavilion KL' },
  { key: 'pic', title: 'PIC', optional: true, placeholder: 'e.g. Aisyah' },
  {
    key: 'contactNumber',
    title: 'Contact number',
    optional: true,
    placeholder: 'e.g. 012-345 6789',
    inputProps: { inputMode: 'tel' },
  },
];

const EMPTY_LOCATION = { name: '', pic: '', contactNumber: '' };

const FormField = ({ label, hint, required = false, children }) => (
  <Stack spacing={0.75}>
    <Stack spacing={0.25}>
      <FormLabel
        required={required}
        sx={{
          fontWeight: 700,
          fontSize: '0.875rem',
          color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
          '& .MuiFormLabel-asterisk': { color: '#FF3500' },
        }}
      >
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

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  hint: PropTypes.node,
  required: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

const removeButtonSx = {
  ...SECONDARY_ACTION_SX,
  width: FIELD_HEIGHT,
  minWidth: FIELD_HEIGHT,
  height: FIELD_HEIGHT,
  p: 0,
  pb: '3px',
  flexShrink: 0,
  color: '#8E8E93',
  transition: `${SECONDARY_ACTION_SX.transition}, color 140ms ease-out`,
  '@media (hover: hover) and (pointer: fine)': {
    '&:hover:not(:disabled)': { color: '#FF5630' },
  },
  '&.Mui-disabled': { ...SECONDARY_ACTION_SX['&.Mui-disabled'], opacity: 0.5 },
};

const addButtonSx = {
  ...SECONDARY_ACTION_SX,
  alignSelf: 'flex-start',
  height: 36,
  px: 1.5,
  pt: '7px',
  pb: '10px',
  gap: 0.75,
  fontSize: 14,
  lineHeight: '18px',
  color: '#3A3A3C',
};

const hiddenInputSx = {
  position: 'absolute',
  opacity: 0,
  width: 1,
  height: 1,
  m: 0,
  pointerEvents: 'none',
};

function PickMark({ selected }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: 18,
        height: 18,
        mt: '1px',
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
        borderRadius: '50%',
        border: '1.5px solid',
        borderColor: selected ? BLUE : '#C4CDD5',
        bgcolor: selected ? BLUE : '#FFFFFF',
        color: '#FFFFFF',
        transition: 'background-color 150ms ease, border-color 150ms ease',
      }}
    >
      <Iconify
        icon="eva:checkmark-fill"
        width={12}
        sx={{
          opacity: selected ? 1 : 0,
          transform: selected ? 'scale(1)' : 'scale(0.6)',
          transition: `opacity 150ms ease, transform 200ms ${EASE_OUT}`,
          '@media (prefers-reduced-motion: reduce)': { transform: 'none' },
        }}
      />
    </Box>
  );
}

PickMark.propTypes = { selected: PropTypes.bool };

const ROW_EASE = [0.23, 1, 0.32, 1];

// A row added with the button opens its height, so the button below glides down. A removed
// row leaves at once: during an exit its inputs would already show the next row's values.
function Row({ appear, instant, children }) {
  return (
    <m.div
      initial={appear ? { height: 0, opacity: 0 } : false}
      animate={{ height: 'auto', opacity: 1 }}
      transition={instant ? { duration: 0 } : { duration: 0.2, ease: ROW_EASE }}
      style={{ overflow: 'hidden' }}
    >
      {children}
    </m.div>
  );
}

Row.propTypes = { appear: PropTypes.bool, instant: PropTypes.bool, children: PropTypes.node };

function RemoveButton({ label, disabled, onClick }) {
  return (
    <IconButton aria-label={label} disabled={disabled} onClick={onClick} sx={removeButtonSx}>
      <Iconify icon="eva:trash-2-outline" width={20} />
    </IconButton>
  );
}

RemoveButton.propTypes = {
  label: PropTypes.string,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
};

function AddButton({ children, onClick }) {
  return (
    <ButtonBase sx={addButtonSx} onClick={onClick}>
      <Iconify icon="mingcute:add-line" width={16} sx={{ color: '#1340FF' }} />
      {children}
    </ButtonBase>
  );
}

AddButton.propTypes = { children: PropTypes.node, onClick: PropTypes.func };

const CampaignLogistics = () => {
  const {
    watch,
    setValue,
    control,
    getValues,
    trigger,
    formState: { errors },
  } = useFormContext();
  const reduceMotion = useReducedMotion();
  // Phones hide the column headers, so each placeholder names its field
  const showHeaders = useMediaQuery((theme) => theme.breakpoints.up('sm'));
  const containerRef = useRef(null);
  useScrollToFirstError(containerRef);

  const logisticsType = watch('logisticsType');
  const schedulingOption = watch('schedulingOption');
  const allowMultipleBookings = !!watch('allowMultipleBookings');

  const {
    fields: productFields,
    append: appendProduct,
    remove: removeProduct,
  } = useFieldArray({ control, name: 'products' });

  const {
    fields: locationFields,
    append: appendLocation,
    remove: removeLocation,
  } = useFieldArray({ control, name: 'locations' });

  // A type change resets what the other type needs; the first render keeps a loaded draft
  const previousType = useRef(logisticsType);
  useEffect(() => {
    if (previousType.current === logisticsType) return;
    previousType.current = logisticsType;
    const dirty = { shouldDirty: true };
    if (logisticsType === 'PRODUCT_DELIVERY') {
      setValue('schedulingOption', '', dirty);
    } else if (logisticsType === 'RESERVATION') {
      setValue('schedulingOption', 'confirmation', dirty);
    } else {
      setValue('schedulingOption', '', dirty);
      setValue('products', [{ name: '' }], dirty);
      setValue('locations', [EMPTY_LOCATION], dirty);
    }
  }, [logisticsType, setValue]);

  // Each type always shows at least one row to type in
  useEffect(() => {
    if (logisticsType === 'PRODUCT_DELIVERY' && productFields.length === 0) {
      appendProduct({ name: '' }, { shouldFocus: false });
    }
    if (logisticsType === 'RESERVATION' && locationFields.length === 0) {
      appendLocation(EMPTY_LOCATION, { shouldFocus: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logisticsType]);

  // The list the Add button just grew; its new last row opens and takes focus
  const added = useRef(null);
  const isNewRow = (list, index) => {
    const count = list === 'products' ? productFields.length : locationFields.length;
    return added.current === list && index === count - 1;
  };
  const addRow = (list) => {
    added.current = list;
    if (list === 'products') appendProduct({ name: '' }, { shouldFocus: false });
    else appendLocation(EMPTY_LOCATION, { shouldFocus: false });
  };
  // RHFTextField's ref is the field box, not the input, so focus the input by its name
  useEffect(() => {
    const list = added.current;
    if (!list) return;
    added.current = null;
    const count = list === 'products' ? productFields.length : locationFields.length;
    containerRef.current
      ?.querySelector(`input[name="${list}.${count - 1}.name"]`)
      ?.focus({ preventScroll: true });
  }, [productFields.length, locationFields.length]);

  // A list-level error (from the schema's .test) sits under `root` for a field array
  const listError = (name) => {
    const message = errors[name]?.root?.message ?? errors[name]?.message;
    return typeof message === 'string' ? message : '';
  };
  const productsError = listError('products');
  const locationsError = listError('locations');

  // Once an error shows, typing re-checks the list, so the error leaves as soon as it is fixed
  const recheck = (name) => {
    if (errors[name]) trigger(name);
  };

  return (
    <Box
      ref={containerRef}
      sx={{ maxWidth: 600, mx: 'auto', px: { xs: 0, sm: 3 }, pt: 3, mb: 10, ...helperTextSx }}
    >
      <Stack spacing={3}>
        <FormField label="Logistics Type" hint="Optional. Leave empty if creators need nothing.">
          <ChipSelect
            single
            clearable
            name="logisticsType"
            options={TYPE_OPTIONS}
            getTitle={typeTitle}
            getDescription={typeDescription}
            placeholder="Select logistics type"
          />
        </FormField>

        {logisticsType === 'PRODUCT_DELIVERY' && (
          <SectionIn component={Stack} key="products" spacing={1.5}>
            <FormField label="Products" required>
              <>
                {productFields.map((field, index) => (
                  <Row key={field.id} appear={isNewRow('products', index)} instant={!!reduceMotion}>
                    <Stack direction="row" spacing={1} sx={{ pb: 1 }}>
                      <RHFTextField
                        fullWidth
                        size="small"
                        placeholder="Product name"
                        name={`products.${index}.name`}
                        onKeyUp={() => recheck('products')}
                        error={!!productsError && !getValues(`products.${index}.name`)?.trim()}
                        sx={singleLineSx}
                      />
                      <RemoveButton
                        label="Remove product"
                        disabled={productFields.length === 1}
                        onClick={() => removeProduct(index)}
                      />
                    </Stack>
                  </Row>
                ))}
              </>
              {productsError && (
                <FormHelperText error sx={{ mt: '-2px !important' }}>
                  {productsError}
                </FormHelperText>
              )}
            </FormField>
            <AddButton onClick={() => addRow('products')}>Add product</AddButton>
          </SectionIn>
        )}

        {logisticsType === 'RESERVATION' && (
          <SectionIn component={Stack} key="reservation" spacing={3}>
            <Stack spacing={1.5}>
              <FormField label="Scheduling Option" required>
                <Stack
                  role="radiogroup"
                  aria-label="Scheduling option"
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                >
                  {SCHEDULING_OPTIONS.map((option) => {
                    const selected = schedulingOption === option.value;
                    return (
                      <Box
                        key={option.value}
                        component="label"
                        sx={{ ...cardSx(selected), flex: 1 }}
                      >
                        <Box
                          component="input"
                          type="radio"
                          name="schedulingOption"
                          value={option.value}
                          checked={selected}
                          onChange={() =>
                            setValue('schedulingOption', option.value, { shouldDirty: true })
                          }
                          sx={hiddenInputSx}
                        />
                        <Iconify
                          icon={option.icon}
                          width={20}
                          sx={{ mt: '1px', ...cardIconSx(selected) }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={titleSx(selected)}>{option.title}</Typography>
                          <Typography sx={descriptionSx}>{option.description}</Typography>
                        </Box>
                        <PickMark selected={selected} />
                      </Box>
                    );
                  })}
                </Stack>
              </FormField>

              <ToggleCard
                icon="eva:people-outline"
                title="Allow multiple creators per time slot"
                description={
                  allowMultipleBookings
                    ? 'Several creators can visit your outlet at the same time.'
                    : 'Each time slot is for one creator only.'
                }
                checked={allowMultipleBookings}
                onChange={(checked) =>
                  setValue('allowMultipleBookings', checked, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              />
            </Stack>
            <Stack spacing={1.5}>
              <FormField label="Locations" required>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ display: { xs: 'none', sm: 'flex' }, pr: `${FIELD_HEIGHT + 8}px` }}
                >
                  {LOCATION_COLUMNS.map((column) => (
                    <Typography
                      key={column.key}
                      sx={{
                        flex: 1,
                        fontSize: 12,
                        lineHeight: '16px',
                        fontWeight: 600,
                        color: '#636366',
                      }}
                    >
                      {column.title}
                      {column.optional && (
                        <Box component="span" sx={{ fontWeight: 400, color: '#8E8E93' }}>
                          {' '}
                          (optional)
                        </Box>
                      )}
                    </Typography>
                  ))}
                </Stack>
                <>
                  {locationFields.map((field, index) => (
                    <Row
                      key={field.id}
                      appear={isNewRow('locations', index)}
                      instant={!!reduceMotion}
                    >
                      <Stack direction="row" spacing={1} sx={{ pb: 1 }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flex: 1 }}>
                          {LOCATION_COLUMNS.map((column) => (
                            <RHFTextField
                              key={column.key}
                              size="small"
                              name={`locations.${index}.${column.key}`}
                              placeholder={
                                showHeaders
                                  ? column.placeholder
                                  : `${column.title}${column.optional ? ' (optional)' : ''}`
                              }
                              inputProps={{ 'aria-label': column.title, ...column.inputProps }}
                              {...(column.key === 'name' && {
                                onKeyUp: () => recheck('locations'),
                                error:
                                  !!locationsError && !getValues(`locations.${index}.name`)?.trim(),
                              })}
                              sx={{ flex: 1, ...singleLineSx }}
                            />
                          ))}
                        </Stack>
                        <RemoveButton
                          label="Remove location"
                          disabled={locationFields.length === 1}
                          onClick={() => removeLocation(index)}
                        />
                      </Stack>
                    </Row>
                  ))}
                </>
                {locationsError && (
                  <FormHelperText error sx={{ mt: '-2px !important' }}>
                    {locationsError}
                  </FormHelperText>
                )}
              </FormField>
              <AddButton onClick={() => addRow('locations')}>Add location</AddButton>
            </Stack>
          </SectionIn>
        )}
      </Stack>
    </Box>
  );
};

export default memo(CampaignLogistics);
