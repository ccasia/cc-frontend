import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { useBoolean } from 'src/hooks/use-boolean';

import Iconify from 'src/components/iconify';

// eslint-disable-next-line import/no-cycle
// import UserQuickEditForm from './user-quick-edit-form';

// ----------------------------------------------------------------------

const primaryButtonSx = {
  bgcolor: '#203ff5',
  border: '1px solid #203ff5',
  borderBottom: '3px solid #1933cc',
  height: 44,
  color: '#ffffff',
  fontSize: '0.875rem',
  fontWeight: 600,
  px: 3,
  textTransform: 'none',
  '&:hover': { bgcolor: '#1933cc', opacity: 0.9 },
};

const dangerButtonSx = {
  bgcolor: '#D4321C',
  border: '1px solid #D4321C',
  borderBottom: '3px solid #a82815',
  height: 44,
  color: '#ffffff',
  fontSize: '0.875rem',
  fontWeight: 600,
  px: 3,
  textTransform: 'none',
  '&:hover': { bgcolor: '#a82815', opacity: 0.9 },
};

function PackageActionDialog({ open, onClose, title, content, children }) {
  return (
    <Dialog
      fullWidth
      open={open}
      onClose={onClose}
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: '#F4F4F4',
        },
      }}
    >
      <DialogTitle
        sx={{
          fontFamily: 'Instrument Serif',
          fontSize: '40px !important',
          fontWeight: 400,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
          lineHeight: 1.2,
        }}
      >
        {title}
        <IconButton onClick={onClose} size="small">
          <Iconify icon="mdi:close" width={24} />
        </IconButton>
      </DialogTitle>

      <Divider sx={{ borderColor: '#EBEBEB', mx: 3 }} />

      <DialogContent>
        <Typography variant="body2" sx={{ color: '#636366', mt: 2, mb: 3 }}>
          {content}
        </Typography>

        <Box mb={2} display="flex" justifyContent="flex-end" gap={1}>
          {children}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

PackageActionDialog.propTypes = {
  children: PropTypes.node,
  content: PropTypes.node,
  onClose: PropTypes.func,
  open: PropTypes.bool,
  title: PropTypes.string,
};

export default function PackageTableRow({ row, onEditRow, onDeleteRow, onArchiveRow, onUnarchiveRow }) {
  const { validityPeriod, name, credits, createdAt, prices, isArchived, subscriptionCount } = row;

  const confirm = useBoolean();
  const canDelete = !subscriptionCount;

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
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
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
            {isArchived && (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  bgcolor: '#F4F4F4',
                  color: '#636366',
                  borderRadius: 0.75,
                  px: 1.5,
                  py: 0.5,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              >
                Archived
              </Box>
            )}
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

          {isArchived ? (
            <Tooltip title="Unarchive" placement="top" arrow>
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
                  '&:hover': { bgcolor: '#f5f5f5' },
                }}
              >
                <Iconify icon="material-symbols:unarchive-outline" width={18} sx={{ color: '#636366' }} />
              </IconButton>
            </Tooltip>
          ) : (
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
                }}
              >
                <Iconify icon="solar:trash-bin-trash-bold" width={18} sx={{ color: '#D4321C' }} />
              </IconButton>
            </Tooltip>
          )}
        </TableCell>
      </TableRow>

      {isArchived ? (
        <PackageActionDialog
          open={confirm.value}
          onClose={confirm.onFalse}
          title="Unarchive Package"
          content={`Restore "${name}" so it can be selected for new subscriptions again?`}
        >
          <Button
            sx={primaryButtonSx}
            onClick={() => {
              onUnarchiveRow?.();
              confirm.onFalse();
            }}
          >
            Unarchive
          </Button>
        </PackageActionDialog>
      ) : (
        <PackageActionDialog
          open={confirm.value}
          onClose={confirm.onFalse}
          title="Delete Package"
          content={
            canDelete
              ? `Are you sure want to delete ${name}?`
              : `"${name}" is used by ${subscriptionCount} existing subscription${subscriptionCount === 1 ? '' : 's'}, so it can only be archived, not deleted.`
          }
        >
          {canDelete && (
            <Button
              sx={dangerButtonSx}
              onClick={() => {
                onDeleteRow?.();
                confirm.onFalse();
              }}
            >
              Delete
            </Button>
          )}
          <Button
            sx={primaryButtonSx}
            onClick={() => {
              onArchiveRow?.();
              confirm.onFalse();
            }}
          >
            Archive
          </Button>
        </PackageActionDialog>
      )}
    </>
  );
}

PackageTableRow.propTypes = {
  onArchiveRow: PropTypes.func,
  onDeleteRow: PropTypes.func,
  onEditRow: PropTypes.func,
  onUnarchiveRow: PropTypes.func,
  row: PropTypes.object,
};
