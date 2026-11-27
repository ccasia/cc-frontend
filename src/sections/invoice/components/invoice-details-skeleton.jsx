import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useRouter } from 'src/routes/hooks';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

const BAR = 8;

const headingBarSx = { height: '1em', display: 'inline-block', verticalAlign: 'middle' };

const META_WIDTHS = [48, 56, 52, 44];
const FROM_WIDTHS = ['80%', '56%', '70%'];
const TO_WIDTHS = ['90%', '50%', '84%'];

function TextBlock({ widths }) {
  return (
    <Stack spacing={0.75}>
      {widths.map((width, index) => (
        <Skeleton key={index} sx={{ width, height: BAR }} />
      ))}
    </Stack>
  );
}

TextBlock.propTypes = {
  widths: PropTypes.array,
};

function TableBlock({ rows }) {
  return (
    <Stack spacing={1.5} sx={{ mt: 1.5, pb: 1.5, borderBottom: 1, borderColor: 'divider' }}>
      <Skeleton sx={{ width: 1, height: 16 }} />
      {rows.map((cells, index) => (
        <Stack key={index} direction="row" justifyContent="space-between" spacing={1.5} px={1.5}>
          {cells.map((width, cellIndex) => (
            <Box key={cellIndex} sx={{ width: '20%' }}>
              <Skeleton sx={{ width, height: BAR }} />
            </Box>
          ))}
        </Stack>
      ))}
    </Stack>
  );
}

TableBlock.propTypes = {
  rows: PropTypes.array,
};

export default function InvoiceDetailsSkeleton() {
  const settings = useSettingsContext();
  const router = useRouter();

  return (
    <Container
      maxWidth={settings.themeStretch ? false : 'lg'}
      aria-busy="true"
      aria-label="Loading"
    >
      <Box paddingX={2}>
        <Button
          size="small"
          startIcon={<Iconify icon="ic:round-arrow-back-ios-new" />}
          sx={{ color: 'rgba(99, 99, 102, 1)' }}
          onClick={() => router.back()}
        >
          Back
        </Button>

        <Box
          sx={{
            mt: 2,
            mx: 2,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { sm: 'center' },
            gap: 2,
          }}
        >
          <Stack spacing={1}>
            <Typography variant="h3">
              <Skeleton sx={{ ...headingBarSx, width: 320 }} />
            </Typography>
            <Typography variant="h5">
              <Skeleton sx={{ ...headingBarSx, width: 120 }} />
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Skeleton sx={{ width: { xs: 1, sm: 88 }, height: 30 }} />
            <Skeleton sx={{ width: { xs: 1, sm: 112 }, height: 30 }} />
          </Stack>
        </Box>

        <Box
          sx={{
            mt: 2,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            overflow: 'auto',
            maxHeight: { xs: 'calc(100vh - 200px)', sm: 'calc(100vh - 180px)' },
          }}
        >
          <Box sx={{ width: '100%', maxWidth: { md: 800 } }}>
            <Box sx={{ aspectRatio: '595 / 842', px: '1.7%', pt: '5%', bgcolor: 'common.white' }}>
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  aspectRatio: '575 / 400',
                  p: '3.5%',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ width: '25%', pr: 2, borderRight: 2, borderColor: 'divider' }}>
                  <Skeleton sx={{ width: '45%', height: 32 }} />

                  <Stack spacing={1.5} sx={{ my: 5 }}>
                    <Skeleton sx={{ width: 32, height: BAR }} />
                    <TextBlock widths={FROM_WIDTHS} />
                  </Stack>

                  <Stack spacing={1.5}>
                    <Skeleton sx={{ width: 48, height: BAR }} />
                    <TextBlock widths={TO_WIDTHS} />
                  </Stack>
                </Box>

                <Stack justifyContent="space-between" sx={{ width: '75%', px: 3 }}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between">
                      {META_WIDTHS.map((width, index) => (
                        <Stack key={index} spacing={0.75}>
                          <Skeleton sx={{ width, height: BAR }} />
                          <Skeleton sx={{ width: width + 16, height: BAR }} />
                        </Stack>
                      ))}
                    </Stack>

                    <Divider sx={{ mt: 3 }} />

                    <TableBlock rows={[['20%', '70%', '56%', '64%', '80%']]} />
                    <TableBlock rows={[['20%', '76%', '48%', '24%', '60%']]} />
                  </Box>

                  <Box>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ py: 1.5, borderTop: 1, borderBottom: 1, borderColor: 'divider' }}
                    >
                      <Skeleton sx={{ width: 96, height: BAR }} />
                      <Skeleton sx={{ width: 80, height: 14 }} />
                    </Stack>

                    <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ mt: 1 }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <TextBlock widths={[40, '70%']} />
                      </Box>
                      <Stack spacing={0.75} alignItems="flex-end">
                        <Skeleton sx={{ width: 72, height: BAR }} />
                        <Skeleton sx={{ width: 100, height: BAR }} />
                      </Stack>
                    </Stack>
                  </Box>
                </Stack>
              </Stack>
            </Box>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
