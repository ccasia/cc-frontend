import * as Yup from 'yup';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import { LoadingButton } from '@mui/lab';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { createFilterOptions } from '@mui/material/Autocomplete';

import { useGetCampaignBrandOption } from 'src/hooks/use-get-company-brand';

import axiosInstance, { endpoints } from 'src/utils/axios';

import FormProvider, { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';
import PackageCreateDialog from 'src/sections/packages/package-dialog';

const filter = createFilterOptions();

// --- Link existing brand/company dialog ---

function LinkBrandDialog({ open, onClose, campaign, onSaved }) {
  const { data: options, isLoading } = useGetCampaignBrandOption();

  const methods = useForm({
    defaultValues: {
      campaignBrand: campaign?.brand ?? campaign?.company ?? null,
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await axiosInstance.patch(endpoints.campaign.editCampaignBrandOrCompany, {
        campaignBrand: data.campaignBrand,
        id: campaign?.id,
      });
      enqueueSnackbar('Company linked', { variant: 'success' });
      onSaved();
      onClose();
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to link', { variant: 'error' });
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Link Brand or Company</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <RHFAutocomplete
              fullWidth
              name="campaignBrand"
              placeholder="Search brands & companies..."
              options={(!isLoading && options) || []}
              getOptionLabel={(option) => option.name || ''}
              renderOption={(props, option) => (
                <Stack direction="row" spacing={1} p={1} {...props} key={option.id}>
                  <Avatar src={option?.logo}>{option.name?.slice(0, 1)}</Avatar>
                  <ListItemText primary={option.name} />
                </Stack>
              )}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              filterOptions={(opts, params) => filter(opts, params)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Save
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}

LinkBrandDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  campaign: PropTypes.object.isRequired,
  onSaved: PropTypes.func.isRequired,
};

// --- Create new company dialog ---

const createCompanySchema = Yup.object().shape({
  name: Yup.string().required('Company name is required'),
  email: Yup.string().email('Invalid email').nullable(),
  phone: Yup.string().nullable(),
  website: Yup.string().nullable(),
});

function CreateCompanyDialog({ open, onClose, campaign, onSaved }) {
  const methods = useForm({
    resolver: yupResolver(createCompanySchema),
    defaultValues: { name: '', email: '', phone: '', website: '' },
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.post(endpoints.company.createOneCompany, data);
      const newCompany = res.data.company;

      await axiosInstance.patch(endpoints.campaign.editCampaignBrandOrCompany, {
        campaignBrand: { id: newCompany.id, name: newCompany.name },
        id: campaign?.id,
      });

      enqueueSnackbar('Company created and linked', { variant: 'success' });
      reset();
      onSaved();
      onClose();
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to create company', { variant: 'error' });
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Create New Company</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <RHFTextField name="name" label="Company name" />
            <RHFTextField name="email" label="Email (optional)" />
            <RHFTextField name="phone" label="Phone (optional)" />
            <RHFTextField name="website" label="Website (optional)" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Create & Link
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}

CreateCompanyDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  campaign: PropTypes.object.isRequired,
  onSaved: PropTypes.func.isRequired,
};

// --- Helpers ---

function getCompanyFromCampaign(campaign) {
  if (campaign?.brand?.company) return campaign.brand.company;
  if (campaign?.company) return campaign.company;
  return null;
}

function getActiveSubscription(company) {
  if (!company?.subscriptions) return null;
  return company.subscriptions.find((s) => s.status === 'ACTIVE') || null;
}

// --- Main section ---

export default function DraftPackageSection({ campaign, onSaved, campaignCredits, onCreditsChange }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [packageOpen, setPackageOpen] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const handleUnlink = async () => {
    setUnlinking(true);
    try {
      await axiosInstance.patch(endpoints.campaign.unlinkCompany(campaign.id));
      enqueueSnackbar('Company unlinked', { variant: 'success' });
      onSaved();
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to unlink', { variant: 'error' });
    } finally {
      setUnlinking(false);
    }
  };

  const linked = campaign?.brand || campaign?.company;
  const company = getCompanyFromCampaign(campaign);
  const activeSub = getActiveSubscription(company);

  const packageName =
    activeSub?.package?.name || activeSub?.customPackage?.customName || 'Custom';
  const totalCredits = activeSub?.totalCredits ?? activeSub?.customPackage?.customCredits ?? 0;
  const creditsUsed = activeSub?.creditsUsed ?? 0;
  const remaining = totalCredits - creditsUsed;
  const expiresAt = activeSub?.expiredAt ? dayjs(activeSub.expiredAt).format('DD MMM YYYY') : '—';

  return (
    <Box>
      {/* Step 1: Company / Brand */}
      {linked ? (
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Avatar src={linked.logo} sx={{ width: 48, height: 48 }}>
            {linked.name?.slice(0, 1)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1">{linked.name}</Typography>
            <Chip
              size="small"
              label={campaign?.brand ? 'Brand' : 'Company'}
              variant="outlined"
              sx={{ mt: 0.5 }}
            />
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" size="small" onClick={() => setLinkOpen(true)}>
              Change
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="error"
              disabled={unlinking}
              onClick={handleUnlink}
            >
              {unlinking ? 'Removing...' : 'Remove'}
            </Button>
          </Stack>
        </Stack>
      ) : (
        <Stack spacing={2} alignItems="flex-start" sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            No company or brand linked yet. Link an existing one or create a new company.
          </Typography>
          <Stack direction="row" spacing={1.5}>
            <Button variant="contained" onClick={() => setLinkOpen(true)}>
              Link Existing
            </Button>
            <Button variant="outlined" onClick={() => setCreateOpen(true)}>
              Create New Company
            </Button>
          </Stack>
        </Stack>
      )}

      {/* Step 2: Package / Subscription */}
      {linked && company && (
        <>
          {activeSub ? (
            <Stack spacing={2}>
              <Box
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'background.neutral',
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="subtitle2">
                      Package: {packageName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Credits: {remaining} remaining of {totalCredits} &bull; Expires: {expiresAt}
                    </Typography>
                  </Box>
                  <Chip size="small" label="Active" color="success" variant="outlined" />
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Campaign Credits
                </Typography>
                <TextField
                  type="number"
                  size="small"
                  placeholder="Enter credits to allocate"
                  value={campaignCredits}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    onCreditsChange(Number.isNaN(val) ? '' : val);
                  }}
                  inputProps={{ min: 1, max: remaining }}
                  error={campaignCredits !== '' && campaignCredits > remaining}
                  helperText={
                    campaignCredits !== '' && campaignCredits > remaining
                      ? `Exceeds available credits (${remaining})`
                      : `Available: ${remaining} credits`
                  }
                  fullWidth
                />
              </Box>
            </Stack>
          ) : (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                This company has no active package. Add a package before submitting for review.
              </Alert>
              <Button variant="contained" onClick={() => setPackageOpen(true)}>
                Add Package
              </Button>
            </Box>
          )}
        </>
      )}

      {linked && !company && (
        <Alert severity="warning">
          Could not resolve company from the linked {campaign?.brand ? 'brand' : 'entity'}. This
          may indicate the brand has no parent company.
        </Alert>
      )}

      {/* Dialogs */}
      <LinkBrandDialog
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        campaign={campaign}
        onSaved={onSaved}
      />
      <CreateCompanyDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        campaign={campaign}
        onSaved={onSaved}
      />
      {company && (
        <PackageCreateDialog
          open={packageOpen}
          onClose={() => setPackageOpen(false)}
          clientId={company.id}
          onRefresh={onSaved}
        />
      )}
    </Box>
  );
}

DraftPackageSection.propTypes = {
  campaign: PropTypes.object.isRequired,
  onSaved: PropTypes.func.isRequired,
  campaignCredits: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onCreditsChange: PropTypes.func.isRequired,
};
