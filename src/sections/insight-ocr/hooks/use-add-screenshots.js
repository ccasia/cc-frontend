import { useCallback } from 'react';
import { enqueueSnackbar } from 'notistack';

import { MAX_SCREENSHOTS } from '../constants';
import { useInsightOcrStore } from '../store/use-insight-ocr-store';

export const IMAGE_ACCEPT = { 'image/jpeg': [], 'image/png': [], 'image/webp': [] };

const isImage = (file) => Object.keys(IMAGE_ACCEPT).includes(file.type);

export function useAddScreenshots() {
  return useCallback((files, rejectedCount = 0) => {
    const images = files.filter(isImage);
    const skipped = rejectedCount + files.length - images.length;
    const room = MAX_SCREENSHOTS - useInsightOcrStore.getState().items.length;

    if (skipped) enqueueSnackbar(`${skipped} skipped. Use JPG, PNG, or WEBP.`, { variant: 'warning' });
    if (images.length > room) enqueueSnackbar(`Only ${MAX_SCREENSHOTS} screenshots at a time.`, { variant: 'warning' });
    if (images.length && room > 0) useInsightOcrStore.getState().addFiles(images);
  }, []);
}
