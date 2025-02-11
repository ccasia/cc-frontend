import React from 'react';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import { Chip, TableRow, MenuItem, TableCell, Typography, IconButton } from '@mui/material';

import Iconify from 'src/components/iconify';
import { usePopover } from 'src/components/custom-popover';
import CustomPopover from 'src/components/custom-popover/custom-popover';

const PackageItem = ({ packageItem }) => {
  const popover = usePopover();
  return (
    <TableRow key={packageItem.type}>
      <TableCell>
        <Chip label={packageItem.type} size="small" color="secondary" />
      </TableCell>
      <TableCell>
        {packageItem.type === 'Custom' ? (
          'CSM to update'
        ) : (
          <>
            {packageItem.valueMYR} MYR | {packageItem.valueSGD} SGD
          </>
        )}
      </TableCell>
      <TableCell>
        {packageItem.type === 'Custom' ? 'CSM to update' : <>{packageItem.totalUGCCredits}</>}
      </TableCell>
      <TableCell>
        {/* {packageItem.admin.length ? (
          <AvatarGroup max={3}>
            {packageItem.admin.map((admin) => (
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
        )} */}
        {packageItem.type === 'Custom' ? (
          'CSM to update'
        ) : (
          <>
            {packageItem.validityPeriod} {packageItem.validityPeriod > 1 ? 'months' : 'month'}{' '}
          </>
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
            console.log('clicked');
          }}
        >
          <Iconify icon="material-symbols:bookmark-manager" />
          <Typography variant="body2">View</Typography>
        </MenuItem>
        <MenuItem>
          <Iconify icon="akar-icons:edit" />
          <Typography variant="body2">Edit</Typography>
        </MenuItem>
        <MenuItem>
          <Iconify icon="fluent:delete-28-filled" />
          <Typography variant="body2">Delete</Typography>
        </MenuItem>
      </CustomPopover>
    </TableRow>
  );
};

PackageItem.propTypes = {
  packageItem: PropTypes.object,
};

export default PackageItem;
