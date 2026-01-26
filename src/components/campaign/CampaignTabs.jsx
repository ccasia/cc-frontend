import axios from 'axios';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';

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
    // If filter is empty or "all", show only active campaign tabs
    if (!filter || filter.toLowerCase() === 'all') {
      if (window.campaignTabsStatus) {
        const filtered = tabs.filter(tab => {
          const status = window.campaignTabsStatus[tab.id]?.status?.toLowerCase() || '';
          return status === 'active';
        });
        setFilteredTabs(filtered);
      } else {
        // If no status data, show all tabs (fallback)
        setFilteredTabs(tabs);
      }
      return;
    }
    
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
    if (!filter || filter.toLowerCase() === 'all') {
      return 'All Campaigns';
    }
    const type = filter.charAt(0).toUpperCase() + filter.slice(1);
    return `${type} Campaigns`;
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      <AnimatePresence mode="wait">
        {filteredTabs.length > 0 && (
          <m.div
            key={filter || 'all'}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Box sx={{ mb: 2, width: '100%', overflow: 'hidden' }}>
              <Stack 
                direction="row" 
                spacing={0} 
                alignItems="center"
                sx={{ 
                  width: '100%',
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  pb: 1,
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#e0e0e0 transparent',
                  '&::-webkit-scrollbar': { 
                    height: '6px',
                    display: 'block'
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: 'transparent'
                  },
                  '&::-webkit-scrollbar-thumb': { 
                    backgroundColor: '#e0e0e0', 
                    borderRadius: '4px',
                    '&:hover': {
                      backgroundColor: '#bdbdbd'
                    }
                  },
                  // Smooth scrolling
                  scrollBehavior: 'smooth',
                  // Hide scrollbar on mobile but keep functionality
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                <AnimatePresence mode="popLayout">
                  {filteredTabs.length > 0 && (
                    <m.div
                      key="campaign-label"
                      initial={{ opacity: 0, scale: 0.8, x: -20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: -20 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      style={{ display: 'inline-flex' }}
                    >
                      <Typography 
                        variant="caption" 
                        onClick={() => router.push(paths.dashboard.campaign.root)}
                        sx={{ 
                          color: '#1340FF', 
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          fontWeight: 600, 
                          flexShrink: 0, 
                          display: 'flex', 
                          alignItems: 'center',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        {getCampaignTypeText()}
                        <ArrowForwardIosIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' }, mx: { xs: 0.5, sm: 1 } }} />
                      </Typography>
                    </m.div>
                  )}
                  {filteredTabs.map((tab) => {
                    const isActive = activeTabId === tab.id;
                    return (
                      <m.div
                        key={tab.id}
                        initial={{ opacity: 0, scale: 0.8, x: -20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: -20 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        style={{ display: 'inline-flex' }}
                      >
                        <Button
                          variant="text"
                          onClick={() => handleTabClick(tab.id)}
                          title={tab.name}
                          sx={{
                            minWidth: 'auto',
                            maxWidth: { xs: '120px', sm: '200px', md: 'none' },
                            px: { xs: 1, sm: 1.5 },
                            py: 0.5,
                            borderRadius: '8px',
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            flexShrink: 0,
                            border: 'none',
                            borderRight: '1px solid',
                            borderBottom: '2px solid',
                            borderColor: isActive ? '#1340FF' : '#e0e0e0',
                            color: isActive ? '#1340FF' : '#8E8E93',
                            backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                            '& .MuiButton-endIcon': {
                              flexShrink: 0,
                            },
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
                          <Box
                            component="span"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '100%',
                            }}
                          >
                            {tab.name}
                          </Box>
                        </Button>
                      </m.div>
                    );
                  })}
                </AnimatePresence>
              </Stack>
            </Box>
          </m.div>
        )}
      </AnimatePresence>
    </Box>
  );
}

CampaignTabs.propTypes = {
  filter: PropTypes.string,
}; 