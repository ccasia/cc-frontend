import React from 'react';
import PropTypes from 'prop-types';

import { Typography } from '@mui/material';

const CampaignDetailPitch = ({ pitches }) => (
  <>
    <Typography>dawdaw</Typography>
    {JSON.stringify(pitches)}pitches
  </>
);

export default CampaignDetailPitch;

CampaignDetailPitch.propTypes = {
  pitches: PropTypes.object,
};
