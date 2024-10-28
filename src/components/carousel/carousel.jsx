import { useState } from 'react';
import PropTypes from 'prop-types';

import { Box, IconButton } from '@mui/material';

import Iconify from '../iconify';

const Carousel = ({ images, height }) => {
  const [curImage, setCurImage] = useState(0);

  const handleNext = () => {
    setCurImage((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          transform: `translateX(-${curImage * 100}%)`,
          transition: 'all .5s ease-in-out',
        }}
      >
        {images?.map((img, idx) => (
          <Box
            key={idx}
            sx={{
              flex: '0 0 100%',
              borderRadius: 2,
              height: 300,
            }}
          >
            <Box
              component="img"
              src={img}
              alt="Example"
              sx={{
                width: 1,
                height: 1,
                objectFit: 'contain',
              }}
            />
          </Box>
        ))}
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          width: 1,
        }}
      >
        <IconButton onClick={handlePrev} color="info">
          <Iconify icon="icon-park-outline:left-c" width={20} />
        </IconButton>
        <IconButton onClick={handleNext} color="info">
          <Iconify icon="icon-park-outline:right-c" width={20} />
        </IconButton>
      </Box>
      <Box
        sx={{
          mt: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          justifyContent: 'center',
        }}
      >
        {images?.map((img, idx) => (
          <Box
            sx={{
              bgcolor: (theme) =>
                idx === curImage && (theme.palette.mode === 'dark' ? 'white' : 'black'),
              border: 1,
              width: 10,
              height: 10,
              borderRadius: 10,
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default Carousel;

Carousel.propTypes = {
  images: PropTypes.array,
  height: PropTypes.number,
};
