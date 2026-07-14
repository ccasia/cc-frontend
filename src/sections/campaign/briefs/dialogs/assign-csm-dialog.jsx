import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import DialogContent from '@mui/material/DialogContent';
import FormHelperText from '@mui/material/FormHelperText';
import CircularProgress from '@mui/material/CircularProgress';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

import AttachClientPackage from './attach-client-package';

// mode:
//   'assign'   — CSL assigns one or more CSMs (shows the CSM picker).
//   'finalize' — a CSM finalizes their OWN brief into a campaign they manage.
//                No CSM picker; on save it just attaches the client/package and
//                calls the finalize endpoint (server keeps the CSM as manager).
export default function AssignCsmDialog({ open, brief, onClose, onAssigned, mode = 'assign' }) {
  const { enqueueSnackbar } = useSnackbar();

  const isFinalize = mode === 'finalize';

  const attachRef = useRef(null);

  const [csmOptions, setCsmOptions] = useState([]);
  const [assigned, setAssigned] = useState([]); // [{ id, name, email }]
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Whether the linked company already has an active package. When true we skip
  // the client/package attach section entirely.
  const [hasActivePackage, setHasActivePackage] = useState(true);
  const [internalComments, setInternalComments] = useState('');

  useEffect(() => {
    if (!open || !brief?.id) return;
    setSelected([]);
    setError('');
    setInternalComments('');
    setLoading(true);

    // Finalize mode doesn't pick CSMs, so skip the admins fetch.
    const adminsReq = isFinalize
      ? Promise.resolve({ data: [] })
      : axiosInstance.get('/api/admin/getAllAdmins');

    Promise.all([adminsReq, axiosInstance.get(endpoints.campaignBrief.get(brief.id))])
      .then(([adminsRes, briefRes]) => {
        const csms = (adminsRes.data || []).filter(
          (a) =>
            a.role?.name === 'CSM' ||
            a.role?.name === 'Customer Success Manager' ||
            a.role?.name?.toLowerCase().includes('csm') ||
            a.role?.name?.toLowerCase().includes('customer success')
        );
        setCsmOptions(csms);

        // Assigned CSMs are campaignAdmin rows with role 'manager'.
        const managers = (briefRes.data?.campaignAdmin || [])
          .filter((ca) => ca.role === 'manager' && ca.admin?.user)
          .map((ca) => {
            // getBriefById doesn't select photoURL, so fall back to the admin
            // list (keyed by userId) to pull the avatar image.
            const fromOptions = csms.find((o) => o.userId === ca.admin.user.id);
            return {
              id: ca.admin.user.id,
              name: ca.admin.user.name,
              email: ca.admin.user.email,
              photoURL: ca.admin.user.photoURL || fromOptions?.user?.photoURL || null,
            };
          });
        setAssigned(managers);

        // Detect a linked company with an ACTIVE subscription.
        const company = briefRes.data?.company || briefRes.data?.brand?.company || null;
        const activeSub = (company?.subscriptions || []).some((s) => s.status === 'ACTIVE');
        setHasActivePackage(Boolean(activeSub));

        setInternalComments(briefRes.data?.internalComments || '');
      })
      .catch(() => enqueueSnackbar('Failed to load brief', { variant: 'error' }))
      .finally(() => setLoading(false));
  }, [open, brief?.id, isFinalize, enqueueSnackbar]);

  const assignedIds = new Set(assigned.map((a) => a.id));

  const handleSubmit = async () => {
    if (!isFinalize && selected.length === 0) {
      setError('Select at least one CSM.');
      return;
    }
    setSubmitting(true);
    try {
      // Attach a client + package when the brief has no active package yet.
      if (!hasActivePackage) {
        const result = await attachRef.current?.resolveCompany();
        if (!result?.ok) {
          setSubmitting(false);
          return;
        }
        await axiosInstance.patch(endpoints.campaign.editCampaignBrandOrCompany, {
          campaignBrand: { id: result.id, name: result.name },
          id: brief.id,
        });
      }

      if (isFinalize) {
        // CSM finalizes their own brief — no CSM selection, they stay as manager.
        await axiosInstance.post(endpoints.campaignBrief.finalize(brief.id), {
          internalComments: internalComments || '',
        });
        enqueueSnackbar('Campaign created', { variant: 'success' });
      } else {
        await axiosInstance.post(endpoints.campaignBrief.assignCsm(brief.id), {
          csmIds: selected,
          internalComments: internalComments || '',
        });
        enqueueSnackbar('CSM assigned', { variant: 'success' });
      }
      onAssigned?.();
      onClose?.();
    } catch (err) {
      enqueueSnackbar(
        err?.response?.data?.message || err?.message || `Failed to ${isFinalize ? 'finalize brief' : 'assign CSM'}`,
        { variant: 'error' }
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogContent sx={{ p: 4, minHeight: 610 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}>
          <Typography variant="h3" sx={{ fontFamily: 'Instrument Serif, serif', fontWeight: 400 }}>
            Attach Client &amp; Package
          </Typography>
          <IconButton onClick={onClose} size="medium">
            <Iconify width={24} icon="eva:close-fill" />
          </IconButton>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {brief?.name || 'this campaign'}
        </Typography>

        {loading ? (
          <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <>
            {/* Client + package attach — only when no active package is linked yet. */}
            {!hasActivePackage && (
              <>
                <AttachClientPackage ref={attachRef} brief={brief} />
                <Divider sx={{ my: 2 }} />
              </>
            )}

            {/* CSM picker — only in assign mode. In finalize mode the CSM
                finalizes their own brief and stays as manager. */}
            {!isFinalize && (
              <>
            {/* Currently assigned — so CSL doesn't double-assign. */}
            {assigned.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600 }}>
                  Currently assigned
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 0 }}>
                  {assigned.map((a) => (
                    <Chip
                      key={a.id}
                      avatar={<Avatar src={a.photoURL || undefined}>{a.name?.charAt(0) || 'C'}</Avatar>}
                      label={a.name || a.email || a.id}
                      size="small"
                      sx={{ bgcolor: 'transparent', color: 'text.secondary', fontWeight: 600 }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            <FormControl fullWidth error={!!error} sx={{ mb: 2 }}>
              <InputLabel>CSM Admins</InputLabel>
              <Select
                multiple
                value={selected}
                onChange={(e) => {
                  setSelected(e.target.value);
                  setError('');
                }}
                input={<OutlinedInput label="CSM Admins" />}
                renderValue={(vals) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {vals.map((v) => {
                      const a = csmOptions.find((o) => o.userId === v);
                      return <Chip key={v} label={a?.user?.name || v} size="small" />;
                    })}
                  </Box>
                )}
              >
                {csmOptions.length > 0 ? (
                  csmOptions.map((admin) => {
                    const already = assignedIds.has(admin.userId);
                    return (
                      <MenuItem key={admin.userId} value={admin.userId} disabled={already}>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          justifyContent="space-between"
                          sx={{ width: '100%' }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Avatar src={admin.user?.photoURL} sx={{ width: 32, height: 32 }}>
                              {admin.user?.name?.charAt(0) || 'A'}
                            </Avatar>
                            <Typography>{admin.user?.name || admin.userId}</Typography>
                          </Stack>
                          {already && (
                            <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                              Assigned
                            </Typography>
                          )}
                        </Stack>
                      </MenuItem>
                    );
                  })
                ) : (
                  <MenuItem disabled>No CSM admins available</MenuItem>
                )}
              </Select>
              {error && <FormHelperText>{error}</FormHelperText>}
            </FormControl>
              </>
            )}

            {/* Internal comments for the CS team. */}
            <Box>
              <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, mb: 1, display: 'block' }}>
                Internal Comments
              </Typography>
              <TextField
                value={internalComments}
                onChange={(e) => setInternalComments(e.target.value)}
                placeholder="Anything the CS team should know?"
                fullWidth
                multiline
                minRows={2}
                sx={{ mb: 1 }}
              />
            </Box>
          </>
        )}

        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button onClick={onClose} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || loading}
            sx={{ bgcolor: '#1340FF', '&:hover': { bgcolor: '#0F33CC' }, px: 4, textTransform: 'none' }}
          >
            {submitting ? 'Saving…' : 'Save'}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

AssignCsmDialog.propTypes = {
  open: PropTypes.bool,
  brief: PropTypes.object,
  onClose: PropTypes.func,
  onAssigned: PropTypes.func,
  mode: PropTypes.oneOf(['assign', 'finalize']),
};
