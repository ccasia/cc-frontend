import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import { alpha, useTheme } from '@mui/material/styles';

import { _socials, _userAbout } from 'src/_mock';
import { AvatarShape } from 'src/assets/illustrations';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function UserCard({ creator, campaignId, selectedPitch }) {
  const theme = useTheme();

  return (
    <Box component="div">
      <Card
        sx={{
          textAlign: 'center',
          '&:hover': {
            // transform: 'scale(1.01)',
            transition: 'all ease-in .1s',
            cursor: 'pointer',
          },
          border: selectedPitch?.id === creator?.id && '2px solid green',
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <AvatarShape
            sx={{
              left: 0,
              right: 0,
              zIndex: 10,
              mx: 'auto',
              bottom: -26,
              position: 'absolute',
            }}
          />

          <Avatar
            alt={creator?.user?.name}
            src={creator?.user?.photoURL}
            sx={{
              width: 64,
              height: 64,
              zIndex: 11,
              left: 0,
              right: 0,
              bottom: -32,
              mx: 'auto',
              position: 'absolute',
            }}
          />

          <Image
            src={_userAbout?.coverUrl}
            alt={_userAbout?.coverUrl}
            ratio="16/9"
            overlay={alpha(theme.palette.grey[900], 0.48)}
          />
          {/* <Box
            sx={{
              width: '100%',
              height: 200,
              bgcolor: theme.palette.grey[400],
            }}
          /> */}
        </Box>

        <ListItemText
          sx={{ mt: 7, mb: 1 }}
          primary={
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              {creator?.user?.name}
              <Iconify icon="mdi:tick-decagram" color="success.main" />
            </Stack>
          }
          secondary={`${dayjs().diff(dayjs(creator?.user?.creator?.birthDate), 'years')} years old`}
          primaryTypographyProps={{ typography: 'subtitle1' }}
          secondaryTypographyProps={{ component: 'span', mt: 0.5 }}
        />

        <Stack direction="row" alignItems="center" justifyContent="center" sx={{ mb: 2.5 }}>
          {_socials.map((social) => (
            <IconButton
              key={social.name}
              sx={{
                color: social.color,
                '&:hover': {
                  bgcolor: alpha(social.color, 0.08),
                },
              }}
            >
              <Iconify icon={social.icon} />
            </IconButton>
          ))}
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Box
          display="grid"
          gridTemplateColumns="repeat(3, 1fr)"
          sx={{ py: 3, typography: 'subtitle1' }}
        >
          <div>
            <Typography variant="caption" component="div" sx={{ mb: 0.5, color: 'text.secondary' }}>
              Followers
            </Typography>
            0{/* {fShortenNumber(totalFollowers)} */}
          </div>

          <div>
            <Typography variant="caption" component="div" sx={{ mb: 0.5, color: 'text.secondary' }}>
              Engagement Rates
            </Typography>
            0{/* {fShortenNumber(totalFollowing)} */}
          </div>

          <div>
            <Typography variant="caption" component="div" sx={{ mb: 0.5, color: 'text.secondary' }}>
              Total Views
            </Typography>
            0{/* {fShortenNumber(totalPosts)} */}
          </div>
        </Box>
      </Card>
    </Box>
  );
}

UserCard.propTypes = {
  creator: PropTypes.object,
  campaignId: PropTypes.string,
  selectedPitch: PropTypes.object,
};
