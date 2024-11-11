import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';

import {
  Table,
  Button,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
  TableContainer,
  Box,
  Stack,
  Typography,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import { confirmItemDelivered } from 'src/api/logistic';

import Label from 'src/components/label';

const statusMapping = {
  Product_is_being_packaged: 'BEING PACKAGED',
  Pending_Delivery_Confirmation: 'PENDING DELIVERY CONFIRMATION',
  Product_has_been_received: 'RECEIVED',
  Product_is_out_for_delivery: 'OUT FOR DELIVERY',
  Proudct_is_at_delivery_warehouse_in_transit: 'AT DELIVERY WAREHOUSE',
};

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
    <TableContainer sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Table sx={{ borderCollapse: 'separate', borderSpacing: '0 4px' }}>
        <TableHead sx={{ borderTopLeftRadius: '8px', borderTopRightRadius: '8px', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
          <TableRow>
            <TableCell sx={{ padding: '4px', color: 'black', width: '25%' }} align="left">Item</TableCell>
            <TableCell sx={{ padding: '4px', color: 'black', width: '25%' }} align="left">Courier</TableCell>
            <TableCell sx={{ padding: '4px', color: 'black', width: '25%' }} align="left">Tracking Number</TableCell>
            <TableCell sx={{ padding: '4px', color: 'black', width: '25%' }} align="left">Status</TableCell>
            <TableCell sx={{ padding: '4px' }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {creatorLogistics?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ padding: '20px' }}>
                <Typography variant="h2" sx={{ fontFamily: (theme) => theme.typography.fontSecondaryFamily, fontSize: '3.5rem', fontWeight: 'normal', marginBottom: '10px' }}>
                  👾
                </Typography>
                <Typography variant="h3" sx={{ fontFamily: (theme) => theme.typography.fontSecondaryFamily, fontSize: '2.5rem', fontWeight: 'normal', marginBottom: '10px' }}>
                  No details to show
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            creatorLogistics?.map((logistic) => (
              <TableRow key={logistic?.id} sx={{ borderBottom: '1px solid #e0e0e0' }}>
                <TableCell sx={{ padding: '20px 4px', color: 'black' }}>{logistic?.itemName}</TableCell>
                <TableCell sx={{ padding: '20px 4px', color: 'black' }}>{logistic?.courier}</TableCell>
                <TableCell sx={{ padding: '20px 4px', color: '#203ff5', textDecoration: 'underline' }}>{logistic?.trackingNumber || 'None'}</TableCell>
                <TableCell sx={{ padding: '20px 4px', color: 'black' }}>
                  <Box
                    sx={{
                      border: '1.5px solid #203ff5',
                      borderBottom: '4px solid #203ff5',
                      borderRadius: 1,
                      p: 1,
                      mb: 1,
                      width: 'fit-content',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#203ff5',
                        fontWeight: 600,
                      }}
                    >
                      {statusMapping[logistic?.status] || logistic?.status}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ padding: '4px' }}>
                  {logistic?.status === 'Pending_Delivery_Confirmation' && (
                    <Button variant="contained" size="small" onClick={dialog.onTrue}>
                      Item Received
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CampaignLogistics;

CampaignLogistics.propTypes = {
  campaign: PropTypes.object,
};
