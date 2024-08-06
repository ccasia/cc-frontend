import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';

import { DataGrid } from '@mui/x-data-grid';
import { Button, Dialog, DialogTitle, DialogActions } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

// https://mui.com/x/react-data-grid/getting-started/
const rows = [
  { id: '1', datePerformed: '2024-07-29 06:01:45.925', action: 'Test Action', performedBy: 'Test Admin' },
];

const cols = [
  { field: 'datePerformed', headerName: 'Date performed', width: 250 },
  { field: 'action', headerName: 'Action', width: 250 },
  { field: 'performedBy', headerName: 'Performed by', width: 150 },
];

export const CampaignLog = ({ open, campaign, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [campaignLog, setCampaignLog] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(endpoints.campaign.getCampaignLog(campaign.id));
        setCampaignLog(res.data);
      } catch (error) {
        // TODO TEMP
        console.log('=== BEGIN CampaignLog useEffect error ===');
        console.log(error);
        console.log('=== END CampaignLog useEffect error ===');
        enqueueSnackbar('Failed to fetch campaign log', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, [campaign.id]);

  return (
    <Dialog
      open={open}
      aria-labelledby='alert-dialog-title'
      aria-describedby='alert-dialog-description'
      fullWidth
      maxWidth='md'
    >
      <DialogTitle id="alert-dialog-title">“{campaign.name}” Log</DialogTitle>
      {loading && <Iconify icon="eos-icons:bubble-loading" />}
      {/* TODO: Center this */}
      <div style={{ height: '100vh', width: '95%' }}>
        <DataGrid rows={rows} columns={cols} />
      </div>
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
