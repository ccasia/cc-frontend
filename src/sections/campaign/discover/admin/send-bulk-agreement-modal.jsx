import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { pdf } from '@react-pdf/renderer';
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

import AgreementTemplate from 'src/template/agreement';

import Iconify from 'src/components/iconify';

import BulkAgreementCreatorRow from './bulk-agreement-creator-row';
import TransferPackageCreditsDialog from './transfer-package-credits-dialog';
import AttachAdditionalPackageDialog from './attach-additional-package-dialog';
import { getFollowerCountByPlatform, resolveTierForFollowerCount } from './agreement-creator-cost-row';

const CURRENCY_PREFIXES = {
  SGD: '$',
  MYR: 'RM',
  AUD: '$',
  JPY: '¥',
  IDR: 'Rp',
  USD: '$',
};

function buildInitialRowState(creatorRow) {
  const shortlisted = creatorRow?.user?.shortlisted?.[0] || creatorRow?.shortlistedCreator;
  const platform = shortlisted?.selectedPlatform || 'instagram';
  return {
    userId: creatorRow.userId,
    selectedPlatform: platform,
    currency: shortlisted?.currency || 'MYR',
    followerCount: String(getFollowerCountByPlatform(creatorRow, platform) || ''),
    amount: '',
    videoCount: '1',
    // Dummy for now — not yet wired to any backend behavior.
    productSeeding: false,
  };
}

// Sends a *first* agreement to several not-yet-sent creators at once. Unlike additional rounds
// (which reuse an already-signed contract and skip PDF generation entirely), a first agreement
// is a brand new signed document — so this loops the exact same two-call flow the single-creator
// dialog (campaign-agreement-edit.jsx) uses per creator: generate the PDF, PATCH
// updateAmountAgreement (multipart, carries the PDF), then PATCH sendAgreement. Sequential, not
// parallel, so one creator's failure doesn't race the next and results stay easy to report.
export default function SendBulkAgreementModal({
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
  const [rowErrors, setRowErrors] = useState({});
  const attachDialog = useState(false);
  const [showAttach, setShowAttach] = attachDialog;
  const transferDialog = useState(false);
  const [showTransfer, setShowTransfer] = transferDialog;

  useEffect(() => {
    if (open) {
      setRows(creators.map(buildInitialRowState));
      setRowErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, creators]);

  const creatorsById = useMemo(() => {
    const map = new Map();
    creators.forEach((c) => map.set(c.userId, c));
    return map;
  }, [creators]);

  const extractAgreementsInfo = useMemo(() => {
    if (campaign?.agreementTemplate) return campaign.agreementTemplate;
    return campaign?.campaignAdmin?.reduce(
      (foundTemplate, item) => foundTemplate || item?.admin?.user?.agreementTemplate?.[0] || null,
      null
    );
  }, [campaign]);

  const perRowCost = useMemo(
    () =>
      rows.map((row) => {
        const creatorRow = creatorsById.get(row.userId);
        const isGuest = creatorRow?.user?.creator?.isGuest === true;
        if (isGuest) return 0;
        const videoCount = Number(row.videoCount) || 0;
        if (!campaign?.isCreditTier) return videoCount;
        const tier = resolveTierForFollowerCount(creditTierList, Number(row.followerCount) || 0);
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
  const hasMissingFields = rows.some(
    (row) => row.amount === '' || row.amount == null || row.videoCount === '' || row.videoCount == null
  );

  const handleRowChange = (userId, nextRowState) => {
    setRows((prev) => prev.map((r) => (r.userId === userId ? nextRowState : r)));
    setRowErrors((prev) => ({ ...prev, [userId]: undefined }));
  };

  const handleClose = () => {
    if (sending) return;
    onClose();
  };

  const sendOneAgreement = async (row) => {
    const creatorRow = creatorsById.get(row.userId);
    const isGuestCreator = creatorRow?.user?.creator?.isGuest === true;
    const requiresUGCCredits = !isGuestCreator;
    const creditsToAssign = requiresUGCCredits ? Number(row.videoCount) || 0 : null;
    const followerCountValue = Number(row.followerCount) || 0;

    const blob = await pdf(
      <AgreementTemplate
        DATE={dayjs().format('LL')}
        IC_NUMBER={creatorRow?.user?.paymentForm?.icNumber}
        FREELANCER_FULL_NAME={creatorRow?.user?.paymentForm?.bankAccountName || creatorRow?.user?.name || 'N/A'}
        ADDRESS={creatorRow?.user?.creator?.address}
        ccEmail="hello@cultcreative.com"
        ccPhoneNumber="+60162678757"
        effectiveDate={dayjs().add(4, 'day').format('LL')}
        creatorPayment={`${CURRENCY_PREFIXES[row.currency] || ''}${row.amount}`}
        CREATOR_NAME={creatorRow?.user?.paymentForm?.bankAccountName || creatorRow?.user?.name || 'N/A'}
        CREATOR_ACCOUNT_NUMBER={creatorRow?.user?.paymentForm?.bankAccountNumber}
        CREATOR_BANK_ACCOUNT_NAME={creatorRow?.user?.paymentForm?.bankAccountName || creatorRow?.user?.name || 'N/A'}
        CREATOR_BANK_NAME={creatorRow?.user?.paymentForm?.bankName}
        AGREEMENT_ENDDATE={dayjs().add(1, 'month').format('LL')}
        NOW_DATE={dayjs().format('LL')}
        VERSION_NUMBER={`V${dayjs().unix()}`}
        ADMIN_IC_NUMBER={extractAgreementsInfo?.adminICNumber ?? 'Default'}
        ADMIN_NAME={extractAgreementsInfo?.adminName ?? 'Default'}
        SIGNATURE={extractAgreementsInfo?.signURL ?? 'Default'}
        isForSurfShark={campaign?.isForSurfShark}
        isSeedingCampaign={false}
      />
    ).toBlob();

    const requestData = {
      paymentAmount: row.amount,
      currency: row.currency,
      user: creatorRow?.user,
      campaignId: creatorRow?.campaignId,
      id: creatorRow?.id,
      isNew: creatorRow?.isNew || false,
      credits: creditsToAssign,
      selectedPlatform: row.selectedPlatform,
      ...(followerCountValue > 0 && { followerCount: followerCountValue }),
    };

    const formData = new FormData();
    formData.append('agreementForm', blob);
    formData.append('data', JSON.stringify(requestData));

    const updateRes = await axiosInstance.patch(endpoints.campaign.updateAmountAgreement, formData, {
      headers: { Accept: 'multipart/form-data' },
    });

    const agreementIdToSend = updateRes?.data?.agreement?.id || creatorRow?.id;

    await axiosInstance.patch(endpoints.campaign.sendAgreement, {
      user: creatorRow?.user,
      campaignId: creatorRow?.campaignId,
      id: agreementIdToSend,
      isNew: creatorRow?.isNew || false,
      credits: creditsToAssign,
      selectedPlatform: row.selectedPlatform,
      ...(followerCountValue > 0 && { followerCount: followerCountValue }),
    });
  };

  const handleSend = async () => {
    setSending(true);
    const succeeded = [];
    const failed = {};

    // Sequential, not parallel, so one creator's failure doesn't race the next — chained via
    // reduce rather than a for-loop to keep the linter's no-await-in-loop rule happy.
    await rows.reduce(
      (chain, row) =>
        chain.then(async () => {
          try {
            await sendOneAgreement(row);
            succeeded.push(row.userId);
          } catch (error) {
            failed[row.userId] = error?.message || 'Failed to send';
          }
        }),
      Promise.resolve()
    );

    setSending(false);
    setRowErrors(failed);

    if (succeeded.length) {
      enqueueSnackbar(`Sent agreement to ${succeeded.length} creator${succeeded.length !== 1 ? 's' : ''}`);
    }
    const failedCount = Object.keys(failed).length;
    if (failedCount) {
      enqueueSnackbar(
        `Failed to send agreement to ${failedCount} creator${failedCount !== 1 ? 's' : ''} — see details below`,
        { variant: 'error' }
      );
    }

    if (onSent) await onSent(succeeded);

    if (!failedCount) {
      onClose();
    } else {
      // Keep the modal open, scoped to only the creators that failed, so CS can fix and retry.
      setRows((prev) => prev.filter((r) => failed[r.userId]));
    }
  };

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
            Send Bulk Agreement
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
              <BulkAgreementCreatorRow
                key={row.userId}
                creatorRow={creatorsById.get(row.userId)}
                campaign={campaign}
                creditTierList={creditTierList}
                rowState={row}
                onChange={(next) => handleRowChange(row.userId, next)}
                error={rowErrors[row.userId]}
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
            disabled={isInsufficient || rows.length === 0 || hasMissingFields}
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

SendBulkAgreementModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  campaign: PropTypes.object,
  creators: PropTypes.array,
  onSent: PropTypes.func,
  campaignMutate: PropTypes.func,
};
