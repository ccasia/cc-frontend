import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { useBoolean } from 'src/hooks/use-boolean';

import Iconify from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

// eslint-disable-next-line import/no-cycle
// import UserQuickEditForm from './user-quick-edit-form';

// ----------------------------------------------------------------------

export default function PackageTableRow({ row, onEditRow, onDeleteRow }) {
  const { validityPeriod, name, credits, createdAt, prices } = row;

  const confirm = useBoolean();

  const priceMYR = prices.find((price) => price.currency === 'MYR');
  const priceSGD = prices.find((price) => price.currency === 'SGD');

  return (
    <>
      <TableRow
        hover
        sx={{
          '&:hover': {
            bgcolor: 'rgba(0, 0, 0, 0.02)',
          },
        }}
      >

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              bgcolor: '#1340FF',
              color: '#fff',
              borderRadius: 0.75,
              px: 1.5,
              py: 0.5,
              fontWeight: 600,
              fontSize: '0.8125rem',
            }}
          >
            {name}
          </Box>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', py: 1.5, px: 2 }}>
          <Typography variant="body2" sx={{ color: '#221f20', fontWeight: 500 }}>
            {`RM ${new Intl.NumberFormat('en-MY', { minimumFractionDigits: 2 }).format(priceMYR?.amount ?? 0)}`}
          </Typography>
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap', py: 1.5, px: 2 }}>
          <Typography variant="body2" sx={{ color: '#221f20', fontWeight: 500 }}>
            {`$ ${new Intl.NumberFormat('en-MY', { minimumFractionDigits: 2 }).format(priceSGD?.amount ?? 0)}`}
          </Typography>
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }} align="center">
          <Typography variant="body2" sx={{ color: '#221f20', fontWeight: 600, fontSize: '0.8125rem' }}>
            {credits?.toLocaleString?.() ?? credits}
          </Typography>
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }} align="center">
          <Typography variant="body2" sx={{ color: '#221f20', fontWeight: 600, fontSize: '0.8125rem' }}>
            {`${validityPeriod} ${validityPeriod === 1 ? 'month' : 'months'}`}
          </Typography>
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap', py: 1.5, px: 2 }}>
          <Typography variant="body2" sx={{ color: '#636366' }}>
            {dayjs(createdAt).format('MMM D, YYYY')}
          </Typography>
        </TableCell>

        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
          <Tooltip title="Edit" placement="top" arrow>
            <IconButton
              onClick={onEditRow}
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1,
                border: '1px solid #E7E7E7',
                boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
                bgcolor: '#fff',
                mr: 1,
                '&:hover': { bgcolor: '#f5f5f5' },
                '&:disabled': { opacity: 0.5 },
              }}
            >
              <Iconify icon="solar:pen-bold" width={18} sx={{ color: '#636366' }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete" placement="top" arrow>
            <IconButton
              onClick={() => {
                confirm.onTrue();
              }}
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1,
                border: '1px solid #E7E7E7',
                boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
                bgcolor: '#fff',
                '&:hover': { bgcolor: '#fff0f0', borderColor: '#D4321C' },
                '&:disabled': { opacity: 0.5 },
              }}
            >
              <Iconify icon="solar:trash-bin-trash-bold" width={18} sx={{ color: '#D4321C' }} />
            </IconButton>
          </Tooltip>
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
              onDeleteRow?.();
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

PackageTableRow.propTypes = {
  onDeleteRow: PropTypes.func,
  onEditRow: PropTypes.func,
  row: PropTypes.object,
};
