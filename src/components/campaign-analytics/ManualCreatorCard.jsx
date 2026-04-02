import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';

import {
  Box,
  Grid,
  Link,
  Stack,
  Avatar,
  Divider,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';

import {
  formatNumber,
  parseFormattedNumber,
  formatNumberWithCommas,
} from 'src/utils/socialMetricsCalculator';

import { updateManualCreatorEntry } from 'src/api/manual-creator';

import Iconify from 'src/components/iconify';

import { ScrollingName } from './UserPerformanceCard';

const inlineEditFieldStyle = {
  width: '100%',
  minWidth: 0,
  maxWidth: '100%',
  '& .MuiOutlinedInput-root': {
    borderRadius: 1,
    bgcolor: 'white',
    transition: 'all 0.2s ease',
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

const ManualCreatorCard = ({ entry, campaignId, onUpdate, onDelete, isDisabled = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editValues, setEditValues] = useState({
    views: entry.views,
    likes: entry.likes,
    comments: entry.comments || 0,
    shares: entry.shares,
    saved: entry.saved || 0,
    postUrl: entry.postUrl || '',
  });

  const calculatedEngagementRate = useMemo(() => {
    const { views, likes, comments, shares, saved } = editValues;
    if (!views || views === 0) return 0;
    if (entry.platform === 'Instagram') {
      return ((likes + comments + shares + (saved || 0)) / views) * 100;
    }
    return ((likes + comments + shares) / views) * 100;
  }, [editValues, entry.platform]);

  const handleStartEdit = () => {
    setEditValues({
      views: entry.views,
      likes: entry.likes,
      comments: entry.comments || 0,
      shares: entry.shares,
      saved: entry.saved || 0,
      postUrl: entry.postUrl || '',
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditValues({
      views: entry.views,
      likes: entry.likes,
      comments: entry.comments || 0,
      shares: entry.shares,
      saved: entry.saved || 0,
      postUrl: entry.postUrl || '',
    });
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      await updateManualCreatorEntry(campaignId, entry.id, {
        views: Number(editValues.views),
        likes: Number(editValues.likes),
        comments: Number(editValues.comments),
        shares: Number(editValues.shares),
        saved: entry.platform === 'Instagram' ? Number(editValues.saved) : undefined,
        postUrl: editValues.postUrl || undefined,
      });
      onUpdate?.();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update entry:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field, value) => {
    const cleaned = parseFormattedNumber(value);
    const numValue = cleaned === '' ? 0 : Number(cleaned);
    setEditValues((prev) => ({ ...prev, [field]: numValue }));
  };

  const handlePostUrlChange = (value) => {
    setEditValues((prev) => ({ ...prev, postUrl: value }));
  };

  const actionIconStyle = (isConfirm) => ({
    width: 36,
    height: 36,
    borderRadius: 1.5,
    border: '1px solid #E7E7E7',
    borderBottom: '3px solid #E7E7E7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: isSaving ? 'not-allowed' : 'pointer',
    opacity: isSaving ? 0.6 : 1,
    transition: 'all 0.2s ease',
    '&:hover': isSaving
      ? {}
      : {
          bgcolor: isConfirm ? '#DCFCE7' : '#FEE2E2',
          borderColor: isConfirm ? '#22C55E' : '#EF4444',
          borderBottom: '3px solid',
          borderBottomColor: isConfirm ? '#22C55E' : '#EF4444',
        },
  });

  return (
    <Grid item xs={12}>
      <Box borderRadius={1} border="2px solid #F5F5F5">
        <Box sx={{ py: 0.5 }}>
          <Box
            px={2}
            display={{ xs: 'none', md: 'flex' }}
            alignItems="center"
            gap={{ md: 1, lg: 1.5 }}
            sx={{ minWidth: 0, overflow: 'hidden' }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{
                width: 200,
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              <Avatar
                src={entry.photoUrl || null}
                sx={{
                  width: 44,
                  height: 44,
                  bgcolor: entry.platform === 'Instagram' ? '#E4405F' : '#000000',
                  border: '1px solid #EBEBEB',
                  flexShrink: 0,
                }}
              >
                {entry.creatorName?.charAt(0) || 'U'}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <ScrollingName name={entry.creatorName || 'Unknown Creator'} />
                <Typography
                  sx={{
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: '#636366',
                    fontSize: '0.875rem',
                  }}
                >
                  {entry.creatorUsername}
                </Typography>
              </Box>
            </Stack>

            <Box
              display="flex"
              alignItems="center"
              flex={1}
              justifyContent="space-between"
              sx={{ mx: 1, minWidth: 0, overflow: 'hidden' }}
            >
              <Box sx={{ textAlign: 'left', minWidth: 110 }}>
                <Typography
                  fontFamily="Aileron"
                  fontSize={{ md: 14, lg: 16, xl: 18 }}
                  fontWeight={600}
                  color="#636366"
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  <Box component="span" pr={1.5} sx={{ display: { xs: 'none', xl: 'inline' } }}>
                    Engagement Rate
                  </Box>
                  <Box component="span" sx={{ display: { xs: 'inline', xl: 'none' } }}>
                    Eng. Rate
                  </Box>
                </Typography>
                <Typography
                  fontFamily="Instrument Serif"
                  fontSize={{ md: 28, lg: 36, xl: 40 }}
                  fontWeight={400}
                  color="#1340FF"
                  lineHeight={1.1}
                  sx={{
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  {isEditing
                    ? calculatedEngagementRate.toFixed(2)
                    : entry.engagementRate?.toFixed(2) || '0.00'}
                  %
                </Typography>
              </Box>

              <Divider
                sx={{ width: '1px', height: '55px', backgroundColor: '#1340FF', flexShrink: 0 }}
              />

              <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0, overflow: 'hidden', px: 1 }}>
                <Typography
                  fontFamily="Aileron"
                  fontSize={{ md: 14, lg: 16, xl: 18 }}
                  fontWeight={600}
                  color="#636366"
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Views
                </Typography>
                {isEditing ? (
                  <TextField
                    value={formatNumberWithCommas(editValues.views)}
                    onChange={(e) => handleFieldChange('views', e.target.value)}
                    type="text"
                    size="small"
                    inputProps={{ min: 0 }}
                    sx={inlineEditFieldStyle}
                  />
                ) : (
                  <Typography
                    fontFamily="Instrument Serif"
                    fontSize={{ md: 28, lg: 36, xl: 40 }}
                    fontWeight={400}
                    color="#1340FF"
                    lineHeight={1.1}
                  >
                    {formatNumber(entry.views)}
                  </Typography>
                )}
              </Box>

              <Divider
                sx={{ width: '1px', height: '55px', backgroundColor: '#1340FF', flexShrink: 0 }}
              />

              <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0, overflow: 'hidden', px: 1 }}>
                <Typography
                  fontFamily="Aileron"
                  fontSize={{ md: 14, lg: 16, xl: 18 }}
                  fontWeight={600}
                  color="#636366"
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Likes
                </Typography>
                {isEditing ? (
                  <TextField
                    value={formatNumberWithCommas(editValues.likes)}
                    onChange={(e) => handleFieldChange('likes', e.target.value)}
                    type="text"
                    size="small"
                    inputProps={{ min: 0 }}
                    sx={inlineEditFieldStyle}
                  />
                ) : (
                  <Typography
                    fontFamily="Instrument Serif"
                    fontSize={{ md: 28, lg: 36, xl: 40 }}
                    fontWeight={400}
                    color="#1340FF"
                    lineHeight={1.1}
                  >
                    {formatNumber(entry.likes)}
                  </Typography>
                )}
              </Box>

              <Divider
                sx={{ width: '1px', height: '55px', backgroundColor: '#1340FF', flexShrink: 0 }}
              />

              <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0, px: 1 }}>
                <Typography
                  fontFamily="Aileron"
                  fontSize={{ md: 14, lg: 16, xl: 18 }}
                  fontWeight={600}
                  color="#636366"
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Comments
                </Typography>
                {isEditing ? (
                  <TextField
                    value={formatNumberWithCommas(editValues.comments)}
                    onChange={(e) => handleFieldChange('comments', e.target.value)}
                    type="text"
                    size="small"
                    inputProps={{ min: 0 }}
                    sx={inlineEditFieldStyle}
                  />
                ) : (
                  <Typography
                    fontFamily="Instrument Serif"
                    fontSize={{ md: 28, lg: 36, xl: 40 }}
                    fontWeight={400}
                    color="#1340FF"
                    lineHeight={1.1}
                  >
                    {formatNumber(entry.comments || 0)}
                  </Typography>
                )}
              </Box>

              <Divider
                sx={{
                  width: '1px',
                  height: '55px',
                  backgroundColor: '#1340FF',
                  flexShrink: 0,
                  ml: 2,
                }}
              />

              <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0, overflow: 'hidden', px: 1 }}>
                <Typography
                  fontFamily="Aileron"
                  fontSize={{ md: 14, lg: 16, xl: 18 }}
                  fontWeight={600}
                  color="#636366"
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Shares
                </Typography>
                {isEditing ? (
                  <TextField
                    value={formatNumberWithCommas(editValues.shares)}
                    onChange={(e) => handleFieldChange('shares', e.target.value)}
                    type="text"
                    size="small"
                    inputProps={{ min: 0 }}
                    sx={inlineEditFieldStyle}
                  />
                ) : (
                  <Typography
                    fontFamily="Instrument Serif"
                    fontSize={{ md: 28, lg: 36, xl: 40 }}
                    fontWeight={400}
                    color="#1340FF"
                    lineHeight={1.1}
                  >
                    {formatNumber(entry.shares)}
                  </Typography>
                )}
              </Box>

              {entry.platform === 'Instagram' ? (
                <>
                  <Divider
                    sx={{
                      width: '1px',
                      height: '55px',
                      backgroundColor: '#1340FF',
                      flexShrink: 0,
                    }}
                  />
                  <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0, overflow: 'hidden', px: 1 }}>
                    <Typography
                      fontFamily="Aileron"
                      fontSize={{ md: 14, lg: 16, xl: 18 }}
                      fontWeight={600}
                      color="#636366"
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      Saves
                    </Typography>
                    {isEditing ? (
                      <TextField
                        value={formatNumberWithCommas(editValues.saved)}
                        onChange={(e) => handleFieldChange('saved', e.target.value)}
                        type="text"
                        size="small"
                        inputProps={{ min: 0 }}
                        sx={inlineEditFieldStyle}
                      />
                    ) : (
                      <Typography
                        fontFamily="Instrument Serif"
                        fontSize={{ md: 28, lg: 36, xl: 40 }}
                        fontWeight={400}
                        color="#1340FF"
                        lineHeight={1.1}
                      >
                        {formatNumber(entry.saved || 0)}
                      </Typography>
                    )}
                  </Box>
                </>
              ) : (
                <>
                  <Divider
                    sx={{
                      width: '1px',
                      height: '55px',
                      backgroundColor: 'transparent',
                      flexShrink: 0,
                    }}
                  />
                  <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0, px: 1 }}>
                    <Box sx={{ height: { md: 20, lg: 22, xl: 24 } }} />
                    <Box
                      sx={{
                        position: 'relative',
                        minHeight: 44,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Box sx={{ height: { md: 28, lg: 36, xl: 40 } }} />
                    </Box>
                  </Box>
                </>
              )}

              <AnimatePresence>
                {isEditing && (
                  <>
                    <Box
                      key="post-link-divider"
                      component={m.div}
                      layout
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      exit={{ opacity: 0, scaleX: 0 }}
                      transition={{
                        layout: { duration: 0, ease: 'linear' },
                        opacity: { duration: 0, ease: 'linear' },
                        scaleX: { duration: 0, ease: 'linear' },
                      }}
                      style={{ transformOrigin: 'left center' }}
                    >
                      <Divider
                        sx={{
                          width: '1px',
                          height: '55px',
                          backgroundColor: '#1340FF',
                          mx: { md: 1, lg: 1.5 },
                          flexShrink: 0,
                        }}
                      />
                    </Box>
                    <Box
                      key="post-link-field"
                      component={m.div}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{
                        layout: { duration: 0, ease: 'linear' },
                        opacity: { duration: 0, ease: 'linear' },
                        scale: { duration: 0, ease: 'linear' },
                      }}
                      sx={{
                        textAlign: 'left',
                        flex: 1,
                        minWidth: 0,
                        px: { md: 0.75, lg: 1 },
                        overflow: 'hidden',
                      }}
                    >
                      <Typography
                        fontFamily="Aileron"
                        fontSize={{ md: 14, lg: 16, xl: 18 }}
                        fontWeight={600}
                        color="#636366"
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        Post Link
                      </Typography>
                      <TextField
                        value={editValues.postUrl}
                        onChange={(e) => handlePostUrlChange(e.target.value)}
                        placeholder="Post Link"
                        type="text"
                        size="small"
                        sx={inlineEditFieldStyle}
                      />
                    </Box>
                  </>
                )}
              </AnimatePresence>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0, minWidth: 0 }}>
              <AnimatePresence>
                {!isEditing && (
                  <Box
                    key="thumbnail"
                    component={m.div}
                    layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{
                      layout: { duration: 0, ease: 'linear' },
                      opacity: { duration: 0, ease: 'linear' },
                      scale: { duration: 0, ease: 'linear' },
                    }}
                    sx={{ flexShrink: 0 }}
                  >
                    <Box
                      component={entry.postUrl ? Link : 'div'}
                      href={entry.postUrl || undefined}
                      target={entry.postUrl ? '_blank' : undefined}
                      rel={entry.postUrl ? 'noopener' : undefined}
                      sx={{
                        display: 'block',
                        textDecoration: 'none',
                        position: 'relative',
                        cursor: entry.postUrl ? 'pointer' : 'default',
                        '&:hover .play-overlay': {
                          bgcolor: 'rgba(255, 255, 255, 0.25)',
                          transform: 'translate(-50%, -50%) scale(1.1)',
                        },
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <Box
                        sx={{
                          width: 140,
                          height: 80,
                          borderRadius: 2,
                          bgcolor: '#0F2D5C',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'flex-end',
                          position: 'relative',
                          overflow: 'hidden',
                          p: 1,
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background:
                              'linear-gradient(135deg, rgba(19, 64, 255, 0.1) 0%, rgba(15, 45, 92, 0.2) 100%)',
                            pointerEvents: 'none',
                          },
                        }}
                      >
                        <Box
                          component="img"
                          src="/logo/newlogo.svg"
                          alt="Cult Creative"
                          sx={{
                            width: 24,
                            height: 28,
                            opacity: 0.6,
                            position: 'relative',
                            zIndex: 1,
                          }}
                        />

                        {entry.postUrl && (
                          <Box
                            className="play-overlay"
                            sx={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              bgcolor: 'rgba(255, 255, 255, 0.2)',
                              backdropFilter: 'blur(4px)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease',
                              zIndex: 2,
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                            }}
                          >
                            <Iconify
                              icon="solar:play-bold"
                              sx={{ color: '#FFFFFF', width: 16, height: 16, ml: 0.3 }}
                            />
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                )}
              </AnimatePresence>

              <Stack direction="column" spacing={1}>
                <Stack direction="column" spacing={1}>
                  <Box
                    onClick={() => {
                      if (isDisabled) return;
                      if (isEditing) {
                        if (!isSaving) {
                          handleSaveEdit();
                        }
                      } else {
                        handleStartEdit();
                      }
                    }}
                    sx={
                      isEditing
                        ? actionIconStyle(true)
                        : {
                            width: 36,
                            height: 36,
                            borderRadius: 1.5,
                            border: '1px solid #E7E7E7',
                            borderBottom: '3px solid #E7E7E7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            opacity: isDisabled ? 0.5 : 1,
                            transition: 'all 0.2s ease',
                            '&:hover': isDisabled
                              ? {}
                              : {
                                  bgcolor: '#f5f5f5',
                                  borderColor: '#221f20',
                                  borderBottom: '3px solid',
                                  borderBottomColor: '#221f20',
                                },
                          }
                    }
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <AnimatePresence mode="wait">
                        {isEditing ? (
                          <m.div
                            key="check-icon"
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -100, opacity: 0 }}
                            transition={{ duration: 0.15, ease: 'easeInOut' }}
                            style={{
                              position: 'absolute',
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {isSaving ? (
                              <CircularProgress size={16} sx={{ color: '#22C55E' }} />
                            ) : (
                              <Iconify icon="mdi:check" width={20} sx={{ color: '#22C55E' }} />
                            )}
                          </m.div>
                        ) : (
                          <m.div
                            key="edit-icon"
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -100, opacity: 0 }}
                            transition={{ duration: 0.15, ease: 'easeInOut' }}
                            style={{
                              position: 'absolute',
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Iconify icon="mdi:pencil-outline" width={18} sx={{ color: '#221f20' }} />
                          </m.div>
                        )}
                      </AnimatePresence>
                    </Box>
                  </Box>
                  <Box
                    onClick={() => {
                      if (isDisabled && !isEditing) return;
                      if (isEditing) {
                        if (!isSaving) {
                          handleCancelEdit();
                        }
                      } else {
                        onDelete?.(entry);
                      }
                    }}
                    sx={
                      isEditing
                        ? actionIconStyle(false)
                        : {
                            width: 36,
                            height: 36,
                            borderRadius: 1.5,
                            border: '1px solid #E7E7E7',
                            borderBottom: '3px solid #E7E7E7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            opacity: isDisabled ? 0.5 : 1,
                            transition: 'all 0.2s ease',
                            '&:hover': isDisabled
                              ? {}
                              : {
                                  bgcolor: '#FEE2E2',
                                  borderColor: '#EF4444',
                                  borderBottom: '3px solid',
                                  borderBottomColor: '#EF4444',
                                },
                          }
                    }
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <AnimatePresence mode="wait">
                        {isEditing ? (
                          <m.div
                            key="close-icon"
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -100, opacity: 0 }}
                            transition={{ duration: 0.15, ease: 'easeInOut' }}
                            style={{
                              position: 'absolute',
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Iconify icon="mdi:close" width={20} sx={{ color: '#EF4444' }} />
                          </m.div>
                        ) : (
                          <m.div
                            key="delete-icon"
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -100, opacity: 0 }}
                            transition={{ duration: 0.15, ease: 'easeInOut' }}
                            style={{
                              position: 'absolute',
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Iconify
                              icon="mdi:trash-can-outline"
                              width={18}
                              sx={{ color: '#EF4444' }}
                            />
                          </m.div>
                        )}
                      </AnimatePresence>
                    </Box>
                  </Box>
                </Stack>
              </Stack>
            </Stack>
          </Box>

          <Box display={{ xs: 'block', md: 'none' }} px={2} py={1}>
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              justifyContent="space-between"
              mb={2}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  src={entry.photoUrl}
                  sx={{
                    width: 44,
                    height: 44,
                    bgcolor: entry.platform === 'Instagram' ? '#E4405F' : '#000000',
                  }}
                >
                  {entry.creatorName?.charAt(0) || 'U'}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <ScrollingName name={entry.creatorName || 'Unknown Creator'} />
                  <Typography color="text.secondary" fontSize={14} sx={{ mt: 0.5 }}>
                    {entry.creatorUsername}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Box
                  onClick={() => {
                    if (isEditing) {
                      if (!isSaving) {
                        handleSaveEdit();
                      }
                    } else {
                      handleStartEdit();
                    }
                  }}
                  sx={
                    isEditing
                      ? actionIconStyle(true)
                      : {
                          width: 36,
                          height: 36,
                          borderRadius: 1,
                          border: '1.5px solid #e7e7e7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          '&:active': {
                            bgcolor: '#f5f5f5',
                          },
                        }
                  }
                >
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {isEditing ? (
                        <m.div
                          key="check-icon"
                          initial={{ x: 100, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -100, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isSaving ? (
                            <CircularProgress size={14} sx={{ color: '#22C55E' }} />
                          ) : (
                            <Iconify icon="mdi:check" width={18} sx={{ color: '#22C55E' }} />
                          )}
                        </m.div>
                      ) : (
                        <m.div
                          key="edit-icon"
                          initial={{ x: 100, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -100, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Iconify icon="mdi:pencil-outline" width={18} sx={{ color: '#221f20' }} />
                        </m.div>
                      )}
                    </AnimatePresence>
                  </Box>
                </Box>
                <Box
                  onClick={() => {
                    if (isEditing) {
                      if (!isSaving) {
                        handleCancelEdit();
                      }
                    } else {
                      onDelete?.(entry);
                    }
                  }}
                  sx={
                    isEditing
                      ? actionIconStyle(false)
                      : {
                          width: 36,
                          height: 36,
                          borderRadius: 1,
                          border: '1.5px solid #e7e7e7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          '&:active': {
                            bgcolor: '#FEE2E2',
                          },
                        }
                  }
                >
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {isEditing ? (
                        <m.div
                          key="close-icon"
                          initial={{ x: 100, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -100, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Iconify icon="mdi:close" width={18} sx={{ color: '#EF4444' }} />
                        </m.div>
                      ) : (
                        <m.div
                          key="delete-icon"
                          initial={{ x: 100, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -100, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Iconify icon="mdi:trash-can-outline" width={18} sx={{ color: '#EF4444' }} />
                        </m.div>
                      )}
                    </AnimatePresence>
                  </Box>
                </Box>
              </Stack>
            </Stack>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography fontSize={12} color="text.secondary">
                  Engagement Rate
                </Typography>
                <Typography fontFamily="Instrument Serif" fontSize={24} color="#1340FF">
                  {isEditing
                    ? calculatedEngagementRate.toFixed(2)
                    : entry.engagementRate?.toFixed(2) || '0.00'}
                  %
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography fontSize={12} color="text.secondary">
                  Views
                </Typography>
                {isEditing ? (
                  <TextField
                    value={formatNumberWithCommas(editValues.views)}
                    onChange={(e) => handleFieldChange('views', e.target.value)}
                    type="text"
                    size="small"
                    inputProps={{ min: 0 }}
                    sx={{ ...inlineEditFieldStyle, width: '100%' }}
                  />
                ) : (
                  <Typography fontFamily="Instrument Serif" fontSize={24} color="#1340FF">
                    {formatNumber(entry.views)}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={6}>
                <Typography fontSize={12} color="text.secondary">
                  Likes
                </Typography>
                {isEditing ? (
                  <TextField
                    value={formatNumberWithCommas(editValues.likes)}
                    onChange={(e) => handleFieldChange('likes', e.target.value)}
                    type="text"
                    size="small"
                    inputProps={{ min: 0 }}
                    sx={{ ...inlineEditFieldStyle, width: '100%' }}
                  />
                ) : (
                  <Typography fontFamily="Instrument Serif" fontSize={24} color="#1340FF">
                    {formatNumber(entry.likes)}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={6}>
                <Typography fontSize={12} color="text.secondary">
                  Comments
                </Typography>
                {isEditing ? (
                  <TextField
                    value={formatNumberWithCommas(editValues.comments)}
                    onChange={(e) => handleFieldChange('comments', e.target.value)}
                    type="text"
                    size="small"
                    inputProps={{ min: 0 }}
                    sx={{ ...inlineEditFieldStyle, width: '100%' }}
                  />
                ) : (
                  <Typography fontFamily="Instrument Serif" fontSize={24} color="#1340FF">
                    {formatNumber(entry.comments || 0)}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={6}>
                <Typography fontSize={12} color="text.secondary">
                  Shares
                </Typography>
                {isEditing ? (
                  <TextField
                    value={formatNumberWithCommas(editValues.shares)}
                    onChange={(e) => handleFieldChange('shares', e.target.value)}
                    type="text"
                    size="small"
                    inputProps={{ min: 0 }}
                    sx={{ ...inlineEditFieldStyle, width: '100%' }}
                  />
                ) : (
                  <Typography fontFamily="Instrument Serif" fontSize={24} color="#1340FF">
                    {formatNumber(entry.shares)}
                  </Typography>
                )}
              </Grid>
              {entry.platform === 'Instagram' && (
                <Grid item xs={6}>
                  <Typography fontSize={12} color="text.secondary">
                    Saves
                  </Typography>
                  {isEditing ? (
                    <TextField
                      value={formatNumberWithCommas(editValues.saved)}
                      onChange={(e) => handleFieldChange('saved', e.target.value)}
                      type="text"
                      size="small"
                      inputProps={{ min: 0 }}
                      sx={{ ...inlineEditFieldStyle, width: '100%' }}
                    />
                  ) : (
                    <Typography fontFamily="Instrument Serif" fontSize={24} color="#1340FF">
                      {formatNumber(entry.saved || 0)}
                    </Typography>
                  )}
                </Grid>
              )}
            </Grid>
          </Box>
        </Box>
      </Box>
    </Grid>
  );
};

ManualCreatorCard.propTypes = {
  entry: PropTypes.shape({
    id: PropTypes.string,
    creatorName: PropTypes.string,
    creatorUsername: PropTypes.string,
    photoUrl: PropTypes.string,
    platform: PropTypes.string,
    postUrl: PropTypes.string,
    views: PropTypes.number,
    likes: PropTypes.number,
    comments: PropTypes.number,
    shares: PropTypes.number,
    saved: PropTypes.number,
    engagementRate: PropTypes.number,
  }).isRequired,
  campaignId: PropTypes.string.isRequired,
  onUpdate: PropTypes.func,
  onDelete: PropTypes.func,
  isDisabled: PropTypes.bool,
};

export default ManualCreatorCard;
