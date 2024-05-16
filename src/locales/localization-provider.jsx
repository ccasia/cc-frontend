import PropTypes from 'prop-types';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider as MuiLocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

// ----------------------------------------------------------------------

export default function LocalizationProvider({ children }) {
  // const { currentLang } = useLocales();

  return <MuiLocalizationProvider dateAdapter={AdapterDateFns}>{children}</MuiLocalizationProvider>;
}

LocalizationProvider.propTypes = {
  children: PropTypes.node,
};
