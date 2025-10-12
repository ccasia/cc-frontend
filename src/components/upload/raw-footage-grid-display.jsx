import React, { useMemo, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, IconButton } from '@mui/material';

const RawFootageGridDisplay = ({ files, onRemoveVideo, height = { xs: 320, md: 480 } }) => {
  if (files.length === 0) return null;

  // Memoize video URLs to prevent recreation on every render
  const videoUrls = useMemo(() => {
    return files.map(file => {
      if (typeof file === 'string') return file; // Already a URL string
      if (file && typeof file === 'object' && file.url) return file.url; // API object with url property
      if (file instanceof File) return URL.createObjectURL(file); // File object
      console.error('Invalid file type:', file);
      return ''; // Fallback for invalid files
    });
  }, [files]);

  // Cleanup blob URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      videoUrls.forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [videoUrls]);

  // Memoized component to prevent unnecessary re-renders
  const VideoWithRemoveButton = useCallback(({ file, index, sx }) => (
    <Box sx={{ position: 'relative', ...sx }}>
      <video
        controls
        controlsList="nodownload"
        preload="metadata"
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          backgroundColor: '#000',
          borderRadius: 8,
        }}
        src={videoUrls[index]}
      >
        <track kind="captions" srcLang="en" label="English" />
      </video>

      {/* Video Number - Top Left */}
      <Box
        sx={{
          position: 'absolute',
          top: 4,
          left: 4,
          px: 1,
          py: 0.25,
          fontWeight: 600,
          border: '1px solid',
          borderBottom: '3px solid',
          borderRadius: 0.8,
          bgcolor: 'white',
          color: '#48484A',
          borderColor: '#e7e7e7',
          fontSize: '0.75rem',
          minWidth: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.01)',
        }}
      >
        {index + 1}
      </Box>

      {/* Individual Remove Button - Top Right */}
      {onRemoveVideo && (
        <Box
          component="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveVideo(index);
          }}
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            px: 1,
            py: 0.25,
            fontWeight: 600,
            border: '1px solid',
            borderBottom: '3px solid',
            borderRadius: 0.8,
            bgcolor: 'white',
            color: '#48484A',
            borderColor: '#e7e7e7',
            fontSize: '0.75rem',
            minWidth: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.01)',
            '&:hover': {
              bgcolor: '#f5f5f5',
            },
          }}
        >
          ✕
        </Box>
      )}
    </Box>
  ), [videoUrls, onRemoveVideo]);

  const containerHeight = typeof height === 'object' ? height : { xs: height, md: height };

  // Layout logic based on number of videos
  if (files.length === 1) {
    // Single video - full size like Draft Video 1 & 2
    return (
      <Box
        sx={{
          width: '100%',
          height: containerHeight,
          p: 1,
          overflowY: 'hidden',
        }}
      >
        <VideoWithRemoveButton
          file={files[0]}
          index={0}
          sx={{
            width: '100%',
            height: '100%',
          }}
        />
      </Box>
    );
  }

  if (files.length === 2) {
    // Two videos - split 50/50
    return (
      <Box
        sx={{
          width: '100%',
          height: containerHeight,
          p: 1,
          display: 'flex',
          gap: 1,
          overflowY: 'hidden',
        }}
      >
        <VideoWithRemoveButton
          file={files[0]}
          index={0}
          sx={{
            flex: 1,
            height: '100%',
          }}
        />
        <VideoWithRemoveButton
          file={files[1]}
          index={1}
          sx={{
            flex: 1,
            height: '100%',
          }}
        />
      </Box>
    );
  }

  if (files.length === 3) {
    // Three videos - fit nicely in view
    return (
      <Box
        sx={{
          width: '100%',
          height: containerHeight,
          p: 1,
          display: 'flex',
          gap: 1,
          overflowY: 'hidden',
        }}
      >
        <VideoWithRemoveButton
          file={files[0]}
          index={0}
          sx={{
            flex: 1,
            height: '100%',
          }}
        />
        <VideoWithRemoveButton
          file={files[1]}
          index={1}
          sx={{
            flex: 1,
            height: '100%',
          }}
        />
        <VideoWithRemoveButton
          file={files[2]}
          index={2}
          sx={{
            flex: 1,
            height: '100%',
          }}
        />
      </Box>
    );
  }

  // 4+ videos - horizontal carousel
  return (
    <Box
      sx={{
        width: '100%',
        height: containerHeight,
        p: 1,
        overflowY: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
          height: '100%',
          minWidth: 'max-content', // Ensure content expands for unified scrolling
          '&::-webkit-scrollbar': {
            height: 6,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderRadius: 4,
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.5)',
            },
          },
        }}
      >
        {files.map((file, index) => (
          <VideoWithRemoveButton
            key={file.id || index}
            file={file}
            index={index}
            sx={{
              flexShrink: 0,
              width: index < 3 ? '240px' : '200px', // First 3 slightly larger
              height: '100%',
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

RawFootageGridDisplay.propTypes = {
  files: PropTypes.array.isRequired,
  onRemoveVideo: PropTypes.func,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
};

export default React.memo(RawFootageGridDisplay);
