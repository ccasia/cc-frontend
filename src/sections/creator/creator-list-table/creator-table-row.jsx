import PropTypes from 'prop-types';

import { Avatar, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';

import { useBoolean } from 'src/hooks/use-boolean';
import useCheckPermission from 'src/hooks/use-check-permission';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { usePopover } from 'src/components/custom-popover';
import { ConfirmDialog } from 'src/components/custom-dialog';

import CreatorQuickForm from './creator-quick-edit';

import MediaKitCreator from '../media-kit-creator-view/mediakit-view-by-id';

import { useState } from 'react';

// ----------------------------------------------------------------------

export default function CreatorTableRow({ row, selected, onEditRow, onSelectRow, onDeleteRow }) {
  const [openMediaKit, setOpenMediaKit] = useState(false);

  const handleOpenMediaKit = () => {
    setOpenMediaKit(true);
  };

  const handleCloseMediaKit = () => {
    setOpenMediaKit(false);
  };
  
  const { name, creator, country, status, photoURL } = row;

  const confirm = useBoolean();

  const quickEdit = useBoolean();

  const popover = usePopover();

  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onClick={onSelectRow} />
        </TableCell>

        <TableCell sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar src={photoURL} alt={name} sx={{ mr: 2 }} />

          <ListItemText
            primary={name || 'null'}
            primaryTypographyProps={{ typography: 'body2' }}
            secondaryTypographyProps={{
              component: 'span',
              color: 'text.disabled',
            }}
          />
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{creator?.pronounce || 'null'}</TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{creator?.tiktok || 'null'}</TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}> {creator?.instagram || 'null'}</TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{country || 'null'}</TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={
              (status === 'active' && 'success') ||
              (status === 'pending' && 'warning') ||
              (status === 'banned' && 'error') ||
              'default'
            }
          >
            {status}
          </Label>
        </TableCell>

        <TableCell>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenMediaKit}
            endIcon={<Iconify icon="eva:external-link-fill" />}
          >
            <Typography variant="button" sx={{ fontWeight: 'normal' }}>
              Media Kit
            </Typography>
          </Button>
        </TableCell>

        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
          {useCheckPermission(['update:creator']) && (
            <Tooltip title="Quick Edit" placement="top" arrow>
              <IconButton
                color={quickEdit.value ? 'inherit' : 'default'}
                onClick={quickEdit.onTrue}
              >
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>
          )}
          {useCheckPermission(['delete:creator']) && (
            <Tooltip title="Delete" placement="top" arrow>
              <IconButton
                onClick={() => {
                  confirm.onTrue();
                  popover.onClose();
                }}
                sx={{ color: 'error.main' }}
              >
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Tooltip>
          )}
        </TableCell>
      </TableRow>

      <MediaKitCreator 
        creatorId={row.id} 
        open={openMediaKit} 
        onClose={handleCloseMediaKit} 
      />

      <CreatorQuickForm currentUser={row} open={quickEdit.value} onClose={quickEdit.onFalse} />

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={`Are you sure want to delete ${name}?`}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              onDeleteRow(row);
              confirm.onFalse();
            }}
          >
            Delete
          </Button>
        }
      />
    </>
  );
}

CreatorTableRow.propTypes = {
  onDeleteRow: PropTypes.func,
  onEditRow: PropTypes.func,
  onSelectRow: PropTypes.func,
  row: PropTypes.object,
  selected: PropTypes.bool,
};
