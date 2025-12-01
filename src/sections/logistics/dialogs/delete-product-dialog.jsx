import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';

export default function DeleteProductDialog({ open, onClose, onConfirm, productName }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: '#F4F4F4',
          p: 3,
          width: '100%',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Emoji Circle */}
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: '#8A5AFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            fontSize: 32,
          }}
        >
          😲
        </Box>

        <Typography variant="h3" sx={{ fontFamily: 'instrument serif', color: '#231F20', mb: 1 }}>
          Delete product?
        </Typography>

        <Typography variant="body2" sx={{ color: '#636366', mb: 4, maxWidth: 280 }}>
          Deleting <strong>{productName}</strong> will remove all instances from creators who are
          assigned with this product.
        </Typography>

        <Stack spacing={1.5} sx={{ width: '100%' }}>
          <Button
            fullWidth
            variant="contained"
            onClick={onConfirm}
            sx={{
              bgcolor: '#333333',
              color: '#fff',
              py: 1.5,
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              '&:hover': { bgcolor: '#000000' },
            }}
          >
            Confirm
          </Button>
          <Button
            fullWidth
            onClick={onClose}
            sx={{
              bgcolor: '#fff',
              color: '#231F20',
              py: 1.5,
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              border: '1px solid #E0E0E0',
              '&:hover': { bgcolor: '#F8F9FA' },
            }}
          >
            Cancel
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
}

DeleteProductDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onConfirm: PropTypes.func,
  productName: PropTypes.string,
};
