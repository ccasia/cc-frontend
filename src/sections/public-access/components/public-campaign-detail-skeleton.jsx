import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

const BOX_SX = {
  border: '1px solid #e0e0e0',
  borderRadius: 2,
  p: 3,
  mt: -1,
  mb: 3,
  width: '100%',
};

const HEADER_SX = {
  borderBottom: '1px solid #e0e0e0',
  mx: -3,
  mt: -1,
  mb: 2,
  pb: 1.5,
  px: 1.8,
  display: 'flex',
  alignItems: 'center',
  gap: 1,
};

function Section({ title, first, children }) {
  return (
    <Box sx={{ ...BOX_SX, ...(first && { mt: 1 }) }}>
      <Box sx={HEADER_SX}>
        <Typography
          variant="body2"
          sx={{ color: '#221f20', fontWeight: 600, fontSize: '0.875rem' }}
        >
          {title}
        </Typography>
      </Box>
      {children}
    </Box>
  );
}

Section.propTypes = {
  title: PropTypes.string,
  first: PropTypes.bool,
  children: PropTypes.node,
};

const lines = (widths, height = 12) =>
  widths.map((width, i) => <Skeleton key={i} sx={{ width, height }} />);

export default function PublicCampaignDetailSkeleton() {
  return (
    <Box sx={{ maxWidth: '100%', px: 2, mx: 'auto' }} aria-busy="true" aria-label="Loading">
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        <Stack spacing={-3} sx={{ flex: { xs: 1, md: 2.5 } }}>
          <Section title="CAMPAIGN INFO" first>
            <Stack spacing={1}>{lines([0.95, 0.88, 0.6])}</Stack>
          </Section>

          <Section title="CAMPAIGN DEMOGRAPHICS">
            <Stack direction="row" spacing={4}>
              {[0, 1].map((col) => (
                <Stack key={col} spacing={2} sx={{ flex: 1 }}>
                  {[0.3, 0.4, 0.35].map((width, i) => (
                    <Stack key={i} spacing={1}>
                      <Skeleton sx={{ width, height: 12 }} />
                      <Stack direction="row" spacing={0.5}>
                        <Skeleton sx={{ width: 72, height: 32 }} />
                        <Skeleton sx={{ width: 96, height: 32 }} />
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              ))}
            </Stack>
          </Section>

          <Section title="CAMPAIGN OBJECTIVES">
            <Stack spacing={1}>{lines([0.5, 0.7])}</Stack>
          </Section>

          <Section title="CAMPAIGN TIMELINE">
            <Stack spacing={1.5}>{lines([1, 1, 1, 1], 20)}</Stack>
          </Section>
        </Stack>

        <Stack spacing={-3} sx={{ flex: { xs: 1, md: 1 } }}>
          <Section title="CAMPAIGN MANAGER(S)" first>
            <Stack spacing={1}>
              {[0.5, 0.4].map((width, i) => (
                <Stack key={i} direction="row" spacing={1} alignItems="center">
                  <Skeleton variant="circular" sx={{ width: 34, height: 34 }} />
                  <Skeleton sx={{ width, height: 14 }} />
                </Stack>
              ))}
            </Stack>
          </Section>

          <Section title="CLIENT INFO">
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Skeleton variant="circular" sx={{ width: 36, height: 36 }} />
                <Skeleton sx={{ width: 0.5, height: 14 }} />
              </Stack>
              {[0.6, 0.45, 0.7].map((width, i) => (
                <Stack key={i} spacing={0.75}>
                  <Skeleton sx={{ width: 0.3, height: 12 }} />
                  <Skeleton sx={{ width, height: 14 }} />
                </Stack>
              ))}
            </Stack>
          </Section>
        </Stack>
      </Stack>
    </Box>
  );
}
