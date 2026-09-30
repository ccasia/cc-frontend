import PropTypes from 'prop-types';

import { Box, Stack, Button, Divider, Skeleton, Typography } from '@mui/material';

import Image from 'src/components/image';

const SKELETON_GRADIENT_SX = {
  '@keyframes pcrSkeletonShimmer': {
    '0%': { backgroundPosition: '0% 50%' },
    '100%': { backgroundPosition: '200% 50%' },
  },
  background:
    'linear-gradient(90deg, rgba(138, 90, 254, 1) 0%, rgba(203, 185, 248, 1) 50%, rgba(138, 90, 254, 1) 100%)',
  backgroundSize: '200% 100%',
  animation: 'pcrSkeletonShimmer 1.4s linear infinite',
};

const LoadingSkeleton = ({ title, cancel }) => (
  <Box
    sx={{
      border: 1,
      borderStyle: 'dashed',
      borderRadius: 1,
      p: '20px 10px',
      borderColor: 'rgba(138, 90, 254, 1)',
    }}
  >
    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
      <Image
        src="/assets/ai-star.svg"
        alt="star-logo"
        sx={{ width: 28, height: 28, flexShrink: 0 }}
      />
      <Typography
        sx={{
          fontFamily: 'Inter Display, sans-serif',
          fontWeight: 500,
          fontSize: '18px',
          color: '#221F20',
        }}
      >
        Drafting your report {title ? `- ${title}` : ''}
      </Typography>
    </Stack>
    <Stack spacing={1}>
      <Skeleton animation={false} sx={{ ...SKELETON_GRADIENT_SX }} width="100%" />
      <Skeleton animation={false} sx={{ ...SKELETON_GRADIENT_SX }} width="80%" />
      <Skeleton animation={false} sx={{ ...SKELETON_GRADIENT_SX }} width="40%" />
    </Stack>
    <Divider sx={{ my: 2 }} />
    <Stack justifyContent="space-between" direction="row" alignItems="center">
      <Typography color="GrayText">Nothing is saved to the report until you confirm.</Typography>
      <Button variant="text" onClick={cancel}>
        Cancel
      </Button>
    </Stack>
  </Box>
);

export default LoadingSkeleton;

LoadingSkeleton.propTypes = {
  title: PropTypes.string,
  cancel: PropTypes.func,
};
