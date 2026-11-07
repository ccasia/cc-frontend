import { useMemo } from 'react';
import merge from 'lodash/merge';
import PropTypes from 'prop-types';

import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

import { useSettingsContext } from 'src/components/settings';

// system
import { palette } from './palette';
import { shadows } from './shadows';
import { typography } from './typography';
// options
import RTL from './options/right-to-left';
import { customShadows } from './custom-shadows';
import { componentsOverrides } from './overrides';
import { createPresets } from './options/presets';
import { createContrast } from './options/contrast';

// ----------------------------------------------------------------------

export default function ThemeProvider({ children }) {
  const { themeMode, themeDirection, themeColorPresets, themeContrast } = useSettingsContext();

  // A new theme re-renders every styled component, so build it only when a setting changes.
  const theme = useMemo(() => {
    const presets = createPresets(themeColorPresets);
    const contrast = createContrast(themeContrast, themeMode);

    const next = createTheme({
      palette: {
        ...palette(themeMode),
        ...presets.palette,
        ...contrast.palette,
      },
      customShadows: {
        ...customShadows(themeMode),
        ...presets.customShadows,
      },
      direction: themeDirection,
      shadows: shadows(themeMode),
      shape: { borderRadius: 8 },
      typography,
    });

    next.components = merge(componentsOverrides(next), contrast.components);
    return next;
  }, [themeMode, themeDirection, themeColorPresets, themeContrast]);

  return (
    <MuiThemeProvider theme={theme}>
      <RTL themeDirection={themeDirection}>
        <CssBaseline />
        {children}
      </RTL>
    </MuiThemeProvider>
  );
}

ThemeProvider.propTypes = {
  children: PropTypes.node,
};
