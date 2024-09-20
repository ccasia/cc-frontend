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

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { formatText } from 'src/utils/format-test';

import { _socials } from 'src/_mock';
import { AvatarShape } from 'src/assets/illustrations';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

// Utility function to format numbers
const formatNumber = (num) => {
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}G`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export default function UserCard({ user }) {
  const theme = useTheme();

  const { name, role, avatarUrl } = user;

  const router = useRouter();

  return (
    <Box
      component="div"
      onClick={() => router.push(paths.dashboard.creator.mediaKit(user?.creator?.id))}
    >
      <Card
        sx={{
          textAlign: 'center',
          '&:hover': {
            transform: 'scale(1.02)',
            transition: 'all ease-in .1s',
            cursor: 'pointer',
          },
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
            alt={name}
            src={user?.photoURL}
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

          {/* <Image
          // src={coverUrl}
          // alt={coverUrl}
          ratio="16/9"
          overlay={alpha(theme.palette.grey[900], 0.48)}
        /> */}
          <Box
            sx={{
              width: '100%',
              height: 200,
              bgcolor: theme.palette.grey[400],
            }}
          />
        </Box>

        <ListItemText
          sx={{ mt: 7, mb: 1 }}
          primary={name}
          secondary={formatText(role)}
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
            {user.creator.socialMediaData?.instagram?.data.followers
              ? formatNumber(user.creator.socialMediaData?.instagram?.data.followers)
              : 'N/A'}
            {/* {fShortenNumber(totalFollowers)} */}
          </div>

          <div>
            <Typography variant="caption" component="div" sx={{ mb: 0.5, color: 'text.secondary' }}>
              Engagement Rates
            </Typography>
            {user.creator.socialMediaData?.instagram?.data.engagement_rate
              ? `${Number(user.creator.socialMediaData?.instagram?.data.engagement_rate).toFixed(2)} %`
              : 'N/A'}
            {/* {fShortenNumber(totalFollowing)} */}
          </div>

          <div>
            <Typography variant="caption" component="div" sx={{ mb: 0.5, color: 'text.secondary' }}>
              Average Likes
            </Typography>
            {user.creator.socialMediaData?.instagram?.data.user_performance.avg_likes_per_post
              ? formatNumber(
                  user.creator.socialMediaData?.instagram?.data.user_performance.avg_likes_per_post
                )
              : 'N/A'}
            {/* {fShortenNumber(totalPosts)} */}
          </div>
        </Box>
      </Card>
    </Box>
  );
}

UserCard.propTypes = {
  user: PropTypes.object,
};
