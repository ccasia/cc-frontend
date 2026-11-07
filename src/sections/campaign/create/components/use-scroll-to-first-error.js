import { useEffect } from 'react';

import { useCampaignCreateStore } from '../store/use-campaign-create-store';

// A blocked Next press brings the first field with an error into view
export default function useScrollToFirstError(containerRef) {
  const failedNextCount = useCampaignCreateStore((s) => s.failedNextCount);

  useEffect(() => {
    if (!failedNextCount) return undefined;
    const frame = requestAnimationFrame(() => {
      const field = containerRef.current?.querySelector('.Mui-error, [data-field-error="true"]');
      if (!field) return;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      field.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      field.querySelector('input:not([type="file"]), textarea')?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [failedNextCount, containerRef]);

  return failedNextCount;
}
