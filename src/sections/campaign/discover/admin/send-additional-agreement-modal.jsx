import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { useMemo, useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import useGetCreditTiers from 'src/hooks/use-get-credit-tiers';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

import TransferPackageCreditsDialog from './transfer-package-credits-dialog';
import AttachAdditionalPackageDialog from './attach-additional-package-dialog';
import AgreementCreatorCostRow, {
  getFollowerCountByPlatform,
  resolveTierForFollowerCount,
} from './agreement-creator-cost-row';

function buildInitialRowState(creatorRow) {
  const shortlisted = creatorRow?.user?.shortlisted?.[0] || creatorRow?.shortlistedCreator;
  return {
    userId: creatorRow.userId,
    selectedPlatform: shortlisted?.selectedPlatform || 'instagram',
    videoCount: '1',
    amount: '',
    // Dummy for now — not yet wired to any backend behavior.
    productSeeding: false,
  };
}

export default function SendAdditionalAgreementModal({
  open,
  onClose,
  campaign,
  creators,
  onSent,
  campaignMutate,
}) {
  const { data: creditTierList } = useGetCreditTiers();
  const [rows, setRows] = useState([]);
  const [sending, setSending] = useState(false);
  const [serverBreakdown, setServerBreakdown] = useState(null);
  const attachDialog = useState(false);
  const [showAttach, setShowAttach] = attachDialog;
  const transferDialog = useState(false);
  const [showTransfer, setShowTransfer] = transferDialog;

  useEffect(() => {
    if (open) {
      setRows(creators.map(buildInitialRowState));
      setServerBreakdown(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, creators]);

  const creatorsById = useMemo(() => {
    const map = new Map();
    creators.forEach((c) => map.set(c.userId, c));
    return map;
  }, [creators]);

  const perRowCost = useMemo(
    () =>
      rows.map((row) => {
        const creatorRow = creatorsById.get(row.userId);
        const videoCount = Number(row.videoCount) || 0;
        if (!campaign?.isCreditTier) return videoCount;
        const followerCount = getFollowerCountByPlatform(creatorRow, row.selectedPlatform);
        const tier = resolveTierForFollowerCount(creditTierList, followerCount);
        return (tier?.creditsPerVideo || 0) * videoCount;
      }),
    [rows, creatorsById, campaign?.isCreditTier, creditTierList]
  );

  const totalRequired = perRowCost.reduce((sum, c) => sum + c, 0);
  const creditsRemaining = Math.max(
    0,
    Number(campaign?.campaignCredits ?? 0) - Number(campaign?.creditsUtilized ?? 0)
  );
  const hasCreditLimit = campaign?.campaignCredits != null;
  const isInsufficient = hasCreditLimit && totalRequired > creditsRemaining;
  const hasMissingAmount = rows.some((row) => row.amount === '' || row.amount == null);

  const handleRowChange = (userId, nextRowState) => {
    setRows((prev) => prev.map((r) => (r.userId === userId ? nextRowState : r)));
    setServerBreakdown(null);
  };

  const handleClose = () => {
    if (sending) return;
    onClose();
  };

  const handleSend = async () => {
    setSending(true);
    setServerBreakdown(null);
    try {
      const payload = {
        campaignId: campaign?.id,
        creators: rows.map((row) => ({
          userId: row.userId,
          selectedPlatform: row.selectedPlatform,
          videoCount: Number(row.videoCount) || 0,
          ...(row.amount !== '' && row.amount != null && { amount: String(row.amount), currency: 'MYR' }),
        })),
      };
      const res = await axiosInstance.patch(endpoints.campaign.sendAdditionalAgreement, payload);
      enqueueSnackbar(res?.data?.message || 'Agreement sent successfully!');
      onClose();
      if (onSent) await onSent();
    } catch (error) {
      if (error?.breakdown) {
        setServerBreakdown(error.breakdown);
      }
      enqueueSnackbar(error?.message || 'Failed to send agreement', { variant: 'error' });
    } finally {
      setSending(false);
    }
  };

  const errorByUserId = useMemo(() => {
    const map = {};
    (serverBreakdown || []).forEach((b) => {
      map[b.userId] = `Requires ${b.totalCredits} credit${b.totalCredits !== 1 ? 's' : ''}`;
    });
    return map;
  }, [serverBreakdown]);

  const refreshAfterCreditChange = async () => {
    if (campaignMutate) await campaignMutate();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', bgcolor: '#F5F5F5', position: 'relative' } }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3.5, pt: 3.5 }}>
          <DialogTitle
            sx={{
              p: 0,
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
              '&.MuiTypography-root': { fontSize: 24, fontWeight: 400 },
            }}
          >
            Send Additional Agreement
          </DialogTitle>

          <Stack direction="row" alignItems="center" spacing={1.5}>
            {hasCreditLimit && (
              <Typography
                sx={{
                  fontSize: '0.8rem',
                  color: isInsufficient ? '#D4321C' : '#1340FF',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >
                {isInsufficient
                  ? 'Insufficient Campaign Credits!'
                  : `${creditsRemaining} Campaign Credits Remaining`}
              </Typography>
            )}
            <IconButton onClick={handleClose} disabled={sending} sx={{ color: '#221f20' }}>
              <Iconify icon="eva:close-fill" width={24} />
            </IconButton>
          </Stack>
        </Stack>

        <Divider sx={{ borderColor: '#E3E3E3', mt: 2.5, mx: 3.5 }} />

        <DialogContent sx={{ px: 4, pb: 0.5, maxHeight: '60vh' }}>
          <Stack divider={<Divider sx={{ borderColor: '#E3E3E3' }} />}>
            {rows.map((row) => (
              <AgreementCreatorCostRow
                key={row.userId}
                creatorRow={creatorsById.get(row.userId)}
                campaign={campaign}
                creditTierList={creditTierList}
                rowState={row}
                onChange={(next) => handleRowChange(row.userId, next)}
                error={errorByUserId[row.userId]}
              />
            ))}
          </Stack>
        </DialogContent>

        <Divider sx={{ borderColor: '#E3E3E3', mx: 3.5 }} />

        <DialogActions sx={{ px: 4, pb: 4, pt: 2.5, alignItems: 'center', gap: 2.5 }}>
          {isInsufficient && (
            <Typography
              sx={{ color: '#D4321C', textAlign: 'right', flex: 1, lineHeight: 1.5, fontSize: '0.8rem', fontWeight: 500 }}
            >
              You only have {creditsRemaining} Campaign Credits for this campaign.
              <br />
              <Typography
                component="button"
                type="button"
                onClick={() => setShowAttach(true)}
                sx={{
                  border: 'none',
                  bgcolor: 'transparent',
                  cursor: 'pointer',
                  p: 0,
                  color: '#D4321C',
                  fontWeight: 500,
                  fontSize: 'inherit',
                  fontFamily: 'inherit',
                  textDecoration: 'underline',
                }}
              >
                Attach a New Package
              </Typography>{' '}
              or{' '}
              <Typography
                component="button"
                type="button"
                onClick={() => setShowTransfer(true)}
                sx={{
                  border: 'none',
                  bgcolor: 'transparent',
                  cursor: 'pointer',
                  p: 0,
                  color: '#D4321C',
                  fontWeight: 500,
                  fontSize: 'inherit',
                  fontFamily: 'inherit',
                  textDecoration: 'underline',
                }}
              >
                Transfer from Package Credits
              </Typography>
              .
            </Typography>
          )}
          <LoadingButton
            onClick={handleSend}
            loading={sending}
            disabled={isInsufficient || rows.length === 0 || hasMissingAmount}
            sx={{
              width: '170px',
              height: '44px',
              gap: '6px',
              opacity: 1,
              pt: '10px',
              pr: '18px',
              pb: '13px',
              pl: '18px',
              borderRadius: '8px',
              background:
                'linear-gradient(0deg, #1340FF, #1340FF), linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6))',
              boxShadow: '0px -3px 0px 0px #0000001A inset',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': {
                background:
                  'linear-gradient(0deg, #0F35D6, #0F35D6), linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6))',
                boxShadow: '0px -3px 0px 0px #0000001A inset',
              },
              '&.Mui-disabled': {
                background: '#A6ADF5',
                color: '#ffffff',
                boxShadow: 'none',
              },
            }}
          >
            {`Send to ${rows.length} Creator${rows.length !== 1 ? 's' : ''}`}
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <AttachAdditionalPackageDialog
        open={showAttach}
        onClose={() => setShowAttach(false)}
        campaign={campaign}
        onAttached={refreshAfterCreditChange}
      />

      <TransferPackageCreditsDialog
        open={showTransfer}
        onClose={() => setShowTransfer(false)}
        campaign={campaign}
        onTransferred={refreshAfterCreditChange}
      />
    </>
  );
}

SendAdditionalAgreementModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  campaign: PropTypes.object,
  creators: PropTypes.array,
  onSent: PropTypes.func,
  campaignMutate: PropTypes.func,
};
