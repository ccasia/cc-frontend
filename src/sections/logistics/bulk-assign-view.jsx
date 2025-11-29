import PropTypes from 'prop-types';
import { useState, useMemo } from 'react';
import useSWR from 'swr';

import {
  Box,
  Grid,
  Stack,
  Button,
  Dialog,
  Avatar,
  Checkbox,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import { fetcher } from 'src/utils/axios';
import axiosInstance from 'src/utils/axios';

// import EditQuantityDialog from './dialogs/edit-quantity-dialog';
// import DeleteProductDialog from './dialogs/delete-product-dialog';

export default function BulkAssignView({ open, onClose, campaign, logistics, onUpdate }) {
  const { data: products } = useSWR(
    campaign?.id ? `/api/logistics/products/campaign/${campaign.id}` : null,
    fetcher
  );

  const creators =
    logistics.map((item) => {
      const socialMediaHandle =
        item.creator?.creator?.instagramUser?.username ||
        item.creator?.creator?.tiktokUser?.username;

      return {
        id: item.creatorId,
        name: item.creator?.name,
        photoURL: item.creator?.photoURL,
        handle: socialMediaHandle ? `@${socialMediaHandle}` : '-',
        existingItems: item.deliveryDetails?.items || [],
      };
    }) || [];

  const [selectedCreatorIds, setSelectedCreatorIds] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [openEditQuantity, setOpenEditQuantity] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProductIds, setActiveProductIds] = useState([]);

  //helper function
  const assignProductsToCreators = (productsList, creatorIds) => {
    setAssignments((prev) => {
      const next = { ...prev };

      for (const creatorId of creatorIds) {
        const currentItems = next[creatorId] || [];
        const existingIds = new Set(currentItems.map((item) => item.productId));

        const newItems = productsList
          .filter((product) => !existingIds.has(product.id))
          .map((product) => ({
            productId: product.id,
            name: product.productName,
            quantity: 1,
          }));

        if (newItems.length > 0) {
          next[creatorId] = [...currentItems, ...newItems];
        }
      }
      return next;
    });
  };

  const handleSelectProduct = (product) => {
    const isSelected = selectedProductIds.includes(product.id);

    setActiveProductIds((prev) =>
      isSelected ? prev.filter((id) => id !== product.id) : [...prev, product.id]
    );

    setAssignments((prev) => {
      if (isSelected) {
        return Object.fromEntries(
          Object.entries(prev).map(([creatorId, items]) => [
            creatorId,
            items.filter((item) => item.productId !== product.id),
          ])
        );
      }
      const next = { ...prev };
      const newItem = {
        productId: product.id,
        name: product.productName,
        quantity: 1,
      };

      selectedCreatorIds.forEach((creatorId) => {
        const currentItems = next[creatorId] || [];
        if (!currentItems.some((item) => item.productId === product.id)) {
          next[creatorId] = [...currentItems, newItem];
        }
      });

      return next;
    });
  };

  const handleSelectCreator = (creatorId) => {
    const isSelected = selectedCreatorIds.includes(creatorId);

    setSelectedCreatorIds((prev) =>
      isSelected ? prev.filter((id) => id !== creatorId) : [...prev, creatorId]
    );

    setAssignments((prev) => {
      if (isSelected) {
        const { [creatorId]: removed, ...rest } = prev;
        return rest;
      }

      if (selectedProductIds.length === 0) return prev;

      const productsToAdd = products
        .filter((p) => selectedProductIds.includes(p.id))
        .map((p) => ({
          productId: p.id,
          name: p.productName,
          quantity: 1,
        }));

      return { ...prev, [creatorId]: productsToAdd };
    });
  };

  const handleSelectAllCreators = (event) => {
    if (event.target.checked) {
      const allIds = creators.filter((creator) => creator.id).map((creator) => creator.id);
      setSelectedCreatorIds(allIds);

      if (selectedProductIds.length > 0) {
        const productsToAssign = products.filter((product) =>
          selectedProductIds.includes(product.id)
        );
        assignProductsToCreators(productsToAssign, allIds);
      }
    } else {
      setSelectedCreatorIds([]);
      setAssignments({});
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        assignments: Object.entries(assignments)
          .map(([creatorId, items]) => ({
            creatorId,
            items: items.map(({ productId, quantity }) => ({ productId, quantity })),
          }))
          .filter((assignment) => assignment.items.length > 0),
      };

      if (payload.assignments.length === 0) {
        onClose();
        return;
      }

      await axiosInstance.post(`/api/logistics/bulk-assign/${campaign.id}`, payload);
      onUpdate();
      onClose();
      setAssignments({});
      setSelectedCreatorIds([]);
      setActiveProductIds([]);
    } catch {
      console.error('Bulk assign failed', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAssignment = (creatorId, productId, actionOrDelta) => {
    setAssignments((prev) => {
      const next = { ...prev };
      const currentItems = next[creatorId] || [];

      if (actionOrDelta === 'remove') {
        next[creatorId] = currentItems.filter((item) => item.productId !== productId);
      } else {
        next[creatorId] = currentItems
          .map((item) => {
            if (item.productId === productId) {
              return { ...item, quantity: Math.max(0, item.quantity + actionOrDelta) };
            }
            return item;
          })
          .filter((item) => item.quantity > 0);
      }
    });
  };

  const handleDeleteProduct = () => {
    if (!productToDelete) return;
    setAssignments((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((creatorId) => {
        next[creatorId] = next[creatorId].filter((i) => i.productId !== productToDelete.id);
      });
      return next;
    });
    setProductToDelete(null);
  };

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { bgcolor: '#F4F4F4', p: 1 },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#FFFFFF',
          borderRadius: '16px',
          height: '100%',
        }}
      >
        <Box
          sx={{
            px: 4,
            py: 2,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            flexShrink: 0,
          }}
        >
          <Box fullWidth sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 1 }}>
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{
                borderRadius: '8px',
                color: '#231F20',
                bgcolor: '#FFFFFF',
                boxShadow: '0px -4px 0px 0px #F4F4F4 inset',
                borderColor: '#F4F4F4',
                '&:hover': {
                  bgcolor: '#FFFFFF',
                  borderColor: '#F4F4F4',
                  boxShadow: '0px -4px 0px 0px #F4F4F4 inset',
                },
                '&:active': {
                  boxShadow: '0px 0px 0px 0px #F4F4F4 inset',
                  transform: 'translateY(1px)',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirm}
              disabled={isSubmitting}
              sx={{
                borderRadius: '8px',
                boxShadow: '0px -4px 0px 0px #00000073 inset',
                bgcolor: '#3A3A3C',
                '&:hover': { bgcolor: '#3a3a3cd1', boxShadow: '0px -4px 0px 0px #000000 inset' },
                '&:active': {
                  boxShadow: '0px 0px 0px 0px #000000 inset',
                  transform: 'translateY(1px)',
                },
              }}
            >
              {isSubmitting ? 'Saving...' : 'Confirm'}
            </Button>
          </Box>
        </Box>
        <Box fullWidth>
          <Stack alignItems="center" sx={{ flexGrow: 1, mb: 4 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                bgcolor: '#CCF209',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                mb: 1,
              }}
            >
              📦
            </Box>
            <Typography variant="h3" sx={{ fontFamily: 'instrument serif', color: '#231F20' }}>
              Edit & Bulk Assign Logistics
            </Typography>
            <Typography variant="body2" sx={{ color: '#636366' }}>
              Select products and creators to assign.
            </Typography>
            <Typography variant="body2" sx={{ color: '#636366' }}>
              You can set different product quantities in{' '}
              <Iconify
                icon="mi:edit-alt"
                width={24}
                sx={{ verticalAlign: 'middle', mb: 0.5, mr: 0.5 }}
              />
              <strong>Edit</strong>
            </Typography>
          </Stack>

          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 4 }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={4} display="flex" flexDirection="column" alignItems="center">
                <Button
                  // fullWidth
                  variant="contained"
                  startIcon={<Iconify icon="mi:edit-alt" width={24} />}
                  onClick={() => setOpenEditQty(true)}
                  disabled={selectedCreatorIds.length === 0}
                  sx={{
                    mb: 4,
                    px: 2,
                    py: 1,
                    boxShadow: '0px -4px 0px 0px #0B2DAD inset',
                    fontSize: '1rem',
                    fontWeight: 700,
                    bgcolor: '#1340FF',
                    color: '#fff',
                    borderRadius: '8px',
                    '&:hover': {
                      bgcolor: '#133effd8',
                      boxShadow: '0px -4px 0px 0px #0B2DAD inset',
                    },
                    '&:active': {
                      boxShadow: '0px 0px 0px 0px #0B2DAD inset',
                      transform: 'translateY(1px)',
                    },
                  }}
                >
                  Edit Quantity
                </Button>
                <Typography variant="body2" sx={{ mb: 2, alignItems: 'center', fontWeight: 600 }}>
                  Product List
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    ({selectedProductIds.length} Selected)
                  </Typography>
                </Typography>
                <Stack spacing={1.5}>
                  {products?.map((product) => (
                    // chip for list of products
                    <Box
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 'fit-content',
                        p: 1,
                        pl: 2,
                        cursor: 'pointer',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                        // Conditional Styles based on selection
                        bgcolor: selectedProductIds.includes(product.id) ? '#1340FF' : '#FFFFFF',
                        color: selectedProductIds.includes(product.id) ? '#FFFFFF' : '#231F20',
                        border: selectedProductIds.includes(product.id)
                          ? '1px solid #1340FF'
                          : '1px solid #D6D6D6',
                        boxShadow: selectedProductIds.includes(product.id)
                          ? 'inset 0px -3px 0px rgba(0, 0, 0, 0.1)' // Subtle darkened bottom lip
                          : 'inset 0px -3px 0px #D6D6D6',

                        // Hover states
                        // '&:hover': {
                        //   bgcolor: selectedProductIds.includes(product.id)
                        //     ? '#133effd8'
                        //     : '#F9FAFB',
                        // },

                        // Click/Active states
                        '&:active': {
                          boxShadow: selectedProductIds.includes(product.id)
                            ? '0px 0px 0px 0px #0B2DAD inset'
                            : '0px 0px 0px 0px #F4F4F4 inset',
                          transform: 'translateY(1px)',
                        },
                      }}
                      // {{
                      //       mb: 4,
                      //       px: 2,
                      //       py: 1,
                      //       boxShadow: '0px -4px 0px 0px #0B2DAD inset',
                      //       fontSize: '1rem',
                      //       fontWeight: 700,
                      //       bgcolor: '#1340FF',
                      //       color: '#fff',
                      //       borderRadius: '8px',
                      //       '&:hover': {
                      //         bgcolor: '#133effd8',
                      //         boxShadow: '0px -4px 0px 0px #0B2DAD inset',
                      //       },
                      //       '&:active': {
                      //         boxShadow: '0px 0px 0px 0px #0B2DAD inset',
                      //         transform: 'translateY(1px)',
                      //       },
                      //     }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {product.productName}
                      </Typography>
                      <IconButton
                        size="small"
                        sx={{ color: '#fff', opacity: 0.7, '&:hover': { opacity: 1 } }}
                      >
                        <Iconify
                          icon="eva:close-fill"
                          width={16}
                          sx={{
                            color: selectedProductIds.includes(product.id) ? 'inherit' : '#919EAB',
                            display: 'block',
                          }}
                        />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              </Grid>
              <Grid item xs={12} md={8}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                  <TextField
                    placeholder="Search Creator"
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      width: 300,
                      bgcolor: '#fff',
                      '& .MuiOutlinedInput-root': { borderRadius: '8px' },
                    }}
                  />
                  <Select
                    size="small"
                    value="all"
                    sx={{ width: 120, bgcolor: '#fff', borderRadius: '8px' }}
                  >
                    <MenuItem value="all" onClick={handleSelectAllCreators}>
                      All
                    </MenuItem>
                  </Select>
                </Stack>
                <Stack
                  spacing={0}
                  sx={{
                    bgcolor: '#fff',
                    borderRadius: '12px',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 2,
                    }}
                  >
                    <Grid container>
                      <Grid item xs={6} display="flex" alignItems="center">
                        {/* <Checkbox
                          checked={
                            selectedCreatorIds.length === creators.length && creators.length > 0
                          }
                          indeterminate={
                            selectedCreatorIds.length > 0 &&
                            selectedCreatorIds.length < creators.length
                          }
                          // onChange={handleSelectAll}
                        /> */}
                        <Typography variant="subtitle2" sx={{ ml: 1 }}>
                          Assigning to{' '}
                          <Typography component="span" variant="caption">
                            ({selectedCreatorIds.length} Selected)
                          </Typography>
                        </Typography>
                      </Grid>
                      <Grid item xs={6} display="flex" alignItems="center">
                        <Typography variant="subtitle2">Products</Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  {creators.map((creator) => {
                    const isSelected = selectedCreatorIds.includes(creator.id);
                    const assigned = assignments[creator.id] || [];
                    const assignedString =
                      assigned.length > 0
                        ? assigned.map((i) => `${i.name} (${i.quantity})`).join(', ')
                        : '-';

                    return (
                      <Box
                        key={creator.id}
                        sx={{
                          py: 1,
                          px: 2,
                          // borderBottom: '1px solid #F4F6F8',
                          // '&:hover': { bgcolor: '#FAFAFA' },
                        }}
                      >
                        <Grid container alignItems="center">
                          <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleSelectCreator(creator.id)}
                              sx={{
                                mr: 1,
                                color: '#1340FF',
                                '&.Mui-checked': {
                                  color: '#1340FF',
                                },
                              }}
                            />
                            <Avatar src={creator.photoURL} sx={{ width: 40, height: 40, mr: 2 }} />
                            <Box>
                              <Typography variant="subtitle2" sx={{ lineHeight: 0.5 }}>
                                {creator.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {creator.handle}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography
                              variant="body2"
                              noWrap
                              sx={{ color: assigned.length ? 'text.primary' : 'text.disabled' }}
                            >
                              {assignedString}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    );
                  })}
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}

BulkAssignView.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  campaign: PropTypes.object,
  logistics: PropTypes.array,
  onUpdate: PropTypes.func,
};
