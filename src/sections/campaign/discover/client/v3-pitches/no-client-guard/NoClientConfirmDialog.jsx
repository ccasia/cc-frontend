import PropTypes from 'prop-types';

import { Stack, Dialog, Typography, DialogContent } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import CtaButton from 'src/components/cta-button';

// Shown by useNoClientGuard before an admin approval that would be final only because the
// client-campaign toggle was left off
export default function NoClientConfirmDialog({
  open,
  count,
  campaignId,
  companyName,
  onCancel,
  onConfirm,
}) {
  const router = useRouter();
  const creatorsLabel = count === 1 ? 'this creator' : `these ${count} creators`;

  const handleAttachClient = () => {
    onCancel();
    router.push(`${paths.dashboard.campaign.adminCampaignManageDetail(campaignId)}?tab=finalise`);
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, p: 3 } }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Typography
          sx={{
            fontFamily: (theme) => theme.typography.fontSecondaryFamily,
            fontSize: 32,
            fontWeight: 400,
            lineHeight: 1.2,
            mb: 1,
          }}
        >
          No client attached
        </Typography>
        <Typography sx={{ color: '#636366', fontSize: '0.875rem', lineHeight: 1.5, mb: 3 }}>
          {companyName || 'This company'} has client accounts, but none are attached to this
          campaign. If you continue, {creatorsLabel} will be approved immediately, with no client
          review.
        </Typography>
        <Stack spacing={1}>
          <CtaButton variant="blue" fullWidth onClick={handleAttachClient}>
            Attach client
          </CtaButton>
          <CtaButton variant="white" fullWidth onClick={onConfirm}>
            Approve anyway
          </CtaButton>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

NoClientConfirmDialog.propTypes = {
  open: PropTypes.bool,
  count: PropTypes.number,
  campaignId: PropTypes.string,
  companyName: PropTypes.string,
  onCancel: PropTypes.func,
  onConfirm: PropTypes.func,
};
