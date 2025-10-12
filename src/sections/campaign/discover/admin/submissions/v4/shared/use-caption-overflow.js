import { useState, useEffect } from 'react';

export default function useCaptionOverflow(captionMeasureRef, caption) {
  const [captionOverflows, setCaptionOverflows] = useState(false);

  useEffect(() => {
    if (captionMeasureRef.current && caption) {
      const element = captionMeasureRef.current;
      const maxHeight = window.innerWidth < 600 ? 80 : window.innerWidth < 900 ? 100 : 120;
      setCaptionOverflows(element.scrollHeight > maxHeight);
    }
  }, [caption, captionMeasureRef]);

  return captionOverflows;
}
