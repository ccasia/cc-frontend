import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';

const NAME_WIDTHS = ['60%', '45%', '70%', '50%', '65%', '40%'];

export default function UserCardListSkeleton() {
  return (
    <Box
      gap={2}
      display="grid"
      gridTemplateColumns={{
        xs: 'repeat(1, 1fr)',
        sm: 'repeat(2, 1fr)',
        md: 'repeat(3, 1fr)',
      }}
      sx={{ mt: 2.5, pb: 2 }}
      aria-busy="true"
      aria-label="Loading"
    >
      {NAME_WIDTHS.map((nameWidth, index) => (
        <Card
          key={index}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            boxShadow: '0 0 1px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ py: 2.5, px: 2.25, borderBottom: '1px solid', borderColor: 'divider' }}
          >
            <Skeleton width={56} height={56} sx={{ borderRadius: 1.5, flexShrink: 0 }} />

            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Skeleton width={nameWidth} height={16} />
              <Skeleton width="40%" height={12} sx={{ mt: 1 }} />
            </Box>

            <Skeleton width={64} height={36} sx={{ flexShrink: 0 }} />
          </Stack>

          <Box sx={{ p: 1.5 }}>
            <Skeleton width="35%" height={10} sx={{ mb: 1 }} />
            <Stack spacing={0.5}>
              {[...Array(3)].map((_, metricIndex) => (
                <Skeleton key={metricIndex} height={41} sx={{ mb: 0.5 }} />
              ))}
            </Stack>
          </Box>
        </Card>
      ))}
    </Box>
  );
}
