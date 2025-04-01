import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import {
  Table,
  Button,
  Dialog,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
  DialogTitle,
  DialogActions,
  TableContainer,
} from '@mui/material';

export const AdminLogsModal = ({ open, logs, onClose }) => (
  <Dialog
    open={open}
    aria-labelledby="admin-logs-title"
    fullWidth
    maxWidth="md"
  >
    <DialogTitle id="admin-logs-title">Activity Logs</DialogTitle>

    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date Performed</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs?.length > 0 ? (
            logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{dayjs(log.createdAt).format('ddd LL')}</TableCell>
                <TableCell>{log.message}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} align="center">
                No logs available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>

    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);

AdminLogsModal.propTypes = {
  open: PropTypes.bool,
  logs: PropTypes.array,
  onClose: PropTypes.func,
};
