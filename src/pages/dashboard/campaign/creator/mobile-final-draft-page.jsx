import useSWR from 'swr';
import { useParams } from 'react-router-dom';

import { useGetDeliverables } from 'src/hooks/use-get-deliverables';

import { fetcher, endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import { LoadingScreen } from 'src/components/loading-screen';

import CampaignFinalDraftMobile from 'src/sections/campaign/manage-creator/mobile/campaign-final-draft-mobile';

const MobileFinalDraftPage = () => {
  const { id } = useParams();
  const { user } = useAuthContext();

  const { data: campaign, isLoading: campaignLoading } = useSWR(
    endpoints.campaign.creator.getCampaign(id),
    fetcher
  );

  const { data: submissions, isLoading: submissionLoading } = useSWR(
    user?.id ? `${endpoints.submission.root}?creatorId=${user?.id}&campaignId=${id}` : null,
    fetcher
  );

  const { data: deliverables, isLoading: deliverableLoading, mutate: deliverableMutate } = useGetDeliverables(
    user?.id, 
    id
  );

  if (campaignLoading || submissionLoading || deliverableLoading || !user?.id) {
    return <LoadingScreen />;
  }

  const timeline = campaign?.campaignTimeline?.find((elem) => elem?.name === 'Agreement');
  const submission = submissions?.find(
    (sub) => sub?.submissionType?.type === 'FINAL_DRAFT'
  );

  const getDependency = (submissionId) =>
    submissions
      ?.find((sub) => sub?.id === submissionId)
      ?.dependentOn?.find((dependency) => dependency);

  return (
    <CampaignFinalDraftMobile
      campaign={campaign}
      timeline={timeline}
      submission={submission}
      fullSubmission={submissions}
      getDependency={getDependency}
      deliverablesData={{ deliverables, deliverableMutate }}
    />
  );
};

export default MobileFinalDraftPage; 