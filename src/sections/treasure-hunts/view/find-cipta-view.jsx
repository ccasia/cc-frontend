import { useState } from 'react';
import { enqueueSnackbar } from 'notistack';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';

import { useBoolean } from 'src/hooks/use-boolean';

import {
  useGetCurrentHunt,
  pauseTreasureHunt,
  resumeTreasureHunt,
  archiveTreasureHunt,
  publishTreasureHunt,
  reactivateTreasureHunt,
} from 'src/api/treasure-hunts';

import Iconify from 'src/components/iconify';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content/empty-content';

import FindCiptaOverview from '../find-cipta-overview';
import FindCiptaLocations from '../find-cipta-locations';
import FindCiptaParticipants from '../find-cipta-participants';
import FindCiptaConfirmDialog from '../find-cipta-confirm-dialog';
import {
  getEventState,
  primaryButtonSx,
  EventStatusPill,
  secondaryButtonSx,
  dangerGhostButtonSx,
} from '../find-cipta-shared';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'locations', label: 'Locations' },
  { value: 'participants', label: 'Participants' },
];

/**
 * Find Cipta is a one-time event, so this page owns the single hunt outright —
 * there is no list, no create, and no id in the URL. The backend resolves (and
 * on first visit creates) the event behind /current.
 */
export default function FindCiptaView() {
  const { hunt, isLoading, mutate } = useGetCurrentHunt();
  const [tab, setTab] = useState('overview');
  const [busy, setBusy] = useState(false);
  const confirmEnd = useBoolean();
  const confirmReactivate = useBoolean();

  const run = async (action, successMessage) => {
    try {
      setBusy(true);
      await action();
      enqueueSnackbar(successMessage);
      await mutate();
      return true;
    } catch (error) {
      enqueueSnackbar(error?.message || 'Something went wrong.', { variant: 'error' });
      if (['INVALID_HUNT_TRANSITION', 'HUNT_NOT_ENDED'].includes(error?.code)) {
        await mutate().catch(() => undefined);
      }
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleEndEvent = async () => {
    const succeeded = await run(() => archiveTreasureHunt(hunt.id), 'Event ended.');
    if (succeeded) confirmEnd.onFalse();
  };

  const handleReactivateEvent = async () => {
    const succeeded = await run(
      () => reactivateTreasureHunt(hunt.id),
      'Event re-enabled and live.'
    );
    if (succeeded) confirmReactivate.onFalse();
  };

  if (isLoading) {
    return (
      <Box sx={{ position: 'relative', top: 200, textAlign: 'center' }}>
        <CircularProgress
          thickness={7}
          size={25}
          sx={{ color: (theme) => theme.palette.common.black, strokeLinecap: 'round' }}
        />
      </Box>
    );
  }

  if (!hunt) {
    return (
      <Container maxWidth="lg">
        <EmptyContent
          title="Find Cipta could not be loaded"
          description="Refresh the page to try again."
          sx={{ py: 10 }}
        />
      </Container>
    );
  }

  // Derived, not the raw enum: a PUBLISHED event outside its own window is not
  // live to anyone, and labelling it "Live" sends admins hunting for a bug.
  const status = getEventState(hunt);
  const enabledLocations = (hunt.locations ?? []).filter((location) => location.isEnabled);
  const isPublishReady =
    Boolean(hunt.heroArtworkUrl) &&
    hunt.rewardXp > 0 &&
    new Date(hunt.endsAt) > new Date() &&
    new Date(hunt.endsAt) > new Date(hunt.startsAt) &&
    enabledLocations.length > 0 &&
    enabledLocations.every(
      (location) => location.artworkUrl && location.bitlyPublication?.status === 'READY'
    );
  const publishMessage = new Date(hunt.startsAt) > new Date() ? 'Event scheduled.' : 'Event is live.';

  return (
    <Container maxWidth="lg">
      <CustomBreadcrumbs
        heading="Find Cipta"
        action={
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <EventStatusPill label={status.label} color={status.color} />

            {status.phase === 'ended' && (
              <LoadingButton
                loading={busy}
                disabled={!isPublishReady}
                startIcon={<Iconify icon="mdi:restore" width={16} />}
                onClick={confirmReactivate.onTrue}
                sx={primaryButtonSx}
              >
                Re-enable event
              </LoadingButton>
            )}

            {hunt.status === 'DRAFT' && (
              <LoadingButton
                loading={busy}
                startIcon={<Iconify icon="eva:checkmark-fill" width={16} />}
                onClick={() => run(() => publishTreasureHunt(hunt.id, true), publishMessage)}
                sx={primaryButtonSx}
              >
                Publish &amp; Feature
              </LoadingButton>
            )}

            {status.phase === 'live' && (
              <LoadingButton
                loading={busy}
                startIcon={<Iconify icon="mdi:pause" width={16} />}
                onClick={() => run(() => pauseTreasureHunt(hunt.id), 'Event paused.')}
                sx={secondaryButtonSx}
              >
                Pause
              </LoadingButton>
            )}

            {status.phase === 'paused' && (
              <LoadingButton
                loading={busy}
                startIcon={<Iconify icon="mdi:play" width={16} />}
                onClick={() => run(() => resumeTreasureHunt(hunt.id), 'Event resumed.')}
                sx={primaryButtonSx}
              >
                Resume
              </LoadingButton>
            )}

            {status.phase !== 'ended' && hunt.status !== 'ARCHIVED' && (
              <LoadingButton
                loading={busy}
                startIcon={<Iconify icon="mdi:archive-outline" width={16} />}
                onClick={confirmEnd.onTrue}
                sx={dangerGhostButtonSx}
              >
                End event
              </LoadingButton>
            )}
          </Stack>
        }
        sx={{ mb: 2 }}
      />

      <Box sx={{ mt: 2, mb: 2.5, position: 'relative', overflow: 'hidden' }}>
        <Divider sx={{ position: 'absolute', bottom: 0, left: 0, width: 1 }} />

        <Stack
          role="tablist"
          direction="row"
          sx={{
            width: 1,
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <Stack direction="row" sx={{ width: 'max-content' }}>
            {TABS.map((item) => {
              const isActive = tab === item.value;

              return (
                <Button
                  key={item.value}
                  role="tab"
                  aria-selected={tab === item.value}
                  disableRipple
                  size="large"
                  onClick={() => setTab(item.value)}
                  sx={{
                    px: { xs: 1, sm: 1.2 },
                    py: 0.5,
                    pb: 1,
                    minWidth: 'fit-content',
                    color: isActive ? '#221f20' : '#8e8e93',
                    position: 'relative',
                    fontSize: { xs: '0.9rem', sm: '1.05rem' },
                    fontWeight: 650,
                    whiteSpace: 'nowrap',
                    mr: { xs: 1, sm: 2 },
                    transition: 'transform 0.1s ease-in-out',
                    '&:focus': {
                      outline: 'none',
                      bgcolor: 'transparent',
                    },
                    '&:active': {
                      transform: 'scale(0.95)',
                      bgcolor: 'transparent',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      width: isActive ? '100%' : '0%',
                      bgcolor: '#1340ff',
                      transition: 'all 0.3s ease-in-out',
                      transformOrigin: 'left',
                    },
                    '&:hover': {
                      bgcolor: 'transparent',
                      '&::after': {
                        width: '100%',
                        opacity: isActive ? 1 : 0.5,
                      },
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Stack>
        </Stack>
      </Box>

      {tab === 'overview' && <FindCiptaOverview hunt={hunt} mutate={mutate} />}
      {tab === 'locations' && <FindCiptaLocations hunt={hunt} mutate={mutate} />}
      {tab === 'participants' && <FindCiptaParticipants huntId={hunt.id} />}

      <FindCiptaConfirmDialog
        open={confirmEnd.value}
        onClose={confirmEnd.onFalse}
        emoji="🏁"
        title="End event"
        description="Find Cipta will stop accepting new scans and leave the featured slot. Existing collections and awarded XP are kept, and the event can be re-enabled later."
        confirmLabel="End event"
        onConfirm={handleEndEvent}
        loading={busy}
        destructive
      />

      <FindCiptaConfirmDialog
        open={confirmReactivate.value}
        onClose={confirmReactivate.onFalse}
        emoji="🔄"
        title="Re-enable Find Cipta?"
        description="All existing locations, QR codes, scans, photos, participant progress, and awarded XP will be kept. Find Cipta will restart now, run for 30 days, and immediately return to the featured slot."
        confirmLabel="Re-enable event"
        onConfirm={handleReactivateEvent}
        loading={busy}
      />
    </Container>
  );
}
