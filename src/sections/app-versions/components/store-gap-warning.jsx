import PropTypes from 'prop-types';

import { Stack, darken, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

import { ICONS, COLORS, isVersion, compareVersions } from '../utils';

// Shown when the latest version is ahead of the store: prompted users can't find the update
export default function StoreGapWarning({ latestVersion, storeVersion, storeRef }) {
  if (
    !storeVersion ||
    !isVersion(latestVersion) ||
    compareVersions(latestVersion, storeVersion) <= 0
  ) {
    return null;
  }

  return (
    <Stack
      direction="row"
      spacing={0.75}
      alignItems="flex-start"
      sx={{ color: darken(COLORS.warning, 0.45) }}
    >
      <Iconify icon={ICONS.warning} width={16} sx={{ mt: '2px', flexShrink: 0 }} />
      <Typography variant="caption" sx={{ fontSize: 13 }}>
        Latest is ahead of {storeRef} ({storeVersion}). Users who tap Update won&apos;t find{' '}
        {latestVersion} yet.
      </Typography>
    </Stack>
  );
}

StoreGapWarning.propTypes = {
  latestVersion: PropTypes.string,
  storeVersion: PropTypes.string,
  storeRef: PropTypes.string,
};
