import PropTypes from 'prop-types';

import { Box, Stack, Divider, Typography, CircularProgress } from '@mui/material';

import { useGetReimbursements } from 'src/hooks/use-get-reimbursements';

import { COLORS } from 'src/sections/campaign/reimbursement/reimbursement-styles';

import ReimbursementSection from './submissions/reimbursement-section';

// ----------------------------------------------------------------------

// Creator "Receipts" tab: one card per agreement round that needs receipts.
// Same SWR key as the tab check in campaign-detail-item, so this reads from cache.
export default function CampaignV4Receipts({ campaign }) {
  const { reimbursementRounds, reimbursementsLoading } = useGetReimbursements(campaign?.id);

  const rounds = reimbursementRounds.filter((round) => round.required);
  // "Agreement", "Agreement 2", ... — same names as the Submissions tab
  const roundLabel = (round) => (round.round > 1 ? `Agreement ${round.round}` : 'Agreement');

  if (reimbursementsLoading) {
    return (
      <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!rounds.length) {
    return (
      <Typography sx={{ py: 6, textAlign: 'center', color: COLORS.textMuted }}>
        No receipts are needed for this campaign.
      </Typography>
    );
  }

  return (
    <Stack spacing={5} divider={<Divider />} sx={{ maxWidth: 1100 }}>
      {rounds.map((round) => (
        <ReimbursementSection
          key={round.agreementId}
          reimbursement={round}
          campaign={campaign}
          title={rounds.length > 1 ? `${roundLabel(round)} receipts` : undefined}
        />
      ))}
    </Stack>
  );
}

CampaignV4Receipts.propTypes = {
  campaign: PropTypes.object,
};
