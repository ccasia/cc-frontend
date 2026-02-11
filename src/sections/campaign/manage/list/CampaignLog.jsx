import PropTypes from 'prop-types';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';

import useGetInvoicesByCampId from 'src/hooks/use-get-invoices-by-campId';

import Iconify from 'src/components/iconify';

import CampaignLogTimeline from './campaign-log/campaign-log-timeline';
import CampaignLogEmptyState from './campaign-log/campaign-log-empty-state';
import CampaignLogDetailPanel from './campaign-log/campaign-log-detail-panel';
import { extractInvoiceInfo } from './campaign-log/campaign-log-detail-utils';
import {
  classifyLog,
  getTabCounts,
  getCategoryMeta,
  deduplicateLogs,
  filterLogsByTab,
  formatLogMessage,
  formatLogSummary,
  filterLogsBySearch,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [creatorFilter, setCreatorFilter] = useState('');
  const [adminFilter, setAdminFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLogId, setSelectedLogId] = useState(null);

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

  // Build unique creator list for the dropdown filter
  const creatorList = useMemo(() => {
    if (!campaign) return [];
    const names = new Set();
    campaign.shortlisted?.forEach((s) => {
      if (s.user?.name) names.add(s.user.name);
    });
    campaign.pitch?.forEach((p) => {
      if (p.user?.name) names.add(p.user.name);
    });
    return Array.from(names).sort();
  }, [campaign]);

  const classifiedLogs = useMemo(() => {
    if (!campaign?.campaignLogs) return [];

    const logs = [...campaign.campaignLogs]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((log) => {
        const { category, groups } = classifyLog(log.message);
        const performedBy = log.admin?.name || 'System';
        return {
          id: log.id,
          createdAt: log.createdAt,
          action: log.message,
          formattedAction: formatLogMessage(log.message, performedBy),
          formattedSummary: formatLogSummary(log.message, performedBy),
          performedBy,
          performerRole: log.admin?.role || '',
          category,
          groups,
        };
      });

    return deduplicateLogs(logs);
  }, [campaign?.campaignLogs]);

  // Apply all non-tab filters first (search, creator, admin, action)
  const baseFilteredLogs = useMemo(() => {
    let result = filterLogsBySearch(classifiedLogs, searchQuery, creatorFilter);
    if (actionFilter) {
      result = result.filter((log) => log.category === actionFilter);
    }
    if (adminFilter) {
      result = result.filter((log) => log.performedBy === adminFilter);
    }
    return result;
  }, [classifiedLogs, searchQuery, creatorFilter, actionFilter, adminFilter]);

  // Tab counts reflect active filters
  const tabCounts = useMemo(() => getTabCounts(baseFilteredLogs), [baseFilteredLogs]);

  // Build unique category list for the action filter dropdown
  const categoryList = useMemo(() => {
    const cats = new Set();
    classifiedLogs.forEach((log) => cats.add(log.category));
    return Array.from(cats).sort();
  }, [classifiedLogs]);

  // Build unique admin list for the admin filter dropdown
  const adminList = useMemo(() => {
    const admins = new Set();
    classifiedLogs.forEach((log) => {
      if (log.performedBy && log.performedBy !== 'System') admins.add(log.performedBy);
    });
    return Array.from(admins).sort();
  }, [classifiedLogs]);

  // Apply tab filter on top of base filtered logs
  const filteredLogs = useMemo(
    () => filterLogsByTab(baseFilteredLogs, currentTab),
    [baseFilteredLogs, currentTab]
  );

  const selectedLog = useMemo(
    () => filteredLogs.find((log) => log.id === selectedLogId) || null,
    [filteredLogs, selectedLogId]
  );

  // Fetch the specific invoice when an invoice log is selected
  const invoiceCategories = selectedLog?.category === 'Invoice' || selectedLog?.category === 'Amount Changed';
  const selectedInvoiceNumber = invoiceCategories ? extractInvoiceInfo(selectedLog?.action)?.invoiceNumber : null;
  const { campaigns: invoices, isLoading: invoicesLoading } = useGetInvoicesByCampId(
    open && invoiceCategories ? campaign?.id : null,
    selectedInvoiceNumber ? { search: selectedInvoiceNumber } : {}
  );

  const handleTabChange = useCallback((v) => {
    setCurrentTab(v);
    setSelectedLogId(null);
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
    setSelectedLogId(null);
  }, []);

  const handleCreatorFilterChange = useCallback((e) => {
    setCreatorFilter(e.target.value);
    setSelectedLogId(null);
  }, []);

  const handleActionFilterChange = useCallback((e) => {
    setActionFilter(e.target.value);
    setSelectedLogId(null);
  }, []);

  const handleAdminFilterChange = useCallback((e) => {
    setAdminFilter(e.target.value);
    setSelectedLogId(null);
  }, []);

  const campaignImage = campaign?.campaignBrief?.images?.[0] || '';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xl"
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

        {/* ---- Pill Tabs ---- */}
        <Box sx={{ display: 'flex', gap: 0.75, mb: 2 }}>
          {TABS.map((tab) => {
            const isActive = currentTab === tab.value;
            const count = tabCounts[tab.value];
            return (
              <Box
                key={tab.value}
                component="button"
                onClick={() => handleTabChange(tab.value)}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  border: '1px solid',
                  borderColor: isActive ? '#1340FF' : '#e7e7e7',
                  borderRadius: 100,
                  bgcolor: isActive ? '#EBF0FF' : 'transparent',
                  color: isActive ? '#1340FF' : '#636366',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.15s',
                  '&:hover': {
                    borderColor: isActive ? '#1340FF' : '#c7c7cc',
                    bgcolor: isActive ? '#EBF0FF' : '#F9FAFB',
                  },
                }}
              >
                {tab.label}
                <Box
                  component="span"
                  sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isActive ? '#1340FF' : '#8e8e93',
                  }}
                >
                  {count}
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* ---- Search & Filters ---- */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name or action..."
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" width={20} sx={{ color: '#8e8e93' }} />
                </InputAdornment>
              ),
              ...(searchQuery && {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => { setSearchQuery(''); setSelectedLogId(null); }} edge="end">
                      <Iconify icon="mingcute:close-line" width={18} />
                    </IconButton>
                  </InputAdornment>
                ),
              }),
            }}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                bgcolor: '#FFFFFF',
              },
            }}
          />

          {/* Action filter */}
          <TextField
            select
            size="small"
            value={actionFilter}
            onChange={handleActionFilterChange}
            sx={{
              minWidth: 180,
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                bgcolor: '#FFFFFF',
                ...(actionFilter && { '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1340FF' } }),
              },
            }}
            SelectProps={{
              displayEmpty: true,
              renderValue: (val) => {
                if (!val) return 'All Actions';
                const m = getCategoryMeta(val);
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Iconify icon={m.icon} width={16} sx={{ color: m.color, flexShrink: 0 }} />
                    <span>{val}</span>
                  </Box>
                );
              },
            }}
          >
            <MenuItem value="">All Actions</MenuItem>
            {categoryList.map((cat) => {
              const meta = getCategoryMeta(cat);
              return (
                <MenuItem key={cat} value={cat} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Iconify icon={meta.icon} width={18} sx={{ color: meta.color, flexShrink: 0 }} />
                  {cat}
                </MenuItem>
              );
            })}
          </TextField>

          {/* Admin filter */}
          <TextField
            select
            size="small"
            value={adminFilter}
            onChange={handleAdminFilterChange}
            sx={{
              minWidth: 170,
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                bgcolor: '#FFFFFF',
                ...(adminFilter && { '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1340FF' } }),
              },
            }}
            SelectProps={{
              displayEmpty: true,
              renderValue: (val) => {
                if (!val) return 'All Admins';
                const photo = photoMap.get(val);
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Avatar src={photo} alt={val} sx={{ width: 20, height: 20, fontSize: 10, fontWeight: 700 }}>
                      {val.charAt(0).toUpperCase()}
                    </Avatar>
                    <span>{val}</span>
                  </Box>
                );
              },
            }}
          >
            <MenuItem value="">All Admins</MenuItem>
            {adminList.map((name) => (
              <MenuItem key={name} value={name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar src={photoMap.get(name)} alt={name} sx={{ width: 22, height: 22, fontSize: 11, fontWeight: 700 }}>
                  {name.charAt(0).toUpperCase()}
                </Avatar>
                {name}
              </MenuItem>
            ))}
          </TextField>

          {/* Creator filter */}
          <TextField
            select
            size="small"
            value={creatorFilter}
            onChange={handleCreatorFilterChange}
            sx={{
              minWidth: 170,
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                bgcolor: '#FFFFFF',
                ...(creatorFilter && { '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1340FF' } }),
              },
            }}
            SelectProps={{
              displayEmpty: true,
              renderValue: (val) => {
                if (!val) return 'All Creators';
                const photo = photoMap.get(val);
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Avatar src={photo} alt={val} sx={{ width: 20, height: 20, fontSize: 10, fontWeight: 700 }}>
                      {val.charAt(0).toUpperCase()}
                    </Avatar>
                    <span>{val}</span>
                  </Box>
                );
              },
            }}
          >
            <MenuItem value="">All Creators</MenuItem>
            {creatorList.map((name) => (
              <MenuItem key={name} value={name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar src={photoMap.get(name)} alt={name} sx={{ width: 22, height: 22, fontSize: 11, fontWeight: 700 }}>
                  {name.charAt(0).toUpperCase()}
                </Avatar>
                {name}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>

      {/* ---- Content: 70/30 split ---- */}
      <DialogContent sx={{ p: 0, height: '70vh', display: 'flex' }}>
        {/* Left panel — 70% */}
        <Box sx={{ width: '70%', height: '100%', borderRight: '1px solid #E7E7E7' }}>
          {filteredLogs.length > 0 ? (
            <CampaignLogTimeline
              logs={filteredLogs}
              photoMap={photoMap}
              selectedLogId={selectedLogId}
              onSelectLog={setSelectedLogId}
            />
          ) : (
            <CampaignLogEmptyState tab={currentTab} query={searchQuery || creatorFilter || actionFilter} />
          )}
        </Box>

        {/* Right panel — 30% */}
        <Box sx={{ width: '30%', height: '100%', overflow: 'auto' }}>
          <CampaignLogDetailPanel
            log={selectedLog}
            allLogs={classifiedLogs}
            campaign={campaign}
            photoMap={photoMap}
            invoices={invoices}
            invoicesLoading={invoicesLoading}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

CampaignLog.propTypes = {
  open: PropTypes.bool,
  campaign: PropTypes.object,
  onClose: PropTypes.func,
};
