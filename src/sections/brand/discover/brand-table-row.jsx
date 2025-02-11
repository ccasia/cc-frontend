import PropTypes from 'prop-types';
import React, { useMemo } from 'react';

import {
  Chip,
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
import { ConfirmDialog } from 'src/components/custom-dialog';

const dictionary = {
  active: 'Active',
  inactive: 'Inactive',
  expired: 'Expired',
};

const findLatestPackage = (packages) => {
  if (packages.length === 0) {
    return null; // Return null if the array is empty
  }

  const latestPackage = packages.reduce((latest, current) => {
    const latestDate = new Date(latest.createdAt);
    const currentDate = new Date(current.createdAt);

    return currentDate > latestDate ? current : latest;
  });

  return latestPackage;
};
function getRemainingTime(createdDate, months) {
  const created = new Date(createdDate);
  const expiryDate = new Date(created);
  expiryDate.setMonth(expiryDate.getMonth() + months);

  const today = new Date();
  const diffTime = expiryDate - today;

  const remainingDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return remainingDays;
}

const BrandTableRow = ({ row, selected, onEditRow, onSelectRow, onDeleteRow }) => {
  const { logo, name, email, phone, website, campaign, brand, id, PackagesClient } = row;

  const confirm = useBoolean();

  const router = useRouter();

  // const popover = usePopover();
  const latestPackageItem = PackagesClient ? findLatestPackage(PackagesClient) : null;

  console.log(latestPackageItem);

  const validity = useMemo(() => {
    if (latestPackageItem && latestPackageItem.invoiceDate) {
      if (getRemainingTime(latestPackageItem.invoiceDate, latestPackageItem.validityPeriod) > 0) {
        return `${getRemainingTime(latestPackageItem.invoiceDate, latestPackageItem.validityPeriod)} days left`;
      }
      return `${Math.abs(
        getRemainingTime(latestPackageItem.invoiceDate, latestPackageItem.validityPeriod)
      )} days overdue`;
    }

    return 'No Days Added';
  }, [latestPackageItem]);

  // function Validity() {
  //   if (latestPackageItem && latestPackageItem.invoiceDate) {
  //     if (getRemainingTime(latestPackageItem.invoiceDate, latestPackageItem.validityPeriod) > 0) {
  //       return (
  //         <TableCell sx={{ whiteSpace: 'nowrap' }}>
  //           <Chip
  //             label={getRemainingTime(
  //               latestPackageItem.invoiceDate,
  //               latestPackageItem.validityPeriod
  //             )}
  //             variant="outlined"
  //             color="default"
  //           />{' '}
  //           days left
  //         </TableCell>
  //       );
  //     }
  //     return (
  //       <TableCell sx={{ whiteSpace: 'nowrap' }}>
  //         <Chip
  //           label={Math.abs(
  //             getRemainingTime(latestPackageItem.invoiceDate, latestPackageItem.validityPeriod)
  //           )}
  //           variant="outlined"
  //           color="error"
  //         />
  //         days overdue
  //       </TableCell>
  //     );
  //   }
  //   return (
  //     <TableCell sx={{ whiteSpace: 'nowrap' }}>
  //       <Label>no Days added</Label>
  //     </TableCell>
  //   );
  // }

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

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Chip
            label={latestPackageItem ? dictionary[latestPackageItem.status] : 'N/A'}
            variant="outlined"
            color={latestPackageItem && latestPackageItem.status === 'active' ? 'success' : 'error'}
          />
        </TableCell>

        {/* {Validity()} */}
        <TableCell>
          <Label>{validity}</Label>
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
