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

  const handleSelectAllCreators = (event) => {
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
          <Stack alignItems="center" sx={{ flexGrow: 1, mb: 1, px: { xs: 2, md: 0 } }}>
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
            <Typography
              variant="body2"
              sx={{ fontSize: { xs: 12, md: 14 }, color: '#231F20', textAlign: 'center' }}
            >
              Select products and creators to assign.
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontSize: { xs: 12, md: 14 }, color: '#231F20', textAlign: 'center' }}
            >
              Only creators that are{' '}
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: 0.5,
                  py: 0.5,
                  mx: 0.5,
                  borderRadius: '6px',
                  border: `1px solid #B0B0B0`,
                  boxShadow: `0px -2px 0px 0px #B0B0B0 inset`,
                  color: '#B0B0B0',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  verticalAlign: 'middle',
                  cursor: 'default',
                }}
              >
                Unassigned
              </Box>{' '}
              and{' '}
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: 0.5,
                  py: 0.5,
                  mx: 0.5,
                  borderRadius: '6px',
                  border: `1px solid #FF9A02`,
                  boxShadow: `0px -2px 0px 0px #FF9A02 inset`,
                  color: '#FF9A02',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  verticalAlign: 'middle',
                  cursor: 'default',
                }}
              >
                Yet To Ship
              </Box>{' '}
              will appear here.
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontSize: { xs: 12, md: 14 }, color: '#231F20', textAlign: 'center' }}
            >
              Assigning new products to a creator replaces the previous products assigned.{' '}
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontSize: { xs: 12, md: 14 }, color: '#231F20', textAlign: 'center' }}
            >
              You can edit product quantity for individual creators after assigning here{' '}
              <Box
                sx={{
                  display: 'inline-flex',
                  width: '28px',
                  height: '20px',
                  borderRadius: '12px',
                  border: '1.5px solid #1340FF',
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#000000',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  boxSizing: 'border-box',
                  justifyContent: 'center',
                }}
              >
                1
              </Box>
            </Typography>
          </Stack>

          {/* --- MAIN CONTENT AREA --- */}
          <Box
            sx={{ flexGrow: 1, px: { xs: 2, md: 4 }, p: 4, overflow: 'hidden', display: 'flex' }}
          >
            <Grid container sx={{ height: '100%' }} spacing={0}>
              {/* COLUMN 1: STEP 1 (Left Sidebar) */}
              <Grid
                item
                xs={12}
                md={4}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: { xs: 'flex-start', md: 'flex-end' },
                  pr: 3,
                  // pl: 12,
                }}
              >
                <Stack
                  alignItems="flex-start"
                  spacing={1}
                  sx={{ overflowY: 'auto', flexGrow: 1, pb: 2 }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: 'text.secondary', display: 'block' }}
                  >
                    STEP 1 <br />
                    <Typography component="span" variant="subtitle2" color="text.primary">
                      Product List
                    </Typography>{' '}
                    ({selectedProductIds.length} Selected)
                  </Typography>
                  <Stack
                    spacing={1}
                    useFlexGap
                    flexWrap="wrap"
                    direction={{ xs: 'row', md: 'column' }}
                  >
                    {products?.map((product) => (
                      <Stack direction="row" spacing={{ xs: 0, md: 0.5 }}>
                        <Box
                          key={product.id}
                          onClick={() => handleSelectProduct(product)}
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 'fit-content',
                            px: { xs: 0.5, md: 1.5 },
                            py: { xs: 0, md: 0.5 },
                            borderRadius: '8px',
                            transition: 'all 0.2s ease',
                            bgcolor: selectedProductIds.includes(product.id)
                              ? '#1340FF'
                              : '#FFFFFF',
                            color: selectedProductIds.includes(product.id) ? '#FFFFFF' : '#231F20',
                            border: selectedProductIds.includes(product.id)
                              ? '1px solid #1340FF'
                              : '1px solid #D6D6D6',
                            boxShadow: selectedProductIds.includes(product.id)
                              ? 'inset 0px -3px 0px rgba(0, 0, 0, 0.1)'
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
                              fontSize: { xs: 12, md: 16 },
                              fontWeight: 600,
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
                                  ml: 1,
                                }}
                              >
                                <input
                                  ref={(input) => input && input.focus()}
                                  type="text"
                                  value={tempQuantity}
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onChange={handleQuantityChange}
                                  onBlur={() => handleQuantitySubmit(product.id)}
                                  style={{
                                    width: '30px',
                                    height: '22px',
                                    borderRadius: '14px', // More curvy/rounded
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
                                  width: { xs: '20px', md: '30px' },
                                  height: { xs: '18px', md: '22px' },
                                  bgcolor: '#FFFFFF',
                                  color: '#000000',
                                  borderRadius: '14px',
                                  border: '1px solid #EBEBEB',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  ml: 1,
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
                            width: 40,
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
                        px: 1.5,
                        py: 0.5,
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
                      <Typography
                        variant="body2"
                        sx={{ fontSize: { xs: 11, md: 16 }, fontWeight: 600 }}
                      >
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
                </Stack>
              </Grid>

              {/* COLUMNS 2 & 3: THE SYNCED WORKSPACE */}
              <Grid
                item
                xs={12}
                md={8}
                sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                {/* 2A: STATIC HEADER (Step 2 & 3 titles) */}
                <Grid container spacing={0}>
                  {/* Step 2 Header */}
                  <Grid
                    item
                    xs={7.5}
                    md={4.5}
                    sx={{
                      pl: { xs: 0, md: 3 },
                      // pr: 3,
                      pb: 0,
                      borderLeft: { xs: 'none', md: '1px solid #EAEAEA' },
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ pb: 1 }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 700, color: 'text.secondary' }}
                      >
                        STEP 2 <br />{' '}
                        <Typography component="span" variant="subtitle2" color="text.primary">
                          Assigning to
                        </Typography>{' '}
                        ({selectedCreatorIds.length} Selected)
                      </Typography>
                    </Stack>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search Creator"
                      value={searchCreator}
                      onChange={(e) => setSearchCreator(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Iconify icon="eva:search-fill" width={18} />
                          </InputAdornment>
                        ),
                        sx: { height: 40, borderRadius: 1.5, bgcolor: '#F9FAFB' },
                      }}
                      sx={{
                        mb: 1,
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
                    <Box display="flex" alignItems="center" sx={{ ml: -1 }}>
                      <Checkbox
                        size="small"
                        checked={
                          selectedCreatorIds.length === creators.length && creators.length > 0
                        }
                        onChange={handleSelectAllCreators}
                      />
                      <Typography variant="caption" fontWeight={600}>
                        Select all
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Step 3 Header */}
                  <Grid item xs={4.5} md={7.5} sx={{ pl: 2 }}>
                    <Box sx={{ height: 40, mb: 1, display: 'flex', alignItems: 'center' }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleAssign}
                        disabled={
                          selectedCreatorIds.length === 0 || selectedProductIds.length === 0
                        }
                        sx={{
                          width: 140,
                          height: 36,
                          padding: { xs: '4px 8px', sm: '6px 10px' },
                          borderRadius: '8px',
                          boxShadow: '0px -4px 0px 0px #0c2aa6 inset',
                          backgroundColor: '#1340FF',
                          color: '#FFFFFF',
                          fontSize: { xs: 12, sm: 14, md: 16 },
                          fontWeight: 600,
                          textTransform: 'none',
                          '&:hover': {
                            backgroundColor: '#133effd3',
                            boxShadow: '0px -3px 0px 0px #0c2aa6 inset',
                          },
                          '&:active': {
                            boxShadow: '0px 0px 0px 0px #0c2aa6 inset',
                            transform: 'translateY(1px)',
                          },
                        }}
                      >
                        Assign
                      </Button>
                    </Box>
                    <Box sx={{ height: 40, mb: 2, display: 'flex' }}>
                      <Select
                        size="small"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        IconComponent={() => (
                          <Iconify
                            icon="material-symbols:filter-list-rounded"
                            width={15}
                            sx={{
                              height: 32,
                              color: '#231F20',
                              pointerEvents: 'none',
                              position: 'absolute',
                              right: 12,
                              ml: 5,
                            }}
                          />
                        )}
                        sx={{
                          height: 40,
                          width: 140,
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
                    </Box>
                  </Grid>
                </Grid>

                {/* 2B: SCROLLABLE CREATORS (Steps 2 & 3 synced) */}
                <Box
                  sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    maxHeight: '320px',
                    msOverflowStyle: 'none' /* IE/Edge */,
                    scrollbarWidth: 'none' /* Firefox */,
                    '&::-webkit-scrollbar': { display: 'none' } /* Chrome/Safari */,
                  }}
                >
                  {filteredCreators.map((creator) => {
                    const isSelected = selectedCreatorIds.includes(creator.id);
                    const assigned = assignments[creator.id] || [];

                    return (
                      <Grid container spacing={0} key={creator.id}>
                        {/* Creator Info (Matches Step 2 Header) */}
                        <Grid
                          item
                          xs={6}
                          md={4.5}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            ml: { xs: -1, md: 0 },
                            py: 1,
                            px: { xs: 0, md: 2 },
                            borderLeft: { xs: 'none', md: '1px solid #EAEAEA' },
                          }}
                        >
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleSelectCreator(creator.id)}
                            sx={{
                              mr: { xs: 0, md: 1 },
                              color: '#1340FF',
                              '&.Mui-checked': {
                                color: '#1340FF',
                              },
                            }}
                          />
                          <Avatar
                            src={creator.photoURL}
                            sx={{ width: { xs: 36, md: 40 }, height: { xs: 36, md: 40 }, mr: 2 }}
                          />
                          <Box sx={{ minWidth: 10 }}>
                            <Typography
                              variant="subtitle2"
                              noWrap
                              sx={{ fontSize: { xs: 12, md: 16 }, lineHeight: 0.8 }}
                            >
                              {creator.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              noWrap
                              sx={{ fontSize: { xs: 11, md: 14 }, lineHeight: 0.8 }}
                            >
                              {creator.handle}
                            </Typography>
                          </Box>
                        </Grid>

                        {/* Product Info (Matches Step 3 Header) */}
                        <Grid
                          item
                          xs={6}
                          md={7.5}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            pl: { xs: 0, md: 3 },
                            py: { xs: 0, md: 2 },
                            justifyContent: { xs: 'center', md: 'start' },
                          }}
                        >
                          {assigned.length > 0 ? (
                            <Box
                              sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 0.5,
                                alignItems: 'center',
                              }}
                            >
                              {assigned
                                .filter((i) => activeProductIds.has(i.productId))
                                .map((item, idx, arr) => (
                                  <Stack
                                    key={item.productId}
                                    direction="row"
                                    alignItems="center"
                                    spacing={0.5}
                                  >
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontSize: { xs: 11, md: 16 },
                                        color: '#231F20',
                                        fontWeight: 500,
                                      }}
                                    >
                                      {item.name}
                                    </Typography>

                                    {/* Internal Creator Quantity Edit */}
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
                                          width: '30px',
                                          height: '22px',
                                          borderRadius: '12px',
                                          border: '1.5px solid #1340FF',
                                          textAlign: 'center',
                                          fontSize: { xs: 11, md: '0.75rem' },
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
                                          width: { xs: '25px', md: '30px' },
                                          height: { xs: '18px', md: '22px' },
                                          bgcolor: '#FFFFFF',
                                          color: '#000000',
                                          borderRadius: '12px',
                                          border: '1.5px solid #133eff70',
                                          fontSize: { xs: 11, md: '0.75rem' },
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
                                    {idx < arr.length - 1 && (
                                      <Typography variant="caption">,</Typography>
                                    )}
                                  </Stack>
                                ))}
                            </Box>
                          ) : (
                            <Typography
                              variant="caption"
                              color="text.disabled"
                              sx={{ fontSize: { xs: 12, md: '16px' } }}
                            >
                              Unassigned
                            </Typography>
                          )}
                        </Grid>
                      </Grid>
                    );
                  })}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>
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
