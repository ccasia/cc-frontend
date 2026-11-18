import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

import { BORDER, formatUsd, truncateMiddle } from '../constants';
import { useInsightOcrStore } from '../store/use-insight-ocr-store';

const navSx = { border: BORDER, borderRadius: 1, p: 0.5 };

const getMeta = (result) => {
  if (result?.isPending) return 'Reading…';
  const data = result?.data;
  if (!data) return null;
  return `${data.fields.length} values · ${(data.durationMs / 1000).toFixed(1)}s · ${formatUsd(data.usage.costUsd)}`;
};

export default function ViewerHeader({ item, result }) {
  const items = useInsightOcrStore((s) => s.items);
  const { step } = useInsightOcrStore.getState();

  const index = items.findIndex((i) => i.id === item.id);
  const meta = getMeta(result);

  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: 1, minWidth: 0 }}>
      {items.length > 1 && (
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" aria-label="Previous screenshot" disabled={index <= 0} onClick={() => step(-1)} sx={navSx}>
            <Iconify icon="mingcute:left-line" width={18} />
          </IconButton>
          <IconButton
            size="small"
            aria-label="Next screenshot"
            disabled={index >= items.length - 1}
            onClick={() => step(1)}
            sx={navSx}
          >
            <Iconify icon="mingcute:right-line" width={18} />
          </IconButton>
        </Stack>
      )}

      <Tooltip title={item.file.name} placement="bottom-start">
        <Typography variant="subtitle1" noWrap sx={{ flex: 1, minWidth: 0 }}>
          {truncateMiddle(item.file.name, 48)}
        </Typography>
      </Tooltip>

      {meta && (
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}
        >
          {meta}
        </Typography>
      )}
    </Stack>
  );
}

ViewerHeader.propTypes = {
  item: PropTypes.object.isRequired,
  result: PropTypes.object,
};
