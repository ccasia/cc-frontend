/* eslint-disable react/prop-types */
import dayjs from 'dayjs';

import AgreementTemplate from './agreement';

// Example creator agreement with placeholder creator details, for previews only.
export default function AgreementPreview({ isNdaRequired, isSeedingCampaign, isForSurfShark }) {
  // Explicit format: 'LL' needs the dayjs localizedFormat plugin to be loaded first.
  const today = dayjs().format('MMMM D, YYYY');

  return (
    <AgreementTemplate
      DATE={today}
      NOW_DATE={today}
      AGREEMENT_ENDDATE={dayjs().add(1, 'month').format('MMMM D, YYYY')}
      FREELANCER_FULL_NAME="FREELANCER FULL NAME"
      CREATOR_NAME="FREELANCER FULL NAME"
      IC_NUMBER="XXXXXX-XX-XXXX"
      creatorPayment="RM200"
      VERSION_NUMBER="PREVIEW"
      isNdaRequired={!!isNdaRequired}
      isSeedingCampaign={!!isSeedingCampaign}
      isForSurfShark={!!isForSurfShark}
    />
  );
}
