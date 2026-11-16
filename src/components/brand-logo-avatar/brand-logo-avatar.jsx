import PropTypes from 'prop-types';

import Avatar from '@mui/material/Avatar';

export default function BrandLogoAvatar({ src, alt, children, sx, ...other }) {
  const initial = Array.from(alt?.trim() ?? '')[0]?.toUpperCase();

  return (
    <Avatar
      src={src || undefined}
      alt={alt}
      sx={[
        {
          bgcolor: 'common.white',
          color: 'text.secondary',
          fontWeight: 600,
          '& .MuiAvatar-img': { objectFit: 'contain', p: '8%' },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
        !!src && { bgcolor: 'common.white' },
      ]}
      {...other}
    >
      {children ?? initial}
    </Avatar>
  );
}

BrandLogoAvatar.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  children: PropTypes.node,
  sx: PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.func]),
};
