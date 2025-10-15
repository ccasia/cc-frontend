import PropTypes from 'prop-types';
import React, { useState, useMemo } from 'react';
import { useSnackbar } from 'notistack';

import {
  Box,
  Dialog,
  Button,
  Avatar,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Typography,
  Autocomplete,
  TextField,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import { useGetAllCreators } from 'src/api/creator';
import axiosInstance from 'src/utils/axios';
import Iconify from 'src/components/iconify';

/**
 * SwapCreatorModal
 *
 * Allows admins to swap a guest creator with an existing platform creator
 *
 * Props:
 * - open: boolean - whether modal is open
 * - onClose: function - close handler
 * - guestCreator: object - the guest creator to be swapped
 * - campaign: object - the campaign object
 * - onSwapped: function - callback after successful swap
 */
const SwapCreatorModal = ({ open, onClose, guestCreator, campaign, onSwapped }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { data: allCreators, isLoading: creatorsLoading } = useGetAllCreators();

  const [selectedPlatformCreator, setSelectedPlatformCreator] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Filter out inactive creators and already shortlisted creators
  const availableCreators = useMemo(() => {
    if (!allCreators || !campaign) return [];

    const shortlistedIds = new Set((campaign?.shortlisted || []).map((s) => s.userId));

    return allCreators.filter(
      (creator) =>
        creator.status === 'active' &&
        creator.creator?.isFormCompleted &&
        !creator.creator?.isGuest &&
        !shortlistedIds.has(creator.id)
    );
  }, [allCreators, campaign]);

  const handleSwap = async () => {
    if (!selectedPlatformCreator || !guestCreator) {
      enqueueSnackbar('Please select a platform creator', { variant: 'warning' });
      return;
    }

    try {
      setSubmitting(true);

      const response = await axiosInstance.post('/api/campaign/swapCreator', {
        campaignId: campaign.id,
        guestUserId: guestCreator.userId || guestCreator.user?.id,
        platformUserId: selectedPlatformCreator.id,
      });

      enqueueSnackbar(response.data.message || 'Successfully swapped creators!', {
        variant: 'success',
      });

      // Close dialogs
      setConfirmDialogOpen(false);
      onClose();

      // Reset selection
      setSelectedPlatformCreator(null);

      // Callback to refresh data
      if (onSwapped) {
        onSwapped();
      }
    } catch (error) {
      console.error('Error swapping creators:', error);
      enqueueSnackbar(error?.response?.data?.message || 'Failed to swap creators', {
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenConfirm = () => {
    if (!selectedPlatformCreator) {
      enqueueSnackbar('Please select a platform creator', { variant: 'warning' });
      return;
    }
    setConfirmDialogOpen(true);
  };

  const handleCloseConfirm = () => {
    setConfirmDialogOpen(false);
  };

  const handleClose = () => {
    if (submitting) return;
    setSelectedPlatformCreator(null);
    onClose();
  };

  if (!guestCreator) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: (theme) => theme.typography.fontSecondaryFamily,
            '&.MuiTypography-root': { fontSize: 24 },
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify icon="solar:refresh-circle-bold" width={28} color="#203ff5" />
              <span>Link Creator</span>
            </Stack>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3}>
            {/* Guest Creator Info */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: (theme) => alpha(theme.palette.warning.main, 0.08),
                border: '1px solid',
                borderColor: (theme) => alpha(theme.palette.warning.main, 0.24),
              }}
            >
              <Typography
                variant="caption"
                sx={{ fontWeight: 600, color: 'text.secondary', mb: 1, display: 'block' }}
              >
                Current Profile
              </Typography>

              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar
                  src={guestCreator.user?.photoURL}
                  alt={guestCreator.user?.name || guestCreator.name}
                  sx={{ width: 48, height: 48 }}
                >
                  {(guestCreator.user?.name || guestCreator.name)?.charAt(0)?.toUpperCase()}
                </Avatar>

                <Stack spacing={0.5} flex={1}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {guestCreator.user?.name || guestCreator.name}
                  </Typography>

                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Chip
                      label="Non-platform Creator"
                      size="small"
                      sx={{
                        bgcolor: 'warning.main',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    />

                    {guestCreator.user?.guestProfileLink && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'primary.main',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                        }}
                        component="a"
                        href={guestCreator.user.guestProfileLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Profile
                      </Typography>
                    )}
                  </Stack>

                  {guestCreator.adminComments && (
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', fontStyle: 'italic' }}
                    >
                      Comments: {guestCreator.adminComments}
                    </Typography>
                  )}

                  {guestCreator.ugcVideos && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      UGC Credits: {guestCreator.ugcVideos}
                    </Typography>
                  )}
                </Stack>
              </Stack>
            </Box>

            {/* Platform Creator Selection */}
            <Box>
              <Typography
                variant="caption"
                sx={{ fontWeight: 600, display: 'block', mb: 1, color: 'text.secondary' }}
              >
                Select Platform Creator to Add
              </Typography>

              {creatorsLoading ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <CircularProgress thickness={6} size={28} />
                </Box>
              ) : (
                <Autocomplete
                  value={selectedPlatformCreator}
                  onChange={(e, val) => setSelectedPlatformCreator(val)}
                  options={availableCreators}
                  getOptionLabel={(opt) => opt?.name || ''}
                  isOptionEqualToValue={(opt, val) => opt.id === val.id}
                  filterOptions={(options, state) => {
                    if (!state.inputValue) return options;

                    const lowercaseInput = state.inputValue.toLowerCase();
                    return options.filter(
                      (option) =>
                        option?.name?.toLowerCase().includes(lowercaseInput) ||
                        option?.email?.toLowerCase().includes(lowercaseInput) ||
                        option?.creator?.instagram?.toLowerCase().includes(lowercaseInput)
                    );
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
                        sx={{ width: 40, height: 40, borderRadius: 2, flexShrink: 0 }}
                      >
                        {option?.name?.[0]?.toUpperCase()}
                      </Avatar>
                      <Stack spacing={0}>
                        <Typography variant="body2" sx={{ lineHeight: 1.3, fontWeight: 500 }}>
                          {option?.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ lineHeight: 1.2 }}
                        >
                          {option?.email}
                        </Typography>
                        {option?.creator?.instagram && (
                          <Typography
                            variant="caption"
                            color="primary.main"
                            sx={{ lineHeight: 1.2 }}
                          >
                            @{option.creator.instagram}
                          </Typography>
                        )}
                      </Stack>
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
                            <Iconify
                              icon="eva:search-fill"
                              width={20}
                              sx={{ color: 'text.disabled' }}
                            />
                          </Box>
                        ),
                      }}
                    />
                  )}
                  noOptionsText="No platform creators available"
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
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, color: 'text.secondary', mb: 1, display: 'block' }}
                  >
                    Selected Platform Creator
                  </Typography>

                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar
                      src={selectedPlatformCreator.photoURL}
                      alt={selectedPlatformCreator.name}
                      sx={{ width: 48, height: 48 }}
                    >
                      {selectedPlatformCreator.name?.charAt(0)?.toUpperCase()}
                    </Avatar>

                    <Stack spacing={0.5}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {selectedPlatformCreator.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {selectedPlatformCreator.email}
                      </Typography>
                      {selectedPlatformCreator.creator?.instagram && (
                        <Typography variant="caption" sx={{ color: 'primary.main' }}>
                          @{selectedPlatformCreator.creator.instagram}
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleClose}
            disabled={submitting}
            sx={{
              bgcolor: '#ffffff',
              border: '1px solid #e7e7e7',
              borderBottom: '3px solid #e7e7e7',
              height: 44,
              color: '#221f20',
              fontSize: '0.875rem',
              fontWeight: 600,
              px: 3,
              textTransform: 'none',
              '&:hover': { bgcolor: (theme) => theme.palette.action.hover },
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={handleOpenConfirm}
            disabled={!selectedPlatformCreator || submitting}
            sx={{
              bgcolor: '#203ff5',
              border: '1px solid #203ff5',
              borderBottom: '3px solid #1933cc',
              height: 44,
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 600,
              px: 3,
              textTransform: 'none',
              '&:hover': { bgcolor: '#1933cc', opacity: 0.9 },
              '&:disabled': {
                bgcolor: '#e7e7e7',
                color: '#999999',
                border: '1px solid #e7e7e7',
                borderBottom: '3px solid #d1d1d1',
              },
            }}
          >
            Add Creator
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCloseConfirm}
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: (theme) => theme.typography.fontSecondaryFamily,
            '&.MuiTypography-root': { fontSize: 20 },
          }}
        >
          Confirm Creator Link
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Are you sure you want to link this creator:
          </Typography>

          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
            }}
          >
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  From:
                </Typography>
                <Typography variant="body2">
                  {guestCreator.user?.name || guestCreator.name}
                </Typography>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  To:
                </Typography>
                <Typography variant="body2">
                  {selectedPlatformCreator?.name} (on Platform)
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <Alert severity="error" sx={{ mt: 2, borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              This action cannot be undone!
            </Typography>
          </Alert>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleCloseConfirm}
            disabled={submitting}
            sx={{
              bgcolor: '#ffffff',
              border: '1px solid #e7e7e7',
              borderBottom: '3px solid #e7e7e7',
              height: 44,
              color: '#221f20',
              fontSize: '0.875rem',
              fontWeight: 600,
              px: 3,
              textTransform: 'none',
              '&:hover': { bgcolor: (theme) => theme.palette.action.hover },
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSwap}
            disabled={submitting}
            sx={{
              bgcolor: '#ff4842',
              border: '1px solid #ff4842',
              borderBottom: '3px solid #d32f2f',
              height: 44,
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 600,
              px: 3,
              textTransform: 'none',
              '&:hover': { bgcolor: '#d32f2f', opacity: 0.9 },
              '&:disabled': {
                bgcolor: '#e7e7e7',
                color: '#999999',
                border: '1px solid #e7e7e7',
                borderBottom: '3px solid #d1d1d1',
              },
            }}
          >
            {submitting ? 'Swapping...' : 'Yes, Add Creator'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

SwapCreatorModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  guestCreator: PropTypes.object,
  campaign: PropTypes.object.isRequired,
  onSwapped: PropTypes.func,
};

export default SwapCreatorModal;
