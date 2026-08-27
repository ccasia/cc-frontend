import PropTypes from 'prop-types';

import CampaignLogDetailEmpty from 'src/sections/campaign/manage/list/campaign-log/campaign-log-detail-empty';

import AdminLogDetailContent from './admin-log-detail-content';

// ---------------------------------------------------------------------------

export default function AdminLogDetailPanel({ log, photoMap }) {
  if (!log) return <CampaignLogDetailEmpty />;

  return <AdminLogDetailContent log={log} photoMap={photoMap} />;
}

AdminLogDetailPanel.propTypes = {
  log: PropTypes.object,
  photoMap: PropTypes.instanceOf(Map),
};
