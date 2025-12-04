import PropTypes from 'prop-types';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import { styled } from '@mui/material/styles';

import Iconify from 'src/components/iconify';

export default function LogisticsTableRow({ row, onClick, onEditStatus }) {
  const { creator, status, deliveryDetails } = row;
  const items = deliveryDetails?.items;

  const getStatusConfig = (currentStatus) => {
    switch (currentStatus) {
      case 'PENDING_ASSIGNMENT':
        return {
          label: 'UNASSIGNED',
          color: '#B0B0B0',
          hasAction: true,
        };
      case 'SCHEDULED':
        return {
          label: 'YET TO SHIP',
          color: '#FF9A02',
          hasAction: true,
        };
      case 'SHIPPED':
        return {
          label: 'SHIPPED OUT',
          color: '#8A5AFE',
          hasAction: false,
        };
      case 'DELIVERED':
        return {
          label: 'DELIVERED',
          color: '#1ABF66',
          hasAction: false,
        };
      case 'RECEIVED':
      case 'COMPLETED':
        return {
          label: 'COMPLETED',
          color: '#1ABF66',
          hasAction: false,
        };
      case 'ISSUE_REPORTED':
        return {
          label: 'FAILED',
          color: '#D4321C',
          hasAction: true,
        };
      default:
        return {
          label: currentStatus,
          color: '#B0B0B0',
          hasAction: false,
        };
    }
  };

  const configCurrentStatus = getStatusConfig(status);
  const isUnassigned = !items || items.length === 0;
  const finalStatus = isUnassigned ? getStatusConfig('PENDING_ASSIGNMENT') : configCurrentStatus;

  return (
    <>
      <TableRow hover onClick={onClick} sx={{ cursor: 'pointer' }}>
        {/* Column 1: Name */}
        <TableCell sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Avatar alt={creator?.name} src={creator?.photoURL} sx={{ mr: 2 }} />
          <ListItemText
            primary={creator?.name}
            primaryTypographyProps={{ typography: 'subtitle2', noWrap: true }}
            sx={{ minWidth: 0 }}
          />
        </TableCell>
        {/* Column 2: Products */}
        <TableCell sx={{ width: '40%' }}>
          {items && items.length > 0 ? (
            <Box display="flex" flexDirection="row">
              {items.map((item, index) => (
                <Typography key={index} variant="body2">
                  {item.product?.productName} ({item.quantity}){index < items.length - 1 && ',\u00A0'}
                </Typography>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              -
            </Typography>
          )}
        </TableCell>
        {/* Column 3: Status */}
        <TableCell sx={{ width: '20%', textAlign: 'right' }}>
          <Box sx={{ display: 'flex', pr: 2 }}>
            <Box
              onClick={onEditStatus}
              sx={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 'fit-content',
                height: { xs: 28, sm: 30 },
                padding: { xs: '4px 8px', sm: '6px 10px' },
                borderRadius: '6px',
                border: `1px solid ${finalStatus.color}`,
                boxShadow: `0px -2px 0px 0px ${finalStatus.color} inset`,
                backgroundColor: '#FFFFFF',
                color: finalStatus.color,
                fontSize: { xs: 8, sm: 10, md: 12 },
                fontWeight: 600,
                textTransform: 'uppercase',
                ...(onEditStatus && {
                  '&:hover': {
                    backgroundColor: '#F8F9FA',
                    border: `1px solid ${finalStatus.color}`,
                    boxShadow: `0px -2px 0px 0px ${finalStatus.color} inset`,
                  },
                  '&:active': {
                    boxShadow: `0px -1px 0px 0px ${finalStatus.color} inset`,
                    transform: 'translateY(1px)',
                  },
                }),
              }}
            >
              <Typography variant="subtitle2">{finalStatus.label}</Typography>
              {onEditStatus && <Iconify icon="eva:edit-2-outline" width={12} sx={{ ml: 0.5 }} />}
            </Box>
          </Box>
        </TableCell>
      </TableRow>
    </>
  );
}

LogisticsTableRow.propTypes = {
  row: PropTypes.object,
  onClick: PropTypes.func,
  onEditStatus: PropTypes.func,
};
