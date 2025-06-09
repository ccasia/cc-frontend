import axios from 'axios';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import { Box, Stack, Button, Tooltip, IconButton, Typography } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function CampaignTabsMobile({ filter = 'active' }) {
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [filteredTabs, setFilteredTabs] = useState([]);
  const [isOnCampaignDetailPage, setIsOnCampaignDetailPage] = useState(false);
  
  const router = useRouter();
  const location = useLocation();
  
  // Fetch campaign data with useCallback to prevent unnecessary re-renders
  const fetchCampaignData = useCallback(async (campaignId) => {
    try {
      const response = await axios.get(`/api/admin/campaign/${campaignId}`);
      if (response.data?.name) {
        // Extract campaign image from campaignBrief
        const campaignImage = response.data?.campaignBrief?.images?.[0] || null;
        
        // Update the tab with the actual campaign name and image
        const updatedTabs = window.campaignTabs.map(tab => 
          tab.id === campaignId ? { 
            ...tab, 
            name: response.data.name,
            image: campaignImage 
          } : tab
        );
        
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
  }, []);
  
  // Load tabs from window.campaignTabs
  useEffect(() => {
    const handleTabsUpdate = () => {
      if (window.campaignTabs) {
        setTabs([...window.campaignTabs]);
        
        // Check for any tabs with "Campaign Details" and try to update them
        window.campaignTabs.forEach(tab => {
          if (tab.name === 'Campaign Details' || !tab.name) {
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
  }, [fetchCampaignData]);
  
  // Filter tabs based on current filter and campaign status
  useEffect(() => {
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
    const { pathname } = location;
    // Match campaign detail pages including sub-routes like pitch and creator pages
    const match = pathname.match(/\/campaign\/discover\/detail\/([^/]+)/);
    if (match?.[1]) {
      setActiveTabId(match[1]);
      setIsOnCampaignDetailPage(true);
    } else {
      setActiveTabId(null);
      setIsOnCampaignDetailPage(false);
    }
  }, [location]);
  
  // Navigate to campaign page
  const handleTabClick = useCallback((campaignId) => {
    router.push(paths.dashboard.campaign.adminCampaignDetail(campaignId));
  }, [router]);
  
  // Close a tab
  const handleCloseTab = useCallback((event, tabId) => {
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
    
    // Only if closing the currently active tab
    if (isClosingActiveTab) {
      if (updatedTabs.length > 0) {
        // Navigate to the first active tab
        router.push(paths.dashboard.campaign.adminCampaignDetail(updatedTabs[0].id));
      } else {
        // No tabs left, go back to campaign dashboard
        router.push(paths.dashboard.campaign.root);
      }
    }
  }, [activeTabId, tabs, router]);

  // Handle close all tabs
  const handleCloseAll = useCallback(() => {
    // Clear all campaign tabs
    window.campaignTabs = [];
    setTabs([]);
    
    try {
      localStorage.setItem('campaignTabs', JSON.stringify([]));
    } catch (error) {
      console.error('Error saving campaign tabs to localStorage:', error);
    }
    
    // Navigate back to campaigns list
    router.push(paths.dashboard.campaign.root);
  }, [router]);
  
  // Don't render if no tabs
  if (!filteredTabs.length) {
    return null;
  }
  
  // Get the display text based on current filter
  const getCampaignTypeText = () => {
    const type = filter.charAt(0).toUpperCase() + filter.slice(1);
    return `${type} Campaigns`;
  };
  
  return (
    <Box
      sx={{
        border: '1px solid #e7e7e7',
        borderRadius: 1,
        p: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        bgcolor: 'background.paper',
        mb: 2.5,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        {/* Title */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            backgroundColor: '#FFFFFF',
            border: '1px solid #E7E7E7',
            borderRadius: 1,
            padding: '6px 10px',
            height: 28,
            flex: 1,
            minWidth: 0,
          }}
        >
          <Typography
            sx={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '0.75rem',
              color: '#48484A',
              lineHeight: 1,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
            }}
          >
            Opened Tabs
          </Typography>
          
          <Box
            sx={{
              width: '1px',
              height: '14px',
              backgroundColor: '#D0D0D0',
              flexShrink: 0,
            }}
          />
          
          <Box
            sx={{
              backgroundColor: '#E0E0E0',
              borderRadius: 0.75,
              padding: '2px 6px',
              minWidth: 'auto',
            }}
          >
            <Typography
              sx={{
                color: '#666666',
                fontSize: '0.65rem',
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: '0.01em',
              }}
            >
              {filteredTabs.length}
            </Typography>
          </Box>
        </Box>

        {/* Close All Button */}
        <Tooltip 
          title="Close all" 
          arrow 
          placement="left"
          slotProps={{
            tooltip: {
              sx: {
                bgcolor: 'rgba(0, 0, 0, 0.9)',
                color: 'white',
                fontSize: '11px',
                fontWeight: 500,
              },
            },
            arrow: {
              sx: {
                color: 'rgba(0, 0, 0, 0.9)',
              },
            },
          }}
        >
          <IconButton
            onClick={handleCloseAll}
            size="small"
            sx={{
              width: 28,
              height: 28,
              borderRadius: 0.75,
              border: '1px solid #E0E0E0',
              backgroundColor: '#FFFFFF',
              flexShrink: 0,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(19, 64, 255, 0.08)',
                borderColor: '#1340FF',
              },
            }}
          >
            <Iconify icon="solar:close-circle-bold" width={14} sx={{ color: '#666666' }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Breadcrumb */}
      {isOnCampaignDetailPage && (
        <Box sx={{ px: 0.5 }}>
          <Typography 
            variant="caption" 
            onClick={() => router.push(paths.dashboard.campaign.root)}
            sx={{ 
              color: '#1340FF', 
              fontSize: '0.8rem', 
              fontWeight: 600, 
              display: 'flex', 
              alignItems: 'center',
              cursor: 'pointer',
              letterSpacing: '0.01em',
              '&:hover': {
                textDecoration: 'underline',
                color: '#0F2DB8',
              }
            }}
          >
            <Iconify 
              icon="solar:arrow-left-linear" 
              width={12} 
              sx={{ mr: 0.5 }} 
            />
            Back to {getCampaignTypeText()}
          </Typography>
        </Box>
      )}

      {/* Campaign Tabs - Horizontal Scrollable */}
      <Box
        sx={{
          overflowX: 'auto',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <Stack direction="row" spacing={1} sx={{ minWidth: 'fit-content' }}>
          {filteredTabs.map((tab) => {
            const isActive = activeTabId === tab.id;
            
            return (
              <Button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                sx={{
                  px: 2,
                  py: 1,
                  minHeight: '36px',
                  height: '36px',
                  minWidth: 'fit-content',
                  maxWidth: '200px',
                  color: isActive ? '#ffffff' : '#666666',
                  bgcolor: isActive ? '#1340ff' : 'transparent',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  borderRadius: 0.75,
                  textTransform: 'none',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  border: '1px solid #E7E7E7',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&:hover': {
                    bgcolor: isActive ? '#1340ff' : 'rgba(19, 64, 255, 0.08)',
                    color: isActive ? '#ffffff' : '#1340ff',
                    borderColor: 'rgba(19, 64, 255, 0.2)',
                  },
                }}
              >
                <Typography
                  sx={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'inherit',
                    maxWidth: '140px',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {tab.name}
                </Typography>
                
                <IconButton
                  onClick={(e) => handleCloseTab(e, tab.id)}
                  size="small"
                  sx={{
                    width: 18,
                    height: 18,
                    minWidth: 18,
                    color: 'inherit',
                    backgroundColor: 'transparent',
                    borderRadius: 0.5,
                    padding: 0,
                    marginLeft: 0.5,
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 59, 48, 0.1)',
                      color: '#FF3B30',
                      transform: 'scale(1.1)',
                    },
                    '& .MuiSvgIcon-root': {
                      fontSize: '12px',
                    },
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Button>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
}

CampaignTabsMobile.propTypes = {
  filter: PropTypes.string,
}; 