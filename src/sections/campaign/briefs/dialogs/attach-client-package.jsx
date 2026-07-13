import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { useState, useEffect, forwardRef, useCallback, useImperativeHandle } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import ToggleButton from '@mui/material/ToggleButton';
import Autocomplete from '@mui/material/Autocomplete';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormHelperText from '@mui/material/FormHelperText';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import useGetPackages from 'src/hooks/use-get-packges';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

const AttachClientPackage = forwardRef(({ brief }, ref) => {
  const { data: packages, isLoading: packagesLoading } = useGetPackages();

  const [clientMode, setClientMode] = useState('new'); // 'new' | 'existing'

  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const [attachNewPackage, setAttachNewPackage] = useState(false);

  const [packageId, setPackageId] = useState('');
  const [currency, setCurrency] = useState('MYR');

  const [errors, setErrors] = useState({});

  const existingHasActivePackage =
    clientMode === 'existing' &&
    Number(selectedCompany?.creditSummary?.activePackagesCount || 0) > 0;

  const showPackageFields =
    clientMode === 'new' || !existingHasActivePackage || attachNewPackage;

  useEffect(() => {
    if (clientMode !== 'existing' || companies.length > 0 || companiesLoading) return;
    setCompaniesLoading(true);
    axiosInstance
      .get(endpoints.company.getAll)
      .then((res) => setCompanies(res.data || []))
      .catch(() => setCompanies([]))
      .finally(() => setCompaniesLoading(false));
  }, [clientMode, companies.length, companiesLoading]);

  useEffect(() => {
    setAttachNewPackage(false);
    setErrors((prev) => ({ ...prev, company: undefined }));
  }, [selectedCompany?.id]);

  const validate = useCallback(() => {
    const next = {};
    if (clientMode === 'existing' && !selectedCompany) {
      next.company = 'Select an existing client.';
    }
    if (showPackageFields && !packageId) {
      next.package = 'Pick a client package.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [clientMode, selectedCompany, showPackageFields, packageId]);

  // Builds the payload for creating a company from the brief details.
  const buildCompanyPayload = useCallback(() => {
    const pkg = (packages || []).find((p) => p.id === packageId);
    if (!pkg) throw new Error('Selected package not found');
    const price = pkg.prices?.find((pr) => pr.currency === currency)?.amount;
    return {
      pkg,
      price,
      base: {
        packageType: 'Fixed',
        packageId: pkg.id,
        packageValue: String(price ?? ''),
        totalUGCCredits: String(pkg.credits ?? ''),
        validityPeriod: String(pkg.validityPeriod ?? ''),
        currency,
        invoiceDate: dayjs().toISOString(),
      },
    };
  }, [packages, packageId, currency]);

  const resolveCompany = useCallback(async () => {
    if (!validate()) return { ok: false };

    // Existing client, reuse active package -> just link the company.
    if (clientMode === 'existing' && !showPackageFields) {
      return { ok: true, id: selectedCompany.id, name: selectedCompany.name };
    }

    // Existing client, attach a fresh package to that company.
    if (clientMode === 'existing') {
      const { base } = buildCompanyPayload();
      await axiosInstance.patch(endpoints.company.linkPackage(selectedCompany.id), base);
      return { ok: true, id: selectedCompany.id, name: selectedCompany.name };
    }

    // New client -> create the company from the brief details + package.
    const { base } = buildCompanyPayload();
    const fd = new FormData();
    fd.append(
      'data',
      JSON.stringify({
        type: 'directClient',
        companyName: brief?.name || 'Untitled Client',
        companyEmail: brief?.clientEmail || '',
        personInChargeName: brief?.clientName || brief?.name || 'Client',
        personInChargeEmail: brief?.clientEmail || '',
        personInChargeDesignation: 'Client',
        ...base,
      })
    );
    const res = await axiosInstance.post(endpoints.company.create, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const id = res.data?.company?.id;
    const name = res.data?.company?.name;
    if (!id) throw new Error('Company creation returned no id');
    return { ok: true, id, name };
  }, [validate, clientMode, showPackageFields, selectedCompany, buildCompanyPayload, brief]);

  useImperativeHandle(ref, () => ({ resolveCompany }), [resolveCompany]);

  return (
    <Box>
      <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, mb: 1, display: 'block' }}>
        Client
      </Typography>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={clientMode}
        onChange={(_e, val) => val && setClientMode(val)}
        sx={{
          mb: 2,
          bgcolor: '#F4F4F4',
          borderRadius: 1.5,
          '& .MuiToggleButton-root': {
            border: 'none',
            borderRadius: '10px !important',
            textTransform: 'none',
            px: 2.5,
            color: 'text.secondary',
            '&.Mui-selected': {
              bgcolor: '#fff',
              color: 'text.primary',
              fontWeight: 600,
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
              '&:hover': { bgcolor: '#fff' },
            },
          },
        }}
      >
        <ToggleButton value="new">New Client</ToggleButton>
        <ToggleButton value="existing">Existing Client</ToggleButton>
      </ToggleButtonGroup>

      {clientMode === 'existing' && (
        <Autocomplete
          options={companies}
          loading={companiesLoading}
          value={selectedCompany}
          onChange={(_e, val) => setSelectedCompany(val)}
          getOptionLabel={(o) => o?.name || ''}
          isOptionEqualToValue={(o, v) => o.id === v?.id}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select a client"
              error={!!errors.company}
              helperText={errors.company}
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

      {/* Active-package banner for existing clients. */}
      {existingHasActivePackage && (
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
            <strong>{selectedCompany?.name}</strong> already has an active package —{' '}
            {selectedCompany?.creditSummary?.remainingCredits ?? 0} credits left
            {selectedCompany?.creditSummary?.nextExpiryDate
              ? `, expires ${dayjs(selectedCompany.creditSummary.nextExpiryDate).format('D MMM YYYY')}`
              : ''}
            .
          </Typography>
          <Typography
            component="button"
            type="button"
            onClick={() => setAttachNewPackage((v) => !v)}
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
      )}

      {showPackageFields && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <FormControl fullWidth size="small" error={!!errors.package}>
            <InputLabel>Client Package</InputLabel>
            <Select
              value={packageId}
              onChange={(e) => {
                setPackageId(e.target.value);
                setErrors((prev) => ({ ...prev, package: undefined }));
              }}
              input={<OutlinedInput label="Client Package" />}
            >
              {packagesLoading ? (
                <MenuItem disabled>
                  <CircularProgress size={16} />
                </MenuItem>
              ) : (
                (packages || []).map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))
              )}
            </Select>
            {errors.package && <FormHelperText>{errors.package}</FormHelperText>}
          </FormControl>
          <FormControl size="small" sx={{ width: { xs: '100%', sm: 140 } }}>
            <InputLabel>Currency</InputLabel>
            <Select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              input={<OutlinedInput label="Currency" />}
            >
              <MenuItem value="MYR">MYR</MenuItem>
              <MenuItem value="SGD">SGD</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      )}
    </Box>
  );
});

AttachClientPackage.propTypes = {
  brief: PropTypes.object,
};

export default AttachClientPackage;
