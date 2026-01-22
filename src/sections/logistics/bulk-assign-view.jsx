import PropTypes from 'prop-types';
import useSWR, { mutate } from 'swr';
import { useMemo, useState, useEffect } from 'react';

import {
  Box,
  Grid,
  Stack,
  Button,
  Dialog,
  Avatar,
  Select,
  Checkbox,
  MenuItem,
  TextField,
  Typography,
  IconButton,
  DialogTitle,
  DialogActions,
  DialogContent,
  InputAdornment,
} from '@mui/material';

import axiosInstance, { fetcher } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

import DeleteProductDialog from './dialogs/delete-product-dialog';

export default function BulkAssignView({ open, onClose, campaign, logistics, onUpdate }) {
  const { enqueueSnackbar } = useSnackbar();

  const productsApiUrl = campaign?.id ? `/api/logistics/products/campaign/${campaign.id}` : null;
  const { data: products } = useSWR(productsApiUrl, fetcher);

  const creators = useMemo(() => {
    const realCreators =
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
        }) || [];

    return realCreators;
  }, [logistics]);

  const activeProductIds = useMemo(() => new Set(products?.map((p) => p.id) || []), [products]);

  const [assignments, setAssignments] = useState({});
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [selectedCreatorIds, setSelectedCreatorIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [productToDelete, setProductToDelete] = useState(null);
  const [openAddProduct, setOpenAddProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  const [filterStatus, setFilterStatus] = useState('all');
  const [searchCreator, setSearchCreator] = useState('');
  const [editingProductId, setEditingProductId] = useState(null);
  const [tempQuantity, setTempQuantity] = useState('');
  const [editingCreatorProduct, setEditingCreatorProduct] = useState(null);
  const [tempCreatorQuantity, setTempCreatorQuantity] = useState('');
  const [productBaseQuantities, setProductBaseQuantities] = useState({});

  useEffect(() => {
    if (open && logistics && !isInitialized) {
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
      setIsInitialized(true);
    }
    return () => {
      if (!open) {
        setIsInitialized(false);
        setAssignments({});
        setSelectedCreatorIds([]);
        setSelectedProductIds([]);
      }
    };
  }, [logistics, open, creators, isInitialized]);

  const getProductQuantity = (productId) => productBaseQuantities[productId] || 1;

  // Handle quantity editing
  const handleQuantityClick = (productId, e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Quantity click for product:', productId);
    setEditingProductId(productId);
    const currentQuantity = getProductQuantity(productId);
    setTempQuantity((currentQuantity || 1).toString());
  };

  const handleQuantityChange = (e) => {
    const { value } = e.target;
    if (value === '' || /^\d+$/.test(value)) {
      setTempQuantity(value);
    }
  };

  const handleQuantitySubmit = (productId) => {
    const newQuantity = parseInt(tempQuantity, 10) || 0;
    console.log(
      'Submitting quantity:',
      newQuantity,
      'for product:',
      productId,
      'to creators:',
      selectedCreatorIds
    );

    if (newQuantity > 0) {
      // Save the base quantity for the Product List
      setProductBaseQuantities((prev) => ({
        ...prev,
        [productId]: newQuantity,
      }));
    }

    setEditingProductId(null);
    setTempQuantity('');
  };

  const handleQuantityCancel = () => {
    setEditingProductId(null);
    setTempQuantity('');
  };

  // Handle individual creator-product quantity editing
  const handleCreatorQuantityClick = (creatorId, productId, currentQuantity, e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Creator quantity click:', creatorId, productId, currentQuantity);
    setEditingCreatorProduct({ creatorId, productId });
    setTempCreatorQuantity(currentQuantity.toString());
  };

  const handleCreatorQuantityChange = (e) => {
    const { value } = e.target;
    if (value === '' || /^\d+$/.test(value)) {
      setTempCreatorQuantity(value);
    }
  };

  const handleCreatorQuantitySubmit = () => {
    const newQuantity = parseInt(tempCreatorQuantity, 10) || 0;
    if (newQuantity >= 0 && editingCreatorProduct) {
      const { creatorId, productId } = editingCreatorProduct;
      const newAssignments = { ...assignments };

      if (!newAssignments[creatorId]) {
        newAssignments[creatorId] = [];
      }

      const existingIndex = newAssignments[creatorId].findIndex(
        (item) => item.productId === productId
      );

      if (newQuantity > 0) {
        const product = products.find((p) => p.id === productId);
        const productData = {
          productId,
          name: product?.productName,
          quantity: newQuantity,
        };

        if (existingIndex >= 0) {
          newAssignments[creatorId][existingIndex] = productData;
        } else {
          newAssignments[creatorId].push(productData);
        }
      } else if (existingIndex >= 0) {
        // Remove the product if quantity is 0
        newAssignments[creatorId].splice(existingIndex, 1);
      }

      setAssignments(newAssignments);
    }

    setEditingCreatorProduct(null);
    setTempCreatorQuantity('');
  };

  const handleCreatorQuantityCancel = () => {
    setEditingCreatorProduct(null);
    setTempCreatorQuantity('');
  };

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
  };

  const handleSelectCreator = (creatorId) => {
    setSelectedCreatorIds((prev) =>
      prev.includes(creatorId) ? prev.filter((id) => id !== creatorId) : [...prev, creatorId]
    );
  };

  const handleClose = () => {
    // Reset everything to empty state when canceling
    setAssignments({});
    setSelectedCreatorIds([]);
    setSelectedProductIds([]);
    setProductBaseQuantities({});
    setEditingProductId(null);
    setEditingCreatorProduct(null);
    onClose();
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        assignments: Object.entries(assignments)
          .map(([creatorId, items]) => ({
            creatorId,
            items: items
              .filter((item) => activeProductIds.has(item.productId))
              .map(({ productId, quantity }) => ({ productId, quantity })),
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
      setProductBaseQuantities({});

      enqueueSnackbar('Assignments updated successfully', { variant: 'success' });
    } catch (error) {
      console.error('Bulk assign failed', error);
      enqueueSnackbar('Failed to update assignments', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
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
          next[creatorId] = next[creatorId].filter((item) => item.productId !== productToDelete.id);
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
    } else {
      setSelectedCreatorIds([]);
    }
  };

  const handleAssign = () => {
    if (selectedProductIds.length === 0 || selectedCreatorIds.length === 0) {
      enqueueSnackbar('Select both products and creators first', { variant: 'info' });
      return;
    }

    const newAssignments = { ...assignments };

    const productsToAssign = products
      .filter((p) => selectedProductIds.includes(p.id))
      .map((p) => ({
        productId: p.id,
        name: p.productName,
        quantity: getProductQuantity(p.id), // Default quantity when assigned via bulk
      }));

    selectedCreatorIds.forEach((creatorId) => {
      // Overwrite existing assignment for these specific creators as per requirement
      newAssignments[creatorId] = productsToAssign.map((item) => ({ ...item }));
    });

    setAssignments(newAssignments);

    // Process repeat: Deselect selections
    setSelectedProductIds([]);
    setSelectedCreatorIds([]);
    setProductBaseQuantities({});

    enqueueSnackbar(
      'Products temporarily saved, click confirm to assign products to selected creators',
      { variant: 'success' }
    );
  };

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={handleClose}
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
              onClick={handleClose}
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
            <Typography variant="body2" sx={{ color: '#231F20' }}>
              Select products and creators to assign.
            </Typography>
            <Typography variant="body2" sx={{ color: '#231F20' }}>
              You can set different product quantities under Product List
            </Typography>
          </Stack>

          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 4 }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={4} display="flex" flexDirection="column" alignItems="center">
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
                <Stack spacing={1.5} sx={{ alignItems: 'flex-start', width: '33%' }}>
                  {products?.map((product) => (
                    <Stack direction="row" spacing={1}>
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
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            mr: 1,
                            cursor: 'pointer',
                            flex: 1,
                          }}
                        >
                          {product.productName}
                        </Typography>
                        {selectedProductIds.includes(product.id) &&
                          (getProductQuantity(product.id) > 0 ||
                            editingProductId === product.id ||
                            selectedCreatorIds.length === 0) &&
                          (editingProductId === product.id ? (
                            <Box
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                mx: 1,
                              }}
                            >
                              <input
                                ref={(input) => input && input.focus()}
                                type="text"
                                value={tempQuantity}
                                onChange={handleQuantityChange}
                                onBlur={() => handleQuantitySubmit(product.id)}
                                style={{
                                  width: '28px',
                                  height: '20px',
                                  borderRadius: '12px', // More curvy/rounded
                                  border: '1px solid #EBEBEB',
                                  textAlign: 'center',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  color: '#000000', // Black font color
                                  backgroundColor: '#FFFFFF',
                                  outline: 'none',
                                  boxSizing: 'border-box',
                                  transition: 'width 0.1s ease',
                                }}
                              />
                            </Box>
                          ) : (
                            <Box
                              onClick={(e) => handleQuantityClick(product.id, e)}
                              onMouseDown={(e) => e.stopPropagation()}
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '28px',
                                height: '20px',
                                bgcolor: '#FFFFFF',
                                color: '#000000',
                                borderRadius: '12px',
                                border: '1px solid #EBEBEB',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                mx: 1,
                                cursor: 'pointer',
                                opacity: 1,
                                boxSizing: 'border-box',
                                zIndex: 10,
                                position: 'relative',
                                '&:hover': {
                                  bgcolor: '#f5f5f5',
                                },
                              }}
                            >
                              {getProductQuantity(product.id) || 1}
                            </Box>
                          ))}
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProductToDelete({ id: product.id, name: product.productName });
                        }}
                        sx={{
                          width: 50,
                          borderRadius: 1,
                          '&:hover': { bgcolor: '#FFF5F5' },
                        }}
                      >
                        <Iconify icon="eva:trash-2-outline" color="#FF3030" width={20} />
                      </IconButton>
                    </Stack>
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
              <Grid item xs={12} md={8} sx={{ pl: 2 }}>
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
                      width: '400px',
                      height: '40px',
                      bgcolor: '#FFFFFF',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        border: '1px solid #E7E7E7',
                        boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                        height: '40px',
                        '& fieldset': {
                          border: 'none',
                        },
                        '&:hover fieldset': {
                          border: 'none',
                        },
                        '&.Mui-focused fieldset': {
                          border: 'none',
                        },
                      },
                      '& .MuiOutlinedInput-input': {
                        padding: '6px 12px 9px 12px',
                        height: 'auto',
                      },
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
                      mr: 14,
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
                    ml: -3, // Move slightly to the left
                    maxHeight: '400px', // Limit maximum height
                    display: 'flex',
                    flexDirection: 'column',
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
                      <Grid
                        item
                        xs={6}
                        display="flex"
                        alignItems="center"
                        sx={{ justifyContent: 'flex-start', ml: -4 }}
                      >
                        <Typography variant="subtitle2">Products</Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Scrollable creators list container */}
                  <Box
                    sx={{
                      overflowY: 'auto',
                      maxHeight: '320px',
                      flex: 1,
                    }}
                  >
                    {filteredCreators.map((creator) => {
                      const isSelected = selectedCreatorIds.includes(creator.id);
                      const assigned = assignments[creator.id] || [];

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
                              <Avatar
                                src={creator.photoURL}
                                sx={{ width: 40, height: 40, mr: 2 }}
                              />
                              <Box>
                                <Typography variant="subtitle2" sx={{ lineHeight: 0.5 }}>
                                  {creator.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {creator.handle}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6} sx={{ ml: -4 }}>
                              {assigned.length > 0 ? (
                                <Box
                                  sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 1,
                                    alignItems: 'center',
                                  }}
                                >
                                  {assigned
                                    .filter((item) => activeProductIds.has(item.productId))
                                    .map((item, index, filteredArray) => (
                                      <Box
                                        key={item.productId}
                                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                                      >
                                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                                          {item.name}
                                        </Typography>
                                        {editingCreatorProduct?.creatorId === creator.id &&
                                        editingCreatorProduct?.productId === item.productId ? (
                                          <input
                                            ref={(input) => input && input.focus()}
                                            type="text"
                                            value={tempCreatorQuantity}
                                            onChange={handleCreatorQuantityChange}
                                            onBlur={handleCreatorQuantitySubmit}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                handleCreatorQuantitySubmit();
                                              } else if (e.key === 'Escape') {
                                                handleCreatorQuantityCancel();
                                              }
                                            }}
                                            style={{
                                              width: '28px',
                                              height: '20px',
                                              borderRadius: '12px',
                                              border: '1px solid #1340FF',
                                              textAlign: 'center',
                                              fontSize: '0.75rem',
                                              fontWeight: 700,
                                              color: '#000000',
                                              backgroundColor: '#FFFFFF',
                                              outline: 'none',
                                              boxSizing: 'border-box',
                                            }}
                                          />
                                        ) : (
                                          <Box
                                            onClick={(e) =>
                                              handleCreatorQuantityClick(
                                                creator.id,
                                                item.productId,
                                                item.quantity,
                                                e
                                              )
                                            }
                                            onMouseDown={(e) => e.stopPropagation()}
                                            sx={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              width: '28px',
                                              height: '20px',
                                              bgcolor: '#FFFFFF',
                                              color: '#000000',
                                              borderRadius: '12px',
                                              border: '1px solid #1340FF',
                                              fontSize: '0.75rem',
                                              fontWeight: 700,
                                              cursor: 'pointer',
                                              opacity: 1,
                                              boxSizing: 'border-box',
                                              zIndex: 10,
                                              position: 'relative',
                                              '&:hover': {
                                                bgcolor: '#f5f5f5',
                                              },
                                            }}
                                          >
                                            {item.quantity}
                                          </Box>
                                        )}
                                        {index < filteredArray.length - 1 && (
                                          <Typography
                                            variant="body2"
                                            sx={{ color: 'text.primary' }}
                                          >
                                            ,
                                          </Typography>
                                        )}
                                      </Box>
                                    ))}
                                </Box>
                              ) : (
                                <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                                  -
                                </Typography>
                              )}
                            </Grid>
                          </Grid>
                        </Box>
                      );
                    })}

                    {filteredCreators.length === 0 && (
                      <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                        <Typography>No creators found.</Typography>
                      </Box>
                    )}
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>
      {/* <EditQuantityDialog
        open={openEditQuantity}
        onClose={() => setOpenEditQuantity(false)}
        selectedCreatorIds={selectedCreatorIds}
        creators={creators}
        assignments={assignments}
        onSave={handleUpdateAssignment}
      /> */}
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
