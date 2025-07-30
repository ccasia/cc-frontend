import React from 'react';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import {
  Chip,
  Avatar,
  TableRow,
  MenuItem,
  TableCell,
  Typography,
  IconButton,
  AvatarGroup,
  Badge,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import { usePopover } from 'src/components/custom-popover';
import CustomPopover from 'src/components/custom-popover/custom-popover';

const RoleItem = ({ role, key, onView }) => {
  const popover = usePopover();
  return (
    <TableRow key={role.id}>
      {/* <TableCell>
        <Chip label={role.id} size="small" color="info" />
      </TableCell> */}

      <TableCell>
        <Chip label={role?.name} size="small" sx={{ borderRadius: 0.5 }} />
      </TableCell>
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
          }}
        >
          <Iconify icon="bi:three-dots-vertical" />
        </IconButton>
      </TableCell>
      <CustomPopover open={popover.open} onClose={popover.onClose} sx={{ width: 140 }} arrow="none">
        <MenuItem
          onClick={() => {
            onView();
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
  );
};

export default RoleItem;

RoleItem.propTypes = {
  role: PropTypes.object,
  key: PropTypes.string,
  onView: PropTypes.func,
};
