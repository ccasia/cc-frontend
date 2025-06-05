import { orderBy } from 'lodash';
import React, { useRef, useMemo, useState, useEffect } from 'react';

import { useTheme } from '@mui/material/styles';
import {
  Box,
  Stack,
  Button,
  Select,
  MenuItem,
  Container,
  InputBase,
  Typography,
  CircularProgress,
} from '@mui/material';

import { useGetMyCampaign } from 'src/hooks/use-get-my-campaign';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

import ActiveCampaignView from '../active-campaign-view';
import AppliedCampaignView from '../applied-campaign-view';
import CompletedCampaignView from '../completed-campaign-view';

const ManageCampaignView = () => {
  const [currentTab, setCurrentTab] = useState('myCampaign');
  const { socket } = useSocketContext();

  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('');

  const { user } = useAuthContext();
  const { data: campaigns, isLoading, mutate } = useGetMyCampaign(user?.id);

  // Search input ref for keyboard shortcut focus
  const searchInputRef = useRef(null);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check for CMD+K (Mac) or Ctrl+K (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    socket?.on('pitchUpdate', () => mutate());

    return () => {
      socket?.off('pitchUpdate');
    };
  }, [socket, mutate]);

  // const { campaigns } = useGetCampaigns('creator');
  const settings = useSettingsContext();
  const theme = useTheme();

  // Calculate counts for each tab
  const filteredData = useMemo(() => {
    let filteredCampaigns = campaigns;

    // Apply sorting
    if (sortBy === 'Most matched') {
      filteredCampaigns = orderBy(filteredCampaigns, ['percentageMatch'], ['desc']);
    } else if (sortBy === 'Most recent') {
      filteredCampaigns = orderBy(filteredCampaigns, ['createdAt'], ['desc']);
    }

    return {
      active:
        filteredCampaigns?.filter(
          (campaign) =>
            campaign.shortlisted &&
            campaign.status === 'ACTIVE' &&
            !campaign.shortlisted?.isCampaignDone
        ) || [],
      pending:
        filteredCampaigns?.filter(
          (campaign) => !campaign.shortlisted && campaign?.pitch?.status === 'undecided'
        ) || [],
      completed:
        filteredCampaigns?.filter((campaign) => campaign?.shortlisted?.isCampaignDone) || [],
    };
  }, [campaigns, sortBy]);

  const tabs = [
    { id: 'myCampaign', label: 'Active', count: filteredData.active?.length || 0 },
    { id: 'applied', label: 'Pending', count: filteredData.pending?.length || 0 },
    { id: 'completed', label: 'Completed', count: filteredData.completed?.length || 0 },
  ];

  const renderTabs = (
    <>
      <Typography
        variant="h2"
        sx={{
          mb: 3,
          mt: { lg: 2, xs: 2, sm: 2 },
          fontFamily: theme.typography.fontSecondaryFamily,
          fontWeight: 'normal',
        }}
      >
        My Campaigns ⏰
      </Typography>

      {/* Main Controls Container */}
      <Box
        sx={{
          border: '1px solid #e7e7e7',
          borderRadius: 1,
          p: 1,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          gap: { xs: 1.5, md: 1.5 },
          bgcolor: 'background.paper',
          mb: 2.5,
        }}
      >
        {/* Tab Buttons */}
        <Stack
          direction="row"
          spacing={1}
          sx={{
            flex: { xs: 'none', md: '0 0 auto' },
          }}
        >
          {tabs.map((tab) => {
            // Define colors for each tab
            const getTabColors = (tabId, isActive) => {
              const colors = {
                myCampaign: { bg: '#1DBF66', hover: 'rgba(29, 191, 102, 0.08)' },
                applied: { bg: '#E6B800', hover: 'rgba(230, 184, 0, 0.08)' },
                completed: { bg: '#9CA3AF', hover: 'rgba(20, 20, 21, 0.08)' },
              };
              return colors[tabId] || colors.myCampaign;
            };

            // Define count badge colors for better visibility
            const getCountBadgeColors = (tabId, isActive) => {
              if (isActive) {
                const badgeColors = {
                  myCampaign: { bg: 'rgba(255, 255, 255, 0.25)', color: '#ffffff' },
                  applied: { bg: 'rgba(0, 0, 0, 0.15)', color: '#ffffff' },
                  completed: { bg: 'rgba(255, 255, 255, 0.25)', color: '#ffffff' },
                };
                return badgeColors[tabId] || badgeColors.myCampaign;
              }
              return { bg: '#f5f5f5', color: '#666666' };
            };

            const tabColors = getTabColors(tab.id, currentTab === tab.id);
            const badgeColors = getCountBadgeColors(tab.id, currentTab === tab.id);
            const isActive = currentTab === tab.id;

            return (
              <Button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                sx={{
                  px: 2,
                  py: 1,
                  minHeight: '38px',
                  height: '38px',
                  minWidth: 'fit-content',
                  color: isActive ? '#ffffff' : '#666666',
                  bgcolor: isActive ? tabColors.bg : 'transparent',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  borderRadius: 0.75,
                  textTransform: 'none',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '1px',
                    left: '1px',
                    right: '1px',
                    bottom: '1px',
                    borderRadius: 0.75,
                    backgroundColor: 'transparent',
                    transition: 'background-color 0.2s ease',
                    zIndex: -1,
                  },
                  '&:hover::before': {
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : tabColors.hover,
                  },
                  '&:hover': {
                    bgcolor: isActive ? tabColors.bg : 'transparent',
                    color: isActive ? '#ffffff' : tabColors.bg,
                    transform: 'scale(0.98)',
                  },
                  '&:focus': {
                    outline: 'none',
                  },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <span>{tab.label}</span>
                  <Box
                    sx={{
                      px: 0.75,
                      py: 0.25,
                      borderRadius: 0.5,
                      bgcolor: badgeColors.bg,
                      color: badgeColors.color,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      minWidth: 20,
                      textAlign: 'center',
                      lineHeight: 1,
                    }}
                  >
                    {tab.count}
                  </Box>
                </Stack>
              </Button>
            );
          })}
        </Stack>

        {/* Search and Sort Controls */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{
            flex: { xs: 'none', md: '1 1 auto' },
            justifyContent: { xs: 'stretch', md: 'flex-end' },
            alignItems: { xs: 'stretch', sm: 'center' },
          }}
        >
          {/* Search Box */}
          <Box
            sx={{
              width: { xs: '100%', sm: '240px', md: '280px' },
              border: '1px solid #e7e7e7',
              borderRadius: 0.75,
              bgcolor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              height: '38px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              '&:hover': {
                borderColor: '#1340ff',
                transform: 'translateY(-1px)',
                boxShadow: '0 2px 8px rgba(19, 64, 255, 0.1)',
              },
              '&:focus-within': {
                borderColor: '#1340ff',
                boxShadow: '0 0 0 3px rgba(19, 64, 255, 0.1)',
                transform: 'translateY(-1px)',
              },
            }}
          >
            <InputBase
              inputRef={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              startAdornment={
                <Iconify
                  icon="eva:search-fill"
                  sx={{
                    width: 18,
                    height: 18,
                    color: 'text.disabled',
                    ml: 1.5,
                    mr: 1,
                    transition: 'color 0.2s ease',
                  }}
                />
              }
              endAdornment={
                <Box
                  sx={{
                    display: { xs: 'none', md: 'flex' },
                    alignItems: 'center',
                    gap: 0.25,
                    mr: 1.5,
                    ml: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 1,
                      py: 0.5,
                      bgcolor: '#f5f5f5',
                      borderRadius: 0.5,
                      border: '1px solid #e0e0e0',
                      minHeight: '22px',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: '#eeeeee',
                        borderColor: '#d0d0d0',
                        transform: 'scale(1.05)',
                      },
                      '&:active': {
                        transform: 'scale(0.95)',
                      },
                    }}
                    onClick={() => searchInputRef.current?.focus()}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#666666',
                        lineHeight: 1,
                        fontFamily: 'monospace',
                      }}
                    >
                      {navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#666666',
                        lineHeight: 1,
                        fontFamily: 'monospace',
                      }}
                    >
                      K
                    </Typography>
                  </Box>
                </Box>
              }
              sx={{
                width: '100%',
                color: 'text.primary',
                fontSize: '0.95rem',
                '& input': {
                  py: 1,
                  px: 1,
                  height: '100%',
                  transition: 'all 0.2s ease',
                  '&::placeholder': {
                    color: '#999999',
                    opacity: 1,
                    transition: 'color 0.2s ease',
                  },
                  '&:focus::placeholder': {
                    color: '#cccccc',
                  },
                },
              }}
            />
          </Box>

          {/* Sort Dropdown */}
          <Box
            sx={{
              width: { xs: '100%', sm: '140px' },
              minWidth: { xs: '100%', sm: '140px' },
              maxWidth: { xs: '100%', sm: '140px' },
              border: '1px solid #e7e7e7',
              borderRadius: 0.75,
              bgcolor: 'background.paper',
              height: '38px',
              transition: 'border-color 0.2s ease',
              '&:hover': {
                borderColor: '#1340ff',
              },
            }}
          >
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              displayEmpty
              input={<InputBase />}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: 'white',
                    border: '1px solid #e7e7e7',
                    borderRadius: 1,
                    mt: 0.5,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  },
                },
              }}
              renderValue={(selected) => (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    pr: 0.5, // Space for the arrow
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: selected ? '#1340ff' : '#666666',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}
                  >
                    {selected || 'Sort by'}
                  </Typography>
                </Box>
              )}
              sx={{
                width: '100%',
                height: '100%',
                '& .MuiSelect-select': {
                  py: 1,
                  px: 1.25,
                  pr: '28px !important',
                  display: 'flex',
                  alignItems: 'center',
                  minHeight: 'unset',
                },
                '& .MuiSelect-icon': {
                  right: 6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: sortBy ? '#1340ff' : 'text.secondary',
                  transition: 'color 0.2s ease',
                  position: 'absolute',
                  width: '16px',
                  height: '16px',
                },
                '&.Mui-focused': {
                  outline: 'none',
                },
              }}
            >
              <MenuItem
                value="Most matched"
                sx={{
                  mx: 0.5,
                  my: 0.25,
                  borderRadius: 0.75,
                  fontSize: '0.875rem',
                  '&.Mui-selected': {
                    bgcolor: 'rgba(19, 64, 255, 0.08) !important',
                    color: '#1340ff',
                    '&:hover': {
                      bgcolor: 'rgba(19, 64, 255, 0.12)',
                    },
                  },
                  '&:hover': {
                    bgcolor: 'rgba(19, 64, 255, 0.04)',
                  },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                  Most matched
                  {sortBy === 'Most matched' && (
                    <Iconify
                      icon="eva:checkmark-fill"
                      sx={{ ml: 'auto', width: 16, height: 16, color: '#1340ff' }}
                    />
                  )}
                </Stack>
              </MenuItem>
              <MenuItem
                value="Most recent"
                sx={{
                  mx: 0.5,
                  my: 0.25,
                  borderRadius: 0.75,
                  fontSize: '0.875rem',
                  '&.Mui-selected': {
                    bgcolor: 'rgba(19, 64, 255, 0.08) !important',
                    color: '#1340ff',
                    '&:hover': {
                      bgcolor: 'rgba(19, 64, 255, 0.12)',
                    },
                  },
                  '&:hover': {
                    bgcolor: 'rgba(19, 64, 255, 0.04)',
                  },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                  Most recent
                  {sortBy === 'Most recent' && (
                    <Iconify
                      icon="eva:checkmark-fill"
                      sx={{ ml: 'auto', width: 16, height: 16, color: '#1340ff' }}
                    />
                  )}
                </Stack>
              </MenuItem>
            </Select>
          </Box>
        </Stack>
      </Box>
    </>
  );

  return (
    <Container
      maxWidth={settings.themeStretch ? false : 'xl'}
      sx={{
        px: { xs: 2, sm: 3, md: 4 },
      }}
    >
      {isLoading && (
        <Box
          sx={{
            position: 'relative',
            top: 200,
            textAlign: 'center',
          }}
        >
          <CircularProgress
            thickness={7}
            size={25}
            sx={{
              color: theme.palette.common.black,
              strokeLinecap: 'round',
            }}
          />
        </Box>
      )}

      {!isLoading && (
        <>
          {renderTabs}
          {currentTab === 'myCampaign' && (
            <ActiveCampaignView searchQuery={query} campaigns={filteredData.active} />
          )}
          {currentTab === 'applied' && (
            <AppliedCampaignView searchQuery={query} campaigns={filteredData.pending} />
          )}
          {currentTab === 'completed' && (
            <CompletedCampaignView searchQuery={query} campaigns={filteredData.completed} />
          )}
        </>
      )}

      {/* {currentTab === 'myCampaign' && <ActiveCampaignView searchQuery={query} />} */}
      {/* {currentTab === 'applied' && <AppliedCampaignView searchQuery={query} />} */}
      {/* {currentTab === 'completed' && <CompletedCampaignView searchQuery={query} />} */}
    </Container>
  );
};

export default ManageCampaignView;

// ManageCampaignView.propTypes = {};
