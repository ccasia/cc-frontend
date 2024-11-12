import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';

import {
  Box,
  Table,
  Button,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
  Typography,
  TableContainer,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import { confirmItemDelivered } from 'src/api/logistic';


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
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px' }}>
                  <Box sx={{ 
                    backgroundColor: '#f0f0f0', 
                    borderRadius: '50%', 
                    width: { xs: '60px', md: '80px' },
                    height: { xs: '60px', md: '80px' },
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <Typography variant="h2" sx={{ 
                      fontFamily: (theme) => theme.typography.fontSecondaryFamily, 
                      fontSize: { xs: '2.5rem', md: '3rem' },
                      fontWeight: 'normal', 
                      marginBottom: '0' 
                    }}>
                      👾
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h3" sx={{ 
                  fontFamily: (theme) => theme.typography.fontSecondaryFamily, 
                  fontSize: { xs: '1.8rem', md: '2rem' },
                  fontWeight: 'normal', 
                  marginTop: '10px', 
                  marginBottom: '10px' 
                }}>
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
                      border: { xs: '1px solid #203ff5', md: '1.5px solid #203ff5' },
                      borderBottom: { xs: '4px solid #203ff5', md: '4px solid #203ff5' },
                      borderRadius: 1,
                      p: { xs: 1, md: 0.8 },
                      mb: { xs: 1, md: 1 },
                      width: 'fit-content',
                      display: 'flex',
                      flexDirection: { xs: 'column', md: 'row' },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#203ff5',
                        fontWeight: 500,
                        fontSize: { xs: '0.65rem', md: '0.75rem' },
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
