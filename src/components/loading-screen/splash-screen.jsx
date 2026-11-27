import PropTypes from 'prop-types';

import LoadingScreen from './loading-screen';

export default function SplashScreen({ sx, ...other }) {
  return (
    <LoadingScreen
      instant
      sx={{
        inset: 0,
        px: 0,
        zIndex: 9998,
        position: 'absolute',
        bgcolor: 'background.default',
        ...sx,
      }}
      {...other}
    />
  );
}

SplashScreen.propTypes = {
  sx: PropTypes.object,
};
