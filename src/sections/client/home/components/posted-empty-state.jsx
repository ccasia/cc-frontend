import PropTypes from 'prop-types';
import { format } from 'date-fns';

import { Button } from '@mui/material';

import { plural, periodPhrase, presetCovering } from '../utils';
import EmptyState, { primarySx, secondarySx } from './empty-state';

export default function PostedEmptyState({ period, hiddenCount, lastPostedAt, onPeriodChange }) {
  const suggestion = presetCovering(lastPostedAt);

  return (
    <EmptyState
      icon="solar:calendar-search-linear"
      title={`No posts ${periodPhrase(period)}`}
      actions={
        <>
          {suggestion && (
            <Button
              disableElevation
              variant="contained"
              onClick={() => onPeriodChange({ value: suggestion.value })}
              sx={primarySx}
            >
              Show {suggestion.label.toLowerCase()}
            </Button>
          )}
          <Button
            variant={suggestion ? 'outlined' : 'contained'}
            disableElevation
            onClick={() => onPeriodChange({ value: 'all' })}
            sx={suggestion ? secondarySx : primarySx}
          >
            Show all time
          </Button>
        </>
      }
    >
      {lastPostedAt
        ? `The last post went live on ${format(lastPostedAt, 'd MMM yyyy')}.`
        : 'None of these campaigns has posted yet.'}{' '}
      {plural(hiddenCount, 'campaign')} {hiddenCount === 1 ? 'is' : 'are'} hidden for now.
    </EmptyState>
  );
}

PostedEmptyState.propTypes = {
  period: PropTypes.shape({
    value: PropTypes.string.isRequired,
    from: PropTypes.instanceOf(Date),
    to: PropTypes.instanceOf(Date),
  }).isRequired,
  hiddenCount: PropTypes.number.isRequired,
  lastPostedAt: PropTypes.instanceOf(Date),
  onPeriodChange: PropTypes.func.isRequired,
};
