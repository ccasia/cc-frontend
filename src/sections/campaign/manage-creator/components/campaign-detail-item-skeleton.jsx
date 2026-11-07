import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';

const TAB_WIDTHS = [96, 136];
const CARD_COUNT = 4;

export default function CampaignDetailItemSkeleton() {
  return (
    <Stack
      gap={2}
      aria-busy="true"
      aria-label="Loading"
      sx={{ overflowX: 'hidden', width: '100%' }}
    >
      <Box sx={{ mt: 2 }}>
        <Stack direction="row" spacing={2.5} sx={{ px: 2 }}>
          {TAB_WIDTHS.map((width) => (
            <Box key={width} sx={{ height: 41, display: 'flex', alignItems: 'center', pb: 0.5 }}>
              <Skeleton width={width} height={18} />
            </Box>
          ))}
        </Stack>
      </Box>

      <Box sx={{ width: '100%', height: '1px', bgcolor: 'divider', mt: -2.2 }} />

      <Box mt={3}>
        <Stack spacing={1} sx={{ mb: 3 }}>
          <Skeleton width="70%" height={12} />
          <Skeleton width="35%" height={12} />
        </Stack>

        <Stack spacing={2}>
          {[...Array(CARD_COUNT)].map((_, index) => (
            <Skeleton key={index} height={64} />
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}
