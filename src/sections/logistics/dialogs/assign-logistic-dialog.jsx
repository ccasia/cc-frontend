import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import useSWR from 'swr';

import {
  Box,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import { fetcher } from 'src/utils/axios';
import axiosInstance from 'src/utils/axios';

const mockProducts = [
  {
    id: 'prod-001',
    productName: 'Jar',
    description: 'A glass jar of goodness',
  },
  {
    id: 'prod-002',
    productName: 'Sachet',
    description: 'Travel size pack',
  },
  {
    id: 'prod-003',
    productName: 'Full Bundle Set',
    description: 'Contains all items',
  },
  {
    id: 'prod-004',
    productName: 'Manna & Tayebat Jar',
    description: 'Premium edition',
  },
];

export default function AssignLogisticDialog({ open, onClose, logistic, campaignId, onUpdate }) {
  const { data: products } = useSWR(
    open && campaignId ? `/api/logistics/products/campaign/${campaignId}` : null,
    fetcher
  );

  const [selectedItems, setSelectedItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && logistic?.deliveryDetails?.items) {
      const existingItems = logistic.deliveryDetails.items.map((item) => ({
        productId: item.productId,
        productName: item.product?.productName,
        quantity: item.quantity,
      }));
      setSelectedItems(existingItems);
    } else if (open) {
      setSelectedItems([]);
    }
  }, [open, logistic]);

  const handleAddProduct = (productId) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const exists = selectedItems.find((item) => item.productId === productId);

    if (!exists) {
      setSelectedItems([
        ...selectedItems,
        { productId, productName: product.productName, quantity: 1 },
      ]);
    }
  };

  const handleQuantityChange = (productId, delta) => {
    setSelectedItems((current) =>
      current
        .map((item) => {
          if (item.productId === productId) {
            return { ...item, quantity: Math.max(0, item.quantity + delta) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleAssign = async () => {
    setIsSubmitting(true);
    try {
      await axiosInstance.post(`/api/logistics/assign/${campaignId}`, {
        creatorId: logistic.creatorId,
        items: selectedItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to assign products', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>Assign Products</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Assign products to <strong>{logistic?.creator?.name}</strong>. Items with 0 quantity will
          be removed.
        </Typography>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Select Product to Add</InputLabel>
          <Select
            label="Select Product to Add"
            onChange={(e) => handleAddProduct(e.target.value)}
            value=""
          >
            {products?.map((product) => {
              const isSelected = selectedItems.some((i) => i.productId === product.id);

              return (
                <MenuItem key={product.id} value={product.id} disabled={isSelected}>
                  {product.productName}
                </MenuItem>
              );
            })}
          </Select>
          <FormHelperText>Select a product to add it to the list below.</FormHelperText>
        </FormControl>

        <Stack spacing={2}>
          {selectedItems.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#F4F6F8', borderRadius: 1 }}>
              <Typography>No products assigned yet.</Typography>
            </Box>
          )}

          {selectedItems.map((item) => (
            <Stack
              key={item.productId}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                p: 2,
                borderRadius: 1,
                border: '1px solid #919EAB3D',
                bgcolor: '#FFFFFF',
              }}
            >
              <Typography variant="subtitle2">{item.productName}</Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconButton
                  size="small"
                  onClick={() => handleQuantityChange(item.productId, -1)}
                  sx={{ border: '1px solid #919EAB3D' }}
                >
                  <Iconify icon="eva:minus-fill" width={16} />
                </IconButton>

                <Typography variant="subtitle2" sx={{ minWidth: 20, textAlign: 'center' }}>
                  {item.quantity}
                </Typography>

                <IconButton
                  size="small"
                  onClick={() => handleQuantityChange(item.productId, +1)}
                  sx={{ border: '1px solid #919EAB3D' }}
                >
                  <Iconify icon="eva:plus-fill" width={16} />
                </IconButton>
              </Stack>
            </Stack>
          ))}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleAssign}
          variant="contained"
          disabled={selectedItems.length === 0 || isSubmitting}
          sx={{
            bgcolor: '#1340FF',
            '&:hover': { bgcolor: '#0B2DAD' },
          }}
        >
          {isSubmitting ? 'Assigning...' : 'Confirm Assignment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

AssignLogisticDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  logistic: PropTypes.object,
  campaignId: PropTypes.string,
  onUpdate: PropTypes.func,
};
