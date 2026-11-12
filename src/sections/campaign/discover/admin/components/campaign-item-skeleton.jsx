import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';

function Bone({ variant = 'rounded', sx, ...other }) {
  return (
    <Skeleton
      variant={variant}
      animation="wave"
      sx={{
        flexShrink: 0,
        bgcolor: 'rgba(145, 158, 171, 0.2)',
        ...(variant === 'rounded' && { borderRadius: '6px' }),
        ...sx,
      }}
      {...other}
    />
  );
}

Bone.propTypes = {
  variant: PropTypes.string,
  sx: PropTypes.object,
};

function MetaRow({ textWidth, height, children }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ height }}>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ flex: 1 }}>
        <Bone width={20} height={20} sx={{ borderRadius: '5px' }} />
        <Bone width={textWidth} height={12} />
      </Stack>
      {children}
    </Stack>
  );
}

MetaRow.propTypes = {
  textWidth: PropTypes.string,
  height: PropTypes.number,
  children: PropTypes.node,
};

export default function CampaignItemSkeleton() {
  return (
    <Card
      sx={{
        height: 340,
        mb: -0.5,
        borderRadius: '15px',
        border: '1.2px solid',
        borderColor: 'divider',
        bgcolor: 'background.default',
        boxShadow: 'none',
      }}
    >
      <Box sx={{ position: 'relative', height: 180 }}>
        <Bone variant="rectangular" width="100%" height={180} sx={{ borderRadius: 0 }} />
        <Bone
          width={116}
          height={32}
          sx={{
            position: 'absolute',
            top: 20,
            left: 20,
            borderRadius: '8px',
            bgcolor: 'rgba(255, 255, 255, 0.75)',
          }}
        />
      </Box>

      <Box sx={{ position: 'relative', px: 2, pt: 2 }}>
        <Box
          sx={{
            position: 'absolute',
            top: -40,
            left: 17,
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: '2px solid #ebebeb',
            bgcolor: 'common.white',
            overflow: 'hidden',
          }}
        >
          <Bone variant="circular" width="100%" height="100%" />
        </Box>

        <Bone width="68%" height={20} sx={{ mt: '11px' }} />
        <Bone width="30%" height={14} sx={{ mt: '10px' }} />

        <Box sx={{ mt: '21px' }}>
          <MetaRow textWidth="42%" height={22} />
        </Box>
        <Box sx={{ mt: '4px' }}>
          <MetaRow textWidth="36%" height={28}>
            <Bone variant="circular" width={22} height={22} sx={{ mr: '3px' }} />
          </MetaRow>
        </Box>
      </Box>
    </Card>
  );
}
