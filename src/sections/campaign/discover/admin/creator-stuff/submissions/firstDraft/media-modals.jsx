import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import React, { useState, useEffect } from 'react';

import {
  Box,
  Stack,
  Button,
  Dialog,
  Avatar,
  Tooltip,
  Popover,
  Divider,
  Typography,
} from '@mui/material';

import Iconify from 'src/components/iconify';

import { getVideoSize, handleDownload } from './utils';

const VideoModal = ({ 
  open, 
  onClose, 
  videos, 
  currentIndex, 
  setCurrentIndex,
  title = "Preview Raw Footage",
  creator,
  submission,
  showCaption = false
}) => {
  const [videoDetails, setVideoDetails] = useState({
    size: '0 Bytes',
    resolution: '',
    duration: 0,
  });
  const [fileDetailsAnchor, setFileDetailsAnchor] = useState(null);
  const [linkCopiedAnchor, setLinkCopiedAnchor] = useState(null);
  const [showLinkCopied, setShowLinkCopied] = useState(false);

  const handleVideoMetadata = async (event) => {
    const video = event.target;
    const videoUrl = videos?.[currentIndex]?.url;

    if (videoUrl) {
      const size = await getVideoSize(videoUrl);
      const resolution = `${video.videoWidth} x ${video.videoHeight}`;
      const duration = Math.round(video.duration);

      setVideoDetails({ size, resolution, duration });
    }
  };

  const handleDownloadClick = async () => {
    try {
      await handleDownload(videos?.[currentIndex]?.url);
      enqueueSnackbar('Download started', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to download video', { variant: 'error' });
    }
  };

  const handleCopyLink = async (event) => {
    try {
      await navigator.clipboard.writeText(videos?.[currentIndex]?.url);
      setLinkCopiedAnchor(event.currentTarget);
      setShowLinkCopied(true);
      
      // Hide the indicator after 2 seconds
      setTimeout(() => {
        setShowLinkCopied(false);
        setLinkCopiedAnchor(null);
      }, 2000);
      
      enqueueSnackbar('Link copied to clipboard', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to copy link', { variant: 'error' });
    }
  };

  const handleFileDetailsClick = (event) => {
    setFileDetailsAnchor(event.currentTarget);
  };

  const handleFileDetailsClose = () => {
    setFileDetailsAnchor(null);
  };

  const getFileName = () => {
    const url = videos?.[currentIndex]?.url;
    if (!url) return 'Untitled Video';
    
    // Extract filename from URL
    const urlParts = url.split('/');
    const fileNameWithParams = urlParts[urlParts.length - 1];
    
    // Remove query parameters (everything after ?)
    const fileNameWithoutParams = fileNameWithParams.split('?')[0];
    
    // debug log
    // console.log('Video URL:', url);
    // console.log('Filename with params:', fileNameWithParams);
    // console.log('Filename without params:', fileNameWithoutParams);
    
    // Remove the prefix ID(s) (everything before and including the last underscore)
    // This handles Google Cloud Storage naming pattern: {id}_{originalFileName} or {id1}_{id2}_{originalFileName}
    const lastUnderscoreIndex = fileNameWithoutParams.lastIndexOf('_');
    // console.log('Last underscore index:', lastUnderscoreIndex);
    
    if (lastUnderscoreIndex !== -1) {
      const actualFileName = fileNameWithoutParams.substring(lastUnderscoreIndex + 1);
      // console.log('Extracted filename:', actualFileName);
      return actualFileName || 'Untitled Video';
    }
    
    console.log('No underscore found, returning full filename:', fileNameWithoutParams);
    return fileNameWithoutParams || 'Untitled Video';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Debug logging for caption issue
  React.useEffect(() => {
    if (open && showCaption) {
      console.log('🎬 VideoModal Debug - Caption Info:', {
        showCaption,
        submissionExists: !!submission,
        submissionCaption: submission?.caption,
        submissionFirstDraftCaption: submission?.firstDraft?.caption,
        submissionFinalDraftCaption: submission?.finalDraft?.caption,
        fullSubmission: submission
      });
    }
  }, [open, showCaption, submission]);

  // Helper function to get the caption from various possible locations
  const getCaption = () => {
    return submission?.caption || 
           submission?.firstDraft?.caption || 
           submission?.finalDraft?.caption || 
           null;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          overflow: 'hidden',
          position: 'relative',
        },
      }}
      sx={{
        zIndex: 9999,
        '& .MuiDialog-container': {
          alignItems: 'center',
          justifyContent: 'center',
        },
        '& .MuiDialog-paper': {
          m: 0,
          width: '100%',
          height: '100%',
        },
      }}
    >
      {/* Creator Profile Info - Top Left */}
      <Box
        sx={{
          position: 'fixed',
          top: { xs: 10, md: 20 },
          left: { xs: 10, md: 20 },
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, md: 1.5 },
          borderRadius: '8px',
          p: { xs: 1.5, md: 2 },
          height: { xs: '56px', md: '64px' },
          minWidth: { xs: '180px', md: '200px' },
        }}
      >
        <Avatar
          src={creator?.photoURL || creator?.user?.photoURL}
          sx={{ width: { xs: 36, md: 40 }, height: { xs: 36, md: 40 } }}
        />
        <Stack spacing={0.5}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: '#e7e7e7',
              fontSize: { xs: '13px', md: '14px' },
              lineHeight: 1.3,
            }}
          >
            {creator?.name || creator?.user?.name || 'Creator'}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: '#85868E',
              fontSize: { xs: '11px', md: '12px' },
              lineHeight: 1.3,
            }}
          >
            {formatDate(videos?.[currentIndex]?.createdAt)}, {formatTime(videos?.[currentIndex]?.createdAt)}
          </Typography>
        </Stack>
      </Box>

      {/* Action Buttons - Top Right */}
      <Stack
        direction="row"
        spacing={{ xs: 0.5, md: 1 }}
        sx={{
          position: 'fixed',
          top: { xs: 10, md: 20 },
          right: { xs: 10, md: 20 },
          zIndex: 10000,
        }}
      >
        {/* Grouped Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            border: '1px solid #28292C',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <Tooltip 
            title="Copy Link" 
            arrow 
            placement="bottom"
            PopperProps={{
              sx: {
                zIndex: 10001,
              },
            }}
            slotProps={{
              tooltip: {
                sx: {
                  bgcolor: 'rgba(0, 0, 0, 0.9)',
                  color: 'white',
                  fontSize: { xs: '11px', md: '12px' },
                  fontWeight: 500,
                },
              },
              arrow: {
                sx: {
                  color: 'rgba(0, 0, 0, 0.9)',
                },
              },
            }}
          >
            <Button
              onClick={handleCopyLink}
              sx={{
                minWidth: { xs: '40px', md: '44px' },
                width: { xs: '40px', md: '44px' },
                height: { xs: '40px', md: '44px' },
                p: 0,
                bgcolor: 'transparent',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 650,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: { xs: '3px', md: '4px' },
                  left: { xs: '3px', md: '4px' },
                  right: { xs: '3px', md: '4px' },
                  bottom: { xs: '3px', md: '4px' },
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  transition: 'background-color 0.2s ease',
                  zIndex: -1,
                },
                '&:hover::before': {
                  backgroundColor: '#5A5A5C',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                },
              }}
            >
              <Iconify icon="eva:link-2-fill" width={{ xs: 16, md: 18 }} />
            </Button>
          </Tooltip>

          <Tooltip 
            title="Download Video" 
            arrow 
            placement="bottom"
            PopperProps={{
              sx: {
                zIndex: 10001,
              },
            }}
            slotProps={{
              tooltip: {
                sx: {
                  bgcolor: 'rgba(0, 0, 0, 0.9)',
                  color: 'white',
                  fontSize: { xs: '11px', md: '12px' },
                  fontWeight: 500,
                },
              },
              arrow: {
                sx: {
                  color: 'rgba(0, 0, 0, 0.9)',
                },
              },
            }}
          >
            <Button
              onClick={handleDownloadClick}
              sx={{
                minWidth: { xs: '40px', md: '44px' },
                width: { xs: '40px', md: '44px' },
                height: { xs: '40px', md: '44px' },
                p: 0,
                bgcolor: 'transparent',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 650,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: { xs: '3px', md: '4px' },
                  left: { xs: '3px', md: '4px' },
                  right: { xs: '3px', md: '4px' },
                  bottom: { xs: '3px', md: '4px' },
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  transition: 'background-color 0.2s ease',
                  zIndex: -1,
                },
                '&:hover::before': {
                  backgroundColor: '#5A5A5C',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                },
              }}
            >
              <Iconify icon="eva:download-fill" width={{ xs: 16, md: 18 }} />
            </Button>
          </Tooltip>

          <Tooltip 
            title="File Details" 
            arrow 
            placement="bottom"
            PopperProps={{
              sx: {
                zIndex: 10001,
              },
            }}
            slotProps={{
              tooltip: {
                sx: {
                  bgcolor: 'rgba(0, 0, 0, 0.9)',
                  color: 'white',
                  fontSize: { xs: '11px', md: '12px' },
                  fontWeight: 500,
                },
              },
              arrow: {
                sx: {
                  color: 'rgba(0, 0, 0, 0.9)',
                },
              },
            }}
          >
            <Button
              onClick={handleFileDetailsClick}
              sx={{
                minWidth: { xs: '40px', md: '44px' },
                width: { xs: '40px', md: '44px' },
                height: { xs: '40px', md: '44px' },
                p: 0,
                bgcolor: 'transparent',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 650,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: { xs: '3px', md: '4px' },
                  left: { xs: '3px', md: '4px' },
                  right: { xs: '3px', md: '4px' },
                  bottom: { xs: '3px', md: '4px' },
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  transition: 'background-color 0.2s ease',
                  zIndex: -1,
                },
                '&:hover::before': {
                  backgroundColor: '#5A5A5C',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                },
              }}
            >
              <Iconify icon="eva:info-outline" width={{ xs: 16, md: 18 }} />
            </Button>
          </Tooltip>
        </Box>

        {/* Close Button - Separate */}
        <Tooltip 
          title="Close" 
          arrow 
          placement="bottom"
          PopperProps={{
            sx: {
              zIndex: 10001,
            },
          }}
          slotProps={{
            tooltip: {
              sx: {
                bgcolor: 'rgba(0, 0, 0, 0.9)',
                color: 'white',
                fontSize: { xs: '11px', md: '12px' },
                fontWeight: 500,
              },
            },
            arrow: {
              sx: {
                color: 'rgba(0, 0, 0, 0.9)',
              },
            },
          }}
        >
          <Button
            onClick={onClose}
            sx={{
              minWidth: { xs: '40px', md: '44px' },
              width: { xs: '40px', md: '44px' },
              height: { xs: '40px', md: '44px' },
              p: 0,
              color: '#ffffff',
              border: '1px solid #28292C',
              borderRadius: '8px',
              fontWeight: 650,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: { xs: '3px', md: '4px' },
                left: { xs: '3px', md: '4px' },
                right: { xs: '3px', md: '4px' },
                bottom: { xs: '3px', md: '4px' },
                borderRadius: '4px',
                backgroundColor: 'transparent',
                transition: 'background-color 0.2s ease',
                zIndex: -1,
              },
              '&:hover::before': {
                backgroundColor: '#5A5A5C',
              },
              '&:hover': {
                bgcolor: 'transparent',
              },
            }}
          >
            <Iconify icon="eva:close-fill" width={{ xs: 20, md: 22 }} />
          </Button>
        </Tooltip>
      </Stack>

      {/* Link Copied Indicator */}
      <Box
        sx={{
          position: 'fixed',
          top: { xs: 56, md: 76 },
          right: { xs: 10, md: 20 },
          zIndex: 10002,
          opacity: showLinkCopied ? 1 : 0,
          transform: showLinkCopied ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'all 0.3s ease-in-out',
          pointerEvents: 'none',
          width: { xs: '150px', md: '172px' },
        }}
      >
        <Box
          sx={{
            bgcolor: '#4CAF50',
            border: '1px solid #45A049',
            borderBottom: '3px solid #45A049',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            p: { xs: 1, md: 1.5 },
            display: 'flex',
            alignItems: 'start',
            justifyContent: 'start',
            gap: 1,
          }}
        >
          <Iconify icon="eva:checkmark-circle-2-fill" width={{ xs: 14, md: 16 }} color="white" />
          <Typography
            sx={{
              fontFamily: 'Inter',
              fontWeight: 600,
              color: 'white',
              fontSize: { xs: '11px', md: '12px' },
            }}
          >
            Link Copied
          </Typography>
        </Box>
      </Box>

      {/* File Details Popover */}
      <Popover
        open={Boolean(fileDetailsAnchor)}
        anchorEl={fileDetailsAnchor}
        onClose={handleFileDetailsClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        sx={{
          zIndex: 10002,
          mt: 1,
        }}
        PaperProps={{
          sx: {
            bgcolor: '#FFFFFF',
            border: '1px solid #E7E7E7',
            borderBottom: '3px solid #E7E7E7',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '200px',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography
            sx={{
              fontFamily: 'Inter',
              fontWeight: 600,
              color: '#000',
              fontSize: '14px',
              mb: 1,
            }}
          >
            File Details
          </Typography>
          <Divider sx={{ mb: 1.5 }} />
          
          <Stack spacing={1}>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: '#666',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Filename
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#000',
                  fontSize: '13px',
                  wordBreak: 'break-all',
                }}
              >
                {getFileName()}
              </Typography>
            </Box>
            
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: '#666',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                File Size
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#000',
                  fontSize: '13px',
                }}
              >
                {videoDetails.size}
              </Typography>
            </Box>

            {videoDetails.resolution && (
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#666',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Resolution
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#000',
                    fontSize: '13px',
                  }}
                >
                  {videoDetails.resolution}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>
      </Popover>

      {/* Video Layout */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          pt: { xs: '80px', md: '100px' }, // Account for top controls
          pb: { xs: 2, md: 3 },
          px: { xs: 2, md: 4 },
          gap: { xs: 2, md: 3 },
          overflow: 'hidden', // Prevent any scrolling
        }}
      >
        {/* Video Container */}
        <Box
          sx={{
            position: 'relative',
            width: { 
              xs: '100%', 
              md: showCaption && getCaption() ? '60%' : '90%' 
            },
            height: { 
              xs: showCaption && getCaption() ? 'calc(60vh - 80px)' : 'calc(100vh - 120px)', 
              md: showCaption && getCaption() ? 'calc(100vh - 120px)' : 'calc(100vh - 120px)'
            },
            maxWidth: { 
              xs: '100%', 
              md: showCaption && getCaption() ? '800px' : '1200px' 
            },
            bgcolor: 'black',
            borderRadius: 2,
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            component="video"
            src={videos?.[currentIndex]?.url}
            controls
            autoPlay
            onLoadedMetadata={handleVideoMetadata}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              maxWidth: '100%',
              maxHeight: '100%',
            }}
          />
        </Box>

        {/* Video Caption - Right Side on Desktop, Bottom on Mobile */}
        {showCaption && getCaption() && (
          <Box
            sx={{
              width: { xs: '100%', md: '35%' },
              maxWidth: { xs: '100%', md: '400px' },
              height: { 
                xs: 'calc(40vh - 80px)', 
                md: 'calc(100vh - 120px)' 
              },
              minHeight: { xs: '150px', md: 'auto' },
              bgcolor: 'transparent',
              border: '1px solid #28292C',
              borderRadius: '8px',
              p: { xs: 2, md: 3 },
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: '#ffffff',
                fontSize: { xs: '13px', md: '14px' },
                mb: { xs: 1.5, md: 2 },
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexShrink: 0,
              }}
            >
              <Iconify
                icon="solar:text-bold"
                sx={{
                  width: { xs: 14, md: 16 },
                  height: { xs: 14, md: 16 },
                  color: '#ffffff',
                }}
              />
              Video Caption
            </Typography>
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  width: { xs: '4px', md: '6px' },
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#5A5A5C',
                  borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#6A6A6C',
                },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: '#e7e7e7',
                  fontSize: { xs: '13px', md: '14px' },
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {getCaption()}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Dialog>
  );
};

const PhotoModal = ({ 
  open, 
  onClose, 
  photos, 
  currentIndex, 
  setCurrentIndex,
  creator // Add creator prop for profile info
}) => {
  const [imageDetails, setImageDetails] = useState({
    size: 'Loading...',
  });
  const [fileDetailsAnchor, setFileDetailsAnchor] = useState(null);
  const [linkCopiedAnchor, setLinkCopiedAnchor] = useState(null);
  const [showLinkCopied, setShowLinkCopied] = useState(false);

  const handleCopyLink = async (event) => {
    try {
      await navigator.clipboard.writeText(photos?.[currentIndex]?.url);
      setLinkCopiedAnchor(event.currentTarget);
      setShowLinkCopied(true);
      
      // Hide the indicator after 2 seconds
      setTimeout(() => {
        setShowLinkCopied(false);
        setLinkCopiedAnchor(null);
      }, 2000);
      
      enqueueSnackbar('Link copied to clipboard', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to copy link', { variant: 'error' });
    }
  };

  const handleDownloadClick = async () => {
    try {
      const imageUrl = photos?.[currentIndex]?.url;
      const fileName = getFileName();
      
      // Fetch the image as a blob
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      enqueueSnackbar('Download started', { variant: 'success' });
    } catch (error) {
      console.error('Download failed:', error);
      enqueueSnackbar('Failed to download image', { variant: 'error' });
    }
  };

  const handleFileDetailsClick = (event) => {
    setFileDetailsAnchor(event.currentTarget);
  };

  const handleFileDetailsClose = () => {
    setFileDetailsAnchor(null);
  };

  const getFileName = () => {
    const url = photos?.[currentIndex]?.url;
    if (!url) return 'Untitled Image';
    
    // Extract filename from URL
    const urlParts = url.split('/');
    const fileNameWithParams = urlParts[urlParts.length - 1];
    
    // Remove query parameters (everything after ?)
    const fileNameWithoutParams = fileNameWithParams.split('?')[0];
    
    // Remove the prefix ID(s) (everything before and including the last underscore)
    // This handles Google Cloud Storage naming pattern: {id}_{originalFileName} or {id1}_{id2}_{originalFileName}
    const lastUnderscoreIndex = fileNameWithoutParams.lastIndexOf('_');
    
    if (lastUnderscoreIndex !== -1) {
      const actualFileName = fileNameWithoutParams.substring(lastUnderscoreIndex + 1);
      return actualFileName || 'Untitled Image';
    }
    
    return fileNameWithoutParams || 'Untitled Image';
  };

  // Load image details when currentIndex changes
  useEffect(() => {
    const getFileSize = async () => {
      try {
        const response = await fetch(photos?.[currentIndex]?.url, { method: 'HEAD' });
        const size = response.headers.get('content-length');
        if (size) {
          const sizeInMB = (parseInt(size, 10) / (1024 * 1024)).toFixed(2);
          return `${sizeInMB} MB`;
        }
        return 'Unknown size';
      } catch (error) {
        return 'Unknown size';
      }
    };

    const loadImageDetails = async () => {
      if (photos?.[currentIndex]?.url) {
        setImageDetails({ size: 'Loading...' });
        const size = await getFileSize();
        setImageDetails({ size });
      }
    };
    loadImageDetails();
  }, [currentIndex, photos]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          overflow: 'hidden',
          position: 'relative',
        },
      }}
      sx={{
        zIndex: 9999,
        '& .MuiDialog-container': {
          alignItems: 'center',
          justifyContent: 'center',
        },
        '& .MuiDialog-paper': {
          m: 0,
          width: '100%',
          height: '100%',
        },
      }}
    >
      {/* Creator Profile Info - Top Left */}
      <Box
        sx={{
          position: 'fixed',
          top: { xs: 10, md: 20 },
          left: { xs: 10, md: 20 },
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, md: 1.5 },
          borderRadius: '8px',
          p: { xs: 1.5, md: 2 },
          height: { xs: '56px', md: '64px' },
          minWidth: { xs: '180px', md: '200px' },
        }}
      >
        <Avatar
          src={creator?.photoURL || creator?.user?.photoURL}
          sx={{ width: { xs: 36, md: 40 }, height: { xs: 36, md: 40 } }}
        />
        <Stack spacing={0.5}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: '#e7e7e7',
              fontSize: { xs: '13px', md: '14px' },
              lineHeight: 1.3,
            }}
          >
            {creator?.name || creator?.user?.name || 'Creator'}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: '#85868E',
              fontSize: { xs: '11px', md: '12px' },
              lineHeight: 1.3,
            }}
          >
            {formatDate(photos?.[currentIndex]?.createdAt)}, {formatTime(photos?.[currentIndex]?.createdAt)}
          </Typography>
        </Stack>
      </Box>

      {/* Action Buttons - Top Right */}
      <Stack
        direction="row"
        spacing={{ xs: 0.5, md: 1 }}
        sx={{
          position: 'fixed',
          top: { xs: 10, md: 20 },
          right: { xs: 10, md: 20 },
          zIndex: 10000,
        }}
      >
        {/* Grouped Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            border: '1px solid #28292C',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <Tooltip 
            title="Copy Link" 
            arrow 
            placement="bottom"
            PopperProps={{
              sx: {
                zIndex: 10001,
              },
            }}
            slotProps={{
              tooltip: {
                sx: {
                  bgcolor: 'rgba(0, 0, 0, 0.9)',
                  color: 'white',
                  fontSize: { xs: '11px', md: '12px' },
                  fontWeight: 500,
                },
              },
              arrow: {
                sx: {
                  color: 'rgba(0, 0, 0, 0.9)',
                },
              },
            }}
          >
            <Button
              onClick={handleCopyLink}
              sx={{
                minWidth: { xs: '40px', md: '44px' },
                width: { xs: '40px', md: '44px' },
                height: { xs: '40px', md: '44px' },
                p: 0,
                bgcolor: 'transparent',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 650,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: { xs: '3px', md: '4px' },
                  left: { xs: '3px', md: '4px' },
                  right: { xs: '3px', md: '4px' },
                  bottom: { xs: '3px', md: '4px' },
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  transition: 'background-color 0.2s ease',
                  zIndex: -1,
                },
                '&:hover::before': {
                  backgroundColor: '#5A5A5C',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                },
              }}
            >
              <Iconify icon="eva:link-2-fill" width={{ xs: 16, md: 18 }} />
            </Button>
          </Tooltip>

          <Tooltip 
            title="Download Image" 
            arrow 
            placement="bottom"
            PopperProps={{
              sx: {
                zIndex: 10001,
              },
            }}
            slotProps={{
              tooltip: {
                sx: {
                  bgcolor: 'rgba(0, 0, 0, 0.9)',
                  color: 'white',
                  fontSize: { xs: '11px', md: '12px' },
                  fontWeight: 500,
                },
              },
              arrow: {
                sx: {
                  color: 'rgba(0, 0, 0, 0.9)',
                },
              },
            }}
          >
            <Button
              onClick={handleDownloadClick}
              sx={{
                minWidth: { xs: '40px', md: '44px' },
                width: { xs: '40px', md: '44px' },
                height: { xs: '40px', md: '44px' },
                p: 0,
                bgcolor: 'transparent',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 650,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: { xs: '3px', md: '4px' },
                  left: { xs: '3px', md: '4px' },
                  right: { xs: '3px', md: '4px' },
                  bottom: { xs: '3px', md: '4px' },
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  transition: 'background-color 0.2s ease',
                  zIndex: -1,
                },
                '&:hover::before': {
                  backgroundColor: '#5A5A5C',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                },
              }}
            >
              <Iconify icon="eva:download-fill" width={{ xs: 16, md: 18 }} />
            </Button>
          </Tooltip>

          <Tooltip 
            title="File Details" 
            arrow 
            placement="bottom"
            PopperProps={{
              sx: {
                zIndex: 10001,
              },
            }}
            slotProps={{
              tooltip: {
                sx: {
                  bgcolor: 'rgba(0, 0, 0, 0.9)',
                  color: 'white',
                  fontSize: { xs: '11px', md: '12px' },
                  fontWeight: 500,
                },
              },
              arrow: {
                sx: {
                  color: 'rgba(0, 0, 0, 0.9)',
                },
              },
            }}
          >
            <Button
              onClick={handleFileDetailsClick}
              sx={{
                minWidth: { xs: '40px', md: '44px' },
                width: { xs: '40px', md: '44px' },
                height: { xs: '40px', md: '44px' },
                p: 0,
                bgcolor: 'transparent',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 650,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: { xs: '3px', md: '4px' },
                  left: { xs: '3px', md: '4px' },
                  right: { xs: '3px', md: '4px' },
                  bottom: { xs: '3px', md: '4px' },
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  transition: 'background-color 0.2s ease',
                  zIndex: -1,
                },
                '&:hover::before': {
                  backgroundColor: '#5A5A5C',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                },
              }}
            >
              <Iconify icon="eva:info-outline" width={{ xs: 16, md: 18 }} />
            </Button>
          </Tooltip>
        </Box>

        {/* Close Button - Separate */}
        <Tooltip 
          title="Close" 
          arrow 
          placement="bottom"
          PopperProps={{
            sx: {
              zIndex: 10001,
            },
          }}
          slotProps={{
            tooltip: {
              sx: {
                bgcolor: 'rgba(0, 0, 0, 0.9)',
                color: 'white',
                fontSize: { xs: '11px', md: '12px' },
                fontWeight: 500,
              },
            },
            arrow: {
              sx: {
                color: 'rgba(0, 0, 0, 0.9)',
              },
            },
          }}
        >
          <Button
            onClick={onClose}
            sx={{
              minWidth: { xs: '40px', md: '44px' },
              width: { xs: '40px', md: '44px' },
              height: { xs: '40px', md: '44px' },
              p: 0,
              color: '#ffffff',
              border: '1px solid #28292C',
              borderRadius: '8px',
              fontWeight: 650,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: { xs: '3px', md: '4px' },
                left: { xs: '3px', md: '4px' },
                right: { xs: '3px', md: '4px' },
                bottom: { xs: '3px', md: '4px' },
                borderRadius: '4px',
                backgroundColor: 'transparent',
                transition: 'background-color 0.2s ease',
                zIndex: -1,
              },
              '&:hover::before': {
                backgroundColor: '#5A5A5C',
              },
              '&:hover': {
                bgcolor: 'transparent',
              },
            }}
          >
            <Iconify icon="eva:close-fill" width={{ xs: 20, md: 22 }} />
          </Button>
        </Tooltip>
      </Stack>

      {/* Link Copied Indicator */}
      <Box
        sx={{
          position: 'fixed',
          top: { xs: 56, md: 76 },
          right: { xs: 10, md: 20 },
          zIndex: 10002,
          opacity: showLinkCopied ? 1 : 0,
          transform: showLinkCopied ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'all 0.3s ease-in-out',
          pointerEvents: 'none',
          width: { xs: '150px', md: '172px' },
        }}
      >
        <Box
          sx={{
            bgcolor: '#4CAF50',
            border: '1px solid #45A049',
            borderBottom: '3px solid #45A049',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            p: { xs: 1, md: 1.5 },
            display: 'flex',
            alignItems: 'start',
            justifyContent: 'start',
            gap: 1,
          }}
        >
          <Iconify icon="eva:checkmark-circle-2-fill" width={{ xs: 14, md: 16 }} color="white" />
          <Typography
            sx={{
              fontFamily: 'Inter',
              fontWeight: 600,
              color: 'white',
              fontSize: { xs: '11px', md: '12px' },
            }}
          >
            Link Copied
          </Typography>
        </Box>
      </Box>

      {/* File Details Popover */}
      <Popover
        open={Boolean(fileDetailsAnchor)}
        anchorEl={fileDetailsAnchor}
        onClose={handleFileDetailsClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        sx={{
          zIndex: 10002,
          mt: 1,
        }}
        PaperProps={{
          sx: {
            bgcolor: '#FFFFFF',
            border: '1px solid #E7E7E7',
            borderBottom: '3px solid #E7E7E7',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '200px',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography
            sx={{
              fontFamily: 'Inter',
              fontWeight: 600,
              color: '#000',
              fontSize: '14px',
              mb: 1,
            }}
          >
            File Details
          </Typography>
          <Divider sx={{ mb: 1.5 }} />
          
          <Stack spacing={1}>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: '#666',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Filename
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#000',
                  fontSize: '13px',
                  wordBreak: 'break-all',
                }}
              >
                {getFileName()}
              </Typography>
            </Box>
            
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: '#666',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                File Size
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#000',
                  fontSize: '13px',
                }}
              >
                {imageDetails.size}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Popover>

      {/* Centered Image */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          p: 4,
        }}
      >
        {photos?.[currentIndex] && (
          <Box
            component="img"
            src={photos[currentIndex].url}
            alt={`Photo ${currentIndex + 1}`}
            sx={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
              borderRadius: 2,
            }}
          />
        )}
      </Box>
    </Dialog>
  );
};

VideoModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  videos: PropTypes.array,
  currentIndex: PropTypes.number,
  setCurrentIndex: PropTypes.func.isRequired,
  title: PropTypes.string,
  creator: PropTypes.object,
  submission: PropTypes.object,
  showCaption: PropTypes.bool,
};

PhotoModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  photos: PropTypes.array,
  currentIndex: PropTypes.number,
  setCurrentIndex: PropTypes.func.isRequired,
  creator: PropTypes.object,
};

export { VideoModal, PhotoModal }; 