import PropTypes from 'prop-types';
import React, { useMemo, useEffect, useCallback } from 'react';

import { Box } from '@mui/material';

const ImageGridDisplay = ({ files, onRemoveAll, onRemoveImage, height = { xs: 320, md: 480 } }) => {
  if (files.length === 0) return null;

  // Memoize image URLs to prevent recreation on every render
  const imageUrls = useMemo(() => files.map(file => {
      if (typeof file === 'string') return file; // Already a URL string
      if (file && typeof file === 'object' && file.url) return file.url; // API object with url property
      if (file instanceof File) return URL.createObjectURL(file); // File object
      console.error('Invalid file type:', file);
      return ''; // Fallback for invalid files
    }), [files]);

  // Cleanup blob URLs when component unmounts or files change
  useEffect(() => () => {
      imageUrls.forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    }, [imageUrls]);

  // Memoized component to prevent unnecessary re-renders
  const ImageWithRemoveButton = useCallback(({ file, index, sx }) => (
    <Box sx={{ position: 'relative', ...sx }}>
      <Box
        component="img"
        src={imageUrls[index]}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: 1, // Less curvy edges
        }}
      />
      {/* Image Number - Top Left */}
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
      {onRemoveImage && (
        <Box
          component="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveImage(index);
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
  ), [imageUrls, onRemoveImage]);

  return (
    <Box sx={{ 
      height,
      border: '1px solid #EBEBEB',
      borderRadius: 2,
      overflow: 'hidden',
      overflowY: 'hidden', // Prevent vertical scrolling
      position: 'relative',
      bgcolor: 'white',
      p: 1, // Add padding for gaps
    }}>
      {files.length === 1 && (
        /* Single Image - Cover the entire area */
        <ImageWithRemoveButton
          file={files[0]}
          index={0}
          sx={{
            width: '100%',
            height: '100%',
          }}
        />
      )}
      
      {files.length === 2 && (
        /* Two Images - Side by side */
        <Box sx={{ display: 'flex', height: '100%', gap: 1 }}>
          {files.slice(0, 2).map((file, index) => (
            <ImageWithRemoveButton
              key={index}
              file={file}
              index={index}
              sx={{
                width: '50%',
                height: '100%',
              }}
            />
          ))}
        </Box>
      )}
      
      {files.length === 3 && (
        /* Three Images - 3 columns */
        <Box sx={{ display: 'flex', height: '100%', gap: 1 }}>
          {files.slice(0, 3).map((file, index) => (
            <ImageWithRemoveButton
              key={index}
              file={file}
              index={index}
              sx={{
                width: '33.33%',
                height: '100%',
              }}
            />
          ))}
        </Box>
      )}
      
      {files.length === 4 && (
        /* Four Images - 2x2 grid */
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 1 }}>
          <Box sx={{ display: 'flex', height: '50%', gap: 1 }}>
            {files.slice(0, 2).map((file, index) => (
              <ImageWithRemoveButton
                key={index}
                file={file}
                index={index}
                sx={{
                  width: '50%',
                  height: '100%',
                }}
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', height: '50%', gap: 1 }}>
            {files.slice(2, 4).map((file, index) => (
              <ImageWithRemoveButton
                key={index + 2}
                file={file}
                index={index + 2}
                sx={{
                  width: '50%',
                  height: '100%',
                }}
              />
            ))}
          </Box>
        </Box>
      )}
      
      {files.length === 5 && (
        /* Five Images - 4 small + 1 large */
        <Box sx={{ display: 'flex', height: '100%', gap: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', width: '50%', gap: 1 }}>
            {files.slice(0, 4).map((file, index) => (
              <ImageWithRemoveButton
                key={index}
                file={file}
                index={index}
                sx={{
                  width: '100%',
                  height: '25%',
                }}
              />
            ))}
          </Box>
          <ImageWithRemoveButton
            file={files[4]}
            index={4}
            sx={{
              width: '50%',
              height: '100%',
            }}
          />
        </Box>
      )}
      
      {files.length === 6 && (
        /* Six Images - 3x2 grid */
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 1 }}>
          <Box sx={{ display: 'flex', height: '50%', gap: 1 }}>
            {files.slice(0, 3).map((file, index) => (
              <ImageWithRemoveButton
                key={index}
                file={file}
                index={index}
                sx={{
                  width: '33.33%',
                  height: '100%',
                }}
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', height: '50%', gap: 1 }}>
            {files.slice(3, 6).map((file, index) => (
              <ImageWithRemoveButton
                key={index + 3}
                file={file}
                index={index + 3}
                sx={{
                  width: '33.33%',
                  height: '100%',
                }}
              />
            ))}
          </Box>
        </Box>
      )}
      
      {files.length === 7 && (
        /* Seven Images - 6 small (174.67x191) + 1 large (174.75x405) */
        <Box sx={{ display: 'flex', height: '100%', gap: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', width: '50%', gap: 1 }}>
            <Box sx={{ display: 'flex', height: '50%', gap: 1 }}>
              {files.slice(0, 3).map((file, index) => (
                <ImageWithRemoveButton
                  key={index}
                  file={file}
                  index={index}
                  sx={{
                    width: '33.33%',
                    height: '100%',
                  }}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', height: '50%', gap: 1 }}>
              {files.slice(3, 6).map((file, index) => (
                <ImageWithRemoveButton
                  key={index + 3}
                  file={file}
                  index={index + 3}
                  sx={{
                    width: '33.33%',
                    height: '100%',
                  }}
                />
              ))}
            </Box>
          </Box>
          <ImageWithRemoveButton
            file={files[6]}
            index={6}
            sx={{
              width: '50%',
              height: '100%',
            }}
          />
        </Box>
      )}

      {files.length > 7 && (
        /* More than 7 Images - Maintain same size pattern with horizontal scrolling */
        <Box sx={{ 
          overflowX: 'auto',
          overflowY: 'hidden', // Prevent vertical scrolling
          height: '100%',
          '&::-webkit-scrollbar': {
            height: 6,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: 3,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderRadius: 3,
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.5)',
            },
          },
        }}>
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            gap: 1,
            minWidth: 'max-content',
          }}>
            {/* First Row - Maintain consistent sizing */}
            <Box sx={{ 
              display: 'flex',
              height: '50%',
              gap: 1,
            }}>
              {files.slice(0, Math.ceil(files.length / 2)).map((file, index) => (
                <ImageWithRemoveButton
                  key={index}
                  file={file}
                  index={index}
                  sx={{
                    width: '174.67px', // Fixed width to maintain size
                    height: '100%',
                    flexShrink: 0,
                  }}
                />
              ))}
            </Box>
            
            {/* Second Row - Maintain consistent sizing */}
            <Box sx={{ 
              display: 'flex',
              height: '50%',
              gap: 1,
            }}>
              {files.slice(Math.ceil(files.length / 2)).map((file, index) => (
                <ImageWithRemoveButton
                  key={index + Math.ceil(files.length / 2)}
                  file={file}
                  index={index + Math.ceil(files.length / 2)}
                  sx={{
                    width: '174.67px', // Fixed width to maintain size
                    height: '100%',
                    flexShrink: 0,
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

ImageGridDisplay.propTypes = {
  files: PropTypes.array.isRequired,
  onRemoveImage: PropTypes.func,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
};

export default React.memo(ImageGridDisplay);