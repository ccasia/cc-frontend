import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogContent from '@mui/material/DialogContent';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';

export default function CreditTierTableRow({ row, onEditRow, mutate }) {
  const { name, minFollowers, maxFollowers, creditsPerVideo, isActive, createdAt, creatorsCount } =
    row;

  const { user } = useAuthContext();

  const confirm = useBoolean();

  const handleDelete = async () => {
    try {
      const res = await axiosInstance.delete(endpoints.creditTier.delete(row.id));
      enqueueSnackbar(res?.data?.message || 'Credit tier deleted successfully');
      mutate();
      confirm.onFalse();
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || error?.message || 'Error deleting credit tier', {
        variant: 'error',
      });
    }
  };

  const formatFollowers = (count) => {
    if (count === null || count === undefined) {
      return 'Unlimited';
    }
    return count.toLocaleString();
  };

  const isDisabled = user?.role === 'admin' && user?.admin?.mode !== 'god';

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
        {/* Tier Name */}
        <TableCell sx={{ py: 1.5, px: 2 }}>
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

        {/* Min Followers */}
        <TableCell sx={{ py: 1.5, px: 2, whiteSpace: 'nowrap' }}>
          <Typography variant="body2" sx={{ color: '#221f20', fontWeight: 500 }}>
            {formatFollowers(minFollowers)}
          </Typography>
        </TableCell>

        {/* Max Followers */}
        <TableCell sx={{ py: 1.5, px: 2, whiteSpace: 'nowrap' }}>
          <Typography variant="body2" sx={{ color: '#221f20', fontWeight: 500 }}>
            {formatFollowers(maxFollowers)}
          </Typography>
        </TableCell>

        {/* Credits Per Video */}
        <TableCell sx={{ py: 1.5, px: 2, whiteSpace: 'nowrap' }} align="center">
          <Typography variant="body2" sx={{ color: '#221f20', fontWeight: 500, fontSize: '0.8125rem' }}>
            {creditsPerVideo} credit{creditsPerVideo !== 1 ? 's' : ''}
          </Typography>
        </TableCell>

        {/* Creators */}
        <TableCell sx={{ py: 1.5, px: 2, whiteSpace: 'nowrap' }} align="center">
          <Typography
            variant="body2"
            sx={{ color: '#221f20', fontWeight: 600, fontSize: '0.8125rem' }}
          >
            {Number.isFinite(creatorsCount) ? creatorsCount.toLocaleString() : '—'}
          </Typography>
        </TableCell>

        {/* Status */}
        <TableCell sx={{ py: 1.5, px: 2, whiteSpace: 'nowrap' }} align="center">
          <Box
            sx={{
              textTransform: 'uppercase',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              py: 0.5,
              px: 1,
              fontSize: 12,
              border: '1px solid',
              borderBottom: '3px solid',
              borderRadius: 0.8,
              bgcolor: 'white',
              whiteSpace: 'nowrap',
              color: isActive ? '#1ABF66' : '#8E8E93',
              borderColor: isActive ? '#1ABF66' : '#8E8E93',
            }}
          >
            {isActive ? 'Active' : 'Inactive'}
          </Box>
        </TableCell>

        {/* Created At */}
        <TableCell sx={{ py: 1.5, px: 2, whiteSpace: 'nowrap' }}>
          <Typography variant="body2" sx={{ color: '#636366' }}>
            {dayjs(createdAt).format('MMM D, YYYY')}
          </Typography>
        </TableCell>

        {/* Actions */}
        <TableCell align="right" sx={{ py: 1.5, px: 2, whiteSpace: 'nowrap' }}>
          <Tooltip title="Edit" placement="top" arrow>
            <IconButton
              onClick={onEditRow}
              disabled={isDisabled}
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
              onClick={() => confirm.onTrue()}
              disabled={isDisabled}
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

      {/* Custom Styled Delete Confirmation Dialog */}
      <Dialog
        open={confirm.value}
        onClose={confirm.onFalse}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
          },
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          {/* Icon Circle */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: '#2C2C2C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <Typography sx={{ fontSize: 40 }}>🗑️</Typography>
          </Box>

          {/* Title */}
          <Typography
            sx={{
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
              fontSize: 36,
              fontWeight: 400,
              mb: 1,
              lineHeight: 1.2,
            }}
          >
            Delete
          </Typography>

          {/* Info Statement */}
          <Typography
            sx={{
              color: '#636366',
              fontSize: '0.875rem',
              mb: 3,
              mt: 1,
              lineHeight: 1.5,
            }}
          >
            Are you sure you want to delete &quot;
            <Box component="span" sx={{ color: '#1340FF', fontWeight: 600 }}>
              {name}
            </Box>
            &quot;? If this tier is in use by creators, it will be deactivated instead.
          </Typography>

          {/* Buttons */}
          <Stack spacing={1.5}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleDelete}
              sx={{
                bgcolor: '#D4321C',
                borderBottom: '3px solid #b71c1c',
                color: '#fff',
                py: 1,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 1.5,
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#B71C1C',
                },
              }}
            >
              Delete
            </Button>
            <Button
              fullWidth
              onClick={confirm.onFalse}
              sx={{
                color: '#3A3A3C',
                border: '1px solid #E7E7E7',
                borderBottom: '3px solid #e7e7e7',
                py: 1,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 1.5,
                bgcolor: 'transparent',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'transparent',
                },
              }}
            >
              Cancel
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}

CreditTierTableRow.propTypes = {
  onEditRow: PropTypes.func,
  row: PropTypes.object,
  mutate: PropTypes.func,
};
