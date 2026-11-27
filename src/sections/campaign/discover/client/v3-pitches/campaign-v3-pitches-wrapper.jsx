import PropTypes from 'prop-types';
import { useQueryClient } from '@tanstack/react-query';
import React, { useRef, useEffect, useCallback } from 'react';

import { Box, Alert } from '@mui/material';

import useGetV3Pitches from 'src/hooks/use-get-v3-pitches';

import CampaignV3Pitches from './campaign-v3-pitches';
import CreatorMasterListSkeleton from '../../admin/components/creator-master-list-skeleton';

const CampaignV3PitchesWrapper = ({ campaign, campaignMutate, isDisabled = false }) => {
  const { pitches, isLoading, isError, mutate } = useGetV3Pitches(campaign?.id);
  const queryClient = useQueryClient();

  // The Agreements tab reads the campaign's pitch and shortlist snapshots and
  // its own agreements query. Neither refetches on a tab switch, so refresh
  // them whenever a creator's numbers change here.
  const refreshCreatorSnapshots = useCallback(() => {
    campaignMutate?.();
    queryClient.invalidateQueries({ queryKey: ['agreements', campaign?.id] });
  }, [campaignMutate, queryClient, campaign?.id]);

  // A fetch finishes on the server, and the 2s poll only refreshes this list.
  const pendingIdsRef = useRef(new Set());
  useEffect(() => {
    const pendingNow = new Set(
      pitches.filter((pitch) => pitch?.pendingExtractionId).map((pitch) => pitch.id)
    );
    const settled = [...pendingIdsRef.current].some((id) => !pendingNow.has(id));
    pendingIdsRef.current = pendingNow;
    if (settled) refreshCreatorSnapshots();
  }, [pitches, refreshCreatorSnapshots]);

  const handlePitchUpdate = (updatedPitch) => {
    // If no payload provided, revalidate from server (e.g., guest shortlist added a new pitch)
    if (!updatedPitch) {
      mutate();
      refreshCreatorSnapshots();
      return;
    }

    // Update the pitches list with the updated pitch
    mutate((currentPitches) => {
      if (!currentPitches) return currentPitches;
      const updatedPitches = currentPitches.map((pitch) =>
        pitch.id === updatedPitch.id ? updatedPitch : pitch
      );
      return updatedPitches;
    });

    // Any saved pitch may carry new numbers, platform, or status, and the
    // Agreements tab and credits read those from the campaign snapshots.
    refreshCreatorSnapshots();
  };

  if (isLoading) return <CreatorMasterListSkeleton campaignId={campaign?.id} />;

  if (isError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading pitches. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <CampaignV3Pitches
        pitches={pitches}
        campaign={campaign}
        onUpdate={handlePitchUpdate}
        isDisabled={isDisabled}
      />
    </Box>
  );
};

export default CampaignV3PitchesWrapper;

CampaignV3PitchesWrapper.propTypes = {
  campaign: PropTypes.object.isRequired,
  campaignMutate: PropTypes.func,
  isDisabled: PropTypes.bool,
};
