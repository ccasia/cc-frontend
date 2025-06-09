import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import PropTypes from 'prop-types';
import { saveAs } from 'file-saver';

import {
  Box,
  Chip,
  Table,
  Stack,
  Button,
  Dialog,
  styled,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
  Typography,
  IconButton,
  TableContainer,
} from '@mui/material';

import Iconify from 'src/components/iconify';

// Styled components for improved UI
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '1px solid #f0f0f0',
  overflow: 'hidden',
  margin: 0,
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  backgroundColor: '#fafafa',
  '& .MuiTableCell-head': {
    color: '#666666',
    fontWeight: 600,
    fontSize: '0.8rem',
    textTransform: 'none',
    borderBottom: '1px solid #f0f0f0',
    padding: '12px 16px',
    height: '44px',
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: '#fafafa',
  },
  '& .MuiTableCell-root': {
    borderBottom: '1px solid #f5f5f5',
    padding: '12px 16px',
    fontSize: '0.875rem',
  },
  '&:last-child .MuiTableCell-root': {
    borderBottom: 'none',
  },
}));

export const AdminLogsModal = ({ open, logs, onClose, adminName }) => {
  const handleDownloadExcel = async () => {
    if (!logs || logs.length === 0) {
      alert('No logs available to export.');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Admin Logs');

    // Define header row
    worksheet.columns = [
      { header: 'Date Performed', key: 'createdAt', width: 20 },
      { header: 'Action', key: 'message', width: 40 },
      { header: 'Performed By', key: 'performedBy', width: 25 },
    ];

    // Add rows to the worksheet
    logs.forEach((log) => {
      worksheet.addRow({
        createdAt: dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        message: log.message,
        performedBy: log.performedBy || 'Unknown',
      });
    });

    // Style headers
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const fileName = `${adminName ? adminName.replace(/\s+/g, '_') : 'Admin'}_Logs_${dayjs().format('DD-MMM-YYYY')}.xlsx`;

    // Generate and download the Excel file
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
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          border: '1px solid #f0f0f0',
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 600, 
                  color: '#111827',
                  fontSize: '1.25rem',
                  mb: 0.5,
                }}
              >
                Activity Logs
              </Typography>
              {adminName && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#6b7280', 
                    fontSize: '0.875rem',
                  }}
                >
                  Viewing logs for {adminName}
                </Typography>
              )}
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                onClick={handleDownloadExcel}
                disabled={!logs || logs.length === 0}
                startIcon={<Iconify icon="heroicons:arrow-down-tray-20-solid" width={16} height={16} />}
                sx={{
                  bgcolor: '#1340ff',
                  color: '#ffffff',
                  borderRadius: 1,
                  px: 2,
                  py: 1,
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    bgcolor: '#0f35d1',
                  },
                  '&:disabled': {
                    bgcolor: '#e5e7eb',
                    color: '#9ca3af',
                  },
                }}
              >
                Export
              </Button>
              <IconButton
                onClick={onClose}
                sx={{
                  color: '#6b7280',
                  '&:hover': {
                    bgcolor: '#f3f4f6',
                    color: '#374151',
                  },
                }}
              >
                <Iconify icon="heroicons:x-mark-20-solid" width={20} height={20} />
              </IconButton>
            </Stack>
          </Stack>
        </Box>

        {/* Logs Count */}
        {logs && logs.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Chip
              label={`${logs.length} ${logs.length === 1 ? 'log entry' : 'log entries'}`}
              sx={{
                bgcolor: '#f0f9ff',
                color: '#1340ff',
                fontWeight: 600,
                fontSize: '0.75rem',
                height: '24px',
              }}
            />
          </Box>
        )}

        {/* Table */}
        <StyledTableContainer>
          <Table>
            <StyledTableHead>
              <TableRow>
                <TableCell sx={{ width: '180px' }}>Date & Time</TableCell>
                <TableCell>Activity</TableCell>
              </TableRow>
            </StyledTableHead>
            <TableBody>
              {logs?.length > 0 ? (
                logs.map((log) => (
                  <StyledTableRow key={log.id}>
                    <TableCell>
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            color: '#111827',
                            fontSize: '0.875rem',
                            lineHeight: 1.3,
                            mb: 0.25,
                          }}
                        >
                          {dayjs(log.createdAt).format('MMM DD, YYYY')}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#6b7280',
                            fontSize: '0.75rem',
                            lineHeight: 1.2,
                          }}
                        >
                          {dayjs(log.createdAt).format('h:mm A')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#374151',
                          fontSize: '0.875rem',
                          lineHeight: 1.4,
                        }}
                      >
                        {log.message}
                      </Typography>
                      {log.performedBy && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#6b7280',
                            fontSize: '0.75rem',
                            display: 'block',
                            mt: 0.5,
                          }}
                        >
                          Performed by: {log.performedBy}
                        </Typography>
                      )}
                    </TableCell>
                  </StyledTableRow>
                ))
              ) : (
                <StyledTableRow>
                  <TableCell colSpan={2} align="center" sx={{ py: 6 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Iconify 
                        icon="heroicons:document-text-20-solid" 
                        width={48} 
                        height={48} 
                        sx={{ color: '#d1d5db', mb: 2 }}
                      />
                      <Typography
                        variant="body1"
                        sx={{
                          color: '#6b7280',
                          fontWeight: 500,
                          mb: 0.5,
                        }}
                      >
                        No activity logs found
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#9ca3af',
                          fontSize: '0.875rem',
                        }}
                      >
                        This admin hasn&apos;t performed any logged activities yet.
                      </Typography>
                    </Box>
                  </TableCell>
                </StyledTableRow>
              )}
            </TableBody>
          </Table>
        </StyledTableContainer>
      </Box>
    </Dialog>
  );
};

AdminLogsModal.propTypes = {
  open: PropTypes.bool,
  logs: PropTypes.array,
  onClose: PropTypes.func,
  adminName: PropTypes.string,
};
