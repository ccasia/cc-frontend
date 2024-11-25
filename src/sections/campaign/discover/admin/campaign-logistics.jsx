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

import { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import { confirmItemDelivered } from 'src/api/logistic';

import Scrollbar from 'src/components/scrollbar';

const statusMapping = {
  Product_is_being_packaged: 'BEING PACKAGED',
  Pending_Delivery_Confirmation: 'PENDING DELIVERY CONFIRMATION',
  Product_has_been_received: 'RECEIVED',
  Product_is_out_for_delivery: 'OUT FOR DELIVERY',
  Product_is_at_delivery_warehouse_in_transit: 'AT DELIVERY WAREHOUSE',
};

const CampaignLogistics = ({ campaign }) => {
  const { user } = useAuthContext();

  const onClickConfirm = async (logisticId) => {
    try {
      const res = await confirmItemDelivered(logisticId);
      mutate(endpoints.campaign.creator.getCampaign(campaign?.id));
      enqueueSnackbar(res?.data?.message || 'Item delivery confirmed successfully');
    } catch (error) {
      enqueueSnackbar(error?.message || 'Error confirming delivery', {
        variant: 'error',
      });
    }
  };

  console.log(campaign)

  const campaignLogistics = campaign?.logistic || [];

  return (
    <Box>
      <Scrollbar>
        <TableContainer 
          sx={{ 
            minWidth: 800, 
            position: 'relative',
            bgcolor: 'transparent',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell 
                  sx={{ 
                    py: 1, 
                    color: '#221f20', 
                    fontWeight: 600,
                    borderRadius: '10px 0 0 10px',
                    bgcolor: '#f5f5f5',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Creator
                </TableCell>
                <TableCell 
                  sx={{ 
                    py: 1, 
                    color: '#221f20', 
                    fontWeight: 600,
                    bgcolor: '#f5f5f5',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Item
                </TableCell>
                <TableCell 
                  sx={{ 
                    py: 1, 
                    color: '#221f20', 
                    fontWeight: 600,
                    bgcolor: '#f5f5f5',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Courier
                </TableCell>
                <TableCell 
                  sx={{ 
                    py: 1, 
                    color: '#221f20', 
                    fontWeight: 600,
                    bgcolor: '#f5f5f5',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Tracking Number
                </TableCell>
                <TableCell 
                  sx={{ 
                    py: 1, 
                    color: '#221f20', 
                    fontWeight: 600,
                    bgcolor: '#f5f5f5',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Status
                </TableCell>
                <TableCell 
                  sx={{ 
                    py: 1, 
                    color: '#221f20', 
                    fontWeight: 600,
                    borderRadius: '0 10px 10px 0',
                    bgcolor: '#f5f5f5',
                    whiteSpace: 'nowrap',
                  }}
                />
              </TableRow>
            </TableHead>

            <TableBody>
              {campaignLogistics?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ padding: '40px 20px' }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        No logistics details to show
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Logistics information will appear here once available
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                campaignLogistics?.map((logistic) => (
                  <TableRow 
                    key={logistic?.id}
                    hover
                    sx={{
                      bgcolor: 'transparent',
                      '& td': {
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      },
                    }}
                  >
                    <TableCell sx={{ padding: '16px 12px' }}>
                      {logistic?.user?.name || 'Unknown Creator'}
                    </TableCell>
                    <TableCell sx={{ padding: '16px 12px' }}>{logistic?.itemName}</TableCell>
                    <TableCell sx={{ padding: '16px 12px' }}>{logistic?.courier}</TableCell>
                    <TableCell 
                      sx={{ 
                        padding: '16px 12px',
                        color: logistic?.trackingNumber ? '#203ff5' : 'text.secondary',
                        textDecoration: logistic?.trackingNumber ? 'underline' : 'none',
                        cursor: logistic?.trackingNumber ? 'pointer' : 'default'
                      }}
                    >
                      {logistic?.trackingNumber || 'Not available'}
                    </TableCell>
                    <TableCell sx={{ padding: '16px 12px' }}>
                      <Typography 
                        variant="body2"
                        sx={{ 
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          display: 'inline-block',
                          px: 1.5,
                          py: 0.5,
                          fontSize: '0.75rem',
                          border: '1px solid',
                          borderBottom: '3px solid',
                          borderRadius: 0.8,
                          bgcolor: 'white',
                          color: '#203ff5',
                          borderColor: '#203ff5',
                        }}
                      >
                        {statusMapping[logistic?.status] || logistic?.status}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ padding: '16px 12px' }}>
                      {logistic?.status === 'Pending_Delivery_Confirmation' && (
                        <Button 
                          variant="contained"
                          size="small"
                          onClick={() => onClickConfirm(logistic?.id)}
                        >
                          Confirm Receipt
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Scrollbar>
    </Box>
  );
};

export default CampaignLogistics;

CampaignLogistics.propTypes = {
  campaign: PropTypes.object,
};
