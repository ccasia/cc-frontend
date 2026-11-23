import PropTypes from 'prop-types';
import { keyframes } from '@emotion/react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useInsightOcrStore } from '../store/use-insight-ocr-store';
import ViewerHeader from './viewer-header';
import { BOX_COLOR, toBoxStyle, BOX_PADDING, BOX_ACTIVE_COLOR } from '../constants';
import { useSnappedFields } from '../hooks/use-snapped-fields';

const scan = keyframes`
  from { top: 0%; }
  to { top: 100%; }
`;

function FieldBox({ field, active, dimmed }) {
  const { setHovered, toggleSelected } = useInsightOcrStore.getState();

  return (
    <Box
      onMouseEnter={() => setHovered(field.key)}
      onMouseLeave={() => setHovered(null)}
      onClick={() => toggleSelected(field.key)}
      sx={{
        position: 'absolute',
        ...toBoxStyle(field.box, BOX_PADDING),
        cursor: 'pointer',
        borderRadius: 1,
        border: `${active ? 2 : 1.5}px solid ${active ? BOX_ACTIVE_COLOR : BOX_COLOR}`,
        opacity: dimmed ? 0.25 : 1,
        zIndex: active ? 2 : 1,
        transition: 'opacity 150ms ease, border-color 150ms ease',
      }}
    />
  );
}

FieldBox.propTypes = {
  field: PropTypes.object.isRequired,
  active: PropTypes.bool,
  dimmed: PropTypes.bool,
};

export default function ScreenshotViewer({ item, result }) {
  const hovered = useInsightOcrStore((s) => s.hovered);
  const selected = useInsightOcrStore((s) => s.selected);

  const activeKey = hovered ?? selected;
  const data = result?.data;
  const fields = useSnappedFields(item.url, data?.fields);

  return (
    <Stack spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
      <ViewerHeader item={item} result={result} />

      {result?.isError && (
        <Alert
          severity="error"
          sx={{ width: 1 }}
          action={
            <Button color="inherit" size="small" onClick={() => result.refetch()}>
              Retry
            </Button>
          }
        >
          {result.error?.message || 'Could not read this screenshot.'}
        </Alert>
      )}

      <Box sx={{ position: 'relative', display: 'inline-block', lineHeight: 0, borderRadius: 1.5, overflow: 'visible' }}>
        <Box
          component="img"
          src={item.url}
          alt={item.file.name}
          sx={{
            display: 'block',
            maxWidth: 1,
            maxHeight: { xs: 560, lg: 'calc(100vh - 260px)' },
            borderRadius: 1.5,
            boxShadow: '0 1px 2px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08)',
          }}
        />

        {result?.isPending && (
          <Box sx={{ position: 'absolute', inset: 0, borderRadius: 1.5, overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.08)' }}>
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: 64,
                mt: '-64px',
                background: 'linear-gradient(to bottom, transparent, rgba(34, 197, 94, 0.35))',
                borderBottom: `2px solid ${BOX_COLOR}`,
                animation: `${scan} 1.6s cubic-bezier(0.45, 0, 0.55, 1) infinite alternate`,
                '@media (prefers-reduced-motion: reduce)': { animation: 'none', top: '50%' },
              }}
            />
          </Box>
        )}

        {fields?.map(
          (field, index) =>
            field.box && (
              <FieldBox
                key={index}
                field={field}
                active={field.key === activeKey}
                dimmed={!!activeKey && field.key !== activeKey}
              />
            )
        )}
      </Box>

      {result?.isPending && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Reading numbers…
        </Typography>
      )}
    </Stack>
  );
}

ScreenshotViewer.propTypes = {
  item: PropTypes.object.isRequired,
  result: PropTypes.object,
};
