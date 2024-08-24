import { useState } from 'react';
import PropTypes from 'prop-types';

import { ToggleButton, ToggleButtonGroup } from '@mui/material';

import Agreement from './agreement';
import FirstDraft from './firstDraft';
import FinalDraft from './finalDraft';

const Submissions = ({ campaign, submissions, creator }) => {
  const [currentTab, setCurrentTab] = useState('agreement');

  const agreementSubmission = submissions?.find(
    (item) => item.submissionType.type === 'AGREEMENT_FORM'
  );

  const firstDraftSubmission = submissions?.find(
    (item) => item.submissionType.type === 'FIRST_DRAFT'
  );

  const finalDraftSubmission = submissions?.find(
    (item) => item.submissionType.type === 'FINAL_DRAFT'
  );

  //   const finalDraftSubmission = submissions.find(
  //     (item) => item.submissionType.type === 'FINAL_DRAFT'
  //   );

  //   const posting = submissions.find((item) => item.submissionType.type === 'POSTING');

  const renderTabs = (
    <ToggleButtonGroup
      value={currentTab}
      onChange={(e, val) => setCurrentTab(val)}
      exclusive
      fullWidth
      color="primary"
      sx={{ mb: 2, overflow: 'auto' }}
      size="small"
    >
      <ToggleButton value="agreement">Agreement Submission</ToggleButton>
      <ToggleButton value="firstDraft">First Draft Submission</ToggleButton>
      <ToggleButton value="finalDraft">Final Draft Submission</ToggleButton>
      <ToggleButton value="posting">Posting</ToggleButton>
    </ToggleButtonGroup>
  );

  return (
    <>
      {renderTabs}
      {currentTab === 'agreement' && agreementSubmission && (
        <Agreement submission={agreementSubmission} campaign={campaign} creator={creator} />
      )}
      {currentTab === 'firstDraft' && firstDraftSubmission && (
        <FirstDraft submission={firstDraftSubmission} campaign={campaign} creator={creator} />
      )}
      {currentTab === 'finalDraft' && firstDraftSubmission && (
        <FinalDraft submission={finalDraftSubmission} campaign={campaign} creator={creator} />
      )}
    </>
  );
};

export default Submissions;

Submissions.propTypes = {
  campaign: PropTypes.object,
  submissions: PropTypes.array,
  creator: PropTypes.object,
};
