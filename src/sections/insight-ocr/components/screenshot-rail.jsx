import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

import Iconify from 'src/components/iconify';

import ScreenshotDropzone from './screenshot-dropzone';
import { useInsightOcrStore } from '../store/use-insight-ocr-store';
import { useAddScreenshots } from '../hooks/use-add-screenshots';
import { ACCENT, BORDER, BOX_COLOR, MAX_SCREENSHOTS } from '../constants';

function StatusBadge({ result }) {
  const base = {
    position: 'absolute',
    left: 4,
    bottom: 4,
    height: 20,
    minWidth: 20,
    px: 0.5,
    borderRadius: 10,
    display: 'grid',
    placeItems: 'center',
    color: 'white',
    fontSize: 11,
    fontWeight: 700,
  };

  if (result?.isPending) {
    return (
      <Box sx={{ ...base, bgcolor: 'rgba(0,0,0,0.7)' }}>
        <CircularProgress size={12} thickness={6} sx={{ color: 'white' }} />
      </Box>
    );
  }

  if (result?.isError) {
    return (
      <Box sx={{ ...base, bgcolor: '#FF5630' }}>
        <Iconify icon="mingcute:alert-fill" width={12} />
      </Box>
    );
  }

  return <Box sx={{ ...base, bgcolor: BOX_COLOR, color: 'black' }}>{result?.data?.fields.length ?? 0}</Box>;
}

StatusBadge.propTypes = {
  result: PropTypes.object,
};

export default function ScreenshotRail({ resultsById }) {
  const items = useInsightOcrStore((s) => s.items);
  const selectedId = useInsightOcrStore((s) => s.selectedId);
  const { select, removeItem } = useInsightOcrStore.getState();
  const addScreenshots = useAddScreenshots();

  return (
    <Stack
      direction={{ xs: 'row', lg: 'column' }}
      spacing={1.5}
      sx={{ overflow: 'auto', p: 0.5, maxHeight: { lg: 'calc(100vh - 220px)' } }}
    >
      {items.map((item) => {
        const selected = item.id === selectedId;

        return (
          <Box
            key={item.id}
            onClick={() => select(item.id)}
            sx={{
              position: 'relative',
              flexShrink: 0,
              width: 64,
              height: 116,
              cursor: 'pointer',
              borderRadius: 1,
              overflow: 'hidden',
              border: BORDER,
              outline: selected ? `2px solid ${ACCENT}` : 'none',
              outlineOffset: 2,
              '&:hover .remove': { opacity: 1 },
            }}
          >
            <Box
              component="img"
              src={item.url}
              alt={item.file.name}
              sx={{ width: 1, height: 1, objectFit: 'cover', objectPosition: 'top' }}
            />
            <StatusBadge result={resultsById[item.id]} />
            <Tooltip title="Remove">
              <IconButton
                className="remove"
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  removeItem(item.id);
                }}
                sx={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  p: 0.25,
                  opacity: { xs: 1, md: 0 },
                  transition: 'opacity 150ms ease',
                  bgcolor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  '&:hover': { bgcolor: 'black' },
                }}
              >
                <Iconify icon="eva:close-fill" width={14} />
              </IconButton>
            </Tooltip>
          </Box>
        );
      })}

      <ScreenshotDropzone compact onAdd={addScreenshots} disabled={items.length >= MAX_SCREENSHOTS} />
    </Stack>
  );
}

ScreenshotRail.propTypes = {
  resultsById: PropTypes.object.isRequired,
};
