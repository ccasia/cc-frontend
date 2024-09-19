import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

import {
  Box,
  Chip,
  Table,
  Avatar,
  TableRow,
  MenuItem,
  TableCell,
  TableHead,
  TableBody,
  IconButton,
  Typography,
  AvatarGroup,
  TableContainer,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import Iconify from 'src/components/iconify';
import { usePopover } from 'src/components/custom-popover';
import CustomPopover from 'src/components/custom-popover/custom-popover';

const RoleLists = ({ roles }) => {
  const popover = usePopover();
  const [selectedRow, setSelectedRow] = useState(null);
  const router = useRouter();

  const handleManageRole = () => {
    router.push(paths.dashboard.roles.manage(selectedRow.id));
  };

  return (
    <Box mt={2}>
      <TableContainer sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Date Created</TableCell>
              <TableCell>Assign</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {roles?.map((role) => (
              <TableRow key={role.id}>
                <TableCell>
                  <Chip label={role.id} size="small" color="info" />
                </TableCell>
                <TableCell>{role.name}</TableCell>
                <TableCell>{dayjs(role.createdAt).format('LL')}</TableCell>
                <TableCell>
                  {role.admin.length ? (
                    <AvatarGroup max={3}>
                      {role.admin.map((admin) => (
                        <Avatar
                          key={admin?.user?.id}
                          alt={admin?.user?.name}
                          src={admin?.user?.photoUrl}
                          sx={{ width: 25, height: 25 }}
                        />
                      ))}
                    </AvatarGroup>
                  ) : (
                    'None'
                  )}
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={(event) => {
                      popover.onOpen(event);
                      setSelectedRow(role);
                    }}
                  >
                    <Iconify icon="bi:three-dots-vertical" />
                  </IconButton>
                </TableCell>
                <CustomPopover
                  open={popover.open}
                  onClose={popover.onClose}
                  sx={{ width: 140 }}
                  arrow="none"
                >
                  <MenuItem
                    onClick={() => {
                      handleManageRole(selectedRow); // Handle the manage role action
                    }}
                  >
                    <Iconify icon="material-symbols:bookmark-manager" />
                    <Typography variant="inherit">Manage</Typography>
                  </MenuItem>
                  <MenuItem>
                    <Iconify icon="material-symbols:delete" color="error.main" />
                    <Typography variant="inherit" color="error.main">
                      Delete
                    </Typography>
                  </MenuItem>
                </CustomPopover>
              </TableRow>
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
