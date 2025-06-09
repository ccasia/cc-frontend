import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';

import { useAuthContext } from 'src/auth/hooks';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

// eslint-disable-next-line import/no-cycle
// import UserQuickEditForm from './user-quick-edit-form';

// ----------------------------------------------------------------------

export default function PackageTableRow({ row, selected, onEditRow, onSelectRow, onDeleteRow }) {
  const { validityPeriod, name, credits, createdAt, prices } = row;

  const { user } = useAuthContext();

  const confirm = useBoolean();

  const quickEdit = useBoolean();

  const priceMYR = prices?.find((price) => price.currency === 'MYR');
  const priceSGD = prices?.find((price) => price.currency === 'SGD');

  return (
    <>
      <TableRow 
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

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 600,
              color: '#374151',
              textTransform: 'capitalize',
            }}
          >
            {name}
          </Typography>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 500,
              color: '#374151',
            }}
          >
            {priceMYR ? `RM ${new Intl.NumberFormat('en-MY', { minimumFractionDigits: 2 }).format(priceMYR.amount)}` : 'N/A'}
          </Typography>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 500,
              color: '#374151',
            }}
          >
            {priceSGD ? `$ ${new Intl.NumberFormat('en-MY', { minimumFractionDigits: 2 }).format(priceSGD.amount)}` : 'N/A'}
          </Typography>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
          <Label 
            sx={{
              bgcolor: '#f0f9ff',
              color: '#1340ff',
              border: '1px solid rgba(19, 64, 255, 0.2)',
              fontWeight: 600,
              borderRadius: '6px',
              px: 1,
              py: 0.5,
            }}
          >
            {credits}
          </Label>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
          <Label 
            sx={{
              bgcolor: '#f0fdf4',
              color: '#16a34a',
              border: '1px solid rgba(22, 163, 74, 0.2)',
              fontWeight: 600,
              borderRadius: '6px',
              px: 1,
              py: 0.5,
            }}
          >
            {validityPeriod} {validityPeriod === 1 ? 'month' : 'months'}
          </Label>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#6b7280',
              fontSize: '0.875rem',
            }}
          >
            {dayjs(createdAt).format('MMM DD, YYYY')}
          </Typography>
        </TableCell>

        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
          <Tooltip title="Package editing is currently disabled" placement="top" arrow>
            <span>
              <IconButton
                disabled
                sx={{
                  width: 30,
                  height: 30,
                  bgcolor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: 0.75,
                  color: '#9ca3af',
                  mr: 0.5,
                  cursor: 'not-allowed',
                }}
              >
                <Iconify icon="heroicons:pencil-square-20-solid" width={15} height={15} />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Package deletion is currently disabled" placement="top" arrow>
            <span>
              <IconButton
                disabled
                sx={{
                  width: 30,
                  height: 30,
                  bgcolor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: 0.75,
                  color: '#9ca3af',
                  cursor: 'not-allowed',
                }}
              >
                <Iconify icon="heroicons:trash-20-solid" width={15} height={15} />
              </IconButton>
            </span>
          </Tooltip>
        </TableCell>
      </TableRow>

      {/* <UserQuickEditForm currentUser={row} open={quickEdit.value} onClose={quickEdit.onFalse} /> */}

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Package"
        content={`Are you sure you want to delete the "${name}" package? This action cannot be undone.`}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              onDeleteRow();
              confirm.onFalse();
            }}
            sx={{
              bgcolor: '#dc2626',
              color: '#ffffff',
              borderRadius: 1,
              px: 3,
              py: 1,
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                bgcolor: '#b91c1c',
              },
            }}
          >
            Delete Package
          </Button>
        }
      />
    </>
  );
}

PackageTableRow.propTypes = {
  onDeleteRow: PropTypes.func,
  onEditRow: PropTypes.func,
  onSelectRow: PropTypes.func,
  row: PropTypes.object,
  selected: PropTypes.bool,
};
