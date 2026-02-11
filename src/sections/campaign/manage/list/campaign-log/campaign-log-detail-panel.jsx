import PropTypes from 'prop-types';

import CampaignLogDetailEmpty from './campaign-log-detail-empty';
import CampaignLogDetailContent from './campaign-log-detail-content';

// ---------------------------------------------------------------------------

export default function CampaignLogDetailPanel({ log, campaign, photoMap, invoices, invoicesLoading }) {
  if (!log) return <CampaignLogDetailEmpty />;

  return (
    <CampaignLogDetailContent
      log={log}
      campaign={campaign}
      photoMap={photoMap}
      invoices={invoices}
      invoicesLoading={invoicesLoading}
    />
  );
}

CampaignLogDetailPanel.propTypes = {
  log: PropTypes.object,
  campaign: PropTypes.object,
  photoMap: PropTypes.instanceOf(Map),
  invoices: PropTypes.array,
  invoicesLoading: PropTypes.bool,
};
