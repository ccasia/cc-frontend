import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/utils/format-time';

import Iconify from 'src/components/iconify';

const STALE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * How fresh a connected account's saved numbers are.
 *
 * Only Instagram stores a token expiry. An expired token cannot refresh the
 * numbers, so they stay as they were on the last sync.
 */
export function getMediaKitSyncState(creator, platform) {
  const isTiktok = platform === 'tiktok';
  const account = isTiktok ? creator?.creator?.tiktokUser : creator?.creator?.instagramUser;
  if (!account) return null;

  const lastSyncedAt = account.lastUpdated ?? account.updatedAt ?? null;
  const tokenExpired = !isTiktok && account.expiresIn != null && account.expiresIn * 1000 < Date.now();
  const tooOld =
    lastSyncedAt != null && Date.now() - new Date(lastSyncedAt).getTime() > STALE_AFTER_MS;

  return { lastSyncedAt, tokenExpired, isStale: tokenExpired || tooOld };
}

export default function MediaKitSyncNote({ lastSyncedAt, tokenExpired, usingProfileLink, onToggle }) {
  const synced = lastSyncedAt ? `last synced ${fDate(lastSyncedAt)}` : 'last sync unknown';
  const message = usingProfileLink
    ? `Using the profile link. Media kit ${synced}.`
    : `Media kit ${synced}${tokenExpired ? ', token expired' : ''}.`;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.75}
      flexWrap="wrap"
      sx={{ mt: 1, color: '#636366' }}
    >
      <Iconify icon={usingProfileLink ? 'eva:link-2-fill' : 'eva:clock-outline'} width={14} />
      <Typography sx={{ fontSize: 12, lineHeight: '16px' }}>{message}</Typography>
      <ButtonBase
        onClick={onToggle}
        sx={{ fontSize: 12, lineHeight: '16px', fontWeight: 600, color: '#1340FF' }}
      >
        {usingProfileLink ? 'Use media kit' : 'Use profile link instead'}
      </ButtonBase>
    </Stack>
  );
}

MediaKitSyncNote.propTypes = {
  lastSyncedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  tokenExpired: PropTypes.bool,
  usingProfileLink: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
};
