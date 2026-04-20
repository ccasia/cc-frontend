import PropTypes from 'prop-types';
import React, { useState } from 'react';

import {
  Box,
  Stack,
  Avatar,
  Button,
  Dialog,
  Divider,
  IconButton,
  TextField,
  Typography,
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TableContainer,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { enqueueSnackbar } from 'notistack';

import axiosInstance, { endpoints } from 'src/utils/axios';
import { formatNumber, extractUsernameFromProfileLink } from 'src/utils/media-kit-utils';
import Iconify from 'src/components/iconify';

const ApprovalSetupModal = ({
  open,
  onClose,
  campaignId,
  selectedPitches,
  onSuccess,
  onRemoveCreator,
  onViewPitch,
}) => {
  const [approverName, setApproverName] = useState('');
  const [approverEmail, setApproverEmail] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    let valid = true;
    setNameError('');
    setEmailError('');

    if (!approverName.trim()) {
      setNameError('Approver name is required');
      valid = false;
    }

    if (!approverEmail.trim()) {
      setEmailError('Approver email is required');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(approverEmail)) {
      setEmailError('Enter a valid email address');
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await axiosInstance.post(endpoints.approvalRequests.create, {
        campaignId,
        approverName: approverName.trim(),
        approverEmail: approverEmail.trim(),
        pitchIds: selectedPitches.map((p) => p.id),
      });
      onSuccess(res.data.link);
    } catch (err) {
      enqueueSnackbar(err?.message || 'Failed to send approval request', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setApproverName('');
      setApproverEmail('');
      setNameError('');
      setEmailError('');
      onClose();
    }
  };

  const handleViewPitch = (pitch) => {
    if (typeof onViewPitch === 'function') {
      onViewPitch(pitch);
    }
  };

  const getFollowerDisplay = (pitch) => {
    const creator = pitch?.user?.creator;
    const igStats = creator?.instagramUser;
    const tkStats = creator?.tiktokUser;
    const raw =
      pitch?.followerCount ??
      creator?.manualFollowerCount ??
      igStats?.followers_count ??
      tkStats?.follower_count ??
      pitch?.user?.instagramUser?.followers_count ??
      pitch?.user?.tiktokUser?.follower_count ??
      null;
    const hasValue =
      raw === 0 || (raw !== undefined && raw !== null && String(raw).trim() !== '');
    if (!hasValue) return '-';
    const n = Number(raw);
    return Number.isFinite(n) ? formatNumber(n) : '-';
  };

  const getStatusChip = (status) => {
    const normalized = (status || '').toUpperCase();
    const statusMap = {
      PENDING_REVIEW: { color: '#FFC702', label: 'PENDING REVIEW' },
      APPROVED: { color: '#1ABF66', label: 'APPROVED' },
      REJECTED: { color: '#FF4842', label: 'REJECTED' },
      AGREEMENT_SUBMITTED: { color: '#1ABF66', label: 'AGREEMENT SUBMITTED' },
      AGREEMENT_PENDING: { color: '#8B5CF6', label: 'AGREEMENT PENDING' },
      SENT_TO_CLIENT: { color: '#8B5CF6', label: 'SENT TO CLIENT' },
      AWAITING_APPROVAL: { color: '#8B5CF6', label: 'AWAITING APPROVAL' },
      INVITED: { color: '#FFC702', label: 'PENDING REVIEW' },
    };

    const mapped = statusMap[normalized] || {
      color: '#637381',
      label: normalized.replaceAll('_', ' ') || 'UNKNOWN',
    };

    return (
      <Box
        sx={{
          textTransform: 'uppercase',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          px: 1.2,
          py: 0.5,
          fontSize: '0.75rem',
          border: '1px solid',
          borderBottom: '3px solid',
          borderRadius: 0.8,
          bgcolor: 'white',
          whiteSpace: 'nowrap',
          color: mapped.color,
          borderColor: mapped.color,
        }}
      >
        {mapped.label}
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, bgcolor: '#F4F4F4', maxWidth: 980 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography
            variant="h6"
            sx={{
              fontFamily: 'Instrument Serif, serif',
              fontWeight: 550,
              fontSize: { xs: '2rem', sm: '2.3rem' },
              lineHeight: 1.05,
            }}
          >
            Send List for Approval
          </Typography>
          <IconButton onClick={handleClose} size="small" disabled={submitting}>
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 1, bgcolor: '#F4F4F4' }}>
        <Stack spacing={2.5}>
          <Divider sx={{ mt: 0.75 }} />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Box flex={1}>
              <Typography
                color="text.secondary"
                sx={{
                  mb: 0.5,
                  fontFamily: 'Inter Display, Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: '12px',
                  lineHeight: '16px',
                  letterSpacing: '0%',
                }}
              >
                Approver Name
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter approver name"
                value={approverName}
                onChange={(e) => { setApproverName(e.target.value); setNameError(''); }}
                error={Boolean(nameError)}
                helperText={nameError}
                size="small"
                sx={{ '& .MuiInputBase-root': { bgcolor: '#FFFFFF' } }}
              />
            </Box>
            <Box flex={1}>
              <Typography
                color="text.secondary"
                sx={{
                  mb: 0.5,
                  fontFamily: 'Inter Display, Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: '12px',
                  lineHeight: '16px',
                  letterSpacing: '0%',
                }}
              >
                Approver Email
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter approver email"
                value={approverEmail}
                onChange={(e) => { setApproverEmail(e.target.value); setEmailError(''); }}
                error={Boolean(emailError)}
                helperText={emailError}
                size="small"
                type="email"
                sx={{ '& .MuiInputBase-root': { bgcolor: '#FFFFFF' } }}
              />
            </Box>
          </Stack>

          <Box>
            <Box
              sx={{
                maxHeight: 280,
                overflowY: 'auto',
                borderRadius: 1,
              }}
            >
              {selectedPitches.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  No creators selected
                </Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {['Creator', 'Followers', 'Tier', 'Credits', 'Status', '', ''].map((header) => (
                          <TableCell
                            key={header}
                            sx={{
                              py: 1,
                              px: 2,
                              fontWeight: 600,
                              fontSize: '0.82rem',
                              color: '#221f20',
                              bgcolor: '#FFFFFF',
                              whiteSpace: 'nowrap',
                              borderBottom: 'none',
                              ...(header === 'Creator' ? { borderRadius: '10px 0 0 10px' } : {}),
                              ...(header === '' ? { borderRadius: '0 10px 10px 0' } : {}),
                            }}
                          >
                            {header}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody
                      sx={{
                        '& .MuiTableRow-root:last-child .MuiTableCell-root': {
                          borderBottom: '1px solid #EAEAEA',
                        },
                      }}
                    >
                      {selectedPitches.map((pitch) => (
                        <TableRow
                          key={pitch.id}
                          sx={{
                            '& td': { borderBottom: '1px solid', borderColor: '#EAEAEA' },
                            bgcolor: 'transparent',
                          }}
                        >
                          <TableCell sx={{ px: 2 }}>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                              <Avatar
                                src={pitch.user?.photoURL}
                                alt={pitch.user?.name}
                                sx={{ width: 36, height: 36, fontSize: 14 }}
                              >
                                {pitch.user?.name?.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography sx={{ fontSize: '0.95rem', fontWeight: 400 }} noWrap>
                                  {pitch.user?.name || '-'}
                                </Typography>
                                <Stack direction="row" spacing={1.25} alignItems="center">
                                  {(pitch.user?.creator?.instagramUser?.username
                                    || extractUsernameFromProfileLink(pitch.user?.creator?.instagramProfileLink)) && (
                                      <Stack direction="row" spacing={0.4} alignItems="center">
                                        <Iconify icon="mdi:instagram" width={14} sx={{ color: '#E4405F' }} />
                                        <Typography sx={{ fontSize: '0.8rem' }} color="text.secondary" noWrap>
                                          {pitch.user?.creator?.instagramUser?.username
                                            || extractUsernameFromProfileLink(
                                              pitch.user?.creator?.instagramProfileLink
                                            )}
                                        </Typography>
                                      </Stack>
                                    )}
                                  {(pitch.user?.creator?.tiktokUser?.username
                                    || extractUsernameFromProfileLink(pitch.user?.creator?.tiktokProfileLink)) && (
                                      <Stack direction="row" spacing={0.4} alignItems="center">
                                        <Iconify icon="ic:baseline-tiktok" width={14} sx={{ color: '#000000' }} />
                                        <Typography sx={{ fontSize: '0.8rem' }} color="text.secondary" noWrap>
                                          {pitch.user?.creator?.tiktokUser?.username
                                            || extractUsernameFromProfileLink(
                                              pitch.user?.creator?.tiktokProfileLink
                                            )}
                                        </Typography>
                                      </Stack>
                                    )}
                                </Stack>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ px: 2 }}>
                            <Typography sx={{ fontSize: '0.92rem' }}>
                              {getFollowerDisplay(pitch)}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ px: 2 }}>
                            <Typography sx={{ fontSize: '0.92rem' }}>
                              {pitch.user?.creator?.creditTier?.name || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ px: 2 }}>
                            <Typography sx={{ fontSize: '0.92rem' }}>
                              {pitch.user?.creator?.creditTier?.creditsPerVideo ?? '-'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ px: 2 }}>{getStatusChip(pitch.status)}</TableCell>
                          <TableCell sx={{ pl: 2, pr: 0.5 }}>
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => handleViewPitch(pitch)}
                              sx={{
                                bgcolor: '#FFFFFF',
                                border: '1.5px solid #e7e7e7',
                                borderBottom: '3px solid #e7e7e7',
                                borderRadius: 1,
                                color: '#1340FF',
                                height: 34,
                                px: 2,
                                py: 1.5,
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                textTransform: 'none',
                                whiteSpace: 'nowrap',
                                minWidth: '90px',
                                display: 'flex',
                                alignItems: 'center',
                                '&:hover': {
                                  bgcolor: 'rgba(19, 64, 255, 0.08)',
                                  border: '1.5px solid #1340FF',
                                  borderBottom: '3px solid #1340FF',
                                  color: '#1340FF',
                                },
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                          <TableCell sx={{ pl: 0, pr: 1, width: 32 }}>
                            <IconButton
                              size="small"
                              onClick={() => onRemoveCreator(pitch.id)}
                              sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                            >
                              <Iconify icon="eva:close-fill" width={18} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || selectedPitches.length === 0}
          sx={{
            ml: 'auto',
            minWidth: { xs: '100%', sm: 260 },
            bgcolor: '#3A3A3C',
            color: '#FFFFFF',
            boxShadow: '0px -3px 0px 0px #00000073 inset',
            borderRadius: 1,
            fontWeight: 600,
            fontSize: '0.85rem',
            height: 42,
            textTransform: 'none',
            '&:hover': {
              bgcolor: '#4a4a4c',
              boxShadow: '0px -3px 0px 0px #00000073 inset',
            },
            '&.Mui-disabled': {
              bgcolor: 'rgba(58, 58, 60, 0.45)',
              color: 'rgba(255, 255, 255, 0.7)',
              boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.2) inset',
            },
          }}
        >
          {submitting ? (
            <CircularProgress size={20} sx={{ color: 'white' }} />
          ) : (
            `Send to ${approverName.trim() || '[Approver Name]'}`
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ApprovalSetupModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  campaignId: PropTypes.string,
  selectedPitches: PropTypes.array.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onRemoveCreator: PropTypes.func.isRequired,
  onViewPitch: PropTypes.func,
};

export default ApprovalSetupModal;
