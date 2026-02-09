import PropTypes from 'prop-types';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogContent from '@mui/material/DialogContent';

import Iconify from 'src/components/iconify';

import CampaignLogTimeline from './campaign-log/campaign-log-timeline';
import CampaignLogEmptyState from './campaign-log/campaign-log-empty-state';
import {
  classifyLog,
  getTabCounts,
  filterLogsByTab,
  formatLogMessage,
} from './campaign-log/campaign-log-utils';

// ---------------------------------------------------------------------------

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'admin', label: 'Admin' },
  { value: 'creator', label: 'Creator' },
  { value: 'client', label: 'Client' },
  { value: 'invoice', label: 'Invoice' },
];

// ---------------------------------------------------------------------------

export const CampaignLog = ({ open, campaign, onClose }) => {
  const [currentTab, setCurrentTab] = useState('all');

  // Build a name → photoURL lookup from all people in the campaign
  const photoMap = useMemo(() => {
    const map = new Map();
    if (!campaign) return map;

    // From shortlisted creators
    campaign.shortlisted?.forEach((s) => {
      if (s.user?.name && s.user?.photoURL) map.set(s.user.name, s.user.photoURL);
    });
    // From pitches (fills gaps for creators not yet shortlisted)
    campaign.pitch?.forEach((p) => {
      if (p.user?.name && p.user?.photoURL && !map.has(p.user.name))
        map.set(p.user.name, p.user.photoURL);
    });
    // From campaign log admins
    campaign.campaignLogs?.forEach((log) => {
      if (log.admin?.name && log.admin?.photoURL && !map.has(log.admin.name))
        map.set(log.admin.name, log.admin.photoURL);
    });

    return map;
  }, [campaign]);

  const classifiedLogs = useMemo(() => {
    if (!campaign?.campaignLogs) return [];

    return [...campaign.campaignLogs]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((log) => {
        const { category, groups } = classifyLog(log.message);
        const performedBy = log.admin?.name || 'System';
        return {
          id: log.id,
          createdAt: log.createdAt,
          action: log.message,
          formattedAction: formatLogMessage(log.message, performedBy),
          performedBy,
          performerRole: log.admin?.role || '',
          category,
          groups,
        };
      });
  }, [campaign?.campaignLogs]);

  const tabCounts = useMemo(() => getTabCounts(classifiedLogs), [classifiedLogs]);

  const filteredLogs = useMemo(
    () => filterLogsByTab(classifiedLogs, currentTab),
    [classifiedLogs, currentTab]
  );

  const handleTabChange = useCallback((_, v) => setCurrentTab(v), []);

  const campaignImage = campaign?.campaignBrief?.images?.[0] || '';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          bgcolor: '#F4F4F4',
          borderRadius: 2,
          overflow: 'hidden',
        },
      }}
    >
      {/* ---- Header ---- */}
      <Box sx={{ px: 3, pt: 3, pb: 0, position: 'relative' }}>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 12, top: 12, color: '#636366' }}
        >
          <Iconify icon="eva:close-fill" width={22} />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
          {campaignImage ? (
            <Box
              component="img"
              src={campaignImage}
              alt={campaign?.name || 'Campaign'}
              sx={{
                width: 56,
                height: 56,
                borderRadius: 1.5,
                objectFit: 'cover',
                flexShrink: 0,
              }}
            />
          ) : (
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: '#e7e7e7',
                color: '#636366',
                fontWeight: 700,
                fontSize: 22,
                borderRadius: 1.5,
              }}
              variant="rounded"
            >
              {campaign?.name ? campaign.name.charAt(0).toUpperCase() : 'C'}
            </Avatar>
          )}

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontFamily: 'fontSecondaryFamily',
                fontSize: 40,
                fontWeight: 400,
                lineHeight: 1.1,
                color: '#221F20',
              }}
            >
              Activity Log
            </Typography>
            {campaign?.name && (
              <Typography variant="body1" sx={{ color: '#636366', mt: 0.25 }} noWrap>
                {campaign.name}
              </Typography>
            )}
          </Box>
        </Box>

        {/* ---- Tabs ---- */}
        <Tabs value={currentTab} onChange={handleTabChange} sx={{ minHeight: 40 }}>
          {TABS.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={`${tab.label} (${tabCounts[tab.value]})`}
            />
          ))}
        </Tabs>
      </Box>

      {/* ---- Content ---- */}
      <DialogContent sx={{ p: 0, height: '60vh' }}>
        {filteredLogs.length > 0 ? (
          <CampaignLogTimeline logs={filteredLogs} photoMap={photoMap} />
        ) : (
          <CampaignLogEmptyState tab={currentTab} />
        )}
      </DialogContent>
    </Dialog>
  );
};

CampaignLog.propTypes = {
  open: PropTypes.bool,
  campaign: PropTypes.object,
  onClose: PropTypes.func,
};
