import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import useSWR from 'swr';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import Popover from '@mui/material/Popover';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';

import Iconify from 'src/components/iconify';
import { fetcher } from 'src/utils/axios';
import axiosInstance from 'src/utils/axios';

export default function AssignLogisticDialog({ open, onClose, logistic, campaignId, onUpdate }) {
  const { data: products } = useSWR(
    open && campaignId ? `/api/logistics/products/campaign/${campaignId}` : null,
    fetcher
  );

  const [quantities, setQuantities] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && logistic?.deliveryDetails?.items) {
      const initialMap = {};
      logistic.deliveryDetails.items.forEach((item) => {
        initialMap[item.productId] = item.quantity;
      });
      setQuantities(initialMap);
    } else if (open) {
      setQuantities({});
    }
  }, [open, logistic]);

  const handleOpenDropdown = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseDropdown = () => {
    setAnchorEl(null);
  };

  const handleUpdateQuantity = (productId, delta) => {
    setQuantities((prev) => {
      const currentQty = prev[productId] || 0;
      const newQty = Math.max(0, currentQty + delta);

      const newState = { ...prev, [productId]: newQty };
      if (newQty === 0) delete newState[productId];
      return newState;
    });
  };

  const handleRemoveItem = (productId, e) => {
    e.stopPropagation();
    setQuantities((prev) => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);

    const payload = Object.entries(quantities).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));

    try {
      await axiosInstance.post(`/api/logistics/assign/${campaignId}`, {
        creatorId: logistic.creatorId,
        items: payload,
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to assign', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProductIds = Object.keys(quantities);
  const hasSelection = selectedProductIds.length > 0;

  const getProduct = (id) => products?.find((p) => p.id === id);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: '#F4F4F4',
          p: 3,
          width: '100%',
          maxWidth: 700,
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
        <Box>
          <Typography
            variant="h2"
            sx={{ fontWeight: 400, fontFamily: 'instrument serif', color: '#231F20' }}
          >
            Assign Logistic
          </Typography>
          <Typography variant="body2" sx={{ color: '#636366', mt: 0.5 }}>
            You may edit products in <strong>[Edit & Bulk Assign]</strong> page.
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <Iconify icon="eva:close-fill" width={32} />
        </IconButton>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Grid container spacing={4}>
        {/* LEFT COLUMN: Creator Info */}
        <Grid item xs={12} md={7}>
          <Typography variant="subtitle2" sx={{ color: '#636366', mb: 2 }}>
            Assigning to
          </Typography>

          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
            <Avatar src={logistic?.creator?.photoURL} sx={{ width: 56, height: 56 }} />
            <Box>
              <Typography variant="body" sx={{ fontWeight: 600, fontSize: '20px' }}>
                {logistic?.creator?.name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#636366' }}>
                {logistic?.creator?.creator?.instagramUser?.username
                  ? `@${logistic.creator.creator.instagramUser.username}`
                  : '-'}
              </Typography>
            </Box>
          </Stack>

          <Typography variant="subtitle2" sx={{ color: '#636366', mb: 1 }}>
            Creator Remarks
          </Typography>

          <Typography variant="body2" sx={{ color: '#636366', lineHeight: 1.6 }}>
            {logistic?.deliveryDetails?.dietaryRestrictions ||
              "This is a paragraph field about creator's personalized requests, preferences or any additional notes filled by the admin.\nDietary: Halal/Vegetarian/Vegan/No Beef/No Peanuts\nReligious Concerns: Muslim\nMedical Conditions: Eczema"}
          </Typography>
        </Grid>

        {/* RIGHT COLUMN: Product Selector */}
        <Grid item xs={12} md={5}>
          <Typography variant="subtitle2" sx={{ color: '#636366', mb: 2 }}>
            Product
          </Typography>

          {/* Custom Trigger Box */}
          <Box
            onClick={handleOpenDropdown}
            sx={{
              border: '1.5px solid #1340FF',
              borderRadius: 1.5,
              bgcolor: '#fff',
              minHeight: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1,
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: '#F4F6F8',
              },
            }}
          >
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {!hasSelection && (
                <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                  Select products...
                </Typography>
              )}
              {selectedProductIds.map((id) => {
                const product = getProduct(id);
                return (
                  <Chip
                    key={id}
                    label={`${product?.productName} (${quantities[id]})`}
                    onDelete={(e) => handleRemoveItem(id, e)}
                    deleteIcon={<Iconify icon="eva:close-fill" />}
                    size="small"
                    sx={{
                      py: 2,
                      bgcolor: '#fff',
                      boxShadow: '0px -3px 0px 0px #E0E0E0 inset',
                      border: '1px solid #E0E0E0',
                      borderRadius: '6px',
                      fontWeight: 600,
                      color: 'text.primary',
                      '&:hover': { bgcolor: '#fff' },
                      '& .MuiChip-deleteIcon': {
                        color: 'text.disabled',
                        '&:hover': { color: 'text.primary' },
                      },
                    }}
                  />
                );
              })}
            </Box>
            <Iconify
              icon={anchorEl ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-upward-fill'}
              sx={{ color: '#1340FF', ml: 1 }}
            />
          </Box>

          {/* The Dropdown Menu (Popover) */}
          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={handleCloseDropdown}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            transitionDuration={100}
            PaperProps={{
              sx: {
                width: anchorEl?.offsetWidth,
                mt: 1,
                p: 1,
                bgcolor: '#fff',
                boxShadow:
                  '0px -3px 0px 0px #E7E7E7 inset, 0px 20px 40px -4px rgba(145, 158, 171, 0.55)',
                border: '1px solid #E7E7E7',
                borderRadius: '8px',
                maxHeight: 300,
                overflowY: 'auto',
              },
            }}
          >
            <Stack spacing={0.5}>
              {products?.map((product, index) => {
                const quantity = quantities[product.id] || 0;
                const isLast = index === products.length - 1;

                return (
                  <>
                    <Box
                      key={product.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1,
                        borderRadius: 1,
                        '&:hover': { bgcolor: '#F4F6F8' },
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {product.productName}
                      </Typography>

                      {/* Quantity Stepper */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          border: '1px solid #E0E0E0',
                          borderRadius: 20,
                          px: 1,
                          py: 0.5,
                          bgcolor: '#fff',
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => handleUpdateQuantity(product.id, -1)}
                          sx={{ p: 0.5, color: '#1340FF' }}
                        >
                          <Iconify icon="eva:minus-fill" width={16} />
                        </IconButton>

                        <Typography
                          variant="subtitle2"
                          sx={{ minWidth: 24, textAlign: 'center', mx: 0 }}
                        >
                          {quantity}
                        </Typography>

                        <IconButton
                          size="small"
                          onClick={() => handleUpdateQuantity(product.id, 1)}
                          sx={{ p: 0.5, color: '#1340FF' }}
                        >
                          <Iconify icon="eva:plus-fill" width={16} />
                        </IconButton>
                      </Box>
                    </Box>
                    {!isLast && <Divider />}
                  </>
                );
              })}
            </Stack>
          </Popover>
        </Grid>
      </Grid>

      {/* Footer / Action Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 0 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleConfirm}
          disabled={!hasSelection || isSubmitting}
          sx={{
            bgcolor: '#333333',
            color: '#fff',
            px: 6,
            py: 1.5,
            borderRadius: '8px',
            textTransform: 'none',
            boxShadow: '0px -4px 0px 0px #000000 inset',
            backgroundColor: '#3A3A3C',
            fontSize: '1rem',
            fontWeight: 700,
            '&:hover': {
              backgroundColor: '#3A3A3C',
              boxShadow: '0px -4px 0px 0px #000000ef inset',
            },
            '&:active': {
              boxShadow: '0px 0px 0px 0px #000000 inset',
              transform: 'translateY(1px)',
            },
          }}
        >
          {isSubmitting ? 'Confirming...' : 'Confirm'}
        </Button>
      </Box>
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
