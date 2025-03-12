import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Avatar from '@mui/material/Avatar';
import { Tab, Tabs } from '@mui/material';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { formatText } from 'src/utils/format-test';

import { AvatarShape } from 'src/assets/illustrations';
import Iconify from 'src/components/iconify';
import { _socials } from 'src/_mock';

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

const calculateEngagementRate = (totalLikes, followers) => {
  if (!(totalLikes || followers)) return null;
  return ((parseInt(totalLikes, 10) / parseInt(followers, 10)) * 100).toFixed(2);
};

export default function UserCard({ user }) {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState('instagram');

  const handleChange = (event, newValue) => {
    event.stopPropagation();
    setCurrentTab(newValue);
  };

  const { name, role, avatarUrl } = user;

  const router = useRouter();

  const socialMediaAnalytics = useMemo(() => {
    if (currentTab === 'instagram') {
      return {
        followers: user?.creator?.instagramUser?.followers_count || 0,
        engagement_rate: `${
          calculateEngagementRate(
            user?.creator?.instagramUser?.instagramVideo?.reduce(
              (sum, acc) => sum + parseInt(acc.like_count, 10),
              0
            ),
            user?.creator?.instagramUser?.followers_count
          ) || 0
        }%`,
        averageLikes: user?.creator?.instagramUser?.average_like || 0,
        username: user?.creator?.instagramUser?.username,
      };
    }

    if (currentTab === 'tiktok') {
      return {
        followers: user?.creator?.tiktokUser?.follower_count || 0,
        engagement_rate: user?.creator?.tiktokUser?.follower_count || 0,
        averageLikes: user?.creator?.tiktokUser?.likes_count || 0,
      };
    }

    return {
      followers: 0,
      engagement_rate: 0,
      averageLikes: 0,
    };
  }, [currentTab, user]);

  return (
    <Box
      // component="div"
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
              height: 100,
              bgcolor: theme.palette.grey[400],
              backgroundImage: `url(${user.photoBackgroundURL})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
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

        <Box width={1}>
          <Tabs value={currentTab} onChange={handleChange} variant="fullWidth">
            <Tab
              value="instagram"
              icon={<Iconify icon="ant-design:instagram-filled" width={20} />}
            />
            <Tab value="tiktok" icon={<Iconify icon="ant-design:tik-tok-filled" width={20} />} />
          </Tabs>
        </Box>

        {/* <Stack direction="row" alignItems="center" justifyContent="center" sx={{ mb: 2.5 }}>
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
        </Stack> */}

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
            {socialMediaAnalytics.followers || 'N/A'}
          </div>

          <div>
            <Typography variant="caption" component="div" sx={{ mb: 0.5, color: 'text.secondary' }}>
              Engagement Rates
            </Typography>
            {socialMediaAnalytics.engagement_rate || 'N/A'}
            {/* {user.creator.socialMediaData?.instagram?.data.engagement_rate
              ? `${Number(user.creator.socialMediaData?.instagram?.data.engagement_rate).toFixed(2)} %`
              : 'N/A'} */}
          </div>

          <div>
            <Typography variant="caption" component="div" sx={{ mb: 0.5, color: 'text.secondary' }}>
              Average Likes
            </Typography>
            {socialMediaAnalytics.averageLikes || 'N/A'}
            {/* {user.creator.socialMediaData?.instagram?.data.user_performance.avg_likes_per_post
              ? formatNumber(
                  user.creator.socialMediaData?.instagram?.data.user_performance.avg_likes_per_post
                )
              : 'N/A'} */}
          </div>
        </Box>
      </Card>
    </Box>
  );
}

UserCard.propTypes = {
  user: PropTypes.object,
};
