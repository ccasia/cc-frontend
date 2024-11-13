import PropTypes from 'prop-types';

import Box from '@mui/material/Box';

import { useResponsive } from 'src/hooks/use-responsive';

import { useSettingsContext } from 'src/components/settings';

import { HEADER } from '../config-layout';

// ----------------------------------------------------------------------

// const SPACING = 8;

export default function Main({ children, sx, ...other }) {
  const settings = useSettingsContext();

  const lgUp = useResponsive('up', 'lg');

  const isNavHorizontal = settings.themeLayout === 'horizontal';

  // const isNavMini = settings.themeLayout === 'mini';

  if (isNavHorizontal) {
    return (
      <Box
        component="main"
        sx={{
          minHeight: 1,
          display: 'flex',
          flexDirection: 'column',
          pt: `${HEADER.H_MOBILE + 24}px`,
          pb: 10,
          ...(lgUp && {
            pt: `${HEADER.H_MOBILE * 2 + 40}px`,
            pb: 15,
          }),
        }}
      >
        {children}
      </Box>
    );
  }

  return (
    <Box
      component="main"
      sx={{
        // flexGrow: 1,
        // minHeight: 1,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: (theme) => theme.palette.background.paper,
        ...sx,
      }}
      {...other}
    >
      {children}
    </Box>
  );
}

Main.propTypes = {
  children: PropTypes.node,
  sx: PropTypes.object,
};
