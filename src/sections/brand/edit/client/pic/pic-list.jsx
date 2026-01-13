import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import React, { useState, useEffect } from 'react';

import EditIcon from '@mui/icons-material/Edit';
import {
  Chip,
  Table,
  Stack,
  Dialog,
  Button,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import axiosInstance from 'src/utils/axios';

import Scrollbar from 'src/components/scrollbar';
import { useTable, emptyRows, TableNoData, TableEmptyRows } from 'src/components/table';

const TABLE_HEAD = [
  { id: 'name', label: 'Name', width: 200 },
  { id: 'email', label: 'Email', width: 200 },
  { id: 'designation', label: 'Designation', width: 150 },
  { id: 'status', label: 'Status', width: 100 },
  { id: 'actions', label: 'Actions', width: 100, textAlign: 'center' },
];

const PICList = ({ personIncharge, companyId, onUpdate }) => {
  const table = useTable();
  const [editDialog, setEditDialog] = useState(false);
  const [selectedPIC, setSelectedPIC] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    designation: '',
  });
  const [picUsers, setPicUsers] = useState({});

  const denseHeight = table.dense ? 56 : 56 + 20;
  const notFound = !personIncharge?.length;

  // Fetch user data for each PIC to get their status
  useEffect(() => {
    const fetchPICUsers = async () => {
      if (!personIncharge?.length) return;

      const userDataPromises = personIncharge.map(async (pic) => {
        try {
          // Find user by email since PIC email should match User email
          const response = await axiosInstance.get(`/api/user/by-email/${pic.email}`);
          return { picId: pic.id, userData: response.data };
        } catch (error) {
          console.error(`Error fetching user for PIC ${pic.id}:`, error);
          return { picId: pic.id, userData: null };
        }
      });

      const results = await Promise.all(userDataPromises);
      const usersMap = {};
      results.forEach(({ picId, userData }) => {
        usersMap[picId] = userData;
      });
      setPicUsers(usersMap);
    };

    fetchPICUsers();
  }, [personIncharge]);

  const handleEditClick = (pic) => {
    setSelectedPIC(pic);
    setFormData({
      name: pic.name || '',
      email: pic.email || '',
      designation: pic.designation || '',
    });
    setEditDialog(true);
  };

  const handleUpdatePIC = async () => {
    if (!selectedPIC) return;

    try {
      setLoading(true);
      const response = await axiosInstance.patch(`/api/pic/${selectedPIC.id}`, {
        ...formData,
        companyId,
      });

      enqueueSnackbar(response.data.message || 'PIC updated successfully', { variant: 'success' });
      setEditDialog(false);
      setSelectedPIC(null);
      setFormData({ name: '', email: '', designation: '' });

      // Call parent refresh function if provided
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating PIC:', error);
      const errorMessage = error.response?.data?.message || 'Error updating PIC';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (pic) => {
    const userData = picUsers[pic.id];

    if (!userData) {
      return <Chip label="Inactive" variant='outlined' color="default" />;
    }

    switch (userData.status) {
      case 'active':
        return <Chip label="Active" variant='outlined' color="success" />;
      case 'pending':
        return <Chip label="Pending" variant='outlined' color="warning" />;
      default:
        return <Chip label={userData.status || 'Unknown'} variant='outlined' color="default" size="small" />;
    }
  };

  return (
    <>
      <TableContainer sx={{ maxHeight: 500 }}>
        <Scrollbar>
          <Table>
            <TableHead>
              <TableRow>
                {TABLE_HEAD.map((item) => (
                  <TableCell key={item.id} sx={{ width: item.width, textAlign: item.textAlign }}>
                    {item.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {notFound ? (
                <TableNoData
                  numSelected={table.selected.length}
                  numHeaders={TABLE_HEAD.length}
                  denseHeight={denseHeight}
                />
              ) : (
                <>
                  {personIncharge?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item?.name || 'None'}</TableCell>
                      <TableCell>{item?.email || 'None'}</TableCell>
                      <TableCell>{item?.designation || 'None'}</TableCell>
                      <TableCell>{getStatusChip(item)}</TableCell>
                      <TableCell style={{ textAlign: 'center' }}>
                        <IconButton onClick={() => handleEditClick(item)} size="small" color="primary">
                          <EditIcon fontSize='small' />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              )}

              <TableEmptyRows
                height={denseHeight}
                emptyRows={emptyRows(table.page, table.rowsPerPage, personIncharge?.length || 0)}
              />

              <TableNoData notFound={notFound} />
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>

      {/* Edit PIC Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Person In Charge</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Designation"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              fullWidth
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleUpdatePIC} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PICList;

PICList.propTypes = {
  personIncharge: PropTypes.array,
  companyId: PropTypes.string,
  onUpdate: PropTypes.func,
};
