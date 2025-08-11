import { orderBy } from 'lodash';
import React, { useMemo, useState, useEffect } from 'react';

import { useTheme } from '@mui/material/styles';
import {
  Box,
  Stack,
  Button,
  Select,
  Divider,
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

    console.log('My Campaigns - Raw campaigns:', campaigns?.map(c => ({ id: c.id, name: c.name, createdAt: c.createdAt, origin: c.origin })));

    // Apply sorting - default to newest first
    if (sortBy === 'Most matched') {
      filteredCampaigns = orderBy(filteredCampaigns, ['percentageMatch'], ['desc']);
    } else if (sortBy === 'Most recent') {
      filteredCampaigns = orderBy(filteredCampaigns, ['createdAt'], ['desc']);
    } else {
      // Default sorting: newest first
      filteredCampaigns = orderBy(filteredCampaigns, ['createdAt'], ['desc']);
    }

    return {
      active:
        filteredCampaigns?.filter(
          (campaign) => {
            // Campaigns that are shortlisted and active
            if (campaign.shortlisted && campaign.status === 'ACTIVE' && !campaign.shortlisted?.isCampaignDone) {
              return true;
            }
            // Campaigns with approved pitches (V3: APPROVED, V2: approved) - these go to active tab
            if (campaign?.pitch?.status === 'APPROVED' || campaign?.pitch?.status === 'approved') {
              return true;
            }
            return false;
          }
        ) || [],
      pending:
        filteredCampaigns?.filter(
          (campaign) => {
            // For V3 campaigns: PENDING_REVIEW and SENT_TO_CLIENT should be in pending
            if (campaign?.pitch?.status === 'PENDING_REVIEW' || campaign?.pitch?.status === 'SENT_TO_CLIENT') {
              return true;
            }
            // For V2 campaigns: undecided status should be in pending
            if (campaign?.pitch?.status === 'undecided') {
              return true;
            }
            // Campaigns that are not shortlisted and don't have approved pitches
            if (!campaign.shortlisted && campaign?.pitch?.status !== 'APPROVED' && campaign?.pitch?.status !== 'approved') {
              return true;
            }
            return false;
          }
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
      {/* Existing Tabs and Desktop Search/Sort */}
      <Stack direction="row" spacing={0.5}>
        <Stack direction="row" spacing={2.5}>
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              disableRipple
              size="large"
              onClick={() => setCurrentTab(tab.id)}
              sx={{
                px: 0.5,
                py: 0.5,
                pb: 1,
                minWidth: 'fit-content',
                color: currentTab === tab.id ? '#221f20' : '#8e8e93',
                position: 'relative',
                fontSize: '1.05rem',
                fontWeight: 650,
                '&:hover': {
                  bgcolor: 'transparent',
                  '&::after': {
                    width: '100%',
                    opacity: currentTab === tab.id ? 1 : 0.5,
                  },
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  bgcolor: '#1340ff',
                  width: currentTab === tab.id ? '100%' : '0%',
                  transition: 'all 0.3s ease-in-out',
                },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <span>{tab.label}</span>
                <Box
                  sx={{
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    bgcolor: currentTab === tab.id ? 'primary.lighter' : 'grey.200',
                    color: currentTab === tab.id ? 'primary.main' : 'grey.600',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    minWidth: 24,
                    textAlign: 'center',
                  }}
                >
                  {tab.count}
                </Box>
              </Stack>
            </Button>
          ))}
        </Stack>

        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{
            ml: 'auto',
            display: { xs: 'none', md: 'flex' },
            mt: -2,
          }}
        >
          {/* Existing Desktop Search Box */}
          <Box
            sx={{
              ml: 'auto',
              display: { xs: 'none', md: 'block' },
              width: 280,
              border: '1px solid',
              borderBottom: '2.5px solid',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'background.paper',
              alignItems: 'center',
              height: '42px',
            }}
          >
            <InputBase
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              startAdornment={
                <Iconify
                  icon="eva:search-fill"
                  sx={{
                    width: 20,
                    height: 20,
                    color: 'text.disabled',
                    ml: 1.5,
                    mr: 1,
                  }}
                />
              }
              sx={{
                width: '100%',
                color: 'text.primary',
                '& input': {
                  py: 1.5,
                  px: 1,
                  height: '100%',
                },
              }}
            />
          </Box>

          {/* New Sort Box */}
          <Box
            sx={{
              minWidth: 120,
              maxWidth: 160,
              border: '1px solid',
              borderBottom: '2.5px solid',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'background.paper',
              height: '42px',
            }}
          >
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              displayEmpty
              input={<InputBase />}
              renderValue={(selected) => (
                <Box
                  sx={{
                    width: '100%',
                    textAlign: 'center',
                    mr: selected ? 0 : '24px',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  >
                    {selected || 'Sort by'}
                  </Typography>
                </Box>
              )}
              sx={{
                height: '100%',
                '& .MuiSelect-select': {
                  py: 1,
                  px: 1.5,
                  pr: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                '& .MuiSelect-icon': {
                  color: '#1340ff',
                },
              }}
              IconComponent={(props) => (
                <Iconify
                  icon="eva:chevron-down-fill"
                  {...props}
                  sx={{
                    mr: 0.2,
                    width: 32,
                    height: 32,
                    right: -4,
                  }}
                />
              )}
            >
              <MenuItem value="Most matched">
                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                    Most matched
                    {sortBy === 'Most matched' && (
                      <Iconify
                        icon="eva:checkmark-fill"
                        sx={{ ml: 'auto', width: 20, height: 20, color: '#1340ff' }}
                      />
                    )}
                  </Stack>
                </Typography>
              </MenuItem>
              <MenuItem value="Most recent">
                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                    Most recent
                    {sortBy === 'Most recent' && (
                      <Iconify
                        icon="eva:checkmark-fill"
                        sx={{ ml: 'auto', width: 20, height: 20, color: '#1340ff' }}
                      />
                    )}
                  </Stack>
                </Typography>
              </MenuItem>
            </Select>
          </Box>
        </Stack>
      </Stack>

      <Divider sx={{ width: '100%', bgcolor: '#ebebeb', my: 1, mt: -0.15 }} />

      {/* sort options */}
      <Box
        sx={{
          display: { xs: currentTab === 'completed' ? 'none' : 'block', md: 'none' },
          mt: 2,
          mb: 2,
        }}
      >
        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          displayEmpty
          fullWidth
          MenuProps={{
            PaperProps: {
              sx: {
                bgcolor: 'white',
                border: '0.5px solid #E7E7E7',
                borderBottom: '3px solid #E7E7E7',
                mt: 1,
              },
            },
          }}
          sx={{
            border: '0.5px solid #E7E7E7',
            borderBottom: '3px solid #E7E7E7',
            borderRadius: 1.25,
            bgcolor: 'background.paper',
            height: '48px',
            width: '160px',
            '& .MuiSelect-select': {
              py: 1.5,
              px: 2,
              display: 'flex',
              alignItems: 'center',
            },
            '& .MuiSelect-icon': {
              right: 10,
              color: '#000000',
            },
            '&.Mui-focused': {
              outline: 'none',
            },
            '&:active': {
              bgcolor: '#f2f2f2',
              transition: 'background-color 0.2s ease',
            },
          }}
          renderValue={(selected) => (
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                fontSize: '1rem',
              }}
            >
              {selected || 'Sort by'}
            </Typography>
          )}
        >
          <MenuItem
            value="Most matched"
            sx={{
              mx: 0.2,
              my: 0.5,
              borderRadius: 0.5,
              '&.Mui-selected': {
                bgcolor: '#F5F5F5 !important',
                '&:hover': {
                  bgcolor: '#F5F5F5',
                },
              },
              '&:hover': {
                bgcolor: '#F5F5F5',
              },
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
              Most matched
              {sortBy === 'Most matched' && (
                <Iconify
                  icon="eva:checkmark-fill"
                  sx={{ ml: 'auto', width: 20, height: 20, color: '#000000' }}
                />
              )}
            </Stack>
          </MenuItem>
          <MenuItem
            value="Most recent"
            sx={{
              mx: 0.2,
              my: 0.5,
              borderRadius: 0.5,
              '&.Mui-selected': {
                bgcolor: '#F5F5F5 !important',
                '&:hover': {
                  bgcolor: '#F5F5F5',
                },
              },
              '&:hover': {
                bgcolor: '#F5F5F5',
              },
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
              Most recent
              {sortBy === 'Most recent' && (
                <Iconify
                  icon="eva:checkmark-fill"
                  sx={{ ml: 'auto', width: 20, height: 20, color: '#000000' }}
                />
              )}
            </Stack>
          </MenuItem>
        </Select>
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
      <Typography
        variant="h2"
        sx={{
          mb: 2,
          mt: { lg: 2, xs: 2, sm: 2 },
          fontFamily: theme.typography.fontSecondaryFamily,
          fontWeight: 'normal',
        }}
      >
        My Campaigns ⏰
      </Typography>

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
