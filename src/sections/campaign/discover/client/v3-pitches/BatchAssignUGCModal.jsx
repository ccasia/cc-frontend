import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useSnackbar } from 'notistack';

import { Box, Stack, Dialog, Button, TextField, Typography, DialogTitle, DialogContent, DialogActions } from '@mui/material';

import axiosInstance from 'src/utils/axios';

const BatchAssignUGCModal = ({ open, onClose, creators = [], campaignId, onAssigned, adminComments, creditsLeft }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [values, setValues] = useState([]);

  React.useEffect(() => {
    setValues((creators || []).map((c) => ({
      id: c.id,
      name: c.name,
      profileLink: c.profileLink,
      username: c.username,
      followerCount: c.followerCount,
      engagementRate: c.engagementRate,
      adminComments: c.adminComments,
      credits: '',
    })));
  }, [creators]);
  const [submitting, setSubmitting] = useState(false);
  const totalEntered = React.useMemo(() => values.reduce((acc, v) => acc + (parseInt(v.credits, 10) || 0), 0), [values]);

  const handleChange = (idx, val) => {
    setValues((prev) => prev.map((c, i) => (i === idx ? { ...c, credits: val } : c)));
  };

  const handleSubmit = async () => {
    const payload = values
      .map((v) => ({ id: v.id, credits: parseInt(v.credits, 10) || 0 }))
      .filter((v) => v.credits > 0);

    if (!payload.length) {
      enqueueSnackbar('Please enter credits for at least one creator', { variant: 'warning' });
      return;
    }

    try {
      setSubmitting(true);
      // Incoming values may include new guest creators without ids; create them first
      const guests = values.filter((v) => !v.id && (v.name || v.profileLink));
      // Debug logs
      // eslint-disable-next-line no-console
      console.log('[BatchAssignUGCModal] values:', values);
      // eslint-disable-next-line no-console
      console.log('[BatchAssignUGCModal] guests (no id):', guests);
      // Validate guest required fields
      const invalidGuest = guests.find((g) => !(g?.name && g?.profileLink));
      if (invalidGuest) {
        // eslint-disable-next-line no-console
        console.log('[BatchAssignUGCModal] invalid guest entry:', invalidGuest);
        enqueueSnackbar('Please provide Name and Profile Link for all non-platform creators before assigning.', { variant: 'error' });
        setSubmitting(false);
        return;
      }
      let workingValues = values;
      if (guests.length) {
        // Prepare payloads (max 3 per request per backend contract)
        const guestIndices = [];
        const guestPayloads = [];
        values.forEach((v, i) => {
          if (!v.id && (v.name || v.profileLink)) {
            guestIndices.push(i);
            guestPayloads.push({
              name: v.name || 'Guest',
              profileLink: v.profileLink || '',
              username: v.username || '',
              followerCount: v.followerCount || 0,
              engagementRate: v.engagementRate || 0,
              adminComments: (v.adminComments || adminComments || '').trim() || undefined,
            });
          }
        });

        // Chunk into batches of 3
        const createdIds = [];
        for (let start = 0; start < guestPayloads.length; start += 3) {
          const batch = guestPayloads.slice(start, start + 3);
          // eslint-disable-next-line no-console
          console.log('[BatchAssignUGCModal] POST /api/campaign/v3/shortlistCreator/guest', { campaignId, guestCreators: batch });
          const res = await axiosInstance.post('/api/campaign/v3/shortlistCreator/guest', {
            campaignId,
            guestCreators: batch,
          });
          const created = Array.isArray(res?.data?.createdCreators) ? res.data.createdCreators : [];
          // eslint-disable-next-line no-console
          console.log('[BatchAssignUGCModal] created guest ids:', created);
          created.forEach((c) => c?.id && createdIds.push(c.id));
        }

        // Merge created ids back in the order of guestIndices
        let idx = 0;
        const merged = values.map((p, i) => {
          if (guestIndices.includes(i)) {
            const newId = createdIds[idx++];
            return newId ? { ...p, id: newId } : p;
          }
          return p;
        });
        workingValues = merged;
        setValues(merged);
      }
      // Ensure pitches exist and attach CS comments if provided for PLATFORM creators only (those that already had ids)
      const platformIds = (creators || []).filter((c) => !!c.id).map((c) => c.id);
      const withIds = (workingValues || []).filter((v) => !!v.id && platformIds.includes(v.id));
      if (withIds.length) {
        // eslint-disable-next-line no-console
        console.log('[BatchAssignUGCModal] POST /api/campaign/v3/shortlistCreator', { campaignId, creators: withIds.map((v) => ({ id: v.id })), adminComments });
        await axiosInstance.post('/api/campaign/v3/shortlistCreator', {
          campaignId,
          creators: withIds.map((v) => ({ id: v.id })),
          adminComments: (adminComments || '').trim() || undefined,
        });
      }
      // eslint-disable-next-line no-console
      console.log('[BatchAssignUGCModal] POST /api/campaign/v3/assignUGCCredits', {
        campaignId,
        creators: (workingValues || [])
          .map((v) => ({ id: v.id, credits: parseInt(v.credits, 10) || 0 }))
          .filter((v) => v.id && v.credits > 0),
      });
      await axiosInstance.post('/api/campaign/v3/assignUGCCredits', {
        campaignId,
        creators: (workingValues || [])
          .map((v) => ({ id: v.id, credits: parseInt(v.credits, 10) || 0 }))
          .filter((v) => v.id && v.credits > 0),
      });
      enqueueSnackbar('UGC credits assigned successfully');
      onAssigned?.();
      onClose?.();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to assign credits';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          fontFamily: (theme) => theme.typography.fontSecondaryFamily,
          '&.MuiTypography-root': { fontSize: 24 },
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          Assign UGC Credits
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: 'text.secondary',
              border: '1px solid #e7e7e7',
              px: 1,
              py: 0.25,
              borderRadius: 1,
            }}
          >
            UGC Credits: {Math.max(0, (parseInt(creditsLeft, 10) || 0) - totalEntered)} left
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {values.map((c, idx) => (
            <Box key={c.id}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {c.name || c.id}
              </Typography>
              <TextField
                type="number"
                value={c.credits}
                onChange={(e) => handleChange(idx, e.target.value)}
                placeholder="UGC credits"
                fullWidth
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
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
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
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
          }}
        >
          Assign
        </Button>
      </DialogActions>
    </Dialog>
  );
};

BatchAssignUGCModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  creators: PropTypes.array,
  campaignId: PropTypes.string,
  onAssigned: PropTypes.func,
  adminComments: PropTypes.string,
};

export default BatchAssignUGCModal;


