import PropTypes from 'prop-types';
import React, { useState } from 'react';

import {
  Box,
  Tab,
  Tabs,
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  TableContainer,
} from '@mui/material';

const RoleAssignee = ({ admins }) => {
  const [activeTab, setActiveTab] = useState('assignee');

  const handleChangeTab = (e, value) => {
    setActiveTab(value);
  };

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleChangeTab}>
          <Tab label="Assignee" value="assignee" />
        </Tabs>
      </Box>
      {activeTab === 'assignee' && (
        <TableContainer sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone Number</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin?.user?.id}>
                  <TableCell>{admin?.user?.name}</TableCell>
                  <TableCell>{admin?.user?.email}</TableCell>
                  <TableCell>{admin?.user?.phoneNumber}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default RoleAssignee;

RoleAssignee.propTypes = {
  admins: PropTypes.array,
};
