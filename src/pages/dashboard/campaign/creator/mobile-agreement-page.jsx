import useSWR from 'swr';
import { useParams } from 'react-router-dom';

import { fetcher, endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import { LoadingScreen } from 'src/components/loading-screen';

import CampaignAgreementMobile from 'src/sections/campaign/manage-creator/mobile/campaign-agreement-mobile';

const MobileAgreementPage = () => {
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

  if (campaignLoading || submissionLoading) {
    return <LoadingScreen />;
  }

  const timeline = campaign?.campaignTimeline?.find((elem) => elem?.name === 'Agreement');
  const submission = submissions?.find(
    (sub) => sub?.submissionType?.type === 'AGREEMENT_FORM'
  );
  const agreementStatus = campaign?.agreement?.agreementUrl;

  return (
    <CampaignAgreementMobile
      campaign={campaign}
      timeline={timeline}
      submission={submission}
      agreementStatus={agreementStatus}
    />
  );
};

export default MobileAgreementPage; 