import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';

import {
  Avatar,
  Button,
  Checkbox,
  TableRow,
  TableCell,
  Typography,
  IconButton,
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
  const { logo, name, campaign, brand, id, subscriptions } = row;

  const confirm = useBoolean();

  const router = useRouter();

  const packageItem = subscriptions ? findLatestPackage(subscriptions) : null;

  const validity = useMemo(() => {
    if (packageItem) {
      if (dayjs().isAfter(dayjs(packageItem?.expiredAt), 'date')) {
        const overdue = dayjs().diff(dayjs(packageItem?.expiredAt), 'days');
        return `${overdue} days overdue`;
      }
      const remainingdays = dayjs(packageItem?.expiredAt).diff(dayjs(), 'days');
      return `${remainingdays} days left`;
    }
    return null;
  }, [packageItem]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'expired':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getValidityColor = (validityText) => {
    if (!validityText) return 'default';
    if (validityText.includes('overdue')) return 'error';
    if (validityText.includes('days left')) {
      const days = parseInt(validityText.split(' ')[0], 10);
      if (days <= 7) return 'warning';
      if (days <= 30) return 'info';
    }
    return 'success';
  };

  const renderPackageContents = packageItem ? (
    <>
      <TableCell>
        <Label color={getStatusColor(packageItem.status)}>
          {packageItem.status}
        </Label>
      </TableCell>
      <TableCell>
        <Label color={getValidityColor(validity)}>{validity}</Label>
      </TableCell>
    </>
  ) : (
    <>
      <TableCell>
        <Label>
          <Typography variant="caption" fontWeight={800}>
            No package is linked
          </Typography>
        </Label>
      </TableCell>
      <TableCell>
        <Label>
          <Typography variant="caption" fontWeight={800}>
            No package is linked
          </Typography>
        </Label>
      </TableCell>
    </>
  );

  return (
    <>
      <TableRow 
        key={id} 
        hover 
        selected={selected}
        sx={{
          '&:hover': {
            backgroundColor: '#f8f9fa',
          },
          '& .MuiTableCell-root': {
            borderBottom: '1px solid #f0f0f0',
            padding: '12px 16px',
          },
        }}
      >
        <TableCell padding="checkbox">
          <Checkbox 
            checked={selected} 
            onClick={onSelectRow}
            sx={{
              '&.Mui-checked': {
                color: '#1340ff',
              },
            }}
          />
        </TableCell>

        <TableCell sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            src={logo} 
            alt={name} 
            sx={{ 
              mr: 2, 
              width: 38, 
              height: 38,
              border: '1px solid #f0f0f0',
            }} 
          />
          <ListItemText
            primary={name || 'Unnamed Client'}
            primaryTypographyProps={{ 
              typography: 'body2',
              fontWeight: 500,
              color: '#374151',
            }}
            secondaryTypographyProps={{
              component: 'span',
              color: '#6b7280',
              fontSize: '0.75rem',
            }}
          />
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Label 
            sx={{
              bgcolor: '#f0f9ff',
              color: '#1340ff',
              border: '1px solid rgba(19, 64, 255, 0.2)',
              fontWeight: 600,
            }}
          >
            {brand?.length || '0'}
          </Label>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Label 
            sx={{
              bgcolor: '#f0f9ff',
              color: '#1340ff',
              border: '1px solid rgba(19, 64, 255, 0.2)',
              fontWeight: 600,
            }}
          >
            {campaign?.length || '0'}
          </Label>
        </TableCell>

        {/* Package Type Column */}
        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          {packageItem ? (
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#374151',
                fontWeight: 500,
                textTransform: 'capitalize',
              }}
            >
              {packageItem.package?.name || packageItem.customPackage?.customName || 'Standard Package'}
            </Typography>
          ) : (
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#9ca3af',
                fontStyle: 'italic',
              }}
            >
              No package linked
            </Typography>
          )}
        </TableCell>

        {/* Status Column */}
        <TableCell>
          {packageItem ? (
            <Label 
              color={getStatusColor(packageItem.status)}
              sx={{
                textTransform: 'capitalize',
                fontWeight: 600,
                borderRadius: '6px',
                px: 1,
                py: 0.5,
              }}
            >
              {packageItem.status}
            </Label>
          ) : (
            <Label 
              color="default"
              sx={{
                fontWeight: 600,
                borderRadius: '6px',
                px: 1,
                py: 0.5,
                bgcolor: '#f3f4f6',
                color: '#6b7280',
              }}
            >
              No package linked
            </Label>
          )}
        </TableCell>

        {/* Validity Column */}
        <TableCell>
          {validity ? (
            <Label 
              color={getValidityColor(validity)}
              sx={{
                fontWeight: 600,
                borderRadius: '6px',
                px: 1,
                py: 0.5,
              }}
            >
              {validity}
            </Label>
          ) : (
            <Label 
              color="default"
              sx={{
                fontWeight: 600,
                borderRadius: '6px',
                px: 1,
                py: 0.5,
                bgcolor: '#f3f4f6',
                color: '#6b7280',
              }}
            >
              No package linked
            </Label>
          )}
        </TableCell>

        <TableCell sx={{ px: 1, whiteSpace: 'nowrap' }}>
          <IconButton
            onClick={() => router.push(paths.dashboard.company.companyEdit(id))}
            sx={{
              width: 30,
              height: 30,
              bgcolor: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: 0.75,
              color: '#374151',
              '&:hover': {
                bgcolor: '#f9fafb',
                borderColor: '#9ca3af',
                color: '#1340ff',
              },
            }}
          >
            <Iconify icon="heroicons:pencil-square-20-solid" width={15} height={15} />
          </IconButton>
        </TableCell>
      </TableRow>

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
