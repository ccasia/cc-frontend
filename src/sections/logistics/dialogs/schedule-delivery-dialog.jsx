import { Dialog, DialogTitle, DialogContent, Button, DialogActions } from '@mui/material';

export default function ScheduleDeliveryDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Schedule Delivery</DialogTitle>
      <DialogContent>Form fields..</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
}
