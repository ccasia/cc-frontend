import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import PropTypes from 'prop-types';
import { saveAs } from 'file-saver';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';

import Iconify from 'src/components/iconify';

import CampaignLogTimeline from 'src/sections/campaign/manage/list/campaign-log/campaign-log-timeline';
import CampaignLogEmptyState from 'src/sections/campaign/manage/list/campaign-log/campaign-log-empty-state';
import { getCategoryMeta, filterLogsBySearch } from 'src/sections/campaign/manage/list/campaign-log/campaign-log-utils';

import AdminLogDetailPanel from './admin-log/admin-log-detail-panel';
import { classifyAdminLog, formatAdminLogMessage } from './admin-log/admin-log-utils';

export const AdminLogsModal = ({ open, logs, onClose, adminName, adminPhotoURL }) => {
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Classify + format raw admin logs into the campaign-log entry shape
  const classifiedLogs = useMemo(() => {
    if (!logs?.length) return [];
    return [...logs]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((log) => {
        const { category, groups } = classifyAdminLog(log.message);
        const formatted = formatAdminLogMessage(log.message);
        return {
          id: log.id,
          createdAt: log.createdAt,
          action: log.message,
          formattedAction: formatted,
          formattedSummary: formatted,
          performedBy: log.performedBy || adminName || 'System',
          performerRole: 'admin',
          category,
          groups,
        };
      });
  }, [logs, adminName]);

  // Avatar lookup. Every entry's performer is the same admin; referenced users
  // (e.g. impersonation targets) come from `refUser`, resolved server-side from
  // the email embedded in the message.
  const photoMap = useMemo(() => {
    const map = new Map();
    if (adminName) map.set(adminName, adminPhotoURL);
    classifiedLogs.forEach((log) => {
      if (log.performedBy) map.set(log.performedBy, adminPhotoURL);
    });
    logs?.forEach((log) => {
      const ref = log.refUser;
      if (ref?.photoURL) {
        if (ref.name) map.set(ref.name, ref.photoURL);
        const quoted = log.message?.match(/"([^"]+)"/)?.[1];
        if (quoted) map.set(quoted, ref.photoURL);
      }
    });
    return map;
  }, [classifiedLogs, logs, adminName, adminPhotoURL]);

  const categoryList = useMemo(() => {
    const cats = new Set();
    classifiedLogs.forEach((log) => cats.add(log.category));
    return Array.from(cats).sort();
  }, [classifiedLogs]);

  const filteredLogs = useMemo(() => {
    let result = filterLogsBySearch(classifiedLogs, searchQuery);
    if (categoryFilter) {
      result = result.filter((log) => log.category === categoryFilter);
    }
    return result;
  }, [classifiedLogs, searchQuery, categoryFilter]);

  const selectedLog = useMemo(
    () => filteredLogs.find((log) => log.id === selectedLogId) || null,
    [filteredLogs, selectedLogId]
  );

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
    setSelectedLogId(null);
  }, []);

  const handleCategoryFilterChange = useCallback((e) => {
    setCategoryFilter(e.target.value);
    setSelectedLogId(null);
  }, []);

  const handleDownloadExcel = async () => {
    if (!logs || logs.length === 0) {
      alert('No logs available to export.');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Admin Logs');

    worksheet.columns = [
      { header: 'Date Performed', key: 'createdAt', width: 20 },
      { header: 'Action', key: 'message', width: 40 },
      { header: 'Performed By', key: 'performedBy', width: 25 },
    ];

    logs.forEach((log) => {
      worksheet.addRow({
        createdAt: dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        message: log.message,
        performedBy: log.performedBy || 'Unknown',
      });
    });

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const fileName = `${adminName ? adminName.replace(/\s+/g, '_') : 'Admin'}_Logs_${dayjs().format('DD-MMM-YYYY')}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, fileName);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xl"
      PaperProps={{ sx: { bgcolor: '#F4F4F4', borderRadius: 2, overflow: 'hidden' } }}
    >
      {/* ---- Header ---- */}
      <Box sx={{ px: 3, pt: 3, pb: 0, position: 'relative' }}>
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12, color: '#636366' }}>
          <Iconify icon="eva:close-fill" width={22} />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
          <Avatar
            src={adminPhotoURL}
            alt={adminName}
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
            {adminName ? adminName.charAt(0).toUpperCase() : 'A'}
          </Avatar>

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
              Activity Logs
            </Typography>
            {adminName && (
              <Typography variant="body1" sx={{ color: '#636366', mt: 0.25 }} noWrap>
                {adminName}
              </Typography>
            )}
          </Box>

          <Tooltip title="Download Logs" placement="top" arrow>
            <Button onClick={handleDownloadExcel} color="primary" sx={{ flexShrink: 0, mr: 4 }}>
              <Iconify icon="mdi:microsoft-excel" width={22} style={{ marginRight: 4 }} />
              Export Logs
            </Button>
          </Tooltip>
        </Box>

        {/* ---- Search & Filter ---- */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by action or category..."
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
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedLogId(null);
                      }}
                      edge="end"
                    >
                      <Iconify icon="mingcute:close-line" width={18} />
                    </IconButton>
                  </InputAdornment>
                ),
              }),
            }}
            sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#FFFFFF' } }}
          />

          <TextField
            select
            size="small"
            value={categoryFilter}
            onChange={handleCategoryFilterChange}
            sx={{
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                bgcolor: '#FFFFFF',
                ...(categoryFilter && { '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1340FF' } }),
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
            <CampaignLogEmptyState tab="admin" query={searchQuery || categoryFilter} />
          )}
        </Box>

        {/* Right panel — 30% */}
        <Box sx={{ width: '30%', height: '100%', overflow: 'auto' }}>
          <AdminLogDetailPanel log={selectedLog} photoMap={photoMap} />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

AdminLogsModal.propTypes = {
  open: PropTypes.bool,
  logs: PropTypes.array,
  onClose: PropTypes.func,
  adminName: PropTypes.string,
  adminPhotoURL: PropTypes.string,
};
