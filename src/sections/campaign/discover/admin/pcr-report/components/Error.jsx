import PropTypes from 'prop-types';

import { Alert, Button } from '@mui/material';

const alertSx = { width: '1046px', mx: 'auto', mb: 2 };

/**
 * @param {Object} props
 * @param {'insightsError' | 'missingSnapshots' | 'loadError'} props.type
 * @param {number} [props.count]
 * @param {() => void} [props.onRetry]
 */
const Error = ({ type, count, onRetry }) => {
  if (type === 'insightsError') {
    return (
      <Alert severity="error" className="hide-in-pdf" sx={alertSx}>
        Analytics data could not load. Try again before you mark this report as ready.
      </Alert>
    );
  }

  if (type === 'missingSnapshots') {
    return (
      <Alert severity="warning" className="hide-in-pdf" sx={alertSx}>
        This report excludes {count} {count === 1 ? 'post' : 'posts'} that are waiting for an
        analytics sync. Sync the data before you mark the report as ready.
      </Alert>
    );
  }

  return (
    <Alert severity="error" className="hide-in-pdf" sx={alertSx}>
      PCR report could not load. Editing, saving, and autosave are disabled.
      <Button size="small" onClick={onRetry} sx={{ ml: 1 }}>
        Retry
      </Button>
    </Alert>
  );
};

export default Error;

Error.propTypes = {
  type: PropTypes.oneOf(['insightsError', 'missingSnapshots', 'loadError']).isRequired,
  count: PropTypes.number,
  onRetry: PropTypes.func,
};
