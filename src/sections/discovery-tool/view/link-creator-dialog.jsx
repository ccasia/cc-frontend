import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useMemo, useState, useEffect } from 'react';

import { alpha } from '@mui/material/styles';
import {
  Box,
  Stack,
  Avatar,
  Button,
  Dialog,
  Divider,
  TextField,
  IconButton,
  Typography,
  DialogTitle,
  Autocomplete,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';

import axiosInstance from 'src/utils/axios';

import { useGetAllCreators } from 'src/api/creator';

import Iconify from 'src/components/iconify';

import {
  resolveProfileUrl,
  resolvePlatformData,
  formatEngagementRate,
  formatDiscoveryNumber,
} from '../components/creator-helpers';

const LABEL_SX = {
  mb: 0.5,
  display: 'block',
  color: '#636366',
  fontSize: '14px !important',
  fontWeight: 600,
};
const FIELD_SX = {
  '& .MuiOutlinedInput-root': { bgcolor: '#fff', minHeight: 48, borderRadius: 1 },
};
const SECONDARY_BUTTON_SX = {
  bgcolor: '#FFFFFF',
  color: '#1340FF',
  border: '1.5px solid #e7e7e7',
  borderBottom: '3px solid #e7e7e7',
  borderRadius: 1.15,
  height: 44,
  px: 2.5,
  fontWeight: 600,
  fontSize: '0.85rem',
  textTransform: 'none',
  '&:hover': {
    bgcolor: 'rgba(19, 64, 255, 0.08)',
    border: '1.5px solid #1340FF',
    borderBottom: '3px solid #1340FF',
    color: '#1340FF',
  },
  '&.Mui-disabled': { cursor: 'not-allowed', pointerEvents: 'auto' },
};
const PRIMARY_BUTTON_SX = {
  bgcolor: '#203ff5',
  border: '1px solid #203ff5',
  borderBottom: '3px solid #1933cc',
  height: 44,
  minWidth: 100,
  color: '#fff',
  fontSize: '0.875rem',
  fontWeight: 600,
  px: 3,
  textTransform: 'none',
  '&:hover': { bgcolor: '#1933cc', opacity: 0.9 },
  '&.Mui-disabled': {
    bgcolor: '#C7C7CC',
    color: '#fff',
    border: '1px solid #C7C7CC',
    borderBottom: '3px solid #0000001A',
    cursor: 'not-allowed',
    pointerEvents: 'auto',
  },
};

const ReadOnlyField = ({ label, value }) => (
  <Box sx={{ flex: 1, minWidth: { xs: '100%', md: 'auto' } }}>
    <Typography sx={LABEL_SX}>{label}</Typography>
    <TextField fullWidth value={value || '—'} InputProps={{ readOnly: true }} sx={FIELD_SX} />
  </Box>
);

ReadOnlyField.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.string };

/**
 * Links a scraped guest creator to a platform creator in every campaign the
 * guest is in. The campaign version lives in v3-pitch-modal (ViewGuestCreatorModal).
 */
export default function LinkCreatorDialog({ open, creator, onClose, onLinked }) {
  const { enqueueSnackbar } = useSnackbar();
  const { data: allCreators, isLoading: creatorsLoading } = useGetAllCreators();
  const [showCreatorSelection, setShowCreatorSelection] = useState(false);
  const [selectedPlatformCreator, setSelectedPlatformCreator] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowCreatorSelection(false);
      setSelectedPlatformCreator(null);
    }
  }, [open]);

  const platformData = creator ? resolvePlatformData(creator) : {};
  const profileUrl = creator ? resolveProfileUrl(creator, platformData.platform) : null;

  // The server rejects a creator already shortlisted in one of the guest's campaigns.
  const availableCreators = useMemo(
    () =>
      (allCreators || []).filter(
        (item) =>
          item.status === 'active' && item.creator?.isFormCompleted && !item.creator?.isGuest
      ),
    [allCreators]
  );

  const handleLink = async () => {
    if (!selectedPlatformCreator || !creator?.userId) return;
    try {
      setSubmitting(true);
      const response = await axiosInstance.post('/api/campaign/linkGuestCreator', {
        guestUserId: creator.userId,
        platformUserId: selectedPlatformCreator.id,
      });
      enqueueSnackbar(response.data.message || 'Successfully linked creator!', {
        variant: 'success',
      });
      onClose();
      onLinked?.();
    } catch (error) {
      enqueueSnackbar(
        error?.response?.data?.message || error?.message || 'Failed to link creator',
        {
          variant: 'error',
        }
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: '#F4F4F4',
          width: { xs: '95%', sm: '90%', md: '900px' },
          maxWidth: { xs: '95%', sm: '90%', md: '900px' },
        },
      }}
    >
      <DialogTitle
        sx={{
          fontFamily: 'Instrument Serif',
          fontSize: { xs: '28px !important', sm: '40px !important' },
          fontWeight: 400,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
          lineHeight: 1.2,
        }}
      >
        {showCreatorSelection ? 'Link Non-Platform Creator' : 'Non-Platform Creator'}
        <IconButton onClick={onClose} size="small" disabled={submitting}>
          <Iconify icon="mdi:close" width={24} />
        </IconButton>
      </DialogTitle>

      <Divider sx={{ borderColor: '#EBEBEB', mx: 3 }} />

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ pb: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2}>
            <ReadOnlyField label="Creator Name" value={creator?.name} />
            <ReadOnlyField label="Profile Link" value={profileUrl} />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <ReadOnlyField
              label="Follower Count"
              value={formatDiscoveryNumber(platformData.followers)}
            />
            <ReadOnlyField
              label="Engagement Rate (%)"
              value={formatEngagementRate(platformData.engagementRate)}
            />
          </Stack>
        </Box>

        {showCreatorSelection && (
          <Box>
            <Typography sx={LABEL_SX}>Select Platform Creator to Link</Typography>
            <Typography sx={{ mb: 1, fontSize: 12, color: '#8E8E93' }}>
              This links the creator in every campaign they are in and moves their saved scrape.
            </Typography>

            {creatorsLoading ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CircularProgress thickness={6} size={28} />
              </Box>
            ) : (
              <Autocomplete
                value={selectedPlatformCreator}
                onChange={(_, val) => setSelectedPlatformCreator(val)}
                options={availableCreators}
                getOptionLabel={(opt) => opt?.name || ''}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                filterOptions={(options, state) => {
                  if (!state.inputValue) return options;
                  const input = state.inputValue.toLowerCase();
                  return options.filter(
                    (option) =>
                      option?.name?.toLowerCase().includes(input) ||
                      option?.email?.toLowerCase().includes(input) ||
                      option?.creator?.instagram?.toLowerCase().includes(input)
                  );
                }}
                slotProps={{
                  popper: {
                    placement: 'bottom-start',
                    modifiers: [{ name: 'flip', enabled: false }],
                    sx: { zIndex: (theme) => theme.zIndex.modal + 1 },
                  },
                }}
                renderOption={(props, option) => (
                  <Box
                    component="li"
                    {...props}
                    key={option.id}
                    sx={{ display: 'flex', gap: 1.5, py: 1 }}
                  >
                    <Avatar
                      src={option?.photoURL}
                      sx={{ width: 32, height: 32, bgcolor: '#e0e0e0' }}
                    >
                      {option?.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {option?.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#636366' }}>
                        {option?.email}
                      </Typography>
                      {option?.creator?.instagram && (
                        <Typography
                          variant="caption"
                          color="primary.main"
                          sx={{ display: 'block' }}
                        >
                          {option.creator.instagram}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search by name, email, or Instagram handle"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <Box sx={{ pl: 1, display: 'flex', alignItems: 'center' }}>
                          <Iconify icon="eva:search-fill" width={16} sx={{ color: '#8E8E93' }} />
                        </Box>
                      ),
                    }}
                    sx={FIELD_SX}
                  />
                )}
              />
            )}

            {selectedPlatformCreator && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: (theme) => alpha(theme.palette.success.main, 0.08),
                  border: '1px solid',
                  borderColor: (theme) => alpha(theme.palette.success.main, 0.24),
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={selectedPlatformCreator?.photoURL}
                    sx={{ width: 48, height: 48, borderRadius: 2 }}
                  >
                    {selectedPlatformCreator?.name?.[0]?.toUpperCase()}
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {selectedPlatformCreator?.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedPlatformCreator?.email}
                    </Typography>
                  </Box>
                  <Iconify
                    icon="eva:checkmark-circle-2-fill"
                    width={24}
                    sx={{ color: 'success.main' }}
                  />
                </Stack>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        {showCreatorSelection ? (
          <>
            <Button
              onClick={() => {
                setShowCreatorSelection(false);
                setSelectedPlatformCreator(null);
              }}
              disabled={submitting}
              sx={SECONDARY_BUTTON_SX}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLink}
              disabled={submitting || !selectedPlatformCreator}
              sx={PRIMARY_BUTTON_SX}
            >
              {submitting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Link'}
            </Button>
          </>
        ) : (
          <Button
            onClick={() => setShowCreatorSelection(true)}
            sx={SECONDARY_BUTTON_SX}
            startIcon={
              <Iconify icon="mdi:account-plus-outline" width={20} sx={{ color: 'inherit' }} />
            }
          >
            Link Creator
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

LinkCreatorDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  creator: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onLinked: PropTypes.func,
};
