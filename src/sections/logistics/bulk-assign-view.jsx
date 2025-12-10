import PropTypes from 'prop-types';
import { useState, useEffect, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import { useSnackbar } from 'src/components/snackbar';

import {
  Box,
  Grid,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
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
import axiosInstance, { fetcher } from 'src/utils/axios';

import EditQuantityDialog from './dialogs/edit-quantity-dialog';
import DeleteProductDialog from './dialogs/delete-product-dialog';

export default function BulkAssignView({ open, onClose, campaign, logistics, onUpdate }) {
  const { enqueueSnackbar } = useSnackbar();

  const productsApiUrl = campaign?.id ? `/api/logistics/products/campaign/${campaign.id}` : null;
  const { data: products } = useSWR(productsApiUrl, fetcher);

  const creators = useMemo(
    () =>
      logistics
        ?.filter((item) => ['PENDING_ASSIGNMENT', 'SCHEDULED'].includes(item.status))
        .map((item) => {
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
        }) || [],
    [logistics]
  );

  const [assignments, setAssignments] = useState({});
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [selectedCreatorIds, setSelectedCreatorIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [productToDelete, setProductToDelete] = useState(null);
  const [openAddProduct, setOpenAddProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');

  const [openEditQuantity, setOpenEditQuantity] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchCreator, setSearchCreator] = useState('');

  useEffect(() => {
    if (open && logistics) {
      const initialAssignments = {};

      // creators valid for editing
      const validCreatorIds = creators.map((creator) => creator.id);

      logistics
        .filter((logistic) => validCreatorIds.includes(logistic.creatorId))
        .forEach((logistic) => {
          if (logistic.deliveryDetails?.items?.length > 0) {
            initialAssignments[logistic.creatorId] = logistic.deliveryDetails.items.map((item) => ({
              productId: item.productId,
              name: item.product?.productName,
              quantity: item.quantity,
            }));
          }
        });

      setAssignments(initialAssignments);
    }
  }, [logistics, open, creators]);

  const filteredCreators = creators.filter((creator) => {
    const matchedSearch =
      creator.name.toLowerCase().includes(searchCreator.toLowerCase()) ||
      creator.handle.toLowerCase().includes(searchCreator.toLowerCase());

    if (!matchedSearch) return false;

    if (filterStatus === 'selected') {
      return selectedCreatorIds.includes(creator.id);
    }
    if (filterStatus === 'assigned') {
      return assignments[creator.id] && assignments[creator.id].length > 0;
    }
    if (filterStatus === 'unassigned') {
      return !assignments[creator.id] || assignments[creator.id].length === 0;
    }

    return true;
  });

  const handleSelectProduct = (product) => {
    const isSelected = selectedProductIds.includes(product.id);
    let newSelectedIds;

    if (isSelected) {
      newSelectedIds = selectedProductIds.filter((id) => id !== product.id);
    } else {
      newSelectedIds = [...selectedProductIds, product.id];
    }

    setSelectedProductIds(newSelectedIds);

    if (selectedCreatorIds.length > 0) {
      setAssignments((prev) => {
        const next = { ...prev };
        selectedCreatorIds.forEach((creatorId) => {
          const currentItems = next[creatorId] || [];

          if (!isSelected) {
            const exists = currentItems.find((i) => i.productId === product.id);
            if (!exists) {
              next[creatorId] = [
                ...currentItems,
                {
                  productId: product.id,
                  name: product.productName,
                  quantity: 1,
                },
              ];
            }
          } else {
            next[creatorId] = currentItems.filter((i) => i.productId !== product.id);
          }
        });
        return next;
      });
    }
  };

  const handleSelectCreator = (creatorId) => {
    const isSelected = selectedCreatorIds.includes(creatorId);

    if (isSelected) {
      setSelectedCreatorIds((prev) => prev.filter((id) => id !== creatorId));
    } else {
      setSelectedCreatorIds((prev) => [...prev, creatorId]);

      // "Paint" logic: If products are active, assign them to this creator
      if (selectedProductIds.length > 0) {
        setAssignments((prev) => {
          const next = { ...prev };
          const currentItems = next[creatorId] || [];

          const productsToAdd = products
            .filter((p) => selectedProductIds.includes(p.id))
            .map((p) => ({
              productId: p.id,
              name: p.productName,
              quantity: 1,
            }));

          const mergedItems = [...currentItems];
          productsToAdd.forEach((newItem) => {
            if (!mergedItems.find((i) => i.productId === newItem.productId)) {
              mergedItems.push(newItem);
            }
          });

          next[creatorId] = mergedItems;
          return next;
        });
      }
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
      setSelectedProductIds([]);
      enqueueSnackbar('Assignments updated successfully', { variant: 'success' });
    } catch (error) {
      console.error('Bulk assign failed', error);
      enqueueSnackbar('Failed to update assignments', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAssignment = (newAssignments) => {
    const cleanedAssignments = {};

    Object.keys(newAssignments).forEach((creatorId) => {
      const items = newAssignments[creatorId];
      const validItems = items.filter((item) => item.quantity !== 0 && item.quantity !== '');

      if (validItems.length > 0) {
        cleanedAssignments[creatorId] = validItems;
      }
    });

    setAssignments(cleanedAssignments);
  };

  const handleAddProduct = async () => {
    if (!newProductName.trim()) return;
    try {
      await axiosInstance.post(`/api/logistics/products/${campaign.id}`, {
        campaignId: campaign.id,
        productName: newProductName,
      });
      mutate(productsApiUrl);
      setNewProductName('');
      setOpenAddProduct(false);
      enqueueSnackbar('Product added successfully', { variant: 'success' });
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Failed to add product', { variant: 'error' });
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      await axiosInstance.delete(`/api/logistics/products/${productToDelete.id}`);

      setAssignments((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((creatorId) => {
          next[creatorId] = next[creatorId].filter((i) => i.productId !== productToDelete.id);
        });
        return next;
      });

      setSelectedProductIds((prev) => prev.filter((id) => id !== productToDelete.id));
      mutate(productsApiUrl);

      enqueueSnackbar('Product deleted', { variant: 'success' });
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Failed to delete product', { variant: 'error' });
    } finally {
      setProductToDelete(null);
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      // 1. Select All IDs
      const allCreatorIds = creators.map((creator) => creator.id);
      setSelectedCreatorIds(allCreatorIds);

      // 2. "Paint" Logic: If products are active in sidebar, assign to EVERYONE
      if (selectedProductIds.length > 0) {
        setAssignments((prev) => {
          const next = { ...prev };

          // Find full product objects for the selected IDs
          const productsToAdd = products
            .filter((p) => selectedProductIds.includes(p.id))
            .map((p) => ({
              productId: p.id,
              name: p.productName,
              quantity: 1,
            }));

          // Loop through ALL creators and add missing products
          allCreatorIds.forEach((creatorId) => {
            const currentItems = next[creatorId] || [];
            const mergedItems = [...currentItems];

            productsToAdd.forEach((newItem) => {
              // Only add if not already assigned
              if (!mergedItems.find((i) => i.productId === newItem.productId)) {
                mergedItems.push(newItem);
              }
            });

            next[creatorId] = mergedItems;
          });

          return next;
        });
      }
    } else {
      // Deselect All
      setSelectedCreatorIds([]);
    }
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
                  variant="contained"
                  startIcon={<Iconify icon="mi:edit-alt" width={24} />}
                  onClick={() => setOpenEditQuantity(true)}
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
                        bgcolor: selectedProductIds.includes(product.id) ? '#1340FF' : '#FFFFFF',
                        color: selectedProductIds.includes(product.id) ? '#FFFFFF' : '#231F20',
                        border: selectedProductIds.includes(product.id)
                          ? '1px solid #1340FF'
                          : '1px solid #D6D6D6',
                        boxShadow: selectedProductIds.includes(product.id)
                          ? 'inset 0px -3px 0px rgba(0, 0, 0, 0.1)' // Subtle darkened bottom lip
                          : 'inset 0px -3px 0px #D6D6D6',
                        '&:hover': {
                          bgcolor: selectedProductIds.includes(product.id)
                            ? '#133effd8'
                            : '#F9FAFB',
                        },
                        '&:active': {
                          boxShadow: selectedProductIds.includes(product.id)
                            ? '0px 0px 0px 0px #0B2DAD inset'
                            : '0px 0px 0px 0px #F4F4F4 inset',
                          transform: 'translateY(1px)',
                        },
                      }}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductToDelete({ id: product.id, name: product.productName });
                          }}
                          sx={{
                            color: selectedProductIds.includes(product.id) ? 'inherit' : '#919EAB',
                            display: 'block',
                          }}
                        />
                      </IconButton>
                    </Box>
                  ))}
                  <Box
                    onClick={() => setOpenAddProduct(true)}
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
                      boxShadow: 'inset 0px -3px 0px rgba(0, 0, 0, 0.1)',
                      bgcolor: '#FFFFFF',
                      color: '#B0B0B0',
                      border: '1px solid #D6D6D6',
                      '&:hover': {
                        bgcolor: '#F9FAFB',
                      },
                      '&:active': {
                        boxShadow: '0px 0px 0px 0px #F4F4F4 inset',
                        transform: 'translateY(1px)',
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      New
                    </Typography>
                    <IconButton size="small" sx={{ color: '#fff' }}>
                      <Iconify
                        icon="eva:plus-outline"
                        width={16}
                        sx={{
                          color: '#919EAB',
                          display: 'block',
                        }}
                      />
                    </IconButton>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={12} md={8}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                  <TextField
                    placeholder="Search Creator"
                    size="small"
                    value={searchCreator}
                    onChange={(e) => setSearchCreator(e.target.value)}
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
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    IconComponent={() => (
                      <Iconify
                        icon="material-symbols:filter-list-rounded"
                        width={20}
                        sx={{
                          color: '#231F20',
                          pointerEvents: 'none', // Allows clicking through to the select
                          position: 'absolute',
                          right: 12,
                        }}
                      />
                    )}
                    sx={{
                      width: 120,
                      bgcolor: '#fff',
                      borderColor: '#EBEBEB',
                      borderRadius: '8px',
                      color: '#1340FF',
                    }}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="selected">Selected</MenuItem>
                    <MenuItem value="assigned">Assigned</MenuItem>
                    <MenuItem value="unassigned">Unassigned</MenuItem>
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
                        <Checkbox
                          checked={
                            selectedCreatorIds.length === creators.length && creators.length > 0
                          }
                          indeterminate={
                            selectedCreatorIds.length > 0 &&
                            selectedCreatorIds.length < creators.length
                          }
                          onChange={handleSelectAll}
                        />
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

                  {filteredCreators.map((creator) => {
                    const isSelected = selectedCreatorIds.includes(creator.id);
                    const assigned = assignments[creator.id] || [];
                    const assignedString =
                      assigned.length > 0
                        ? assigned.map((item) => `${item.name} (${item.quantity})`).join(', ')
                        : '-';

                    return (
                      <Box
                        key={creator.id}
                        sx={{
                          py: 1,
                          px: 2,
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

                  {filteredCreators.length === 0 && (
                    <Box sx={{ p: 4, textAlign: '', color: 'text.secondary' }}>
                      <Typography>No creators found.</Typography>
                    </Box>
                  )}
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>
      <EditQuantityDialog
        open={openEditQuantity}
        onClose={() => setOpenEditQuantity(false)}
        selectedCreatorIds={selectedCreatorIds}
        creators={creators}
        assignments={assignments}
        onSave={handleUpdateAssignment}
      />
      <DeleteProductDialog
        open={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        productName={productToDelete?.name}
        onConfirm={handleDeleteProduct}
      />
      <Dialog open={openAddProduct} onClose={() => setOpenAddProduct(false)}>
        <DialogTitle>Add New Product</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Product Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddProduct(false)}>Cancel</Button>
          <Button onClick={handleAddProduct} variant="contained" disabled={!newProductName.trim()}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
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
