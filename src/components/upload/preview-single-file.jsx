import PropTypes from 'prop-types';

import Box from '@mui/material/Box';

import Image from '../image';

// ----------------------------------------------------------------------

export default function SingleFilePreview({ imgUrl = '', alt = 'file preview', sx }) {
  return (
    <Box sx={sx}>
      <Image
        alt={alt}
        src={imgUrl}
        sx={{
          width: 1,
          height: 1,
          borderRadius: 1,
        }}
      />
    </Box>
  );
}

SingleFilePreview.propTypes = {
  alt: PropTypes.string,
  imgUrl: PropTypes.string,
  sx: PropTypes.object,
};
