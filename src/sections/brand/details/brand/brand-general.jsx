import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import {
  Dialog,
  Button,
  Divider,
  useTheme,
  MenuItem,
  TextField,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { usePopover } from 'src/components/custom-popover';
import CustomChip from 'src/components/custom-chip/custom-chip';
import CustomPopover from 'src/components/custom-popover/custom-popover';

// ----------------------------------------------------------------------

export default function BrandsList({ brands, onView, onEdit, onDelete }) {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const popover = usePopover();
  const { user } = useAuthContext();
  const router = useRouter();
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const handleSearch = useCallback((event) => {
    setSearch(event.target.value);
  }, []);

  const handleView = useCallback(
    (id) => {
      router.push(paths.dashboard.company.brand.details(id));
    },
    [router]
  );

  const handleEdit = useCallback((id) => {
    console.log(id);
  }, []);

  const handleDelete = useCallback((id) => {
    console.log(id);
  }, []);

  const filteredData =
    brands &&
    brands.filter((company) => company.name.toLowerCase().indexOf(search.toLowerCase()) !== -1);

  return (
    <>
      <Stack>
        <TextField
          placeholder="Search..."
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="material-symbols:search" />
              </InputAdornment>
            ),
          }}
        >
          Search
        </TextField>
        <Box
          gap={3}
          display="grid"
          gridTemplateColumns={{
            xs: 'repeat(1, 1fr)',
            md: 'repeat(3, 1fr)',
          }}
          mt={5}
        >
          {filteredData.map((brand) => (
            <Box key={brand.id}>
              <Stack direction="column" component={Card}>
                <Stack direction="row" spacing={2} key={brand.id} sx={{ p: 3 }}>
                  <Stack
                    alignItems="center"
                    direction="row"
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                    spacing={1}
                  >
                    <CustomChip label="Brand" color={theme.palette.secondary.main} />
                    <IconButton onClick={popover.onOpen}>
                      <Iconify icon="eva:more-vertical-fill" />
                    </IconButton>
                  </Stack>

                  <Avatar alt={brand.name} src={brand.name} sx={{ width: 48, height: 48 }} />

                  <Stack spacing={1}>
                    <ListItemText
                      primary={brand.name}
                      secondary={brand.email}
                      secondaryTypographyProps={{
                        mt: 0.5,
                        component: 'span',
                        typography: 'caption',
                        color: 'text.disabled',
                      }}
                    />

                    <Typography variant="subtitle2" color={theme.palette.grey[400]}>
                      {brand.description.length > 50
                        ? brand.description.slice(0, 100).concat('...')
                        : brand.description}
                    </Typography>
                  </Stack>
                </Stack>
                <Divider />

                <Stack p={3} color={theme.palette.grey[500]}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Iconify icon="material-symbols:campaign" />
                    <Typography variant="caption">12 Campaigns</Typography>
                  </Stack>
                </Stack>
              </Stack>
              <CustomPopover
                open={popover.open}
                onClose={popover.onClose}
                arrow="right-top"
                sx={{ width: 140 }}
              >
                <MenuItem
                  onClick={() => {
                    popover.onClose();
                    handleView(brand.id);
                  }}
                >
                  <Iconify icon="solar:eye-bold" />
                  View
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    popover.onClose();
                    handleEdit(brand.id);
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
                <DialogTitle>Delete {brand.name}</DialogTitle>
                <DialogContent>
                  <Typography>
                    Are you sure you want to delete this company? This action will remove all brands
                    under this company.
                  </Typography>
                </DialogContent>
                <DialogActions>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => setOpenDeleteModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      handleDelete(brand.id);
                      setOpenDeleteModal(false);
                    }}
                  >
                    Confirm
                  </Button>
                </DialogActions>
              </Dialog>
            </Box>
          ))}
          {filteredData.length < 1 && <h1>No data found</h1>}
        </Box>
      </Stack>

      {/* <CustomPopover
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
        <DialogTitle>Delete</DialogTitle>
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
      </Dialog> */}
    </>
  );
}

BrandsList.propTypes = {
  brands: PropTypes.array,
  onView: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};
