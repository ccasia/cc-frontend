import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import CircularProgress from '@mui/material/CircularProgress';

import { useBoolean } from 'src/hooks/use-boolean';

import Iconify from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { BORDER, formatUsd } from '../constants';
import { useInsightOcrStore } from '../store/use-insight-ocr-store';
import { getSaveSignature, useSaveInsightOcr } from '../hooks/use-save-insight-ocr';

const Dot = ({ color }) => <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />;

Dot.propTypes = { color: PropTypes.string };

function ReadStatus({ total, pending, failed }) {
  if (pending) {
    return (
      <>
        <CircularProgress size={12} thickness={6} sx={{ color: 'text.secondary' }} />
        <Typography variant="body2">
          Reading {total - pending + 1} of {total}
        </Typography>
      </>
    );
  }

  return (
    <>
      <Dot color={failed ? '#FF5630' : '#22C55E'} />
      <Typography variant="body2">
        {total - failed} of {total} read{failed ? ` · ${failed} failed` : ''}
      </Typography>
    </>
  );
}

ReadStatus.propTypes = {
  total: PropTypes.number.isRequired,
  pending: PropTypes.number.isRequired,
  failed: PropTypes.number.isRequired,
};

const iconButtonSx = { border: BORDER, borderRadius: 1, width: 36, height: 36 };

export default function OcrToolbar({ resultsById, combined }) {
  const items = useInsightOcrStore((s) => s.items);
  const savedSignature = useInsightOcrStore((s) => s.savedSignature);
  const { clear, markSaved } = useInsightOcrStore.getState();

  const confirmClear = useBoolean();
  const save = useSaveInsightOcr();

  const results = Object.values(resultsById);
  const pending = results.filter((r) => r.isPending).length;
  const failed = results.filter((r) => r.isError).length;
  const cost = results.reduce((sum, r) => sum + (r.data?.usage.costUsd ?? 0), 0);

  const signature = getSaveSignature(items, resultsById);
  const isSaved = savedSignature === signature;
  const canSave = !pending && items.length > failed && !isSaved;

  const handleCopy = async () => {
    const json = Object.fromEntries(combined.map((field) => [field.key, field.number ?? field.value]));
    try {
      await navigator.clipboard.writeText(JSON.stringify(json, null, 2));
      enqueueSnackbar('Copied data as JSON');
    } catch {
      enqueueSnackbar('Could not copy', { variant: 'error' });
    }
  };

  const handleSave = () =>
    save.mutate(
      { items, resultsById, combined },
      {
        onSuccess: (data) => {
          markSaved(data.id, signature);
          enqueueSnackbar('Saved to the database');
        },
        onError: (error) => enqueueSnackbar(error?.message || 'Could not save', { variant: 'error' }),
      }
    );

  const handleClear = () => (isSaved || !combined.length ? clear() : confirmClear.onTrue());

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ px: 1.5, height: 36, border: BORDER, borderRadius: 1, whiteSpace: 'nowrap' }}
        >
          <ReadStatus total={items.length} pending={pending} failed={failed} />
          <Typography variant="body2" sx={{ color: 'text.disabled', fontVariantNumeric: 'tabular-nums' }}>
            {formatUsd(cost)}
          </Typography>
        </Stack>

        <Tooltip title="Copy as JSON">
          <span>
            <IconButton disabled={!combined.length} onClick={handleCopy} sx={iconButtonSx}>
              <Iconify icon="solar:copy-linear" width={18} />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Clear all">
          <IconButton onClick={handleClear} sx={iconButtonSx}>
            <Iconify icon="solar:trash-bin-minimalistic-linear" width={18} />
          </IconButton>
        </Tooltip>

        <LoadingButton
          variant="contained"
          loading={save.isPending}
          disabled={!canSave}
          onClick={handleSave}
          startIcon={<Iconify icon={isSaved ? 'mingcute:check-line' : 'solar:diskette-linear'} />}
          sx={{ height: 36, minWidth: 96 }}
        >
          {isSaved ? 'Saved' : 'Save'}
        </LoadingButton>
      </Stack>

      <ConfirmDialog
        open={confirmClear.value}
        onClose={confirmClear.onFalse}
        title="Clear without saving?"
        content="The extracted data is not saved yet. If you clear now, you must read the screenshots again."
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              confirmClear.onFalse();
              clear();
            }}
          >
            Clear
          </Button>
        }
      />
    </>
  );
}

OcrToolbar.propTypes = {
  resultsById: PropTypes.object.isRequired,
  combined: PropTypes.array.isRequired,
};
