import PropTypes from 'prop-types';
import useSWR from 'swr';
import { useState, useMemo } from 'react';
import axiosInstance from 'src/utils/axios';
import { useSnackbar } from 'src/components/snackbar';

import {
  Box,
  Card,
  Stack,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  Popover,
  MenuItem,
  Typography,
  CircularProgress,
} from '@mui/material';

import { fetcher } from 'src/utils/axios';
import Iconify from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';
import EmptyContent from 'src/components/empty-content';

import { LogisticsDrawer, LogisticsAdminDrawer } from './logistics-drawer';
import LogisticsTableRow from './logistics-table-row';
import ConfirmStatusChangeDialog from './dialogs/confirm-status-change-dialog';

const TABLE_HEAD = [
  { id: 'name', label: 'Name', width: '40%' },
  { id: 'product', label: 'Product Assigned', width: '40%' },
  { id: 'status', label: 'Status', width: '20%' },
];

const STATUS_OPTIONS = [
  { value: 'PENDING_ASSIGNMENT', label: 'UNASSIGNED', color: '#B0B0B0' },
  { value: 'SCHEDULED', label: 'YET TO SHIP', color: '#FF9A02' },
  { value: 'SHIPPED', label: 'SHIPPED OUT', color: '#8A5AFE' },
  { value: 'DELIVERED', label: 'DELIVERED', color: '#1ABF66' },
  { value: 'ISSUE_REPORTED', label: 'FAILED', color: '#D4321C' },
];

export default function LogisticsList({ campaignId, isAdmin }) {
  const { enqueueSnackbar } = useSnackbar();
  const {
    data: logistics,
    isLoading,
    mutate,
  } = useSWR(campaignId ? `/api/logistics/campaign/${campaignId}` : null, fetcher);

  const [selectedLogisticId, setSelectedLogisticId] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [statusAnchorEl, setStatusAnchorEl] = useState(null);
  const [statusTargetId, setStatusTargetId] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingNewStatus, setPendingNewStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const selectedLogistic = useMemo(
    () => logistics?.find((item) => item.id === selectedLogisticId),
    [logistics, selectedLogisticId]
  );

  const statusLogistic = useMemo(
    () => logistics?.find((item) => item.id === statusTargetId),
    [logistics, statusTargetId]
  );

  const handleClick = (logisticId) => {
    setSelectedLogisticId(logisticId);
    setOpenDrawer(true);
  };

  const handleCloseDrawer = () => {
    setOpenDrawer(false);
  };

  const handleEditStatus = (e, id) => {
    e.stopPropagation();
    setStatusTargetId(id);
    setStatusAnchorEl(e.currentTarget);
  };

  const handleClosePopover = () => {
    setStatusAnchorEl(null);
  };

  const handleStatusSelect = async (newStatus) => {
    if (!statusLogistic) return;

    handleClosePopover();

    if (statusLogistic.status === newStatus) {
      setStatusTargetId(null);
      return;
    }

    setPendingNewStatus(newStatus);
    setConfirmDialogOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!statusLogistic || !pendingNewStatus) return;

    setStatusLoading(true);
    try {
      await axiosInstance.patch(`/api/logistics/admin/${statusLogistic.id}/status`, {
        status: pendingNewStatus,
      });
      enqueueSnackbar('Status updated successfully');
      mutate();
      setConfirmDialogOpen(false);
      setPendingNewStatus(null);
      setStatusTargetId(null);
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Failed to update status', { variant: 'error' });
    } finally {
      setStatusLoading(false);
    }
  };

  const handleCancelStatusChange = () => {
    setConfirmDialogOpen(false);
    setPendingNewStatus(null);
    setStatusTargetId(null);
  };

  if (isLoading) return <LoadingScreen />;

  const notFound = !logistics || logistics.length === 0;

  return (
    <>
      <Card>
        <TableContainer sx={{ position: 'relative' }}>
          <Table>
            <TableHead>
              <TableRow>
                {TABLE_HEAD.map((heading) => (
                  <TableCell
                    key={heading.id}
                    sx={{ width: heading.width, py: 1, height: 40, color: '#231F20' }}
                  >
                    {heading.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {logistics?.map((row) => (
                <LogisticsTableRow
                  key={row.id}
                  row={row}
                  onClick={() => handleClick(row.id)}
                  onEditStatus={isAdmin ? (e) => handleEditStatus(e, row.id) : null}
                />
              ))}

              {notFound && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <EmptyContent
                      title="No deliveries scheduled"
                      description="Click 'Edit & Bulk Assign' to get started."
                      imgUrl="/assets/icons/empty/ic_content.svg"
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {isAdmin ? (
        <LogisticsAdminDrawer
          open={openDrawer}
          onClose={handleCloseDrawer}
          logistic={selectedLogistic}
          onUpdate={mutate}
          campaignId={campaignId}
        />
      ) : (
        <LogisticsDrawer
          open={openDrawer}
          onClose={handleCloseDrawer}
          logistic={selectedLogistic}
          onUpdate={mutate}
          campaignId={campaignId}
        />
      )}
      {isAdmin && (
        <Popover
          open={Boolean(statusAnchorEl)}
          anchorEl={statusAnchorEl}
          onClose={() => {
            handleClosePopover();
            setStatusTargetId(null);
          }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          PaperProps={{
            sx: {
              p: 1,
              mt: 1,
              width: 'fit-content',
              '& .MuiMenuItem-root': {
                px: 1,
                typography: 'body2',
                borderRadius: 0.75,
                width: 'fit-content',
              },
            },
          }}
        >
          <Stack>
            {statusLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              STATUS_OPTIONS.map((option) => {
                const isSelected = statusLogistic?.status === option.value;

                return (
                  <MenuItem
                    key={option.value}
                    onClick={() => handleStatusSelect(option.value)}
                    sx={{
                      backgroundColor: 'transparent',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 'fit-content',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: { xs: '4px 8px', sm: '6px 10px' },
                        borderRadius: '6px',
                        border: `1px solid ${option.color}`,
                        color: option.color,
                        boxShadow: `0px -2px 0px 0px ${option.color} inset`,
                        fontSize: { xs: 8, sm: 10, md: 12 },
                        fontWeight: 600,
                        typography: 'subtitle2',
                        textTransform: 'uppercase',
                        position: 'relative',
                        bgcolor: isSelected ? `${option.color}14` : 'transparent',
                        '&:hover': {
                          backgroundColor: '#F8F9FA',
                          border: `1px solid ${option.color}`,
                          boxShadow: `0px -2px 0px 0px ${option.color} inset`,
                        },
                        '&:active': {
                          boxShadow: `0px -1px 0px 0px ${option.color} inset`,
                          transform: 'translateY(1px)',
                        },
                      }}
                    >
                      {option.label}
                      {isSelected && (
                        <Iconify icon="eva:checkmark-fill" width={14} sx={{ ml: 0.5 }} />
                      )}
                    </Box>
                  </MenuItem>
                );
              })
            )}
          </Stack>
        </Popover>
      )}

      {isAdmin && statusLogistic && (
        <ConfirmStatusChangeDialog
          open={confirmDialogOpen}
          onClose={handleCancelStatusChange}
          onConfirm={handleConfirmStatusChange}
          oldStatus={statusLogistic.status}
          newStatus={pendingNewStatus}
          loading={statusLoading}
        />
      )}
    </>
  );
}

LogisticsList.propTypes = {
  campaignId: PropTypes.string,
  isAdmin: PropTypes.bool,
};
