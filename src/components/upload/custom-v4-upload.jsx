import React, { useMemo, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';

import {
  Box,
  Paper,
  Typography,
  IconButton,
} from '@mui/material';

import Iconify from 'src/components/iconify';

const CustomV4Upload = ({ 
  files, 
  onFilesChange, 
  disabled, 
  submissionId, 
  submittedVideo,
  accept = 'video/*',
  maxSize = 500 * 1024 * 1024, // 500MB default
  fileTypes = 'MP4, MOV, JPEG, PNG',
  height = 160, // Compressed height
}) => {
  const handleDrop = (e) => {
    e.preventDefault();
    if (disabled) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    validateAndAddFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    if (disabled) return;
    
    const selectedFiles = Array.from(e.target.files);
    validateAndAddFiles(selectedFiles);
  };

  const validateAndAddFiles = (newFiles) => {
    const validFiles = [];
    
    newFiles.forEach(file => {
      // Check file type based on accept prop
      const acceptsVideo = accept.includes('video');
      const acceptsImage = accept.includes('image');
      
      if (acceptsVideo && !file.type.startsWith('video/')) {
        enqueueSnackbar(`${file.name} is not a video file`, { variant: 'error' });
        return;
      }
      
      if (acceptsImage && !file.type.startsWith('image/')) {
        enqueueSnackbar(`${file.name} is not an image file`, { variant: 'error' });
        return;
      }
      
      // Check file size
      if (file.size > maxSize) {
        const sizeMB = Math.round(maxSize / (1024 * 1024));
        enqueueSnackbar(`${file.name} is too large. Maximum size is ${sizeMB}MB`, { variant: 'error' });
        return;
      }
      
      validFiles.push(file);
    });
    
    if (validFiles.length > 0) {
      onFilesChange([...files, ...validFiles]);
    }
  };

  const removeFile = useCallback((index) => {
    onFilesChange(files.filter((_, i) => i !== index));
  }, [files, onFilesChange]);

  // Memoize video display logic to prevent blinking
  const videoDisplayData = useMemo(() => {
    const hasVideo = files.length > 0 || submittedVideo;
    const videoToShow = files.length > 0 ? files[0] : submittedVideo;
    const isLocalVideo = files.length > 0;
    
    // Memoize the video URL to prevent re-creation and blinking
    const videoUrl = isLocalVideo && videoToShow 
      ? URL.createObjectURL(videoToShow) 
      : videoToShow?.url || null;
    
    return { hasVideo, videoToShow, isLocalVideo, videoUrl };
  }, [files, submittedVideo]);

  const { hasVideo, videoToShow, isLocalVideo, videoUrl } = videoDisplayData;

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (isLocalVideo && videoUrl && videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl, isLocalVideo]);

  const openPreview = useCallback(() => {
    // Create preview dialog
    const video = document.createElement('video');
    video.src = videoUrl;
    video.controls = true;
    video.autoplay = true;
    video.style.width = '100%';
    video.style.height = 'auto';
    video.style.maxHeight = '80vh';
    
    // Create modal dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      cursor: pointer;
    `;
    
    const container = document.createElement('div');
    container.style.cssText = `
      position: relative;
      max-width: 90%;
      max-height: 90%;
    `;
    
    dialog.appendChild(container);
    container.appendChild(video);
    
    // Close handlers
    const closeDialog = () => {
      if (document.body.contains(dialog)) {
        document.body.removeChild(dialog);
      }
      document.removeEventListener('keydown', handleEscape);
    };
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') closeDialog();
    };
    
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) closeDialog();
    });
    
    document.addEventListener('keydown', handleEscape);
    document.body.appendChild(dialog);
  }, [videoUrl]);

  return (
    <Box>
      {!hasVideo ? (
        // Upload Box - Compressed
        <Paper
          sx={{
            height: { xs: 280, md: height }, // Responsive height: 280px on mobile, provided height on desktop
            border: '1px solid #EBEBEB',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            bgcolor: 'white',
            boxShadow: 'none',
            '&:hover': {
              borderColor: 'rgba(0, 0, 0, 0.87)',
            },
          }}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !disabled && document.getElementById(`file-input-${submissionId}`).click()}
        >
          {/* Blue Circular Plus Icon - Smaller */}
          <Box
            sx={{
              width: height <= 120 ? 36 : 48, // Even smaller for small upload boxes
              height: height <= 120 ? 36 : 48,
              borderRadius: '50%',
              bgcolor: '#1340FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: height <= 120 ? 1.5 : 2, // Less margin for small upload boxes
              '&:hover': {
                bgcolor: '#0F36E6',
              },
            }}
          >
            <Iconify 
              icon="eva:plus-fill" 
              width={height <= 120 ? 18 : 24} // Smaller icon for small upload boxes
              height={height <= 120 ? 18 : 24} 
              sx={{ color: 'white' }} 
            />
          </Box>
          
          {/* Main Text - Compressed */}
          <Typography 
            variant="body2" // Reduced from body1
            sx={{ 
              color: '#1F2937',
              fontFamily: 'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 'bold',
              mb: 0.5, // Reduced from 1
              textAlign: 'center',
              fontSize: height <= 120 ? '0.75rem' : '0.85rem', // Smaller font for small upload boxes
            }}
          >
            Choose a file or drag and drop here
          </Typography>
          
          {/* File Info Text - Compressed */}
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#8E8E93',
              fontFamily: 'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 400,
              textAlign: 'center',
              fontSize: height <= 120 ? '0.55rem' : '0.65rem', // Smaller font for small upload boxes
            }}
          >
            Acceptable files: {fileTypes} | Max file size: 1 GB
          </Typography>
        </Paper>
      ) : (
        // Video Preview - Compressed
        <Box
          sx={{
            height: { xs: 280, md: height }, // Responsive height: 280px on mobile, provided height on desktop
            border: '1px solid #EBEBEB',
            borderRadius: 2,
            overflow: 'visible', // Changed from 'hidden' to 'visible' to allow controls to show properly
            position: 'relative',
            bgcolor: 'white',
            // Ensure the container doesn't interfere with video controls
            '& video': {
              '&::-webkit-media-controls': {
                zIndex: '2147483647 !important', // Maximum z-index to ensure controls are always on top
              },
              '&::-webkit-media-controls-panel': {
                zIndex: '2147483647 !important',
              },
              '&::-webkit-media-controls-timeline': {
                zIndex: '2147483647 !important',
                cursor: 'pointer !important', // Ensure timeline is clickable
              },
              '&::-webkit-media-controls-time-remaining-display': {
                zIndex: '2147483647 !important',
              },
              '&::-webkit-media-controls-current-time-display': {
                zIndex: '2147483647 !important',
              },
            },
          }}
        >
          <video
            src={videoUrl}
            controls
            controlsList="nodownload"
            preload="metadata"
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain', // Changed from 'cover' to 'contain' to maintain aspect ratio with letterboxing
              backgroundColor: '#000', // Black background for letterboxing
              borderRadius: '8px',
              position: 'relative',
              zIndex: 1,
            }}
          />
          
          {/* Remove Button - Only show for local files */}
          {isLocalVideo && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                removeFile(0);
              }}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 28,
                height: 28,
                bgcolor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                zIndex: 10, 
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.9)',
                },
              }}
            >
              <Iconify icon="eva:close-fill" width={16} />
            </IconButton>
          )}
        </Box>
      )}
      
      <input
        id={`file-input-${submissionId}`}
        type="file"
        accept={accept}
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled}
      />
    </Box>
  );
};

CustomV4Upload.propTypes = {
  files: PropTypes.array.isRequired,
  onFilesChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  submissionId: PropTypes.string.isRequired,
  submittedVideo: PropTypes.object,
  accept: PropTypes.string,
  maxSize: PropTypes.number,
  fileTypes: PropTypes.string,
  height: PropTypes.number,
};

export default React.memo(CustomV4Upload);
