import * as Yup from 'yup';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useState, useEffect, forwardRef, useImperativeHandle } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { parseFormattedNumber, formatNumberWithCommas } from 'src/utils/socialMetricsCalculator';

import { validateUrl, detectPlatformFromUrl, createManualCreatorEntry, updateManualCreatorEntry } from 'src/api/manual-creator';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

// Validation schema factory - creates schema based on selected platform
const createManualCreatorSchema = (selectedPlatform) => Yup.object().shape({
  creatorName: Yup.string().required('Creator name is required'),
  creatorUsername: Yup.string().required('Username is required'),
  postUrl: Yup.string()
    .nullable()
    .test({
      name: 'valid-url',
      message: (value) => {
        if (!value) return '';
        const validation = validateUrl(value, selectedPlatform);
        return validation.reason || (selectedPlatform 
          ? `Must be a valid ${selectedPlatform} URL` 
          : 'Must be a valid Instagram or TikTok URL');
      },
      test: (value) => {
        if (!value) return true;
        const validation = validateUrl(value, selectedPlatform);
        return validation.isValid;
      },
    }),
  views: Yup.number()
    .typeError('Views must be a number')
    .min(0, 'Views cannot be negative')
    .required('Views is required'),
  likes: Yup.number()
    .typeError('Likes must be a number')
    .min(0, 'Likes cannot be negative')
    .required('Likes is required'),
  shares: Yup.number()
    .typeError('Shares must be a number')
    .min(0, 'Shares cannot be negative')
    .required('Shares is required'),
  saved: Yup.number()
    .typeError('Saves must be a number')
    .min(0, 'Saves cannot be negative')
    .nullable(),
});

// Common input field style matching Figma design
const inputFieldStyle = {
  width: '100%',
  minWidth: 0,
  maxWidth: '100%',
  '& .MuiOutlinedInput-root': {
    borderRadius: 1,
    bgcolor: 'white',
    width: '100%',
    maxWidth: '100%',
    '&.Mui-focused': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#1340FF',
        borderWidth: '1.5px',
      },
    },
    '&:hover': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#1340FF',
      },
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: '#e7e7e7',
    },
  },
  '& .MuiInputBase-input': {
    py: 1,
    px: 1.5,
    fontSize: '0.95rem',
    color: '#000000',
    '&::placeholder': {
      color: '#9E9E9E',
      opacity: 1,
    },
  },
};

const ManualCreatorEntryForm = forwardRef(({ campaignId, editingEntry, onSuccess, onFormStateChange, selectedPlatform }, ref) => {
  const isEditMode = Boolean(editingEntry);
  // Use selectedPlatform if provided, otherwise default to editingEntry platform or Instagram
  const initialPlatform = selectedPlatform && selectedPlatform !== 'ALL' 
    ? selectedPlatform 
    : (editingEntry?.platform || 'Instagram');
  const [detectedPlatform, setDetectedPlatform] = useState(initialPlatform);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create schema based on selected platform
  const validationSchema = useMemo(() => {
    const platformForValidation = selectedPlatform && selectedPlatform !== 'ALL' ? selectedPlatform : null;
    return createManualCreatorSchema(platformForValidation);
  }, [selectedPlatform]);

  const methods = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      creatorName: editingEntry?.creatorName || '',
      creatorUsername: editingEntry?.creatorUsername || '',
      postUrl: editingEntry?.postUrl || '',
      views: editingEntry?.views ?? '',
      likes: editingEntry?.likes ?? '',
      shares: editingEntry?.shares ?? '',
      saved: editingEntry?.saved ?? '',
    },
    mode: 'onChange',
  });

  const {
    watch,
    handleSubmit,
    setValue,
    trigger,
    formState: { isValid },
  } = methods;

  const watchedValues = watch(['views', 'likes', 'shares', 'saved']);
  const watchedUrl = watch('postUrl');

  // Re-validate form when selectedPlatform changes
  useEffect(() => {
    trigger('postUrl');
  }, [selectedPlatform, trigger]);

  // Detect platform from URL when it changes, but respect selectedPlatform if set
  useEffect(() => {
    if (watchedUrl) {
      const platform = detectPlatformFromUrl(watchedUrl);
      if (platform) {
        // If selectedPlatform is set and not 'ALL', use it instead of detected platform
        if (selectedPlatform && selectedPlatform !== 'ALL') {
          setDetectedPlatform(selectedPlatform);
        } else {
          setDetectedPlatform(platform);
        }
      }
    } else if (selectedPlatform && selectedPlatform !== 'ALL') {
      // If no URL but selectedPlatform is set, use selectedPlatform
      setDetectedPlatform(selectedPlatform);
    }
  }, [watchedUrl, selectedPlatform]);

  // Handler for formatted number inputs
  const handleFormattedNumberChange = (fieldName, value) => {
    const cleaned = parseFormattedNumber(value);
    const numValue = cleaned === '' ? '' : Number(cleaned);
    setValue(fieldName, numValue, { shouldValidate: true });
  };

  // Real-time engagement rate calculation
  const engagementRate = useMemo(() => {
    const [views, likes, shares, saved] = watchedValues.map((v) => Number(v) || 0);
    if (!views || views === 0) return '0.00';

    if (detectedPlatform === 'Instagram') {
      return (((likes + shares + saved) / views) * 100).toFixed(2);
    }
    return (((likes + shares) / views) * 100).toFixed(2);
  }, [watchedValues, detectedPlatform]);

  // Form submission
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        platform: detectedPlatform,
        views: Number(data.views),
        likes: Number(data.likes),
        shares: Number(data.shares),
        saved: data.saved ? Number(data.saved) : undefined,
      };

      if (isEditMode) {
        await updateManualCreatorEntry(campaignId, editingEntry.id, payload);
      } else {
        await createManualCreatorEntry(campaignId, payload);
      }
      onSuccess?.();
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} manual entry:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if form is complete for button state
  const isFormComplete = useMemo(() => {
    const [views, likes, shares] = watchedValues;
    const creatorName = watch('creatorName');
    const creatorUsername = watch('creatorUsername');
    return creatorName && creatorUsername && views && likes && shares !== undefined;
  }, [watchedValues, watch]);

  // Expose submit function and state to parent
  useImperativeHandle(ref, () => ({
    submit: handleSubmit(onSubmit),
    isValid,
    isFormComplete,
    isSubmitting,
  }));

  // Notify parent of form state changes
  useEffect(() => {
    onFormStateChange?.({ isValid, isFormComplete, isSubmitting });
  }, [isValid, isFormComplete, isSubmitting, onFormStateChange]);

  return (
    <Box
      component={m.div}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      sx={{ overflow: 'hidden', mb: 1 }}
    >
      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <Grid item xs={12}>
          <Box borderRadius={1} border="2px solid #F5F5F5">
            <Box sx={{ py: 1.5 }}>
              {/* Desktop Layout */}
              <Box
                px={{ xs: 0, sm: 2, lg: 3 }}
                display={{ xs: 'none', md: 'flex' }}
                alignItems="center"
                gap={{ md: 1, lg: 1.5 }}
                sx={{ minWidth: 0, overflow: 'hidden' }}
              >
                {/* Left Side: Creator Info */}
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  sx={{ minWidth: { md: 160, lg: 180 }, maxWidth: { md: 180, lg: 200 }, flexShrink: 0 }}
                >
                  <Avatar
                    sx={{
                      width: 44,
                      height: 44,
                      bgcolor: '#D3D3D3',
                      border: '1px solid #EBEBEB',
                      flexShrink: 0,
                      color: '#FFFFFF',
                    }}
                  >
                    <Iconify icon="mdi:account" width={32} sx={{ color: '#FFFFFF' }} />
                  </Avatar>
                  <Stack direction="column" spacing={0.5} sx={{ minWidth: 0, flex: 1, maxWidth: '100%' }}>
                    <RHFTextField
                      name="creatorName"
                      placeholder="Creator Name"
                      size="small"
                      sx={{
                        width: '100%',
                        maxWidth: '100%',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                          '&.Mui-focused': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#1340FF',
                              borderWidth: '1.5px',
                            },
                          },
                          '&:hover': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#1340FF',
                            },
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e7e7e7',
                          },
                        },
                        '& .MuiInputBase-input': {
                          py: 0.75,
                          fontSize: '0.95rem',
                          fontWeight: 400,
                          color: '#000000',
                          '&::placeholder': {
                            color: '#B0B0B0',
                            opacity: 1,
                          },
                        },
                      }}
                    />
                    <RHFTextField
                      name="creatorUsername"
                      placeholder="Creator Username"
                      size="small"
                      sx={{
                        width: '100%',
                        maxWidth: '100%',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                          '&.Mui-focused': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#1340FF',
                              borderWidth: '1.5px',
                            },
                          },
                          '&:hover': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#1340FF',
                            },
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e7e7e7',
                          },
                        },
                        '& .MuiInputBase-input': {
                          py: 0.75,
                          fontSize: '0.875rem',
                          color: '#000000',
                          '&::placeholder': {
                            color: '#B0B0B0',
                            opacity: 1,
                          },
                        },
                      }}
                    />
                  </Stack>
                </Stack>

                {/* Center: Metrics - same divider style as saved entries */}
                <Box
                  display="flex"
                  alignItems="center"
                  flex={1}
                  justifyContent="space-between"
                  sx={{ 
                    mx: { md: 0.75, lg: 1.5, xl: 2 }, 
                    minWidth: 0, 
                    overflow: 'hidden', 
                    flexWrap: 'nowrap',
                    position: 'relative'
                  }}
                >
                  {/* Engagement Rate (auto-calculated, read-only display) */}
                  <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0, maxWidth: { md: 120, lg: 140, xl: 160 }, pr: { md: 1, lg: 1.5, xl: 2 } }}>
                    <Typography
                      fontFamily="Aileron"
                      fontSize={{ md: 14, lg: 16, xl: 18 }}
                      fontWeight={600}
                      color="#636366"
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      <Box component="span" sx={{ display: { md: 'none', xl: 'inline' } }}>
                        Engagement Rate
                      </Box>
                      <Box component="span" sx={{ display: { md: 'inline', xl: 'none' } }}>
                        Engage. Rate
                      </Box>
                    </Typography>
                    <Typography
                      fontFamily="Instrument Serif"
                      fontSize={{ md: 28, lg: 36, xl: 40 }}
                      fontWeight={400}
                      color="#1340FF"
                      lineHeight={1.1}
                    >
                      {engagementRate}%
                    </Typography>
                  </Box>

                  <Divider
                    orientation="vertical"
                    sx={{ 
                      width: '1px', 
                      minWidth: '1px',
                      height: '71px', 
                      backgroundColor: '#1340FF', 
                      mx: { md: 1, lg: 1.5, xl: 2 }, 
                      flexShrink: 0,
                      alignSelf: 'stretch'
                    }}
                  />

                  {/* Views - bordered input field */}
                  <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0, px: { md: 0.75, lg: 1 }, overflow: 'hidden' }}>
                    <Typography
                      fontFamily="Aileron"
                      fontSize={{ md: 14, lg: 16, xl: 18 }}
                      fontWeight={600}
                      color="#636366"
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      Views
                    </Typography>
                    <RHFTextField
                      name="views"
                      placeholder="Views"
                      type="text"
                      size="small"
                      inputProps={{ min: 0 }}
                      fullWidth={false}
                      sx={inputFieldStyle}
                      value={formatNumberWithCommas(watch('views') || '')}
                      onChange={(e) => handleFormattedNumberChange('views', e.target.value)}
                    />
                  </Box>

                  <Divider
                    orientation="vertical"
                    sx={{ 
                      width: '1px', 
                      minWidth: '1px',
                      height: '71px', 
                      backgroundColor: '#1340FF', 
                      mx: { md: 1, lg: 1.5 }, 
                      flexShrink: 0,
                      alignSelf: 'stretch'
                    }}
                  />

                  {/* Likes - bordered input field */}
                  <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0, px: { md: 0.75, lg: 1 }, overflow: 'hidden' }}>
                    <Typography
                      fontFamily="Aileron"
                      fontSize={{ md: 14, lg: 16, xl: 18 }}
                      fontWeight={600}
                      color="#636366"
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      Likes
                    </Typography>
                    <RHFTextField
                      name="likes"
                      placeholder="Likes"
                      type="text"
                      size="small"
                      inputProps={{ min: 0 }}
                      fullWidth={false}
                      sx={inputFieldStyle}
                      value={formatNumberWithCommas(watch('likes') || '')}
                      onChange={(e) => handleFormattedNumberChange('likes', e.target.value)}
                    />
                  </Box>

                  <Divider
                    orientation="vertical"
                    sx={{ 
                      width: '1px', 
                      minWidth: '1px',
                      height: '71px', 
                      backgroundColor: '#1340FF', 
                      mx: { md: 1, lg: 1.5 }, 
                      flexShrink: 0,
                      alignSelf: 'stretch'
                    }}
                  />

                  {/* Shares - bordered input field */}
                  <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0, px: { md: 0.75, lg: 1 }, overflow: 'hidden' }}>
                    <Typography
                      fontFamily="Aileron"
                      fontSize={{ md: 14, lg: 16, xl: 18 }}
                      fontWeight={600}
                      color="#636366"
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      Shares
                    </Typography>
                    <RHFTextField
                      name="shares"
                      placeholder="Shares"
                      type="text"
                      size="small"
                      inputProps={{ min: 0 }}
                      fullWidth={false}
                      sx={inputFieldStyle}
                      value={formatNumberWithCommas(watch('shares') || '')}
                      onChange={(e) => handleFormattedNumberChange('shares', e.target.value)}
                    />
                  </Box>

                  {/* Saves - Instagram only */}
                  {detectedPlatform === 'Instagram' && (
                    <>
                      <Divider
                        orientation="vertical"
                        sx={{ 
                          width: '1px', 
                          minWidth: '1px',
                          height: '71px', 
                          backgroundColor: '#1340FF', 
                          mx: { md: 1, lg: 1.5 }, 
                          flexShrink: 0,
                          alignSelf: 'stretch'
                        }}
                      />
                      <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0, px: { md: 0.75, lg: 1 }, overflow: 'hidden' }}>
                        <Typography
                          fontFamily="Aileron"
                          fontSize={{ md: 14, lg: 16, xl: 18 }}
                          fontWeight={600}
                          color="#636366"
                          sx={{ whiteSpace: 'nowrap' }}
                        >
                          Saves
                        </Typography>
                        <RHFTextField
                          name="saved"
                          placeholder="Saves"
                          type="text"
                          size="small"
                          inputProps={{ min: 0 }}
                          fullWidth={false}
                          sx={inputFieldStyle}
                          value={formatNumberWithCommas(watch('saved') || '')}
                          onChange={(e) => handleFormattedNumberChange('saved', e.target.value)}
                        />
                      </Box>
                    </>
                  )}

                  <Divider
                    orientation="vertical"
                    sx={{ 
                      width: '1px', 
                      minWidth: '1px',
                      height: '71px', 
                      backgroundColor: '#1340FF', 
                      mx: { md: 1, lg: 1.5 }, 
                      flexShrink: 0,
                      alignSelf: 'stretch'
                    }}
                  />

                  {/* Post Link - bordered input field */}
                  <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0, px: { md: 0.75, lg: 1 }, overflow: 'hidden' }}>
                    <Typography
                      fontFamily="Aileron"
                      fontSize={{ md: 14, lg: 16, xl: 18 }}
                      fontWeight={600}
                      color="#636366"
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      Post Link
                    </Typography>
                    <RHFTextField
                      name="postUrl"
                      placeholder="Post Link"
                      size="small"
                      fullWidth={false}
                      sx={inputFieldStyle}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Mobile Layout */}
              <Box display={{ xs: 'block', md: 'none' }} px={2} py={1}>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                  <Avatar
                    sx={{
                      width: 44,
                      height: 44,
                      bgcolor: '#D3D3D3',
                      border: '1px solid #EBEBEB',
                      color: '#FFFFFF',
                    }}
                  >
                    <Iconify icon="mdi:account" width={32} sx={{ color: '#FFFFFF' }} />
                  </Avatar>
                  <Stack direction="column" spacing={0.5} sx={{ flex: 1 }}>
                    <RHFTextField
                      name="creatorName"
                      placeholder="Creator Name"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#1340FF',
                              borderWidth: '1.5px',
                            },
                          },
                          '&:hover': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#1340FF',
                            },
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e7e7e7',
                          },
                        },
                        '& .MuiInputBase-input': {
                          fontWeight: 400,
                          color: '#000000',
                          '&::placeholder': {
                            color: '#B0B0B0',
                            opacity: 1,
                          },
                        },
                      }}
                    />
                    <RHFTextField
                      name="creatorUsername"
                      placeholder="Creator Username"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#1340FF',
                              borderWidth: '1.5px',
                            },
                          },
                          '&:hover': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#1340FF',
                            },
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e7e7e7',
                          },
                        },
                        '& .MuiInputBase-input': {
                          color: '#000000',
                          '&::placeholder': {
                            color: '#B0B0B0',
                            opacity: 1,
                          },
                        },
                      }}
                    />
                  </Stack>
                </Stack>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography fontSize={12} color="text.secondary">
                      Engagement Rate
                    </Typography>
                    <Typography fontFamily="Instrument Serif" fontSize={24} color="#1340FF">
                      {engagementRate}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography fontSize={12} color="text.secondary">
                      Views
                    </Typography>
                    <RHFTextField
                      name="views"
                      placeholder="0"
                      type="text"
                      size="small"
                      inputProps={{ min: 0 }}
                      value={formatNumberWithCommas(watch('views') || '')}
                      onChange={(e) => handleFormattedNumberChange('views', e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#1340FF',
                              borderWidth: '1.5px',
                            },
                          },
                          '&:hover': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#1340FF',
                            },
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e7e7e7',
                          },
                        },
                        '& .MuiInputBase-input': {
                          color: '#000000',
                          '&::placeholder': {
                            color: '#9E9E9E',
                            opacity: 1,
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography fontSize={12} color="text.secondary">
                      Likes
                    </Typography>
                    <RHFTextField
                      name="likes"
                      placeholder="0"
                      type="text"
                      size="small"
                      inputProps={{ min: 0 }}
                      value={formatNumberWithCommas(watch('likes') || '')}
                      onChange={(e) => handleFormattedNumberChange('likes', e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#1340FF',
                              borderWidth: '1.5px',
                            },
                          },
                          '&:hover': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#1340FF',
                            },
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e7e7e7',
                          },
                        },
                        '& .MuiInputBase-input': {
                          color: '#000000',
                          '&::placeholder': {
                            color: '#9E9E9E',
                            opacity: 1,
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography fontSize={12} color="text.secondary">
                      Shares
                    </Typography>
                    <RHFTextField
                      name="shares"
                      placeholder="0"
                      type="text"
                      size="small"
                      inputProps={{ min: 0 }}
                      value={formatNumberWithCommas(watch('shares') || '')}
                      onChange={(e) => handleFormattedNumberChange('shares', e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#1340FF',
                              borderWidth: '1.5px',
                            },
                          },
                          '&:hover': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#1340FF',
                            },
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e7e7e7',
                          },
                        },
                        '& .MuiInputBase-input': {
                          color: '#000000',
                          '&::placeholder': {
                            color: '#9E9E9E',
                            opacity: 1,
                          },
                        },
                      }}
                    />
                  </Grid>
                  {detectedPlatform === 'Instagram' && (
                    <Grid item xs={6}>
                      <Typography fontSize={12} color="text.secondary">
                        Saves
                      </Typography>
                      <RHFTextField
                        name="saved"
                        placeholder="0"
                        type="text"
                        size="small"
                        inputProps={{ min: 0 }}
                        value={formatNumberWithCommas(watch('saved') || '')}
                        onChange={(e) => handleFormattedNumberChange('saved', e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&.Mui-focused': {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#1340FF',
                                borderWidth: '1.5px',
                              },
                            },
                            '&:hover': {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#1340FF',
                              },
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#e7e7e7',
                            },
                          },
                          '& .MuiInputBase-input': {
                            color: '#000000',
                            '&::placeholder': {
                              color: '#9E9E9E',
                              opacity: 1,
                            },
                          },
                        }}
                      />
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <Typography fontSize={12} color="text.secondary">
                      Post Link
                    </Typography>
                    <RHFTextField
                      name="postUrl"
                      placeholder="Paste post URL"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#1340FF',
                              borderWidth: '1.5px',
                            },
                          },
                          '&:hover': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#1340FF',
                            },
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e7e7e7',
                          },
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Box>
        </Grid>
      </FormProvider>
    </Box>
  );
});

ManualCreatorEntryForm.propTypes = {
  campaignId: PropTypes.string.isRequired,
  editingEntry: PropTypes.shape({
    id: PropTypes.string,
    creatorName: PropTypes.string,
    creatorUsername: PropTypes.string,
    platform: PropTypes.string,
    postUrl: PropTypes.string,
    views: PropTypes.number,
    likes: PropTypes.number,
    shares: PropTypes.number,
    saved: PropTypes.number,
  }),
  onSuccess: PropTypes.func,
  onFormStateChange: PropTypes.func,
  selectedPlatform: PropTypes.oneOf(['ALL', 'Instagram', 'TikTok']),
};

export default ManualCreatorEntryForm;
