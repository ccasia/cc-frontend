import PropTypes from 'prop-types';
import { useState, useEffect } from 'react'; // Import hooks

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import Iconify from 'src/components/iconify';

export default function EditQuantityDialog({
  open,
  onClose,
  selectedCreatorIds,
  creators,
  assignments, // Initial data from parent
  onSave, // NEW: Replaces onUpdateAssignment
}) {
  // 1. Local State (The Snapshot)
  const [snapshot, setSnapshot] = useState({});

  // 2. Sync: When dialog opens, copy parent data to local snapshot
  useEffect(() => {
    if (open) {
      // Create a deep copy or shallow copy to break reference
      setSnapshot(JSON.parse(JSON.stringify(assignments)));
    }
  }, [open, assignments]);

  // 3. Local Handler: Update snapshot only
  const handleLocalUpdate = (creatorId, productId, actionOrValue) => {
    setSnapshot((prev) => {
      const next = { ...prev };
      const currentItems = next[creatorId] || [];

      if (actionOrValue === 'remove') {
        next[creatorId] = currentItems.filter((item) => item.productId !== productId);
      } else {
        const newQuantity = actionOrValue;
        next[creatorId] = currentItems.map((item) => {
          if (item.productId === productId) {
            return { ...item, quantity: newQuantity };
          }
          return item;
        });
      }
      return next;
    });
  };

  // 4. Save Handler: Send snapshot back to parent
  const handleConfirm = () => {
    onSave(snapshot);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose} // Clicking outside/X just closes, discarding changes
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: '#F4F4F4',
          p: 3,
          width: '100%',
          maxWidth: 700,
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
        <Typography
          variant="h2"
          sx={{ fontWeight: 400, fontFamily: 'instrument serif', color: '#231F20' }}
        >
          Edit Quantity
        </Typography>
        <IconButton onClick={onClose}>
          <Iconify icon="eva:close-fill" width={32} />
        </IconButton>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Grid container spacing={2} sx={{ mb: 1, px: 1 }}>
        <Grid item xs={5}>
          <Typography variant="subtitle2" sx={{ color: '#636366' }}>
            Assigning to
          </Typography>
        </Grid>
        <Grid item xs={7}>
          <Typography variant="subtitle2" sx={{ color: '#636366' }}>
            Product
          </Typography>
        </Grid>
      </Grid>

      <Stack spacing={2} sx={{ maxHeight: '60vh', overflowY: 'auto', pr: 1 }}>
        {selectedCreatorIds.map((creatorId) => {
          const creator = creators.find((c) => c.id === creatorId);
          // USE SNAPSHOT, NOT PROP
          const creatorAssignments = snapshot[creatorId] || [];

          return (
            <Grid container spacing={2} key={creatorId} alignItems="flex-start" sx={{ px: 1 }}>
              <Grid item xs={5}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar src={creator?.photoURL} sx={{ width: 40, height: 40 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {creator?.name}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={7}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {creatorAssignments.length === 0 && (
                    <Typography variant="body2" sx={{ color: '#919EAB', py: 1 }}>
                      -
                    </Typography>
                  )}

                  {creatorAssignments.map((item) => (
                    <Box
                      key={item.productId}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        bgcolor: '#fff',
                        border: '1px solid #E0E0E0',
                        borderRadius: '8px',
                        px: 1,
                        py: 0.5,
                        height: 36,
                      }}
                    >
                      <Box
                        component="input"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^\d*$/.test(val)) {
                            const payload = val === '' ? '' : parseInt(val, 10);
                            // Call Local Handler
                            handleLocalUpdate(creatorId, item.productId, payload);
                          }
                        }}
                        onBlur={() => {
                          // Auto-fix empty inputs on blur
                          if (item.quantity === '') handleLocalUpdate(creatorId, item.productId, 0);
                        }}
                        sx={{
                          width: 32,
                          height: 24,
                          borderRadius: '12px',
                          border: '1px solid #E0E0E0',
                          bgcolor: '#F4F4F4',
                          textAlign: 'center',
                          fontSize: '13px',
                          fontWeight: 700,
                          mr: 1,
                          outline: 'none',
                          color: '#231F20',
                          '&:focus': { borderColor: '#1340FF', bgcolor: '#fff' },
                        }}
                      />

                      <Typography variant="body2" sx={{ fontWeight: 500, mr: 1 }}>
                        {item.name}
                      </Typography>

                      <Iconify
                        icon="eva:close-fill"
                        width={16}
                        sx={{
                          color: '#919EAB',
                          cursor: 'pointer',
                          '&:hover': { color: '#FF3B30' },
                        }}
                        // Call Local Handler
                        onClick={() => handleLocalUpdate(creatorId, item.productId, 'remove')}
                      />
                    </Box>
                  ))}
                </Box>
              </Grid>
            </Grid>
          );
        })}
      </Stack>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleConfirm} // Calls the save function
          sx={{
            bgcolor: '#333333',
            color: '#fff',
            px: 6,
            py: 1.5,
            borderRadius: '8px',
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 700,
            '&:hover': { bgcolor: '#000000' },
          }}
        >
          Confirm
        </Button>
      </Box>
    </Dialog>
  );
}

EditQuantityDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  selectedCreatorIds: PropTypes.array,
  creators: PropTypes.array,
  assignments: PropTypes.object,
  onSave: PropTypes.func, // Changed from onUpdateAssignment
};
