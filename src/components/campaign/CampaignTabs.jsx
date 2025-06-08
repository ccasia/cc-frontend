import axios from 'axios';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Box, Stack, Button, IconButton, Typography } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

// ----------------------------------------------------------------------

export default function CampaignTabs({ filter = 'active' }) {
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [filteredTabs, setFilteredTabs] = useState([]);
  const router = useRouter();
  const location = useLocation();
  
  const fetchCampaignData = async (campaignId) => {
    try {
      const response = await axios.get(`/api/admin/campaign/${campaignId}`);
      if (response.data && response.data.name) {
        // Update the tab with the actual campaign name
        const updatedTabs = window.campaignTabs.map(tab => {
          if (tab.id === campaignId) {
            return { ...tab, name: response.data.name };
          }
          return tab;
        });
        
        window.campaignTabs = updatedTabs;
        
        // Save to localStorage
        try {
          localStorage.setItem('campaignTabs', JSON.stringify(window.campaignTabs));
        } catch (error) {
          console.error('Error saving campaign tabs to localStorage:', error);
        }
        
        return response.data.name;
      }
    } catch (error) {
      console.error(`Error fetching campaign data for ID ${campaignId}:`, error);
    }
    return null;
  };
  
  // Load tabs from window.campaignTabs
  useEffect(() => {
    const handleTabsUpdate = () => {
      if (window.campaignTabs) {
        setTabs([...window.campaignTabs]);
        
        // Check for any tabs with "Campaign Details" and try to update them
        window.campaignTabs.forEach(tab => {
          if (tab.name === 'Campaign Details' || !tab.name) {
            // For tabs with default names, try to fetch actual campaign name
            fetchCampaignData(tab.id);
          }
        });
      }
    };
    
    // Initial load
    handleTabsUpdate();
    
    // Set up an interval to check for updates
    const intervalId = setInterval(handleTabsUpdate, 500);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Filter tabs based on current filter and campaign status
  useEffect(() => {
    // If we don't have campaignStatus data in the tabs, we show all tabs
    if (window.campaignTabsStatus) {
      const filtered = tabs.filter(tab => {
        const status = window.campaignTabsStatus[tab.id]?.status?.toLowerCase() || '';
        return status === filter.toLowerCase();
      });
      setFilteredTabs(filtered);
    } else {
      setFilteredTabs(tabs);
    }
  }, [tabs, filter]);
  
  // Check the current URL to determine which campaign tab is active
  useEffect(() => {
    const {pathname} = location;
    // regex that gets the campaign ID from URLs like /dashboard/campaign/discover/detail/id
    const match = pathname.match(/\/campaign\/discover\/detail\/([^/]+)/);
    if (match && match[1]) {
      setActiveTabId(match[1]);
      
    } else {
      setActiveTabId(null);
    }
  }, [location]);
  
  // Navigate to campaign page
  const handleTabClick = (campaignId) => {
    router.push(paths.dashboard.campaign.adminCampaignDetail(campaignId));
  };
  
  // Close a tab
  const handleCloseTab = (event, tabId) => {
    event.stopPropagation();
    
    // Check if we're closing the active tab
    const isClosingActiveTab = tabId === activeTabId;
    
    // Update tabs list
    const updatedTabs = tabs.filter(tab => tab.id !== tabId);
    window.campaignTabs = window.campaignTabs.filter(tab => tab.id !== tabId);
    setTabs(updatedTabs);
    
    // Save to localStorage
    try {
      localStorage.setItem('campaignTabs', JSON.stringify(window.campaignTabs));
    } catch (error) {
      console.error('Error saving campaign tabs to localStorage:', error);
    }
    
    // only if closing the currently active tab
    if (isClosingActiveTab) {
      if (updatedTabs.length > 0) {
        // Navigate to the first active tab
        router.push(paths.dashboard.campaign.adminCampaignDetail(updatedTabs[0].id));
      } else {
        // No tabs left, go back to campaign dashboard
        router.push(paths.dashboard.campaign.root);
      }
    }
  };
  
  if (!filteredTabs.length) {
    return null;
  }
  
  // Get the display text based on current filter
  const getCampaignTypeText = () => {
    const type = filter.charAt(0).toUpperCase() + filter.slice(1);
    return `${type} Campaigns`;
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      {filteredTabs.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Stack 
            direction="row" 
            spacing={0} 
            alignItems="center"
            sx={{ 
              overflowX: 'auto', 
              pb: 1,
              '&::-webkit-scrollbar': { height: '4px' },
              '&::-webkit-scrollbar-thumb': { backgroundColor: '#e0e0e0', borderRadius: '4px' } 
            }}
          >
            <Typography 
              variant="caption" 
              onClick={() => router.push(paths.dashboard.campaign.root)}
              sx={{ 
                color: '#1340FF', 
                fontSize: '0.875rem', 
                fontWeight: 600, 
                flexShrink: 0, 
                display: 'flex', 
                alignItems: 'center',
                cursor: 'pointer',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              {getCampaignTypeText()}
              <ArrowForwardIosIcon sx={{ fontSize: '0.8rem', mx: 1 }} />
            </Typography>
            {filteredTabs.map((tab) => {
              const isActive = activeTabId === tab.id;
              return (
                <Button
                  key={tab.id}
                  variant="text"
                  onClick={() => handleTabClick(tab.id)}
                  sx={{
                    minWidth: 'auto',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    border: 'none',
                    borderRight: '1px solid',
                    borderBottom: '2px solid',
                    borderColor: isActive ? '#1340FF' : '#e0e0e0',
                    color: isActive ? '#1340FF' : '#8E8E93',
                    backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                    '&:hover': {
                      color: 'rgba(19, 64, 255, 0.7)',
                      border: 'none',
                      borderRight: '1px solid',
                      borderBottom: '2px solid',
                      borderColor: 'rgba(19, 64, 255, 0.7)',
                      backgroundColor: 'rgba(19, 64, 255, 0.04)',
                    },
                  }}
                  endIcon={
                    <IconButton
                      size="small"
                      onClick={(e) => handleCloseTab(e, tab.id)}
                      onMouseOver={(e) => e.stopPropagation()}
                      sx={{ 
                        p: 0,
                        height: '20px',
                        width: '20px',
                        minWidth: '20px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: '#8E8E93',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                          color: '#FF3B30',
                        }
                      }}
                    >
                      <CloseIcon fontSize="small" sx={{ fontSize: '16px' }} />
                    </IconButton>
                  }
                >
                  {tab.name}
                </Button>
              );
            })}
          </Stack>
        </Box>
      )}
    </Box>
  );
}

CampaignTabs.propTypes = {
  filter: PropTypes.string,
}; 