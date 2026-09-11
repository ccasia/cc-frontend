import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { m, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

import CreatorScrapeRow from './creator-scrape-row';
import { CC, ROW_GAP } from './creator-field-tokens';
import useGuestExtraction from './use-guest-extraction';
import { ACTIONS, MAX_ROWS, BATCH_SAVE_STATUS } from './creator-row-machine';
import { newIdempotencyKey, saveGuestCreators } from './guest-extraction-api';

/**
 * Add Non-Platform Creators.
 *
 * Laid out to the "No-Platform Creators/default" handoff: a 978px grey card
 * with a 20px radius, a serif heading, one rule under the header, the creator
 * rows, then the minus and plus pair and Add Creator on the right. The close
 * cross is the only way out, so there is no Cancel button.
 */

/** Turn eligible rows into the request body. Ineligible rows never get here. */
export function buildGuestPayload(rows) {
  return rows.map((row) => ({
    profileLink: row.canonicalProfileUrl ?? row.profileLink,
    name: row.name.trim() || (row.canonicalProfileKey ? row.canonicalProfileKey.split(':')[1] : '') || '',
    followerCount: row.followerCount || undefined,
    engagementRate: row.engagementRate || undefined,
    adminComments: row.adminComments?.trim() || undefined,
    extractionId: row.extractionId ?? undefined,
    completionReceipt: row.completionReceipt ?? undefined,
    fallbackReason: row.fallbackReason ?? undefined,
    fallbackConfirmed: row.fallbackConfirmed || undefined,
  }));
}

const normalizeLink = (value) => value?.trim().replace(/\/+$/, '');

const normalizeErrorBody = (error) =>
  error?.response?.data ?? (error && typeof error === 'object' ? error : null);

const rowSaveResult = (rows, payload, body) => {
  if (!body?.rejected?.length) return null;
  const rejectedByLink = new Map(
    body.rejected.map((rejected) => [normalizeLink(rejected.profileLink), rejected])
  );
  const acceptedRowIds = [];
  const rejectedByRowId = {};

  rows.forEach((row, index) => {
    const rejected = rejectedByLink.get(normalizeLink(payload[index].profileLink));
    if (!rejected) {
      acceptedRowIds.push(row.id);
      return;
    }
    rejectedByRowId[row.id] = {
      code: rejected.code || 'SAVE_REJECTED',
      message: rejected.message || 'This creator could not be verified.',
    };
  });

  return {
    acceptedRowIds,
    rejectedByRowId,
    error: body.rejected[0].message || body.message || 'Some creators could not be verified.',
  };
};

/** The 38px minus and plus pair from the handoff. */
const stepperSx = {
  width: 38,
  height: 38,
  borderRadius: '8px',
  border: `1px solid ${CC.light200}`,
  boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
  bgcolor: '#FFFFFF',
  '&:hover': { bgcolor: CC.light25 },
  '&:disabled': { opacity: 0.5 },
};

export default function AutomaticCreatorScrapeDialog({ open, onClose, campaignId, onUpdated }) {
  const { enqueueSnackbar } = useSnackbar();

  /**
   * One key per batch, not one per page load.
   *
   * The key must stay stable while a batch is retried, so a double click never
   * shortlists twice. It must not stay stable across batches: the dialog is
   * never unmounted, so a single key would make the second add look to the
   * server like a replay of the first, and it would be dropped.
   */
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  useEffect(() => {
    if (open) setIdempotencyKey(newIdempotencyKey());
  }, [open]);

  const {
    state,
    dispatch,
    duplicateIds,
    eligibleRows,
    eligibleCount,
    setLink,
    removeRow,
    applySaveResult,
    completeSuccessfulSave,
  } = useGuestExtraction({ campaignId, enabled: open, kind: 'guest' });

  const saving = state.batchSaveState === BATCH_SAVE_STATUS.SAVING;

  const handleSave = useCallback(async () => {
    if (eligibleCount === 0 || saving) return;

    dispatch({ type: ACTIONS.BATCH_SAVE_STARTED });
    try {
      const guestCreators = buildGuestPayload(eligibleRows);
      const response = await saveGuestCreators({
        campaignId,
        guestCreators,
        idempotencyKey,
      });

      const saveResult = rowSaveResult(eligibleRows, guestCreators, response);
      if (saveResult) {
        applySaveResult(saveResult);
        setIdempotencyKey(newIdempotencyKey());
        enqueueSnackbar(saveResult.error, { variant: 'error' });
        if (saveResult.acceptedRowIds.length > 0) onUpdated?.();
        return;
      }

      dispatch({ type: ACTIONS.BATCH_SAVE_SUCCEEDED });
      completeSuccessfulSave();
      enqueueSnackbar(
        eligibleCount > 1
          ? 'Guest creators shortlisted successfully.'
          : 'Guest creator shortlisted successfully.',
        { variant: 'success' }
      );
      onUpdated?.();
      onClose();
    } catch (error) {
      const body = normalizeErrorBody(error);
      const guestCreators = buildGuestPayload(eligibleRows);
      const saveResult = rowSaveResult(eligibleRows, guestCreators, body);
      if (saveResult) {
        applySaveResult(saveResult);
        setIdempotencyKey(newIdempotencyKey());
        enqueueSnackbar(saveResult.error, { variant: 'error' });
        if (saveResult.acceptedRowIds.length > 0) onUpdated?.();
        return;
      }
      dispatch({ type: ACTIONS.BATCH_SAVE_FAILED, error: body?.message ?? null });
      enqueueSnackbar(body?.message || 'Failed to add non-platform creator.', {
        variant: 'error',
      });
    }
  }, [
    campaignId,
    dispatch,
    eligibleCount,
    eligibleRows,
    enqueueSnackbar,
    idempotencyKey,
    onClose,
    onUpdated,
    applySaveResult,
    saving,
    completeSuccessfulSave,
  ]);

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: 978,
          maxWidth: 'calc(100% - 32px)',
          bgcolor: CC.paper,
          borderRadius: '20px',
          boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.15)',
        },
      }}
    >
      <Box sx={{ p: 3, maxHeight: '90vh', overflowY: 'auto' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={3}>
          <Box>
            <Typography
              component="h2"
              sx={{
                fontFamily: 'Instrument Serif, serif',
                fontWeight: 400,
                fontSize: { xs: '28px', sm: '36px' },
                lineHeight: '40px',
                color: CC.onyx,
                mb: '4px',
              }}
            >
              Add Non-Platform Creators
            </Typography>
            <Typography sx={{ fontSize: '14px', lineHeight: '18px', color: CC.onyx }}>
              Placing the Profile Link will auto-extract the remaining information. This can be
              edited.
            </Typography>
          </Box>

          <IconButton
            aria-label="Close"
            onClick={onClose}
            disabled={saving}
            sx={{ p: 0, color: CC.grey50, flexShrink: 0 }}
          >
            <Iconify icon="mdi:close" width={24} />
          </IconButton>
        </Stack>

        <Divider sx={{ my: 3, borderColor: CC.light100 }} />

        <Stack spacing={`${ROW_GAP}px`}>
          <AnimatePresence initial={false}>
            {state.rows.map((row) => (
              <Box
                key={row.id}
                component={m.div}
                initial={{ opacity: 0, height: 0 }}
                animate={{
                  opacity: 1,
                  height: 'auto',
                  transition: {
                    height: { duration: 0.3, ease: 'easeOut' },
                    opacity: { duration: 0.2, delay: 0.1 },
                  },
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                  transition: {
                    height: { duration: 0.25, ease: 'easeIn' },
                    opacity: { duration: 0.15 },
                  },
                }}
                sx={{ overflow: 'hidden' }}
              >
                <CreatorScrapeRow
                  row={row.saveError ? { ...row, error: row.saveError } : row}
                  isDuplicate={duplicateIds.includes(row.id)}
                  disabled={saving}
                  dispatch={dispatch}
                  onLinkChange={setLink}
                />
              </Box>
            ))}
          </AnimatePresence>
        </Stack>

        <Stack direction="row" justifyContent="flex-end" spacing="6px" sx={{ mt: `${ROW_GAP}px` }}>
          <Tooltip title="Remove the last creator" arrow>
            <span>
              <IconButton
                aria-label="Remove row"
                onClick={() => removeRow(state.rows[state.rows.length - 1]?.id)}
                disabled={state.rows.length <= 1 || saving}
                sx={stepperSx}
              >
                <Iconify icon="eva:minus-fill" width={20} sx={{ color: CC.onyx }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Add another creator" arrow>
            <span>
              <IconButton
                aria-label="Add row"
                onClick={() => dispatch({ type: ACTIONS.ADD_ROW })}
                disabled={state.rows.length >= MAX_ROWS || saving}
                sx={stepperSx}
              >
                <Iconify icon="eva:plus-fill" width={20} sx={{ color: CC.blue500 }} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ mt: `${ROW_GAP}px` }}>
          <Button
            onClick={handleSave}
            disabled={eligibleCount === 0 || saving}
            sx={{
              height: 44,
              px: 2,
              flexShrink: 0,
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              lineHeight: '20px',
              textTransform: 'none',
              color: '#FFFFFF',
              bgcolor: '#203ff5',
              boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.1) inset',
              '&:hover': { bgcolor: '#1933cc' },
              '&:disabled': {
                color: '#FFFFFF',
                // Brand/Base/CC Onyx Grey at 60% white, straight from the handoff.
                background:
                  'linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6)), #3A3A3C',
              },
            }}
          >
            {saving ? 'Adding...' : 'Add Creator'}
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
}

AutomaticCreatorScrapeDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  campaignId: PropTypes.string.isRequired,
  onUpdated: PropTypes.func,
};
