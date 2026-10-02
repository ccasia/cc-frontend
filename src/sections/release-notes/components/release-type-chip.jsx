import PropTypes from 'prop-types';

import Box from '@mui/material/Box';

import { RELEASE_TYPE_META } from '../constants';

export default function ReleaseTypeChip({ type }) {
  const meta = RELEASE_TYPE_META[type] ?? RELEASE_TYPE_META.NEW;

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-start',
        flexShrink: 0,
        minWidth: 72,
        height: 22,
        px: 1,
        borderRadius: 0.75,
        bgcolor: meta.color,
        color: 'common.white',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
      }}
    >
      {meta.label}
    </Box>
  );
}

ReleaseTypeChip.propTypes = {
  type: PropTypes.string,
};
