import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import { enqueueSnackbar } from 'notistack';

import TextField from '@mui/material/TextField';
import {
  Box,
  Button,
  Typography,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import { confirmItemDelivered } from 'src/api/logistic';


const statusMapping = {
  Product_is_being_packaged: 'BEING PACKAGED',
  Pending_Delivery_Confirmation: 'PENDING DELIVERY CONFIRMATION',
  Product_has_been_received: 'RECEIVED',
  Product_is_out_for_delivery: 'OUT FOR DELIVERY',
  Product_is_at_delivery_warehouse_in_transit: 'AT DELIVERY WAREHOUSE',
};

const CampaignLogistics = ({ campaign, campaignMutate }) => {
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

  console.log(campaign);

  const campaignLogistics = campaign?.logistic || [];

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );

  const initialSheetLink = campaign?.spreadSheetURL || '';
  const [isEditing, setIsEditing] = useState(initialSheetLink === ''); 
  const [sheetLink, setSheetLink] = useState(initialSheetLink);
  const [origSheetLink, setOrigSheetLink] = useState(initialSheetLink);
  const [sheetLoading, setSheetLoading] = useState(false);

  const handleSheetEdit = () => setIsEditing(true);
  const handleSheetCancel = () => {
    setSheetLink(origSheetLink);
    setIsEditing(false);
  };
  const handleSheetChange = (e) => setSheetLink(e.target.value);
  const handleSheetUpdate = async () => {
    setSheetLoading(true);
    try {
      await axiosInstance.patch(
        endpoints.campaign.editCampaignInfo,
        {
          id: campaign?.id,
          name: campaign?.name,
          description: campaign?.description,
          spreadSheetURL: sheetLink,
        }
      );
      enqueueSnackbar('Sheet link updated', { variant: 'success' });
      if (campaignMutate) campaignMutate();
      mutate(`/api/campaign/${campaign?.id}`);
      setIsEditing(false);
      setOrigSheetLink(sheetLink); // update original value
    } catch (err) {
      enqueueSnackbar(err?.message || 'Failed to update link', { variant: 'error' });
    } finally {
      setSheetLoading(false);
    }
  };
  const isUpdateDisabled = !sheetLink || sheetLink === origSheetLink || sheetLoading;

  return (
    <Box sx={{ mb: 5 }}>
      <Typography
        mb={1}
        sx={{
          fontFamily: 'Instrument Serif, serif',
          fontWeight: 400,
          fontStyle: 'normal',
          fontSize: '32px',
          lineHeight: '36px',
          letterSpacing: 0,
          color: '#221f20',
        }}
      >
        Insert Google Sheet Link
      </Typography>
      <Typography
        mb={2}
        sx={{
          fontFamily: 'Inter Display, Inter, sans-serif',
          fontWeight: 400,
          fontStyle: 'normal',
          fontSize: '14px',
          lineHeight: '18px',
          letterSpacing: 0,
          color: '#636366',
        }}
      >
        Clients will use this link to track Product Deliveries and Store Visits/Reservations
      </Typography>

      <Box mb={6} /> {/* 24px gap */}

      <Typography
        sx={{
          fontFamily: 'Inter Display, Inter, sans-serif',
          fontWeight: 500,
          fontSize: '12px',
          lineHeight: '16px',
          color: '#636366',
          mb: 1,
        }}
      >
        Google Sheet Link
      </Typography>
      <Box mb={2}>
        <TextField
          size="small"
          value={sheetLink}
          InputProps={{
            readOnly: !isEditing,
            sx: {
              bgcolor: 'transparent',
              width: '303.33px',
              height: '44px',
              pt: '10px',
              pb: '10px',
              pr: '12px',
              pl: '12px',
              borderRadius: 2,
              color: '#221f20',
              border: '1px solid #E7E7E7',
              fontFamily: 'Inter Display, Inter, sans-serif',
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '18px',
              letterSpacing: 0,
              boxShadow: 'none',
              gap: '8px',
              opacity: 1,
            },
          }}
          onChange={handleSheetChange}
          sx={{ width: '303.333px', height: '44px', gap: '8px' }}
        />
      </Box>
      <Box display="flex" flexDirection="row" gap={2} alignItems="center">
        {isEditing ? (
          <>
            <Button
              variant="contained"
              onClick={handleSheetUpdate}
              disabled={isUpdateDisabled}
              sx={{
                width: '75px', height: '38px', pt: '8px', pb: '11px', pr: '12px', pl: '12px',
                gap: '4px', borderRadius: '8px', boxShadow: '0px -3px 0px 0px #00000073 inset', color: '#fff',
                fontWeight: 600, fontFamily: 'Inter Display, Inter, sans-serif', fontSize: '14px', textTransform: 'none',
                background: '#3A3A3C', border: 'none', opacity: 1,
              }}
            >Update</Button>
            {(origSheetLink !== '' || sheetLink !== '') && (
              <Button
                variant="outlined"
                onClick={handleSheetCancel}
                disabled={sheetLoading}
                sx={{
                  width: '53px', height: '38px', pt: '8px', pb: '11px', pr: '12px', pl: '12px',
                  gap: '4px', borderRadius: '8px', bgcolor: '#FFFFFF', border: '1px solid #E7E7E7',
                  boxShadow: '0px -3px 0px 0px #E7E7E7 inset', color: '#636366', fontWeight: 600,
                  fontFamily: 'Inter Display, Inter, sans-serif', fontSize: '14px', textTransform: 'none', opacity: 1,
                }}
              >Cancel</Button>
            )}
          </>
        ) : (
          <Button
            variant="outlined"
            onClick={handleSheetEdit}
            sx={{
              width: '53px', height: '38px', pt: '8px', pb: '11px', pr: '12px', pl: '12px', gap: '4px', borderRadius: '8px',
              bgcolor: '#FFFFFF', border: '1px solid #E7E7E7', boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
              color: '#636366', fontWeight: 600, fontFamily: 'Inter Display, Inter, sans-serif', fontSize: '14px', textTransform: 'none', opacity: 1,
            }}
          >Edit</Button>
        )}
      </Box>
    </Box>
  );
};

export default CampaignLogistics;

CampaignLogistics.propTypes = {
  campaign: PropTypes.object,
  campaignMutate: PropTypes.func,
};
