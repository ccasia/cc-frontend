import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import { Stack, Tooltip, IconButton } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { formatText } from 'src/utils/format-test';

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

const calculateEngagementRate = (totalLikes, followers) => {
  if (!(totalLikes || followers)) return null;
  return ((parseInt(totalLikes, 10) / parseInt(followers, 10)) * 100).toFixed(2);
};

// Instagram and tiktok colors
const PLATFORM_COLORS = {
  instagram: '#E1306C',
  tiktok: '#000000',
};

export default function UserCard({ user }) {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState('instagram');

  const handleChange = (event, newValue) => {
    event.stopPropagation();
    setCurrentTab(newValue);
  };

  const { name, role } = user;
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
    <Card
      onClick={() => router.push(paths.dashboard.creator.mediaKit(user?.creator?.id))}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        boxShadow: '0 0 1px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.08)',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 0 1px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.12)',
          transform: 'translateY(-4px)',
        },
        cursor: 'pointer',
      }}
    >
      <Stack 
        direction="row" 
        spacing={2} 
        alignItems="center" 
        sx={{ 
          py: 2.5,
          px: 2.25,
          borderBottom: '1px solid',
          borderColor: 'divider',
          position: 'relative',
        }}
      >
        <Avatar
          alt={name}
          src={user?.photoURL}
          sx={{
            width: 56,
            height: 56,
            bgcolor: 'grey.200',
            border: `2px solid ${alpha(theme.palette.grey[900], currentTab === 'instagram' ? 0.3 : 0.2)}`,
            borderRadius: 1.5,
          }}
        />
        
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Stack direction="row" alignItems="center" spacing={0.6}>
            <Typography variant="subtitle1" noWrap fontWeight="600" sx={{ lineHeight: 1.3 }}>
              {name}
            </Typography>
              <Box
                component="img"
                src="/assets/icons/overview/creatorVerified.svg"
                sx={{
                  width: 16,
                  height: 16,
                }}
              />
          </Stack>
          
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.secondary',
              fontWeight: 500,
              mt: 0.1,
            }} 
            noWrap
          >
            {formatText(role)}
          </Typography>
        </Box>
        
        <Box
          sx={{
            p: 0.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'background.paper',
          }}
        >
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Instagram">
              <IconButton 
                size="small"
                onClick={(e) => handleChange(e, 'instagram')}
                sx={{ 
                  p: 0.5,
                  color: currentTab === 'instagram' ? PLATFORM_COLORS.instagram : 'text.secondary',
                  bgcolor: currentTab === 'instagram' 
                    ? alpha(PLATFORM_COLORS.instagram, 0.08)
                    : 'transparent',
                  '&:hover': { 
                    bgcolor: currentTab === 'instagram'
                      ? alpha(PLATFORM_COLORS.instagram, 0.12)
                      : 'action.hover'
                  },
                  border: currentTab === 'instagram' ? `1px solid ${alpha(PLATFORM_COLORS.instagram, 0.3)}` : 'none',
                }}
              >
                <Iconify icon="ant-design:instagram-filled" width={18} />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="TikTok">
              <IconButton 
                size="small"
                onClick={(e) => handleChange(e, 'tiktok')}
                sx={{ 
                  p: 0.5,
                  color: currentTab === 'tiktok' ? PLATFORM_COLORS.tiktok : 'text.secondary',
                  bgcolor: currentTab === 'tiktok' 
                    ? alpha(PLATFORM_COLORS.tiktok, 0.08)
                    : 'transparent',
                  '&:hover': { 
                    bgcolor: currentTab === 'tiktok'
                      ? alpha(PLATFORM_COLORS.tiktok, 0.12)
                      : 'action.hover'
                  },
                  border: currentTab === 'tiktok' ? `1px solid ${alpha(PLATFORM_COLORS.tiktok, 0.3)}` : 'none',
                }}
              >
                <Iconify icon="ant-design:tik-tok-filled" width={18} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </Stack>
      
      <Box sx={{ p: 1.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 0.5 }}>
          <Typography 
            variant="overline" 
            sx={{ 
              fontSize: 9, 
              color: currentTab === 'instagram' ? PLATFORM_COLORS.instagram : PLATFORM_COLORS.tiktok,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <Iconify 
              icon={currentTab === 'instagram' ? 'ant-design:instagram-filled' : 'ant-design:tik-tok-filled'} 
              width={10} 
            />
            {currentTab === 'instagram' ? 'Instagram' : 'TikTok'} Metrics
          </Typography>
        </Box>
        
        <Stack spacing={0.5} sx={{ flexGrow: 1 }}>
          <MetricBar 
            label="Followers" 
            value={formatNumber(socialMediaAnalytics.followers || "N/A")}
            color={currentTab === 'instagram' ? PLATFORM_COLORS.instagram : PLATFORM_COLORS.tiktok}
          />
          
          <MetricBar 
            label="Engagement" 
            value={socialMediaAnalytics.engagement_rate || 'N/A'}
            color={currentTab === 'instagram' ? PLATFORM_COLORS.instagram : PLATFORM_COLORS.tiktok}
          />
          
          <MetricBar 
            label="Avg Likes" 
            value={formatNumber(socialMediaAnalytics.averageLikes || "N/A")}
            color={currentTab === 'instagram' ? PLATFORM_COLORS.instagram : PLATFORM_COLORS.tiktok}
          />
        </Stack>
        
        {currentTab === 'instagram' && socialMediaAnalytics.username && (
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 1 }}>
            <Box
              sx={{
                p: 0.5,
                borderRadius: '50%',
                bgcolor: alpha(PLATFORM_COLORS.instagram, 0.1),
                color: PLATFORM_COLORS.instagram,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify icon="ant-design:instagram-filled" width={12} />
            </Box>
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 500,
                color: 'text.secondary',
                fontSize: '0.7rem',
              }}
            >
              @{socialMediaAnalytics.username}
            </Typography>
          </Stack>
        )}
      </Box>
    </Card>
  );
}

function MetricBar({ label, value, color }) {
  const theme = useTheme();
  
  const getMetricIcon = () => {
    switch (label.toLowerCase()) {
      case 'followers':
        return 'eva:people-fill';
      case 'engagement':
        return 'eva:activity-fill';
      case 'avg likes':
        return 'eva:heart-fill';
      default:
        return 'eva:bar-chart-fill';
    }
  };
  
  return (
    <Box
      sx={{
        p: 0.75,
        mb: 0.5,
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: alpha(color, 0.2),
        bgcolor: alpha(color, 0.03),
      }}
    >
      <Stack direction="row" spacing={0.75} alignItems="center">
        <Box
          sx={{
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            bgcolor: alpha(color, 0.12),
            color,
          }}
        >
          <Iconify icon={getMetricIcon()} width={14} />
        </Box>
        
        <Box sx={{ flexGrow: 1 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary', 
              display: 'block', 
              lineHeight: 1.1,
              fontSize: '0.65rem',
            }}
          >
            {label}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 700, 
              color, 
              lineHeight: 1.2,
              fontSize: '0.8rem',
            }}
          >
            {value}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

MetricBar.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  color: PropTypes.string,
};

UserCard.propTypes = {
  user: PropTypes.object,
};
