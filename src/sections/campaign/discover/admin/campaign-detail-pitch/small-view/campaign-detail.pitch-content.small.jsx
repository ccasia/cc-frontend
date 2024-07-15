import React from 'react';
import PropTypes from 'prop-types';

import { Button, Container } from '@mui/material';

import useGetPitchDetail from 'src/hooks/use-get-pitch';

const CampaignDetailPitchContentSmall = ({ pitchId, campaignId }) => {
  const { data } = useGetPitchDetail(pitchId);

  return (
    <Container maxWidth="md">
      {data && JSON.stringify(data)}
      <Button>Back</Button>
    </Container>
  );
};

export default CampaignDetailPitchContentSmall;

CampaignDetailPitchContentSmall.propTypes = {
  pitchId: PropTypes.string,
  campaignId: PropTypes.string,
};
