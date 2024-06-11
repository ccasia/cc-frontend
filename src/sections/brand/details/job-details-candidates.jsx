import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import { Divider, useTheme, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function JobDetailsCandidates({ brands }) {
  const theme = useTheme();
  return (
    <Box
      gap={3}
      display="grid"
      gridTemplateColumns={{
        xs: 'repeat(1, 1fr)',
        md: 'repeat(3, 1fr)',
      }}
    >
      {brands.map((brand) => (
        <Stack direction="column" component={Card}>
          <Stack direction="row" spacing={2} key={brand.id} sx={{ p: 3 }}>
            <IconButton sx={{ position: 'absolute', top: 8, right: 8 }}>
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>

            <Avatar alt={brand.name} src={brand.avatarUrl} sx={{ width: 48, height: 48 }} />

            <Stack spacing={2}>
              <ListItemText
                primary={brand.name}
                secondary={brand.email}
                secondaryTypographyProps={{
                  mt: 0.5,
                  component: 'span',
                  typography: 'caption',
                  color: 'text.disabled',
                }}
              />

              <Typography variant="subtitle2" color={theme.palette.grey[400]}>
                {brand.description.length > 50
                  ? brand.description.slice(0, 100).concat('...')
                  : brand.description}
              </Typography>
            </Stack>
          </Stack>
          <Divider />

          <Stack p={3} color={theme.palette.grey[500]}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Iconify icon="material-symbols:campaign" />
              <Typography variant="caption">12 Campaigns</Typography>
            </Stack>
          </Stack>
        </Stack>
      ))}
    </Box>
  );
}

JobDetailsCandidates.propTypes = {
  brands: PropTypes.array,
};
