import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import {
  Table,
  Button,
  Box,
  Dialog,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
  DialogTitle,
  DialogActions,
  TableContainer,
  IconButton
} from '@mui/material';
import Tooltip from '@mui/material/Tooltip';

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Icon } from '@iconify/react';

export const AdminLogsModal = ({ open, logs, onClose, adminName }) => {

    console.log("admin lofgs", adminName)
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
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, fileName);
      };

      
    return(
        <Dialog
        open={open}
        aria-labelledby="admin-logs-title"
        fullWidth
        maxWidth="md"
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" padding="16px">
        <DialogTitle id="admin-logs-title" sx={{ margin: 0, paddingLeft: 5, paddingRight: 5 }}>
          Activity Logs
        </DialogTitle>
        
        <Tooltip title="Download Logs" placement="top" arrow>
        <Button onClick={handleDownloadExcel} color="primary" >
         
          <Icon icon="mdi:microsoft-excel" width={24} style={{ marginRight: 4 }} />
          Export Logs
        </Button>
        </Tooltip>
       
      </Box>
    
        <TableContainer  sx={{ margin: 0, paddingLeft: 5, paddingRight: 5 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date Performed</TableCell>
                <TableCell align="center" >Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs?.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{dayjs(log.createdAt).format('ddd LL')}</TableCell>
                    <TableCell>{log.message}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    No logs available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
    
        <DialogActions>
        <Button onClick={onClose}>Close</Button>

      </DialogActions>
      </Dialog>
    );
}


AdminLogsModal.propTypes = {
  open: PropTypes.bool,
  logs: PropTypes.array,
  onClose: PropTypes.func,
  adminName: PropTypes.string,
};
