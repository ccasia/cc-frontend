import { useState, useEffect } from 'react';

import { fetchFeatureDecision } from './guest-extraction-api';

/**
 * Ask the server whether this admin gets the automatic flow.
 *
 * The browser never decides. A failure means off, so a broken decision call
 * shows the existing manual form rather than a half-working new one.
 */
export default function useGuestMetricsDecision() {
  const [decision, setDecision] = useState({ enabled: false, reason: 'disabled' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchFeatureDecision()
      .then((result) => {
        if (!cancelled) setDecision(result);
      })
      .catch(() => {
        if (!cancelled) setDecision({ enabled: false, reason: 'disabled' });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { decision, loading, enabled: decision.enabled };
}
