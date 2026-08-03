import dayjs from 'dayjs';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller } from 'react-hook-form';
import {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useCallback,
  useLayoutEffect,
  useImperativeHandle,
} from 'react';

import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import useGetPackages from 'src/hooks/use-get-packges';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFSelect, RHFTextField } from 'src/components/hook-form';

const CUSTOM = 'custom';

const AttachSchema = Yup.object().shape({
  clientMode: Yup.string().oneOf(['new', 'existing']).required(),
  company: Yup.object()
    .nullable()
    .when('clientMode', {
      is: 'existing',
      then: (s) => s.required('Select an existing client.'),
    }),
  // Whether we're showing the package section at all (derived, kept in the form
  // so the conditional validation below can read it).
  showPackageFields: Yup.boolean(),
  packageId: Yup.string().when('showPackageFields', {
    is: true,
    then: (s) => s.required('Pick a client package.'),
  }),
  currency: Yup.string(),
  // These hold either a string (mirrored from a predefined package) or a number
  // (typed into a Custom `type="number"` field), so validate with mixed().
  pkgValue: Yup.mixed().when(['showPackageFields', 'packageId'], {
    is: (show, id) => show && id === CUSTOM,
    then: (s) => s.test('pos', 'Enter a value.', (v) => Number(v) > 0),
  }),
  pkgCredits: Yup.mixed().when(['showPackageFields', 'packageId'], {
    is: (show, id) => show && id === CUSTOM,
    then: (s) => s.test('pos', 'Enter credits.', (v) => Number(v) > 0),
  }),
  pkgValidity: Yup.mixed().when(['showPackageFields', 'packageId'], {
    is: (show, id) => show && id === CUSTOM,
    then: (s) => s.test('pos', 'Enter a validity period.', (v) => Number(v) > 0),
  }),
});

const AttachClientPackage = forwardRef(({ brief }, ref) => {
  const { data: packages, isLoading: packagesLoading } = useGetPackages();

  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);

  const methods = useForm({
    resolver: yupResolver(AttachSchema),
    defaultValues: {
      clientMode: 'new',
      company: null,
      showPackageFields: true,
      attachNewPackage: false,
      packageId: '',
      currency: 'MYR',
      pkgValue: '',
      pkgCredits: '',
      pkgValidity: '',
    },
  });

  const { control, watch, setValue, getValues, trigger } = methods;

  const clientMode = watch('clientMode');

  // Segmented-toggle sliding pill geometry, measured from the active button so
  // each option can hug its own text with equal left/right padding.
  const modeOptions = [
    { value: 'new', label: 'New Client' },
    { value: 'existing', label: 'Existing Client' },
  ];
  const toggleBtnRefs = useRef([]);
  const [pill, setPill] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const idx = Math.max(
      0,
      modeOptions.findIndex((o) => o.value === clientMode)
    );
    const el = toggleBtnRefs.current[idx];
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientMode]);
  const company = watch('company');
  const attachNewPackage = watch('attachNewPackage');
  const packageId = watch('packageId');
  const currency = watch('currency');

  const isCustom = packageId === CUSTOM;

  const existingHasActivePackage =
    clientMode === 'existing' &&
    Number(company?.creditSummary?.activePackagesCount || 0) > 0;

  const showPackageFields =
    clientMode === 'new' || !existingHasActivePackage || attachNewPackage;

  const selectedPackage = (packages || []).find((p) => p.id === packageId) || null;
  const selectedPrice = selectedPackage?.prices?.find((pr) => pr.currency === currency)?.amount;

  // Keep the derived `showPackageFields` in the form so Yup can gate on it.
  useEffect(() => {
    setValue('showPackageFields', showPackageFields);
  }, [showPackageFields, setValue]);

  // Lazy-load companies the first time the operator switches to "existing".
  useEffect(() => {
    if (clientMode !== 'existing' || companies.length > 0 || companiesLoading) return;
    setCompaniesLoading(true);
    axiosInstance
      .get(endpoints.company.getAll)
      .then((res) => setCompanies(res.data || []))
      .catch(() => setCompanies([]))
      .finally(() => setCompaniesLoading(false));
  }, [clientMode, companies.length, companiesLoading]);

  // Reset the "attach new package" toggle whenever the company changes.
  useEffect(() => {
    setValue('attachNewPackage', false);
  }, [company?.id, setValue]);

  // Sync the value/credits/validity fields with the picked package. Predefined
  // -> mirror the package (read-only). Custom / nothing picked -> clear.
  useEffect(() => {
    if (!isCustom && selectedPackage) {
      setValue('pkgValue', selectedPrice != null ? String(selectedPrice) : '');
      setValue('pkgCredits', selectedPackage.credits != null ? String(selectedPackage.credits) : '');
      setValue(
        'pkgValidity',
        selectedPackage.validityPeriod != null ? String(selectedPackage.validityPeriod) : ''
      );
    } else {
      setValue('pkgValue', '');
      setValue('pkgCredits', '');
      setValue('pkgValidity', '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageId, selectedPrice]);

  // Builds the linkPackage / company-create payload from the current form values.
  const buildBase = useCallback(() => {
    const v = getValues();
    return {
      packageType: v.packageId === CUSTOM ? 'Custom' : 'Fixed',
      packageId: v.packageId === CUSTOM ? 'Autogenerated' : v.packageId,
      packageValue: String(v.pkgValue),
      totalUGCCredits: String(v.pkgCredits),
      validityPeriod: String(v.pkgValidity),
      currency: v.currency,
      invoiceDate: dayjs().toISOString(),
    };
  }, [getValues]);

  const resolveCompany = useCallback(async () => {
    const valid = await trigger();
    if (!valid) return { ok: false };

    const v = getValues();

    // Deal value snapshot — surfaced so the handover/finalize can record
    // wonAmount/wonCurrency for the BD dashboard. When reusing an existing active
    // package (no package fields shown), the value isn't re-entered here, so it's
    // left null rather than guessed.
    const deal = v.showPackageFields
      ? { packageValue: v.pkgValue ? Number(v.pkgValue) : null, currency: v.currency || null }
      : { packageValue: null, currency: v.currency || null };

    // Existing client, reuse active package -> just link the company.
    if (v.clientMode === 'existing' && !v.showPackageFields) {
      return { ok: true, id: v.company.id, name: v.company.name, ...deal };
    }

    // Existing client, attach a fresh package to that company.
    if (v.clientMode === 'existing') {
      await axiosInstance.patch(endpoints.company.linkPackage(v.company.id), buildBase());
      return { ok: true, id: v.company.id, name: v.company.name, ...deal };
    }

    // New client -> create the company from the brief details + package.
    const fd = new FormData();
    fd.append(
      'data',
      JSON.stringify({
        type: 'directClient',
        companyName: brief?.brandName || brief?.name || 'Untitled Client',
        companyEmail: brief?.clientEmail || '',
        personInChargeName: brief?.clientName || brief?.brandName || brief?.name || 'Client',
        personInChargeEmail: brief?.clientEmail || '',
        personInChargeDesignation: 'Client',
        ...buildBase(),
      })
    );
    const res = await axiosInstance.post(endpoints.company.create, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const id = res.data?.company?.id;
    const name = res.data?.company?.name;
    if (!id) throw new Error('Company creation returned no id');
    return { ok: true, id, name, ...deal };
  }, [trigger, getValues, buildBase, brief]);

  useImperativeHandle(ref, () => ({ resolveCompany }), [resolveCompany]);

  // The three package fields share one TextField shape; only label, field name,
  // and (for value) the currency prefix differ.
  const packageFields = [
    { name: 'pkgValue', label: 'Package Value', prefix: currency },
    { name: 'pkgCredits', label: 'Total UGC Credits' },
    { name: 'pkgValidity', label: 'Validity (months)' },
  ];

  return (
    <FormProvider methods={methods}>
      <Box>
        <Typography
          variant="caption"
          sx={{ color: '#6B7280', fontWeight: 600, mb: 1, display: 'block' }}
        >
          Client
        </Typography>

        <Controller
          name="clientMode"
          control={control}
          render={({ field }) => (
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                width: 'fit-content',
                mb: 2,
                p: 0.5,
                bgcolor: '#F4F4F4',
                borderRadius: 1.5,
              }}
            >
              {/* Sliding pill measured from the active button (each option hugs
                  its own text, so widths differ). */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 4,
                  bottom: 4,
                  left: 0,
                  width: pill.width,
                  transform: `translateX(${pill.left}px)`,
                  borderRadius: '10px',
                  bgcolor: '#fff',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                  transition: (theme) =>
                    theme.transitions.create(['transform', 'width'], {
                      duration: 300,
                      easing: theme.transitions.easing.easeInOut,
                    }),
                }}
              />
              {modeOptions.map((o, i) => {
                const selected = field.value === o.value;
                return (
                  <Box
                    key={o.value}
                    ref={(el) => {
                      toggleBtnRefs.current[i] = el;
                    }}
                    component="button"
                    type="button"
                    onClick={() => field.onChange(o.value)}
                    sx={{
                      position: 'relative',
                      zIndex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      border: 'none',
                      bgcolor: 'transparent',
                      cursor: 'pointer',
                      px: 2.5,
                      py: 0.75,
                      whiteSpace: 'nowrap',
                      fontFamily: 'inherit',
                      fontSize: 14,
                      fontWeight: selected ? 600 : 400,
                      color: selected ? 'text.primary' : 'text.secondary',
                      transition: (theme) =>
                        theme.transitions.create(['color', 'font-weight'], {
                          duration: 200,
                        }),
                    }}
                  >
                    {o.label}
                  </Box>
                );
              })}
            </Box>
          )}
        />

        <Collapse in={clientMode === 'existing'} timeout={300} unmountOnExit>
          <Fade in={clientMode === 'existing'} timeout={300}>
            <Box>
              <Controller
                name="company"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <Autocomplete
                    options={companies}
                    loading={companiesLoading}
                    value={field.value}
                    onChange={(_e, val) => field.onChange(val)}
                    getOptionLabel={(o) => o?.name || ''}
                    isOptionEqualToValue={(o, v) => o.id === v?.id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Select a client"
                        error={!!error}
                        helperText={error?.message}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {companiesLoading ? <CircularProgress size={16} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    sx={{ mb: 2 }}
                  />
                )}
              />
            </Box>
          </Fade>
        </Collapse>

        {/* Active-package banner for existing clients. */}
        <Collapse in={existingHasActivePackage} timeout={300} unmountOnExit>
          <Box
            sx={{
              mb: 2,
              p: 2,
              borderRadius: 1.5,
              bgcolor: (theme) => alpha(theme.palette.success.main, 0.08),
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
            }}
          >
            <Iconify
              icon="eva:checkmark-circle-2-fill"
              width={22}
              sx={{ color: 'success.main', flexShrink: 0, mt: 0.2 }}
            />
            <Typography variant="body2" sx={{ flex: 1, color: 'text.primary' }}>
              <strong>{company?.name}</strong> already has an active package —{' '}
              {company?.creditSummary?.remainingCredits ?? 0} credits left
              {company?.creditSummary?.nextExpiryDate
                ? `, expires ${dayjs(company.creditSummary.nextExpiryDate).format('D MMM YYYY')}`
                : ''}
              .
            </Typography>
            <Typography
              component="button"
              type="button"
              onClick={() => setValue('attachNewPackage', !attachNewPackage)}
              sx={{
                flexShrink: 0,
                border: 'none',
                bgcolor: 'transparent',
                cursor: 'pointer',
                p: 0,
                color: '#1340FF',
                fontWeight: 600,
                fontSize: 14,
                fontFamily: 'inherit',
              }}
            >
              {attachNewPackage ? 'Use existing package' : 'Attach new package'}
            </Typography>
          </Box>
        </Collapse>

        <Collapse in={showPackageFields} timeout={300} unmountOnExit>
          <Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
              <RHFSelect name="packageId" label="Client Package" size="small" fullWidth>
                {packagesLoading ? (
                  <MenuItem disabled>
                    <CircularProgress size={16} />
                  </MenuItem>
                ) : (
                  [
                    ...(packages || []).map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name}
                      </MenuItem>
                    )),
                    <MenuItem key={CUSTOM} value={CUSTOM}>
                      Custom
                    </MenuItem>,
                  ]
                )}
              </RHFSelect>
              <RHFSelect
                name="currency"
                label="Currency"
                size="small"
                sx={{ width: { xs: '100%', sm: 140 } }}
              >
                <MenuItem value="MYR">MYR</MenuItem>
                <MenuItem value="SGD">SGD</MenuItem>
              </RHFSelect>
            </Stack>

            {/* Shared value / credits / validity fields. Always visible; editable
                only for Custom, read-only (mirroring the picked package) otherwise. */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
              {packageFields.map(({ name, label, prefix }) => (
                <RHFTextField
                  key={name}
                  name={name}
                  label={label}
                  size="small"
                  type={isCustom ? 'number' : 'text'}
                  disabled={!isCustom}
                  InputProps={{
                    readOnly: !isCustom,
                    inputProps: { min: 1 },
                    startAdornment:
                      prefix && !isCustom ? (
                        <Typography variant="body2" sx={{ color: 'text.secondary', mr: 0.5 }}>
                          {prefix}
                        </Typography>
                      ) : undefined,
                  }}
                  onKeyDown={(e) => {
                    if (isCustom && (e.key === '-' || e.key === 'e')) e.preventDefault();
                  }}
                />
              ))}
            </Stack>
          </Box>
        </Collapse>
      </Box>
    </FormProvider>
  );
});

AttachClientPackage.propTypes = {
  brief: PropTypes.object,
};

export default AttachClientPackage;
