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

export const CampaignLog = ({ open, campaign, onClose }) => {
  // const [campaignLog, setCampaignLog] = useState([]);

  const rows =
    campaign &&
    campaign.campaignLogs.map((log) => ({
      id: log.id,
      datePerformed: dayjs(log.createdAt).format('ddd LL'),
      action: log.message,
      performedBy: log.admin.name,
    }));

  return (
    <Dialog
      open={open}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      fullWidth
      maxWidth="md"
    >
      <DialogTitle id="alert-dialog-title">“{campaign?.name}” Log</DialogTitle>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date Performed</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Performed By</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows?.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.datePerformed}</TableCell>
                <TableCell>{row.action}</TableCell>
                <TableCell>{row.performedBy}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

CampaignLog.propTypes = {
  open: PropTypes.bool,
  campaign: PropTypes.object,
  onClose: PropTypes.func,
};
