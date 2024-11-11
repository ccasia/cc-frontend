import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';

import { ToggleButton, ToggleButtonGroup } from '@mui/material';

import EmptyContent from 'src/components/empty-content/empty-content';

import Agreement from './agreement';
import FirstDraft from './firstDraft';
import FinalDraft from './finalDraft';
import Posting from './posting/posting';

const Submissions = ({ campaign, submissions, creator }) => {
  const [currentTab, setCurrentTab] = useState('agreement');

  const agreementSubmission = useMemo(
    () => submissions?.find((item) => item.submissionType.type === 'AGREEMENT_FORM'),
    [submissions]
  );

  const firstDraftSubmission = useMemo(
    () => submissions?.find((item) => item.submissionType.type === 'FIRST_DRAFT'),
    [submissions]
  );

  const finalDraftSubmission = useMemo(
    () => submissions?.find((item) => item.submissionType.type === 'FINAL_DRAFT'),
    [submissions]
  );

  const postingSubmission = useMemo(
    () => submissions?.find((item) => item.submissionType.type === 'POSTING'),
    [submissions]
  );

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
      <ToggleButton value="firstDraft">Draft Submission</ToggleButton>
      {firstDraftSubmission?.status === 'CHANGES_REQUIRED' && (
        <ToggleButton value="finalDraft">Final Draft Submission</ToggleButton>
      )}
      <ToggleButton value="posting">Posting</ToggleButton>
    </ToggleButtonGroup>
  );

  return (
    <>
      {renderTabs}
      {!currentTab && <EmptyContent title="Click tab above to see content." />}
      {currentTab === 'agreement' && agreementSubmission && (
        <Agreement submission={agreementSubmission} campaign={campaign} creator={creator} />
      )}
      {currentTab === 'firstDraft' && firstDraftSubmission && (
        <FirstDraft submission={firstDraftSubmission} campaign={campaign} creator={creator} />
      )}
      {currentTab === 'finalDraft' && firstDraftSubmission && (
        <FinalDraft submission={finalDraftSubmission} campaign={campaign} creator={creator} />
      )}
      {currentTab === 'posting' && postingSubmission && (
        <Posting submission={postingSubmission} campaign={campaign} creator={creator} />
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
