import { orderBy } from 'lodash';
import React, { useMemo, useState } from 'react';

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

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

import ActiveCampaignView from '../active-campaign-view';
import AppliedCampaignView from '../applied-campaign-view';
import CompletedCampaignView from '../completed-campaign-view';

const ManageCampaignView = () => {
  const [currentTab, setCurrentTab] = useState('myCampaign');
  
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('');

  const { user } = useAuthContext();
  const { data: campaigns, isLoading } = useGetMyCampaign(user?.id);
  
  console.log(campaigns);

  // const { campaigns } = useGetCampaigns('creator');
  const settings = useSettingsContext();

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

      // active:
      //   filteredCampaigns?.filter(
      //     (campaign) =>
      //       campaign?.shortlisted?.some(
      //         (item) => item.userId === user?.id && !item.isCampaignDone
      //       ) && campaign.status !== 'COMPLETED'
      //   )?.length || 0,
      // pending:
      //   filteredCampaigns?.filter((campaign) =>
      //     campaign?.pitch?.some(
      //       (item) =>
      //         item?.userId === user?.id &&
      //         (item?.status === 'undecided' || item?.status === 'rejected')
      //     )
      //   )?.length || 0,
      // completed:
      //   filteredCampaigns?.filter((campaign) =>
      //     campaign?.shortlisted?.some((item) => item.userId === user?.id && item.isCampaignDone)
      //   )?.length || 0,
    };
  }, [campaigns, sortBy]);

  const tabs = [
    { id: 'myCampaign', label: 'Active', count: filteredData.active?.length || 0 },
    { id: 'applied', label: 'Pending', count: filteredData.pending?.length || 0 },
    { id: 'completed', label: 'Completed', count: filteredData.completed?.length || 0 },
  ];

  const renderTabs = (
    <>
      {/* Mobile Search and Sort Stack */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        sx={{
          width: '100%',
          mb: { xs: 3, sm: 0 },
          display: { xs: 'flex', md: 'none' },
          mt: -2,
        }}
      >
        {/* Search Box - Full width on mobile */}
        <Box
          sx={{
            width: '100%',
            border: '1px solid',
            borderBottom: '3.5px solid',
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'background.paper',
          }}
        >
          <InputBase
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            startAdornment={
              <Iconify
                icon="eva:search-fill"
                sx={{ width: 20, height: 20, mr: 1, color: 'text.disabled', ml: 1 }}
              />
            }
            sx={{
              width: '100%',
              color: 'text.primary',
              '& input': {
                py: 1,
                px: 1,
              },
            }}
          />
        </Box>

        {/* Sort Box - Full width on mobile */}
        <Box
          sx={{
            width: '100%',
            border: '1px solid',
            borderBottom: '3.5px solid',
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'background.paper',
          }}
        >
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            displayEmpty
            input={<InputBase />}
            renderValue={(selected) => <strong>{selected || 'Sort by'}</strong>}
            sx={{
              width: '100%',
              '& .MuiSelect-select': {
                py: 1,
                px: 1.5,
                pr: 4,
                display: 'flex',
                alignItems: 'center',
              },
              '& .MuiSelect-icon': {
                color: '#1340ff',
              },
            }}
            IconComponent={(props) => (
              <Iconify
                icon="eva:chevron-down-fill"
                {...props}
                sx={{ mr: 0.2, width: 32, height: 32 }}
              />
            )}
          >
            <MenuItem value="Most matched">
              <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                Most matched
                {sortBy === 'Most matched' && (
                  <Iconify
                    icon="eva:checkmark-fill"
                    sx={{ ml: 'auto', width: 20, height: 20, color: '#1340ff' }}
                  />
                )}
              </Stack>
            </MenuItem>
            <MenuItem value="Most recent">
              <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                Most recent
                {sortBy === 'Most recent' && (
                  <Iconify
                    icon="eva:checkmark-fill"
                    sx={{ ml: 'auto', width: 20, height: 20, color: '#1340ff' }}
                  />
                )}
              </Stack>
            </MenuItem>
          </Select>
        </Box>
      </Stack>

      {/* Existing Tabs and Desktop Search/Sort */}
      <Stack
        direction="row"
        spacing={0.5}
        sx={
          {
            /* existing styles */
          }
        }
      >
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
          fontFamily: 'Instrument Serif, serif',
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
              color: (theme) => theme.palette.common.black,
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
