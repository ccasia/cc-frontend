import PropTypes from 'prop-types';
import useSWR from 'swr';
import { useState, useMemo } from 'react';
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

import axiosInstance, { fetcher } from 'src/utils/axios';
import Iconify from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';
import EmptyContent from 'src/components/empty-content';

import LogisticsDrawer from './logistics-drawer';
import LogisticsTableRow from './logistics-table-row';
import ConfirmStatusChangeDialog from './dialogs/confirm-status-change-dialog';

const getTableHead = (isReservation) => [
  { id: 'name', label: 'Name', width: '20%', align: 'left' },
  {
    id: isReservation ? 'details' : 'product',
    label: isReservation ? 'Details' : 'Product Assigned',
    width: '55%',
    align: 'center',
  },
  { id: 'status', label: 'Status', width: '25%', align: 'left' },
];

const getStatusOption = (isReservation) =>
  [
    {
      value: 'PENDING_ASSIGNMENT' || 'NOT_STARTED',
      label: isReservation ? 'UNCONFIRMED' : 'UNASSIGNED',
      color: '#B0B0B0',
    },
    {
      value: 'SCHEDULED',
      label: isReservation ? 'SCHEDULED' : 'YET TO SHIP',
      color: isReservation ? '#1340FF' : '#FF9A02',
    },
    !isReservation && { value: 'SHIPPED', label: 'SHIPPED OUT', color: '#8A5AFE' },
    {
      value: isReservation ? 'COMPLETED' : 'DELIVERED',
      label: isReservation ? 'COMPLETED' : 'DELIVERED',
      color: '#1ABF66',
    },
    { value: 'ISSUE_REPORTED', label: isReservation ? 'ISSUE' : 'FAILED', color: '#D4321C' },
  ].filter(Boolean);

export default function LogisticsList({
  campaignId,
  isAdmin,
  logistics: propLogistics,
  isReservation,
  onClick,
}) {
  const { enqueueSnackbar } = useSnackbar();
  const {
    data: fetchedLogistics,
    isLoading,
    mutate,
  } = useSWR(campaignId ? `/api/logistics/campaign/${campaignId}` : null, fetcher);

  const logistics = propLogistics || fetchedLogistics;

  const STATUS_OPTIONS = getStatusOption(isReservation);
  const TABLE_HEAD = getTableHead(isReservation);

  const [statusAnchorEl, setStatusAnchorEl] = useState(null);
  const [statusTargetId, setStatusTargetId] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingNewStatus, setPendingNewStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const statusLogistic = useMemo(
    () => logistics?.find((item) => item.id === statusTargetId),
    [logistics, statusTargetId]
  );

  const handleClick = (logisticId) => {
    onClick(logisticId);
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
                    align={heading.align || 'left'}
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
                  isReservation={isReservation}
                  onClick={() => handleClick(row.id)}
                  onEditStatus={isAdmin ? (e) => handleEditStatus(e, row.id) : null}
                />
              ))}

              {notFound && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <EmptyContent
                      title="No logistic found"
                      // description="Click 'Edit & Bulk Assign' to get started."
                      imgUrl="/assets/icons/empty/ic_content.svg"
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

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
              STATUS_OPTIONS.filter((option) => option.value !== 'NOT_STARTED').map((option) => {
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
          isReservation={isReservation}
        />
      )}
    </>
  );
}

LogisticsList.propTypes = {
  campaignId: PropTypes.string,
  logistics: PropTypes.array,
  isAdmin: PropTypes.bool,
  isReservation: PropTypes.bool,
  onClick: PropTypes.func,
};
