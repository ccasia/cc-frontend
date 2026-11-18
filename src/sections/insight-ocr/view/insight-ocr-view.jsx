import { useEffect } from 'react';
import { useDropzone } from 'react-dropzone';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useEventListener } from 'src/hooks/use-event-listener';

import OcrToolbar from '../components/ocr-toolbar';
import FieldPanel from '../components/field-panel';
import ScreenshotRail from '../components/screenshot-rail';
import ScreenshotViewer from '../components/screenshot-viewer';
import ScreenshotDropzone from '../components/screenshot-dropzone';
import { useInsightOcrStore } from '../store/use-insight-ocr-store';
import { useInsightExtractions } from '../hooks/use-insight-extractions';
import { ACCENT, BORDER, combineFields, MAX_SCREENSHOTS } from '../constants';
import { IMAGE_ACCEPT, useAddScreenshots } from '../hooks/use-add-screenshots';

export default function InsightOcrView() {
  const items = useInsightOcrStore((s) => s.items);
  const selectedId = useInsightOcrStore((s) => s.selectedId);
  const { step } = useInsightOcrStore.getState();
  const addScreenshots = useAddScreenshots();

  const resultsById = useInsightExtractions(items);

  const workspaceDrop = useDropzone({
    accept: IMAGE_ACCEPT,
    noClick: true,
    noKeyboard: true,
    disabled: !items.length || items.length >= MAX_SCREENSHOTS,
    onDrop: (accepted, rejected) => addScreenshots(accepted, rejected.length),
  });

  useEffect(() => () => useInsightOcrStore.getState().clear(), []);

  useEventListener('paste', (event) => {
    const files = [...(event.clipboardData?.files ?? [])];
    if (files.length) addScreenshots(files);
  });

  useEventListener('keydown', (event) => {
    if (['INPUT', 'TEXTAREA'].includes(event.target.tagName)) return;
    if (['ArrowUp', 'ArrowLeft'].includes(event.key)) step(-1);
    if (['ArrowDown', 'ArrowRight'].includes(event.key)) step(1);
    if (event.key === 'Escape') useInsightOcrStore.setState({ selected: null });
  });

  const combined = combineFields(items, resultsById);
  const selectedItem = items.find((item) => item.id === selectedId);

  return (
    <Container maxWidth="xl">
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ md: 'flex-end' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="h3" sx={{ fontFamily: 'Instrument Serif', fontWeight: 400 }}>
              Insight OCR Test
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Upload Instagram or TikTok insight screenshots. Each value gets a box on the image, so you can check it.
          </Typography>
        </Box>

        {!!items.length && <OcrToolbar resultsById={resultsById} combined={combined} />}
      </Stack>

      {!items.length ? (
        <ScreenshotDropzone onAdd={addScreenshots} />
      ) : (
        <Box
          {...workspaceDrop.getRootProps()}
          sx={{
            position: 'relative',
            display: 'grid',
            gap: 3,
            alignItems: 'start',
            gridTemplateColumns: { xs: '1fr', lg: '72px minmax(0, 1fr) 400px' },
          }}
        >
          <input {...workspaceDrop.getInputProps()} />
          {workspaceDrop.isDragActive && (
            <Box
              sx={{
                position: 'absolute',
                inset: -8,
                zIndex: 10,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 2,
                border: `2px dashed ${ACCENT}`,
                bgcolor: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(2px)',
              }}
            >
              <Typography variant="h6" sx={{ color: ACCENT }}>
                Drop to add screenshots
              </Typography>
            </Box>
          )}
          <ScreenshotRail resultsById={resultsById} />

          <Box sx={{ p: { xs: 2, md: 3 }, border: BORDER, borderRadius: 1.5, bgcolor: '#F4F4F4' }}>
            {selectedItem && <ScreenshotViewer item={selectedItem} result={resultsById[selectedItem.id]} />}
          </Box>

          <FieldPanel resultsById={resultsById} />
        </Box>
      )}

      {!!items.length && (
        <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.disabled' }}>
          Tip: drop or paste more screenshots anywhere. Use the arrow keys to move between screenshots. Click a box
          or a row to pin it. Press Esc to unpin.
        </Typography>
      )}
    </Container>
  );
}
