import useSWR from 'swr';
import PropTypes from 'prop-types';

import { fetcher, endpoints } from 'src/utils/axios';

const Submissions = ({ campaign, submissions, creator }) => {
  const { data, isLoading } = useSWR(
    `${endpoints.campaign.submission.agreement}/?userId=${creator.user.id}&campaignId=${campaign.id}`,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      revalidateOnMount: true,
    }
  );

  //   const agreementSubmission = submissions.find(
  //     (item) => item.submissionType.type === 'AGREEMENT_FORM'
  //   );

  //   const firstDraftSubmission = submissions.find(
  //     (item) => item.submissionType.type === 'FIRST_DRAFT'
  //   );
  //   const finalDraftSubmission = submissions.find(
  //     (item) => item.submissionType.type === 'FINAL_DRAFT'
  //   );

  //   const posting = submissions.find((item) => item.submissionType.type === 'POSTING');

  return (
    <>
      {!isLoading && JSON.stringify(data)}
      {/* {agreementSubmission.submissionType.type === 'AGREEMENT_FORM' && (
        <Agreement
          agreementSubmission={agreementSubmission}
          campaign={campaign}
          creator={creator}
        />
      )} */}
      {/* {firstDraftSubmission.submissionType.type === 'FIRST_DRAFT' && <FirstDraft />} */}
      {/* {finalDraftSubmission.submissionType.type === 'FINAL_DRAFT' && <FinalDraft />} */}
      {/* {posting.submissionType.type === 'POSTING' && <Posting />} */}
    </>
  );
};

export default Submissions;

Submissions.propTypes = {
  campaign: PropTypes.object,
  submissions: PropTypes.array,
  creator: PropTypes.object,
};
