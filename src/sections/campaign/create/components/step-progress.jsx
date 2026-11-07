import PropTypes from 'prop-types';
import { useRef, Fragment } from 'react';

import { Box, Stack, Typography } from '@mui/material';

import NextStepsIcon from 'src/assets/icons/next-steps-icon';

import { EASE_IN_OUT } from './motion';
import StepHighlight from './step-highlight';
import StepConnector from './step-connector';
import StepPill, { stepButtonSx } from './step-pill';
import StepTooltip, { tooltipSlotSx } from './step-tooltip';
import {
  isInFrontSection,
  backSectionLabels,
  frontSectionLabels,
  getBackSectionIndicatorIndex,
  getFrontSectionIndicatorIndex,
} from '../utils/campaign-steps';

const LOCKED_HINT = 'Finish the earlier steps first';
const NEXT_STEPS_INDEX = backSectionLabels.length;

// A step already reached stays done after going back, so it keeps its tick and can be
// clicked to jump forward to it again
const stateOf = (index, current, reached) => {
  if (index === current) return 'current';
  return index < current || index <= reached ? 'done' : 'upcoming';
};

export function StepProgress({
  activeStep,
  reachedBack = -1,
  reachedFront = -1,
  onBackStepClick,
  onFrontStepClick,
  onNextStepsClick,
}) {
  const inFront = isInFrontSection(activeStep);
  const backIndex = inFront ? NEXT_STEPS_INDEX + 1 : getBackSectionIndicatorIndex(activeStep);
  const frontIndex = getFrontSectionIndicatorIndex(activeStep);
  const backRail = Math.max(backIndex, reachedBack);
  const frontRail = Math.max(frontIndex, reachedFront);
  const nextStepsState = stateOf(NEXT_STEPS_INDEX, backIndex, reachedBack);
  const nextStepsClickable = nextStepsState === 'done';

  // A real button never looks "current": it keeps its last done/upcoming look, and the
  // highlight's copy shows the current step on top of it
  const looks = useRef({});
  const lookOf = (key, state) => {
    if (state !== 'current') looks.current[key] = state;
    return looks.current[key] ?? 'upcoming';
  };

  // The row is drawn twice: once as the real buttons, once in blue on white inside the highlight
  const renderPill = (overlay, { label, state, onClick }) => {
    const pill = (
      <StepPill
        label={label}
        state={state}
        look={overlay ? undefined : lookOf(label, state)}
        clickable={state === 'done'}
        onClick={onClick}
        overlay={overlay}
      />
    );
    return overlay ? (
      <Box component="span" sx={tooltipSlotSx}>
        {pill}
      </Box>
    ) : (
      <StepTooltip title={state === 'upcoming' ? LOCKED_HINT : ''}>{pill}</StepTooltip>
    );
  };

  const renderNextSteps = (overlay) => {
    const look = overlay ? nextStepsState : lookOf('next-steps', nextStepsState);
    const button = (
      <Box
        {...(overlay
          ? { component: 'div' }
          : {
              component: 'button',
              type: 'button',
              'aria-label': 'Next steps',
              'aria-current': nextStepsState === 'current' ? 'step' : undefined,
              disabled: !nextStepsClickable,
              onClick: onNextStepsClick,
            })}
        sx={{
          ...stepButtonSx(look, nextStepsClickable, overlay),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 52,
          flexShrink: 0,
          '& img': { opacity: !overlay && look === 'upcoming' ? 0.55 : 1 },
        }}
      >
        <NextStepsIcon active={!overlay && look === 'done'} size={24} />
      </Box>
    );
    if (overlay) return button;
    return (
      <StepTooltip
        title={
          nextStepsState === 'upcoming' ? `Next steps · ${LOCKED_HINT.toLowerCase()}` : 'Next steps'
        }
      >
        {button}
      </StepTooltip>
    );
  };

  const renderRow = (overlay) => (
    <>
      {!inFront &&
        backSectionLabels.map((label, index) => (
          <Fragment key={label}>
            {renderPill(overlay, {
              label,
              state: stateOf(index, backIndex, reachedBack),
              onClick: () => onBackStepClick(index),
            })}
            <StepConnector filled={index < backRail} hidden={overlay} />
          </Fragment>
        ))}

      {renderNextSteps(overlay)}

      {inFront &&
        frontSectionLabels.map((label, index) => (
          <Fragment key={label}>
            <StepConnector filled={index <= frontRail} hidden={overlay} />
            {renderPill(overlay, {
              label,
              state: stateOf(index, frontIndex, reachedFront),
              onClick: () => onFrontStepClick(index),
            })}
          </Fragment>
        ))}
    </>
  );

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      sx={{ position: 'relative', width: '100%', maxWidth: 900, minWidth: 0 }}
    >
      <StepHighlight key={inFront ? 'front' : 'back'} activeKey={activeStep}>
        {renderRow(true)}
      </StepHighlight>
      {renderRow(false)}
    </Stack>
  );
}

StepProgress.propTypes = {
  activeStep: PropTypes.number.isRequired,
  reachedBack: PropTypes.number,
  reachedFront: PropTypes.number,
  onBackStepClick: PropTypes.func.isRequired,
  onFrontStepClick: PropTypes.func.isRequired,
  onNextStepsClick: PropTypes.func.isRequired,
};

// Phones hide the step row, so they get a short line and a progress bar instead
export function StepProgressCompact({ activeStep }) {
  const inFront = isInFrontSection(activeStep);
  const labels = inFront ? frontSectionLabels : [...backSectionLabels, 'Next steps'];
  const index = inFront
    ? getFrontSectionIndicatorIndex(activeStep)
    : getBackSectionIndicatorIndex(activeStep);
  const progress = (index + 1) / labels.length;

  return (
    <Stack spacing={0.75} sx={{ pt: 0.5 }}>
      <Typography sx={{ fontSize: 12, fontWeight: 500, color: '#8E8E93' }}>
        {inFront ? 'Additional details · ' : ''}Step {index + 1} of {labels.length} ·{' '}
        <Box component="span" sx={{ color: '#1340FF', fontWeight: 600 }}>
          {labels[index]}
        </Box>
      </Typography>
      <Box sx={{ height: 3, borderRadius: 2, bgcolor: '#E7E7E7', overflow: 'hidden' }}>
        <Box
          sx={{
            height: 1,
            bgcolor: '#1340FF',
            transformOrigin: 'left',
            transform: `scaleX(${progress})`,
            transition: `transform 250ms ${EASE_IN_OUT}`,
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          }}
        />
      </Box>
    </Stack>
  );
}

StepProgressCompact.propTypes = {
  activeStep: PropTypes.number.isRequired,
};
