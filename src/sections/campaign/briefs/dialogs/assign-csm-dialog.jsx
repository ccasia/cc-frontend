import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import Typography from '@mui/material/Typography';
import OutlinedInput from '@mui/material/OutlinedInput';
import DialogContent from '@mui/material/DialogContent';
import FormHelperText from '@mui/material/FormHelperText';
import CircularProgress from '@mui/material/CircularProgress';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

export default function AssignCsmDialog({ open, brief, onClose, onAssigned }) {
  const { enqueueSnackbar } = useSnackbar();

  const [csmOptions, setCsmOptions] = useState([]);
  const [assigned, setAssigned] = useState([]); // [{ id, name, email }]
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !brief?.id) return;
    setSelected([]);
    setError('');
    setLoading(true);
    Promise.all([
      axiosInstance.get('/api/admin/getAllAdmins'),
      axiosInstance.get(endpoints.campaignBrief.get(brief.id)),
    ])
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
      })
      .catch(() => enqueueSnackbar('Failed to load CSM admins', { variant: 'error' }))
      .finally(() => setLoading(false));
  }, [open, brief?.id, enqueueSnackbar]);

  const assignedIds = new Set(assigned.map((a) => a.id));

  const handleSubmit = async () => {
    if (selected.length === 0) {
      setError('Select at least one CSM.');
      return;
    }
    setSubmitting(true);
    try {
      await axiosInstance.post(endpoints.campaignBrief.assignCsm(brief.id), { csmIds: selected });
      enqueueSnackbar('CSM assigned', { variant: 'success' });
      onAssigned?.();
      onClose?.();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Failed to assign CSM', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogContent sx={{ p: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
          <Typography variant="h4" sx={{ fontFamily: 'Instrument Serif, serif', fontWeight: 400 }}>
            Assign CSM
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Assign one or more CSMs to <strong>{brief?.name || 'this campaign'}</strong>. They&apos;ll
          complete activation.
        </Typography>

        {loading ? (
          <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
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
                {/* <Divider sx={{ mt: 2 }} /> */}
              </Box>
            )}

            <FormControl fullWidth error={!!error} sx={{ mb: 3 }}>
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
            {submitting ? 'Assigning…' : 'Assign'}
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
};
