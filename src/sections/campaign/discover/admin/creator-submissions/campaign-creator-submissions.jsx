import React from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';

import useGetSubmissions from './hooks/use-get-submissions';
import CreatorSubmissionsToolbar from './components/CreatorSubmissionsToolbar';

/**
 *
 * @param {object} campaign
 */
const CampaignCreatorSubmissions = ({ campaign }) => {
  const { submissions } = useGetSubmissions(campaign?.id);

  return (
    <Box>
      <CreatorSubmissionsToolbar />
    </Box>
  );
};

export default CampaignCreatorSubmissions;

CampaignCreatorSubmissions.propTypes = {
  campaign: PropTypes.object,
};
