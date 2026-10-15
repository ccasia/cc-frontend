import { useState, useCallback } from 'react';

import useGetClients from 'src/hooks/use-get-clients';

import { campaignHasClient } from 'src/utils/campaign-flow';

import { useAuthContext } from 'src/auth/hooks';

/**
 * Guards admin shortlisting / pitch approval on a v4 campaign that has no client attached while
 * its company has client accounts — the usual sign the client-campaign toggle was forgotten.
 * Without a client, admin approval is final, so the admin confirms before it happens.
 *
 * `guard(onConfirm, count)` runs `onConfirm` straight away when no confirmation is needed;
 * otherwise it opens the dialog — render `<NoClientConfirmDialog {...dialogProps} />`.
 */
export default function useNoClientGuard(campaign) {
  const { user } = useAuthContext();
  const [pending, setPending] = useState(null);

  const companyId = campaign?.company?.id || campaign?.brand?.company?.id;
  const mayNeedConfirm =
    user?.role !== 'client' &&
    campaign?.submissionVersion === 'v4' &&
    !campaignHasClient(campaign);
  // Only fetch the company's client accounts when the answer can matter
  const { clients } = useGetClients(mayNeedConfirm ? companyId : null);
  const needsConfirm = mayNeedConfirm && clients.length > 0;

  const guard = useCallback(
    (onConfirm, count = 1) => {
      if (!needsConfirm) {
        onConfirm();
        return;
      }
      setPending({ onConfirm, count });
    },
    [needsConfirm]
  );

  const handleCancel = useCallback(() => setPending(null), []);

  const handleConfirm = useCallback(() => {
    if (!pending) return;
    const { onConfirm } = pending;
    setPending(null);
    onConfirm();
  }, [pending]);

  return {
    guard,
    dialogProps: {
      open: Boolean(pending),
      count: pending?.count ?? 1,
      campaignId: campaign?.id,
      companyName: campaign?.company?.name || campaign?.brand?.company?.name,
      onCancel: handleCancel,
      onConfirm: handleConfirm,
    },
  };
}
