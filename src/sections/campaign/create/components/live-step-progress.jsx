import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useWatch } from 'react-hook-form';

import { StepProgress } from './step-progress';
import { getCreditLimitError } from '../utils/campaign-credits';

// Checks a step's rules against the current values without showing any errors
const passes = (schema, values) => {
  try {
    schema.validateSync(values, { abortEarly: true });
    return true;
  } catch {
    return false;
  }
};

// The step row, with a tick only on steps whose required fields are filled. It watches
// the form on its own, so typing re-renders this row and not the whole form.
export default function LiveStepProgress({ control, getSchemaForStep, ...props }) {
  const values = useWatch({ control });

  const { completeBack, completeFront } = useMemo(() => {
    const ok = (step) => passes(getSchemaForStep(step), values);
    return {
      completeBack: [
        ok(0),
        ok(1),
        ok(2),
        ok(3) && (values.logisticsType !== 'RESERVATION' || ok(4)),
        ok(6) && !getCreditLimitError(values.client, values.campaignCredits),
        true,
      ],
      completeFront: [ok(8), ok(9)],
    };
  }, [values, getSchemaForStep]);

  return <StepProgress {...props} completeBack={completeBack} completeFront={completeFront} />;
}

LiveStepProgress.propTypes = {
  control: PropTypes.object.isRequired,
  getSchemaForStep: PropTypes.func.isRequired,
};
