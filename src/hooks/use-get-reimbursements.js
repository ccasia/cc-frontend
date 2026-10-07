import useSWR from 'swr';
import { useEffect } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

import useSocketContext from 'src/socket/hooks/useSocketContext';

import { COLORS } from 'src/sections/campaign/reimbursement/reimbursement-styles';

// ----------------------------------------------------------------------

// Returns one entry per agreement round:
// { agreementId, round, required, submittedAt, currency, isSeeding, invoiceId, invoice,
//   reimbursementInvoice, billed, receipts[] }
// `invoiceId`/`invoice` are the round's own (STANDARD) invoice — it can exist while receipts are
// still open (late receipts). `billed` is what closes the receipts: they're on an invoice.
// Creators omit userId (the backend scopes it to them); admins pass the creator's userId.
export const useGetReimbursements = (campaignId, userId) => {
  const { socket } = useSocketContext();

  const { data, isLoading, error, mutate } = useSWR(
    campaignId ? endpoints.reimbursement.list(campaignId, userId) : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    if (!socket || !campaignId) return undefined;

    const handleUpdated = (payload) => {
      if (payload?.campaignId !== campaignId) return;
      if (userId && payload?.userId !== userId) return;
      mutate();
    };

    socket.on('v4:reimbursement:updated', handleUpdated);

    return () => {
      socket.off('v4:reimbursement:updated', handleUpdated);
    };
  }, [socket, campaignId, userId, mutate]);

  return {
    reimbursementRounds: data || [],
    reimbursementsLoading: isLoading,
    reimbursementsError: error,
    reimbursementsMutate: mutate,
  };
};

// ----------------------------------------------------------------------

// Pending yellow — shared by every "waiting" state in the reimbursement UI
export const PENDING_COLOR = COLORS.pending;

export const getRoundReimbursement = (rounds, round) =>
  (rounds || []).find((entry) => entry.round === (round || 1) && entry.required) || null;

// { [round]: videoId } — a round's receipts live on its first video (lowest contentOrder).
export const getFirstVideoIdByRound = (videos) => {
  const firstByRound = {};

  (videos || []).forEach((video) => {
    const round = video.round || 1;
    const current = firstByRound[round];
    if (!current || (video.contentOrder || 0) < (current.contentOrder || 0)) {
      firstByRound[round] = video;
    }
  });

  return Object.fromEntries(Object.entries(firstByRound).map(([round, video]) => [round, video.id]));
};

// The round's reimbursement if `video` is that round's first video, otherwise null.
export const getVideoReimbursement = (rounds, firstVideoIdByRound, video) => {
  const round = video?.round || 1;
  if (firstVideoIdByRound[round] !== video?.id) return null;
  return getRoundReimbursement(rounds, round);
};

export const sumReceipts = (receipts) =>
  (receipts || []).reduce((total, receipt) => total + (Number(receipt.amount) || 0), 0);

export const formatReceiptAmount = (amount, currency = 'MYR') => {
  const symbol = currency === 'MYR' ? 'RM' : currency;
  return `${symbol} ${Number(amount || 0).toFixed(2)}`;
};

export const isPdfReceipt = (receipt) =>
  receipt?.mimeType === 'application/pdf' || /\.pdf($|\?)/i.test(receipt?.fileUrl || '');

// One label for the whole round, used by the admin chip and the creator header.
export const getReimbursementSummaryStatus = (reimbursement) => {
  const receipts = reimbursement?.receipts || [];

  if (reimbursement?.billed && receipts.length) return { label: 'Invoiced', color: COLORS.success };
  if (!reimbursement?.submittedAt) {
    return receipts.length
      ? { label: 'Draft', color: COLORS.textMuted }
      : { label: 'Awaiting creator', color: COLORS.textMuted };
  }

  const approved = receipts.filter((receipt) => receipt.status === 'APPROVED').length;
  const rejected = receipts.filter((receipt) => receipt.status === 'REJECTED').length;

  if (approved === receipts.length) return { label: 'All approved', color: COLORS.success };
  if (rejected) return { label: 'Changes needed', color: COLORS.danger };
  if (approved) return { label: `${approved} of ${receipts.length} approved`, color: PENDING_COLOR };
  return { label: 'Pending review', color: PENDING_COLOR };
};

export const RECEIPT_STATUS = {
  DRAFT: { label: 'Draft', color: COLORS.textMuted },
  PENDING_REVIEW: { label: 'Pending Review', color: PENDING_COLOR },
  APPROVED: { label: 'Approved', color: COLORS.success },
  REJECTED: { label: 'Rejected', color: COLORS.danger },
};
