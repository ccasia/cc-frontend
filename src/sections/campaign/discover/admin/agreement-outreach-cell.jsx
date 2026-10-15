import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { OUTREACH_STATUS_OPTIONS } from 'src/contants/outreach';

import { StatusSelect } from 'src/components/status-chip';

// Same endpoint, options and chip as the master list's outreach dropdown, so a change made in
// either tab shows up in the other.
const AgreementOutreachCell = ({ agreement, disabled, onSaved }) => {
  const handleChange = async (value) => {
    try {
      await axiosInstance.patch(endpoints.campaign.pitch.v3.outreachStatus(agreement.pitchId), {
        outreachStatus: value,
      });
      await onSaved?.();
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to update outreach status', { variant: 'error' });
      // Lets the chip switch back to the saved status.
      throw error;
    }
  };

  return (
    <StatusSelect
      value={agreement?.outreachStatus}
      options={OUTREACH_STATUS_OPTIONS}
      onChange={handleChange}
      // Creators shortlisted without a pitch have nowhere to store a status.
      disabled={disabled || !agreement?.pitchId}
    />
  );
};

AgreementOutreachCell.propTypes = {
  agreement: PropTypes.object,
  disabled: PropTypes.bool,
  onSaved: PropTypes.func,
};

export default AgreementOutreachCell;
