import PropTypes from 'prop-types';

import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import { Box, Card } from '@mui/material';
import ListItemText from '@mui/material/ListItemText';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { fDateTime } from 'src/utils/format-time';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

// ----------------------------------------------------------------------

export default function CampaignItem({ tour, onView, onEdit, onDelete }) {
  const { images, createdAt } = tour;
  const settings = useSettingsContext();
  const router = useRouter();

  const renderImages = (
    <Stack
      spacing={0.5}
      direction="row"
      sx={{
        p: (theme) => theme.spacing(1, 1, 0, 1),
      }}
    >
      <Stack flexGrow={1} sx={{ position: 'relative' }}>
        <Image alt={images[0]} src={images[0]} sx={{ borderRadius: 1, height: 164, width: 1 }} />
      </Stack>
      <Stack spacing={0.5}>
        <Image alt={images[1]} src={images[1]} ratio="1/1" sx={{ borderRadius: 1, width: 80 }} />
        <Image alt={images[2]} src={images[2]} ratio="1/1" sx={{ borderRadius: 1, width: 80 }} />
      </Stack>
    </Stack>
  );

  const renderTexts = (
    <ListItemText
      sx={{
        p: (theme) => theme.spacing(2.5, 2.5, 2, 2.5),
      }}
      primary={`Created date: ${fDateTime(createdAt)}`}
      secondary={
        <Link component={RouterLink} color="inherit">
          Campaign title
        </Link>
      }
      primaryTypographyProps={{
        typography: 'caption',
        color: 'text.disabled',
      }}
      secondaryTypographyProps={{
        mt: 1,
        noWrap: true,
        component: 'span',
        color: 'text.primary',
        typography: 'subtitle1',
      }}
    />
  );

  const renderInfo = (
    <Stack
      spacing={1.5}
      sx={{
        position: 'relative',
        p: (theme) => theme.spacing(0, 2.5, 2.5, 2.5),
      }}
    >
      {[
        {
          label: 'Industries',
          icon: <Iconify icon="mingcute:location-fill" sx={{ color: 'error.main' }} />,
        },
        {
          label: 'Start date - End date',
          icon: <Iconify icon="solar:clock-circle-bold" sx={{ color: 'info.main' }} />,
        },
      ].map((item) => (
        <Stack
          key={item.label}
          spacing={1}
          direction="row"
          alignItems="center"
          sx={{ typography: 'body2' }}
        >
          {item.icon}
          {item.label}
        </Stack>
      ))}
    </Stack>
  );

  return (
    <Box
      component={Card}
      onClick={() => {
        router.push(paths.dashboard.campaign.adminCampaignDetail(tour.id));
      }}
      sx={{
        cursor: 'pointer',
        transition: '.2s ease',
        '&:hover': {
          bgcolor: (theme) =>
            settings.themeMode === 'light' ? theme.palette.grey[300] : theme.palette.grey[700],
        },
      }}
    >
      {renderImages}

      {renderTexts}

      {renderInfo}
    </Box>
  );
}

CampaignItem.propTypes = {
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
  onView: PropTypes.func,
  tour: PropTypes.object,
};
