import React from 'react';
import PropTypes from 'prop-types';

import { Button, Dialog, DialogTitle, DialogActions, DialogContent } from '@mui/material';

const CreatorForm = ({ dialog }) => (
  <Dialog open={dialog.value} onClose={dialog.onFalse}>
    <DialogTitle>Complete this form</DialogTitle>
    <DialogContent>Adasdasdsa</DialogContent>
    <DialogActions>
      <Button size="small" variant="outlined" onClick={dialog.onFalse}>
        Close
      </Button>
      <Button size="small" variant="contained">
        Submit
      </Button>
    </DialogActions>
  </Dialog>
);

export default CreatorForm;

CreatorForm.propTypes = {
  dialog: PropTypes.object,
};
