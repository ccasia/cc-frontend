/* eslint-disable no-unused-vars */
import dayjs from 'dayjs';
import { useState } from 'react';
import PropTypes from 'prop-types';

import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import {
  Box,
  Button,
  Dialog,
  Divider,
  MenuItem,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { usePopover } from 'src/components/custom-popover';
import CustomChip from 'src/components/custom-chip/custom-chip';
import CustomPopover from 'src/components/custom-popover/custom-popover';

// ----------------------------------------------------------------------

export default function BrandEditItem({ brand, onView, onEdit, onDelete }) {
  const popover = usePopover();
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const { user } = useAuthContext();

  console.log(brand);

  const {
    about,
    address,
    email,
    id,
    phone,
    objectives,
    registration_number,
    website,
    logo,
    name,
    createdAt,
  } = brand;

  return (
    <>
      <Card>
        <Stack
          alignItems="center"
          direction="row"
          sx={{ position: 'absolute', top: 8, right: 8 }}
          spacing={1}
        >
          <CustomChip label="Client" />
          <IconButton onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </Stack>

        <Stack sx={{ p: 3 }}>
          <Avatar alt={name} src={logo} variant="rounded" sx={{ width: 48, height: 48, mb: 2 }} />

          <ListItemText
            primary={
              <Link component={RouterLink} href={paths.dashboard.root} color="inherit">
                {name}
              </Link>
            }
            secondary={`Created At: ${dayjs(createdAt).format('LL')}`}
            primaryTypographyProps={{
              typography: 'subtitle1',
            }}
            secondaryTypographyProps={{
              component: 'span',
              typography: 'caption',
              color: 'text.disabled',
            }}
          />
        </Stack>

        <Divider
          sx={{
            borderStyle: 'dashed',
          }}
        />

        <Box sx={{ p: 2 }} display="grid" gridTemplateColumns="repeat(2,1fr)" gap={1.5}>
          <Stack
            spacing={0.5}
            direction="row"
            alignItems="center"
            sx={{ color: 'primary.main', typography: 'caption' }}
          >
            <Iconify width={16} icon="solar:users-group-rounded-bold" />
            {brand?.length} Brands
          </Stack>
          <Stack
            spacing={0.5}
            direction="row"
            alignItems="center"
            sx={{ color: 'primary.main', typography: 'caption' }}
          >
            <Iconify width={16} icon="material-symbols:campaign" />
            {brand?.length} Campaigns
          </Stack>
        </Box>
      </Card>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
        sx={{ width: 140 }}
      >
        <MenuItem
          onClick={() => {
            popover.onClose();
            onView();
          }}
        >
          <Iconify icon="solar:eye-bold" />
          View
        </MenuItem>

        <MenuItem
          onClick={() => {
            popover.onClose();
            onEdit();
          }}
        >
          <Iconify icon="solar:pen-bold" />
          Edit
        </MenuItem>
        {user?.role === 'superadmin' && (
          <MenuItem
            onClick={() => {
              popover.onClose();
              setOpenDeleteModal(true);
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete
          </MenuItem>
        )}
      </CustomPopover>

      <Dialog open={openDeleteModal} onClose={() => setOpenDeleteModal(false)}>
        <DialogTitle>Delete Client {name}</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this company? This action will remove all brands under
            this company.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            size="small"
            variant="outlined"
            // color="error"
            onClick={() => setOpenDeleteModal(false)}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={() => {
              onDelete();
              setOpenDeleteModal(false);
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

BrandEditItem.propTypes = {
  brand: PropTypes.object,
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
  onView: PropTypes.func,
};
