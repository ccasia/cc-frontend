import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';

import {
  Table,
  Button,
  Dialog,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import { confirmItemDelivered } from 'src/api/logistic';

import Label from 'src/components/label';

const CampaignLogistics = ({ campaign }) => {
  const { user } = useAuthContext();
  const dialog = useBoolean();

  const onClickYes = async (logisticId) => {
    try {
      const res = await confirmItemDelivered(logisticId);
      mutate(endpoints.campaign.creator.getCampaign(campaign?.id));
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar('Error', {
        variant: 'error',
      });
    }
  };

  const creatorLogistics = campaign?.logistic?.filter(
    (item) => item?.campaignId === campaign?.id && item?.userId === user?.id
  );

  return (
    <TableContainer sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Item</TableCell>
            <TableCell>Courier</TableCell>
            <TableCell>Tracking Number</TableCell>
            <TableCell>Status</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {creatorLogistics?.map((logistic) => (
            <>
              <TableRow key={logistic?.id}>
                <TableCell>{logistic?.itemName}</TableCell>
                <TableCell>{logistic?.courier}</TableCell>
                <TableCell>{logistic?.trackingNumber || 'None'}</TableCell>
                <TableCell>
                  <Label>{logistic?.status}</Label>
                </TableCell>
                <TableCell>
                  {logistic?.status === 'Pending_Delivery_Confirmation' && (
                    <Button variant="contained" size="small" onClick={dialog.onTrue}>
                      Item Received
                    </Button>
                  )}
                </TableCell>
              </TableRow>
              <Dialog open={dialog.value} onClose={dialog.onFalse}>
                <DialogTitle>Confirmation</DialogTitle>
                <DialogContent>
                  Could you please confirm that this item has been received?
                </DialogContent>
                <DialogActions>
                  <Button onClick={dialog.onFalse} variant="outlined" size="small">
                    No
                  </Button>
                  <Button variant="contained" size="small" onClick={() => onClickYes(logistic?.id)}>
                    Yes
                  </Button>
                </DialogActions>
              </Dialog>
            </>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CampaignLogistics;

CampaignLogistics.propTypes = {
  campaign: PropTypes.object,
};
