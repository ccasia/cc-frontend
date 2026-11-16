import PropTypes from 'prop-types';
import { usePDF } from '@react-pdf/renderer';
import { Page, pdfjs, Document } from 'react-pdf';
import { useRef, useMemo, useState, useEffect } from 'react';

import {
  Box,
  Stack,
  Dialog,
  Divider,
  IconButton,
  Typography,
  DialogTitle,
  DialogContent,
  CircularProgress,
} from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';

import AgreementPreview from 'src/template/agreement-preview';

import Iconify from 'src/components/iconify';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const NDA_HEADING = /6\.\s*Confidentiality/;
const MAX_PAGE_WIDTH = 800;

// Where the NDA heading sits: its page, how far down that page (0 to 1), and the
// page's height-to-width ratio, so the page can take its full height before it draws
async function findNdaHeading(pdf) {
  for (let number = 1; number <= pdf.numPages; number += 1) {
    // eslint-disable-next-line no-await-in-loop
    const page = await pdf.getPage(number);
    // eslint-disable-next-line no-await-in-loop
    const { items } = await page.getTextContent();
    let text = '';
    const hit = items.find((item) => {
      text += item.str;
      return NDA_HEADING.test(text);
    });
    if (hit) {
      const [x0, y0, x1, y1] = page.view;
      const pageHeight = y1 - y0;
      const top = (pageHeight - hit.transform[5] - (hit.height || 0)) / pageHeight;
      return { page: number, top: Math.min(Math.max(top, 0), 1), ratio: pageHeight / (x1 - x0) };
    }
  }
  return null;
}

// Only the NDA pages, opened at the NDA heading
function NdaPages({ isSeedingCampaign, isForSurfShark }) {
  const agreement = useMemo(
    () => (
      <AgreementPreview
        isNdaRequired
        isSeedingCampaign={isSeedingCampaign}
        isForSurfShark={isForSurfShark}
      />
    ),
    [isSeedingCampaign, isForSurfShark]
  );
  const [pdf] = usePDF({ document: agreement });

  const scrollRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [nda, setNda] = useState(undefined);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.min(Math.floor(entry.contentRect.width), MAX_PAGE_WIDTH))
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const handleLoad = (doc) => {
    setNumPages(doc.numPages);
    findNdaHeading(doc)
      .then(setNda)
      .catch(() => setNda(null));
  };

  const ready = numPages > 0 && nda !== undefined && width > 0;
  const firstPage = nda?.page ?? 1;
  const pageHeight = nda ? Math.round(width * nda.ratio) : undefined;

  // Every page already has its height, so the heading's place is known before it draws
  useEffect(() => {
    if (!ready || !nda || !scrollRef.current) return;
    scrollRef.current.scrollTop = Math.max(nda.top * pageHeight - 24, 0);
  }, [ready, nda, pageHeight]);

  const status = (content) => (
    <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ height: 1 }}>
      {content}
    </Stack>
  );

  return (
    <Box
      ref={scrollRef}
      sx={{
        height: { xs: 1, sm: 600 },
        overflow: 'auto',
        '&::-webkit-scrollbar': { width: '8px' },
        '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '4px' },
      }}
    >
      {pdf.error &&
        status(
          <Typography variant="body2" color="error">
            The preview could not load. Close it and try again.
          </Typography>
        )}

      {!pdf.error && !ready && status(<CircularProgress size={24} />)}

      {pdf.url && width > 0 && (
        <Document file={pdf.url} onLoadSuccess={handleLoad} loading={null} error={null}>
          {ready && (
            <Stack alignItems="center">
              {Array.from({ length: numPages - firstPage + 1 }, (_, i) => firstPage + i).map(
                (number) => (
                  <Box key={number} sx={{ width, minHeight: pageHeight }}>
                    <Page
                      pageNumber={number}
                      width={width}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      loading={null}
                    />
                  </Box>
                )
              )}
            </Stack>
          )}
        </Document>
      )}
    </Box>
  );
}

NdaPages.propTypes = {
  isSeedingCampaign: PropTypes.bool,
  isForSurfShark: PropTypes.bool,
};

// The NDA section of the creator agreement, laid out like the other agreement
// previews. The PDF is only built while the dialog is open.
export default function NdaPreviewDialog({ open, onClose, isSeedingCampaign, isForSurfShark }) {
  const smDown = useResponsive('down', 'sm');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      fullScreen={smDown}
      aria-labelledby="nda-preview-title"
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" gap={2}>
          <Box>
            <Typography
              id="nda-preview-title"
              variant="h5"
              sx={{
                fontFamily: 'Instrument Serif, serif',
                fontSize: { xs: '2rem', sm: '2.4rem' },
                fontWeight: 550,
              }}
            >
              NDA Preview
            </Typography>
            <Typography variant="body2" sx={{ color: '#636366' }}>
              Added to every creator agreement. Creator details are placeholders.
            </Typography>
          </Box>

          <IconButton
            aria-label="Close"
            onClick={onClose}
            sx={{ ml: 'auto', alignSelf: 'flex-start', '& svg': { color: '#636366' } }}
          >
            <Iconify icon="hugeicons:cancel-01" width={24} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider sx={{ width: '95%', mx: 'auto' }} />

      <DialogContent sx={{ p: 3 }}>
        <NdaPages isSeedingCampaign={isSeedingCampaign} isForSurfShark={isForSurfShark} />
      </DialogContent>
    </Dialog>
  );
}

NdaPreviewDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  isSeedingCampaign: PropTypes.bool,
  isForSurfShark: PropTypes.bool,
};
