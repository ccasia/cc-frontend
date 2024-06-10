/* eslint-disable no-unused-vars */
import dayjs from 'dayjs';
import { useState } from 'react';
import PropTypes from 'prop-types';

import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import {
  Button,
  Dialog,
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
import CustomPopover from 'src/components/custom-popover/custom-popover';

// ----------------------------------------------------------------------

export default function BrandItem({ company, onView, onEdit, onDelete }) {
  const popover = usePopover();
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const { user } = useAuthContext();

  // const { title, company, createdAt, candidates, experience, employmentTypes, salary, role } =
  //   company;
  const {
    about,
    address,
    email,
    id,
    phone,
    objectives,
    registration_number,
    website,
    brand,
    logo,
    name,
    createdAt,
  } = company;

  return (
    <>
      <Card>
        <IconButton onClick={popover.onOpen} sx={{ position: 'absolute', top: 8, right: 8 }}>
          <Iconify icon="eva:more-vertical-fill" />
        </IconButton>

        <Stack sx={{ p: 3, pb: 2 }}>
          <Avatar alt={name} src={logo} variant="rounded" sx={{ width: 48, height: 48, mb: 2 }} />

          <ListItemText
            sx={{ mb: 1 }}
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
              mt: 1,
              component: 'span',
              typography: 'caption',
              color: 'text.disabled',
            }}
          />

          <Stack
            spacing={0.5}
            direction="row"
            alignItems="center"
            sx={{ color: 'primary.main', typography: 'caption' }}
          >
            <Iconify width={16} icon="solar:users-group-rounded-bold" />
            {brand.length} Brands
          </Stack>
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />

        {/* <Box rowGap={1.5} display="grid" gridTemplateColumns="repeat(2, 1fr)" sx={{ p: 3 }}>
          <Stack
            spacing={0.5}
            flexShrink={0}
            direction="row"
            alignItems="center"
            sx={{ color: 'text.disabled', minWidth: 0 }}
          >
            <Iconify icon="mdi:instagram" />
            <Typography variant="caption" noWrap>
              nexea
            </Typography>
          </Stack>
          <Stack
            spacing={0.5}
            flexShrink={0}
            direction="row"
            alignItems="center"
            sx={{ color: 'text.disabled', minWidth: 0 }}
          >
            <Iconify icon="ic:baseline-tiktok" />
            <Typography variant="caption" noWrap>
              nexea
            </Typography>
          </Stack>
        </Box> */}

        {/* <Box rowGap={1.5} display="grid" gridTemplateColumns="repeat(2, 1fr)" sx={{ p: 3 }}>
          {[
            {
              label: experience,
              icon: <Iconify width={16} icon="carbon:skill-level-basic" sx={{ flexShrink: 0 }} />,
            },
            {
              label: employmentTypes.join(', '),
              icon: <Iconify width={16} icon="solar:clock-circle-bold" sx={{ flexShrink: 0 }} />,
            },
            {
              label: salary.negotiable ? 'Negotiable' : fData(salary.price),
              icon: <Iconify width={16} icon="solar:wad-of-money-bold" sx={{ flexShrink: 0 }} />,
            },
            {
              label: role,
              icon: <Iconify width={16} icon="solar:user-rounded-bold" sx={{ flexShrink: 0 }} />,
            },
          ].map((item) => (
            <Stack
              key={item.label}
              spacing={0.5}
              flexShrink={0}
              direction="row"
              alignItems="center"
              sx={{ color: 'text.disabled', minWidth: 0 }}
            >
              {item.icon}
              <Typography variant="caption" noWrap>
                {item.label}
              </Typography>
            </Stack>
          ))}
        </Box> */}
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
        <DialogTitle>Delete {name}</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this company? This action will remove all brands under
            this company.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="error" onClick={() => setOpenDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
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

BrandItem.propTypes = {
  company: PropTypes.object,
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
  onView: PropTypes.func,
};
