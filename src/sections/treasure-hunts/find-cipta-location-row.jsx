import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';
import relativeTime from 'dayjs/plugin/relativeTime';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';

import {
  publishLocationQr,
  syncLocationAnalytics,
  deleteTreasureHuntLocation,
  updateTreasureHuntLocation,
} from 'src/api/treasure-hunts';

import Iconify from 'src/components/iconify';

import FindCiptaConfirmDialog from './find-cipta-confirm-dialog';
import { INK, MUTED, QR_STATUS, StatusPill, iconButtonSx } from './find-cipta-shared';

dayjs.extend(relativeTime);

const cellSx = { py: 1.5, px: 2 };

export default function FindCiptaLocationRow({
  row,
  huntId,
  isFirst,
  isLast,
  canReorder,
  reordering,
  onMove,
  onEdit,
  mutate,
}) {
  const [busy, setBusy] = useState(false);
  const [retryClock, setRetryClock] = useState(() => Date.now());
  const confirmDelete = useBoolean();

  const publication = row.bitlyPublication;
  const qr = QR_STATUS[publication?.status ?? 'NOT_STARTED'] ?? QR_STATUS.NOT_STARTED;
  const hasQr = publication?.status === 'READY';
  const claims = row._count?.claims ?? 0;
  const lastCollectedAt = row.claims?.[0]?.claimedAt ?? null;
  const retryAt = publication?.nextRetryAt ? new Date(publication.nextRetryAt).getTime() : 0;
  const retryBlocked = retryAt > retryClock;

  useEffect(() => {
    if (!retryBlocked) return undefined;
    const timer = window.setTimeout(() => setRetryClock(Date.now()), retryAt - Date.now() + 50);
    return () => window.clearTimeout(timer);
  }, [retryAt, retryBlocked]);

  const run = async (action, successMessage) => {
    try {
      setBusy(true);
      await action();
      enqueueSnackbar(successMessage);
      await mutate();
    } catch (error) {
      enqueueSnackbar(error?.message || 'Something went wrong.', { variant: 'error' });
      if (['QR_PUBLISH_IN_PROGRESS', 'QR_PUBLISH_LEASE_LOST', 'QR_PUBLISH_RATE_LIMITED'].includes(error?.code)) {
        await mutate().catch(() => undefined);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    await run(() => deleteTreasureHuntLocation(huntId, row.id), 'Location deleted.');
    confirmDelete.onFalse();
  };

  // Taking a spot out of the app is the most common thing to do mid-event (the
  // venue moves, the poster comes down), so it lives in the row rather than
  // three clicks deep inside the edit dialog.
  const handleToggle = (event) => {
    const next = event.target.checked;
    run(
      () => updateTreasureHuntLocation(huntId, row.id, { isEnabled: next }),
      next ? `${row.name} is collectable again.` : `${row.name} is hidden from the app.`
    );
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publication.bitlinkUrl);
      enqueueSnackbar('Short link copied.');
    } catch {
      enqueueSnackbar('Could not copy the link.', { variant: 'error' });
    }
  };

  const reorderTitle = canReorder ? '' : 'Clear the search and filter to reorder';

  return (
    <>
      <TableRow hover sx={{ opacity: row.isEnabled ? 1 : 0.6 }}>
        <TableCell sx={cellSx}>
          <Stack direction="row" spacing={0.25} alignItems="center">
            <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', minWidth: 18, color: INK }}>
              {row.sortOrder + 1}
            </Typography>
            <Tooltip title={reorderTitle} placement="top" arrow>
              <span>
                <IconButton
                  size="small"
                  disabled={!canReorder || isFirst || reordering}
                  onClick={() => onMove(row.id, -1)}
                  aria-label="Move up"
                >
                  <Iconify icon="eva:arrow-upward-fill" width={16} sx={{ color: MUTED }} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={reorderTitle} placement="top" arrow>
              <span>
                <IconButton
                  size="small"
                  disabled={!canReorder || isLast || reordering}
                  onClick={() => onMove(row.id, 1)}
                  aria-label="Move down"
                >
                  <Iconify icon="eva:arrow-downward-fill" width={16} sx={{ color: MUTED }} />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </TableCell>

        {/* Artwork, name and hint are one fact — the spot — so they read as one
            cell instead of three columns of horizontal scrolling. */}
        <TableCell sx={cellSx}>
          <Stack direction="row" spacing={1.75} alignItems="center">
            <Box
              component="img"
              src={row.artworkUrl}
              alt={row.name}
              sx={{
                width: 44,
                height: 44,
                borderRadius: 1,
                objectFit: 'cover',
                bgcolor: '#f5f5f5',
                flexShrink: 0,
              }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap sx={{ color: INK }}>
                {row.name}
              </Typography>
              <Tooltip title={row.hint} placement="top">
                <Typography noWrap sx={{ color: '#637381', fontSize: '0.813rem', maxWidth: 320 }}>
                  {row.hint}
                </Typography>
              </Tooltip>
            </Box>
          </Stack>
        </TableCell>

        <TableCell sx={cellSx} align="center">
          <Tooltip
            title={
              (claims === 0 && 'No one has collected this spot yet') ||
              (claims === 1 && '1 person has collected this spot') ||
              `${claims} people have collected this spot`
            }
            placement="top"
            arrow
          >
            <Typography
              sx={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: claims > 0 ? INK : '#B0B0B0',
                display: 'inline-block',
              }}
            >
              {claims}
            </Typography>
          </Tooltip>
        </TableCell>

        <TableCell sx={{ ...cellSx, color: MUTED, fontSize: '0.875rem' }}>
          {lastCollectedAt ? (
            <Tooltip
              title={dayjs(lastCollectedAt).format('D MMM YYYY, h:mm A')}
              placement="top"
              arrow
            >
              <span>{dayjs(lastCollectedAt).fromNow()}</span>
            </Tooltip>
          ) : (
            <Box component="span" sx={{ color: '#B0B0B0' }}>
              Never
            </Box>
          )}
        </TableCell>

        <TableCell sx={cellSx} align="center">
          <Tooltip
            title={row.isEnabled ? 'Hide this spot from the app' : 'Make this spot collectable'}
            placement="top"
            arrow
          >
            <Switch
              size="small"
              checked={row.isEnabled}
              disabled={busy}
              onChange={handleToggle}
              inputProps={{ 'aria-label': `Show ${row.name} in the app` }}
              sx={{
                '& .Mui-checked': { color: '#1ABF66' },
                '& .Mui-checked + .MuiSwitch-track': { bgcolor: '#1ABF66 !important' },
              }}
            />
          </Tooltip>
        </TableCell>

        <TableCell sx={cellSx}>
          {hasQr ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <StatusPill label={qr.label} color={qr.color} />

              <Tooltip title="Copy the short link" placement="top" arrow>
                <span>
                  <IconButton
                    disabled={!publication.bitlinkUrl}
                    onClick={handleCopyLink}
                    sx={iconButtonSx}
                  >
                    <Iconify icon="eva:link-2-fill" width={18} sx={{ color: MUTED }} />
                  </IconButton>
                </span>
              </Tooltip>

              {publication.qrImageUrl && (
                <Tooltip title="Open the QR image to print" placement="top" arrow>
                  <IconButton
                    component={Link}
                    href={publication.qrImageUrl}
                    target="_blank"
                    rel="noopener"
                    sx={iconButtonSx}
                  >
                    <Iconify icon="eva:external-link-fill" width={18} sx={{ color: MUTED }} />
                  </IconButton>
                </Tooltip>
              )}

              <Tooltip
                title={
                  publication.rawScanCount
                    ? `${publication.rawScanCount} scans counted by Bitly — click to refresh`
                    : 'Refresh the scan count from Bitly'
                }
                placement="top"
                arrow
              >
                <span>
                  <IconButton
                    disabled={busy}
                    onClick={() =>
                      run(() => syncLocationAnalytics(huntId, row.id), 'Scan count synced.')
                    }
                    sx={iconButtonSx}
                  >
                    <Iconify icon="eva:sync-fill" width={18} sx={{ color: MUTED }} />
                  </IconButton>
                </span>
              </Tooltip>

              {/* Publishing is idempotent — it reuses the existing bitlink and QR
                  id and only re-fetches the image, so this recovers a broken
                  image without invalidating anything already printed. */}
              <Tooltip
                title="Re-fetch the QR image from Bitly — the link and printed codes stay the same"
                placement="top"
                arrow
              >
                <span>
                  <IconButton
                    disabled={busy || retryBlocked}
                    onClick={() =>
                      run(() => publishLocationQr(huntId, row.id), 'QR image refreshed.')
                    }
                    sx={iconButtonSx}
                  >
                    <Iconify icon="mdi:qrcode-scan" width={18} sx={{ color: MUTED }} />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center">
              {/* A bare icon here read as "something to do with QR codes"; the
                  labelled button says what pressing it will actually do. */}
              <Button
                disabled={busy || retryBlocked}
                onClick={() => run(() => publishLocationQr(huntId, row.id), 'QR code generated.')}
                startIcon={<Iconify icon="mdi:qrcode" width={16} />}
                sx={{
                  height: 34,
                  px: 1.5,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  borderRadius: 1.15,
                  color: '#1340FF',
                  bgcolor: '#fff',
                  border: '1.5px solid #e7e7e7',
                  borderBottom: '3px solid #e7e7e7',
                  '&:hover': { bgcolor: 'rgba(19,64,255,0.08)', border: '1.5px solid #1340FF' },
                }}
              >
                {publication?.status === 'FAILED' || (publication?.status === 'RATE_LIMITED' && !retryBlocked)
                  ? 'Try again'
                  : 'Generate QR'}
              </Button>

              {/* A failed publish used to be a dead end — Bitly's reason is the
                  only thing that tells an admin whether retrying will help. */}
              {publication?.status === 'FAILED' && publication.lastErrorMessage && (
                <Tooltip title={publication.lastErrorMessage} placement="top" arrow>
                  <Box component="span" sx={{ display: 'inline-flex' }}>
                    <Iconify
                      icon="eva:alert-circle-fill"
                      width={18}
                      sx={{ color: '#D4321C', cursor: 'help' }}
                    />
                  </Box>
                </Tooltip>
              )}

              {publication?.status === 'RATE_LIMITED' && (
                <StatusPill label={qr.label} color={qr.color} />
              )}
            </Stack>
          )}
        </TableCell>

        <TableCell sx={cellSx} align="center">
          <Stack direction="row" spacing={1} justifyContent="center">
            <Tooltip title="Edit" placement="top" arrow>
              <IconButton onClick={onEdit} sx={iconButtonSx}>
                <Iconify icon="solar:pen-bold" width={18} sx={{ color: MUTED }} />
              </IconButton>
            </Tooltip>

            <Tooltip
              title={
                claims > 0
                  ? `Already collected by ${claims} ${claims === 1 ? 'person' : 'people'} — switch it off instead`
                  : 'Delete'
              }
              placement="top"
              arrow
            >
              <span>
                <IconButton
                  disabled={claims > 0 || busy}
                  onClick={confirmDelete.onTrue}
                  sx={iconButtonSx}
                >
                  <Iconify icon="solar:trash-bin-trash-bold" width={18} sx={{ color: '#D4321C' }} />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </TableCell>
      </TableRow>

      <FindCiptaConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        emoji="🗑️"
        title="Delete location"
        description={
          <>
            Delete{' '}
            <Box component="span" sx={{ color: '#1340FF', fontWeight: 600 }}>
              {row.name}
            </Box>
            ? Its printed QR code will stop working. This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={busy}
        destructive
      />
    </>
  );
}

FindCiptaLocationRow.propTypes = {
  row: PropTypes.object,
  huntId: PropTypes.string,
  isFirst: PropTypes.bool,
  isLast: PropTypes.bool,
  canReorder: PropTypes.bool,
  reordering: PropTypes.bool,
  onMove: PropTypes.func,
  onEdit: PropTypes.func,
  mutate: PropTypes.func,
};
