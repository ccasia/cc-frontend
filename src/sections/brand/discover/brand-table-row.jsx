import React from 'react';
import PropTypes from 'prop-types';

import {
  Avatar,
  Button,
  Tooltip,
  Checkbox,
  TableRow,
  TableCell,
  ListItemText,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { usePopover } from 'src/components/custom-popover';
import { ConfirmDialog } from 'src/components/custom-dialog';

const BrandTableRow = ({ row, selected, onEditRow, onSelectRow, onDeleteRow }) => {
  const { logo, name, email, phone, website, campaign, brand, id } = row;

  const confirm = useBoolean();

  const router = useRouter();

  const popover = usePopover();

  return (
    <>
      <TableRow key={id} hover selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onClick={onSelectRow} />
        </TableCell>

        <TableCell sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar src={logo} alt={name} sx={{ mr: 2 }} />

          <ListItemText
            primary={name || 'null'}
            primaryTypographyProps={{ typography: 'body2' }}
            secondaryTypographyProps={{
              component: 'span',
              color: 'text.disabled',
            }}
          />
        </TableCell>

        {/* <TableCell sx={{ whiteSpace: 'nowrap' }}>{email || 'null'}</TableCell> */}

        {/* <TableCell sx={{ whiteSpace: 'nowrap' }}>{phone || 'null'}</TableCell> */}

        {/* <TableCell sx={{ whiteSpace: 'nowrap' }}>{website || 'null'}</TableCell> */}

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Label>{brand?.length || '0'}</Label>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Label>{campaign?.length || '0'}</Label>
        </TableCell>

        <TableCell sx={{ px: 1, whiteSpace: 'nowrap' }}>
          <Tooltip title="Edit" placement="top" arrow>
            {/* <IconButton onClick={() => router.push(paths.dashboard.company.companyEdit(id))}>
              <Iconify icon="solar:pen-bold" />
            </IconButton> */}
            <Button
              startIcon={<Iconify icon="solar:pen-bold" />}
              sx={{
                border: 1,
                borderColor: '#EBEBEB',
                boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
              }}
              variant="contained"
              onClick={() => router.push(paths.dashboard.company.companyEdit(id))}
            >
              Edit
            </Button>
          </Tooltip>
          {/* <Tooltip title="Delete" placement="top" arrow>
            <IconButton
              onClick={() => {
                confirm.onTrue();
                popover.onClose();
              }}
              sx={{ color: 'error.main' }}
            >
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Tooltip> */}
        </TableCell>
      </TableRow>

      {/* <UserQuickEditForm currentUser={row} open={quickEdit.value} onClose={quickEdit.onFalse} /> */}

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
              onDeleteRow();
              confirm.onFalse();
            }}
          >
            Delete
          </Button>
        }
      />
    </>
  );
};

export default BrandTableRow;

BrandTableRow.propTypes = {
  onDeleteRow: PropTypes.func,
  onEditRow: PropTypes.func,
  onSelectRow: PropTypes.func,
  row: PropTypes.object,
  selected: PropTypes.bool,
};
