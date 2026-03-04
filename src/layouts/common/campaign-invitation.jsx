import PropTypes from 'prop-types';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { Box, Stack } from '@mui/material';
import Typography from '@mui/material/Typography';
import DialogContent from '@mui/material/DialogContent';

export default function CampaignInvitationModal({ open, onClose, onGoToCampaign, campaignName }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth sx={{ justifySelf: 'center', maxWidth: 410 }}>
      <Stack spacing={1.5} p={3}>
        <Box alignSelf="center" sx={{ bgcolor: '#8A5AFE', px: 2.5, py: 1.5, borderRadius: 100 }}>
          <Typography variant='h3'>🫵</Typography>
        </Box>
        <DialogContent>
          <Typography textAlign="center" variant='h3' fontWeight={500} fontFamily="Instrument Serif">We want you!</Typography>
            <Typography textAlign="center" fontSize={14} color="#636366">You&apos;ve been invited to join the campaign <span style={{ fontWeight: 500, color: '#231F20' }}>{campaignName}</span></Typography>
        </DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={onGoToCampaign}
            sx={{
              bgcolor: '#3a3a3c',
              color: '#ffffff',
              borderBottom: 3.5,
              borderBottomColor: '#202021',
              '&:hover': {
                bgcolor: '#3a3a3c',
                opacity: 0.9,
              },
            }}
          >
            Go to Campaign
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={onClose}
            sx={{
              border: '1px solid #e7e7e7',
              borderBottom: '4px solid',
              borderBottomColor: '#e7e7e7',
              backgroundColor: '#FFFFFF',
            }}
          >
            Close
          </Button>
        </Box>
      </Stack>
    </Dialog>
  );
}

CampaignInvitationModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onGoToCampaign: PropTypes.func,
  campaignName: PropTypes.string,
};
