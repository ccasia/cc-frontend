import PropTypes from 'prop-types';

import CampaignLogDetailEmpty from './campaign-log-detail-empty';
import CampaignLogDetailContent from './campaign-log-detail-content';

// ---------------------------------------------------------------------------

export default function CampaignLogDetailPanel({ log, allLogs, campaign, photoMap, invoices, invoicesLoading }) {
  if (!log) return <CampaignLogDetailEmpty />;

  return (
    <CampaignLogDetailContent
      log={log}
      allLogs={allLogs}
      campaign={campaign}
      photoMap={photoMap}
      invoices={invoices}
      invoicesLoading={invoicesLoading}
    />
  );
}

CampaignLogDetailPanel.propTypes = {
  log: PropTypes.object,
  allLogs: PropTypes.array,
  campaign: PropTypes.object,
  photoMap: PropTypes.instanceOf(Map),
  invoices: PropTypes.array,
  invoicesLoading: PropTypes.bool,
};
