import React from 'react';
import PropTypes from 'prop-types';

import {
  Box,
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  TableContainer,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import RoleItem from './role-item';

const RoleLists = ({ roles }) => {
  const router = useRouter();

  const onView = (id) => {
    router.push(paths.dashboard.roles.manage(id));
  };

  return (
    <Box mt={2}>
      <TableContainer sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              {/* <TableCell size="small">ID</TableCell> */}
              <TableCell size="small">Name</TableCell>
              <TableCell size="small">Date Created</TableCell>
              <TableCell size="small">Assign</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {roles?.map((role) => (
              <RoleItem key={role.id} role={role} onView={() => onView(role.id)} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default RoleLists;

RoleLists.propTypes = {
  roles: PropTypes.array,
};
