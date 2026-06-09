import React from 'react';
import PropTypes from 'prop-types';

import { Box, Button } from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';

import Iconify from 'src/components/iconify';

import { useAnalyticsStore, setSelectedPlatform } from '../stores/analytics.store';

const PlatformToggle = ({ availablePlatforms }) => {
  const lgUp = useResponsive('up', 'lg');

  const selectedPlatform = useAnalyticsStore((state) => state.selectedPlatform);

  const platformConfig = [
    { key: 'ALL', label: 'Overview', icon: null, color: '#1340FF', display: true },
    {
      key: 'Instagram',
      label: 'Instagram',
      icon: 'prime:instagram',
      color: '#C13584',
      display: lgUp,
    },
    { key: 'TikTok', label: 'TikTok', icon: 'prime:tiktok', color: '#000000', display: lgUp },
  ];

  const availablePlatformConfig = platformConfig.filter(
    (config) => config.key === 'ALL' || availablePlatforms.includes(config.key)
  );

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        {availablePlatformConfig.map((config) => (
          <Button
            key={config.key}
            onClick={() => setSelectedPlatform(config.key)}
            sx={{
              width: 135,
              height: 40,
              borderRadius: '8px',
              borderWidth: '2px',
              bgcolor: 'transparent',
              color: selectedPlatform === config.key ? config.color : '#9E9E9E',
              border:
                selectedPlatform === config.key ? `2px solid ${config.color}` : '2px solid #9E9E9E',
              fontWeight: 600,
              fontSize: 16,
              alignItems: 'center',
              justifyContent: 'center',
              textTransform: 'none',
              '&:hover': {
                bgcolor: 'transparent',
                border: `2px solid ${config.color}`,
                color: config.color,
                '& .iconify': {
                  color: config.color,
                },
              },
            }}
          >
            {config.display ? (
              <>
                {config.icon && (
                  <Iconify
                    icon={config.icon}
                    className="iconify"
                    sx={{
                      height: 30,
                      width: 30,
                      mr: config.key === 'TikTok' ? 0 : 0.5,
                      color: selectedPlatform === config.key ? config.color : '#9E9E9E',
                    }}
                  />
                )}
                {config.label}
              </>
            ) : (
              <>
                {config.icon && (
                  <Iconify
                    icon={config.icon}
                    className="iconify"
                    sx={{
                      height: 35,
                      width: 35,
                      color: selectedPlatform === config.key ? config.color : '#9E9E9E',
                    }}
                  />
                )}
              </>
            )}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

export default PlatformToggle;

PlatformToggle.propTypes = {
  availablePlatforms: PropTypes.array,
};
