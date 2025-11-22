import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';

import { Box, Button, Container, Typography } from '@mui/material';
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

import LogisticsList from './logistics-list';
import BulkAssignView from './bulk-assign-view';

export default function CampaignLogisticsView({ campaign, campaignMutate }) {
  const settings = useSettingsContext();

  const [isBulkAssigning, setIsBulkAssigning] = useState(false);

  const handleOpenBulkAssign = useCallback(() => {
    setIsBulkAssigning(true);
  }, []);

  const handleCloseBulkAssign = useCallback(() => {
    setIsBulkAssigning(false);
    campaignMutate();
  }, [campaignMutate]);

  if (isBulkAssigning) {
    return <BulkAssignView campaign={campaign} onBack={handleCloseBulkAssign} />;
  }

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 5,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontFamily: 'Instrument Serif, serif',
              color: '#221f20',
              mb: 1,
            }}
          >
            Logistics Overview
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Track, manage, and coordinate product deliveries and reservations.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Iconify icon="eva:edit-2-fill" />}
          onClick={handleOpenBulkAssign}
          sx={{
            bgcolor: '#1340ff',
            '&:hover': { bgcolor: '#0e2fd6' },
          }}
        >
          Edit & Bulk Assign
        </Button>
      </Box>
      <LogisticsList campaignId={campaign?.id} />
    </Container>
  );
}

CampaignLogisticsView.propTypes = {
  campaign: PropTypes.object,
  campaignMutate: PropTypes.func,
};
