import { useState, useEffect } from 'react';

export default function useCaptionOverflow(captionMeasureRef, caption) {
  const [captionOverflows, setCaptionOverflows] = useState(false);

  useEffect(() => {
    if (captionMeasureRef.current && caption) {
      const element = captionMeasureRef.current;
      // Determine max height based on window width
      let maxHeight = 120; // default for large screens
      if (window.innerWidth < 600) {
        maxHeight = 80;
      } else if (window.innerWidth < 900) {
        maxHeight = 100;
      }
      setCaptionOverflows(element.scrollHeight > maxHeight);
    }
  }, [caption, captionMeasureRef]);

  return captionOverflows;
}
