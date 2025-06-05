import axios from 'axios';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Stack, Button, Tooltip, IconButton, Typography } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

import { NAV } from '../../layouts/config-layout';

// ----------------------------------------------------------------------

const StyledNavContainer = styled(Box)(({ theme, isCollapsed }) => ({
  width: isCollapsed ? 80 : NAV.W_VERTICAL,
  height: '97vh',
  margin: theme.spacing(1.5),
  marginLeft: theme.spacing(-0.5),
  marginRight: theme.spacing(1),
  borderRadius: theme.spacing(2),
  backgroundColor: '#FFFFFF',
  border: '1px solid #E7E7E7',
  borderBottom: '2px solid #E7E7E7',
  boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)',
  overflow: 'hidden',
  flexShrink: 0,
  zIndex: theme.zIndex.drawer - 1,
  cursor: 'default',
  transition: theme.transitions.create(['width'], {
    duration: theme.transitions.duration.standard,
    easing: theme.transitions.easing.easeInOut,
  }),
  // Hide on smaller screens since we use mobile component
  [theme.breakpoints.down('lg')]: {
    display: 'none',
  },
  // Responsive adjustments for larger screens only
  [theme.breakpoints.down('md')]: {
    width: isCollapsed ? 60 : Math.min(NAV.W_VERTICAL, 240),
    margin: theme.spacing(1),
    marginLeft: theme.spacing(-0.25),
    height: '96vh',
    display: 'none', // Still hidden on md and below
  },
  [theme.breakpoints.down('sm')]: {
    width: isCollapsed ? 50 : Math.min(NAV.W_VERTICAL, 200),
    margin: theme.spacing(0.5),
    marginLeft: 0,
    height: '95vh',
    display: 'none', // Still hidden on sm and below
  },
}));

const StyledHeaderContainer = styled(Box)(({ theme, isCollapsed }) => ({
  padding: isCollapsed ? theme.spacing(1.5, 1) : theme.spacing(2, 2),
  borderBottom: '1px solid #F0F0F0',
  minHeight: isCollapsed ? 64 : 72,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  flexDirection: 'row',
  justifyContent: isCollapsed ? 'center' : 'flex-start',
  position: 'relative',
  backgroundColor: '#FAFAFA',
  transition: theme.transitions.create(['padding', 'justify-content', 'min-height'], {
    duration: theme.transitions.duration.standard,
    easing: theme.transitions.easing.easeInOut,
  }),
  // Responsive adjustments
  [theme.breakpoints.down('md')]: {
    padding: isCollapsed ? theme.spacing(1.25, 0.75) : theme.spacing(1.75, 1.5),
    minHeight: isCollapsed ? 56 : 64,
    gap: theme.spacing(1),
  },
  [theme.breakpoints.down('sm')]: {
    padding: isCollapsed ? theme.spacing(1, 0.5) : theme.spacing(1.5, 1),
    minHeight: isCollapsed ? 48 : 56,
    gap: theme.spacing(0.75),
  },
}));

const StyledTextContainer = styled(Box)(() => ({
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
}));

const StyledActionButton = styled(IconButton)(({ theme }) => ({
  width: 28,
  height: 28,
  borderRadius: theme.spacing(0.75),
  border: '1px solid #E0E0E0',
  backgroundColor: '#FFFFFF',
  flexShrink: 0,
  transition: theme.transitions.create(['background-color', 'border-color'], {
    duration: theme.transitions.duration.standard,
    easing: theme.transitions.easing.easeInOut,
  }),
  '&:hover': {
    backgroundColor: 'rgba(19, 64, 255, 0.08)',
    borderColor: '#1340FF',
  },
  // Responsive adjustments
  [theme.breakpoints.down('md')]: {
    width: 26,
    height: 26,
  },
  [theme.breakpoints.down('sm')]: {
    width: 24,
    height: 24,
  },
}));

const StyledCloseButton = styled(IconButton)(({ theme }) => ({
  width: 18,
  height: 18,
  color: '#8E8E93',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  border: '1px solid rgba(0, 0, 0, 0.1)',
  borderRadius: theme.spacing(0.75),
  position: 'absolute',
  top: '50%',
  right: 10,
  transform: 'translateY(-50%)',
  transition: theme.transitions.create(['background-color', 'color', 'border-color', 'transform'], {
    duration: theme.transitions.duration.standard,
    easing: theme.transitions.easing.easeInOut,
  }),
  '&:hover': {
    backgroundColor: '#FF3B30',
    color: '#FFFFFF',
    borderColor: '#FF3B30',
    transform: 'translateY(-50%) scale(1.1)',
  },
  '& .MuiSvgIcon-root': {
    fontSize: '12px',
  },
  // Responsive adjustments
  [theme.breakpoints.down('md')]: {
    width: 16,
    height: 16,
    right: 8,
    '& .MuiSvgIcon-root': {
      fontSize: '10px',
    },
  },
  [theme.breakpoints.down('sm')]: {
    width: 14,
    height: 14,
    right: 6,
    '& .MuiSvgIcon-root': {
      fontSize: '8px',
    },
  },
}));

const StyledNavContent = styled(Box)(({ theme, isCollapsed }) => ({
  padding: theme.spacing(1.5, isCollapsed ? 1 : 1.5),
  height: 'calc(100% - 72px)',
  overflow: 'hidden auto',
  transition: theme.transitions.create(['padding'], {
    duration: theme.transitions.duration.standard,
    easing: theme.transitions.easing.easeInOut,
  }),
  '&::-webkit-scrollbar': {
    width: 4,
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#E0E0E0',
    borderRadius: 2,
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: '#BDBDBD',
  },
  // Responsive adjustments
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(1.25, isCollapsed ? 0.75 : 1.25),
    height: 'calc(100% - 64px)',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1, isCollapsed ? 0.5 : 1),
    height: 'calc(100% - 56px)',
    '&::-webkit-scrollbar': {
      width: 3,
    },
  },
}));

const StyledNumberedTab = styled(Button)(({ theme, isActive }) => ({
  width: '100%',
  height: 36,
  minWidth: 'unset',
  borderRadius: theme.spacing(0.75),
  border: '1px solid #E7E7E7',
  backgroundColor: 'transparent',
  color: isActive ? '#1340FF' : '#666666',
  fontSize: '0.875rem',
  fontWeight: 600,
  marginBottom: theme.spacing(0.75),
  transition: theme.transitions.create(['all'], {
    duration: theme.transitions.duration.standard,
    easing: theme.transitions.easing.easeInOut,
  }),
  '&:hover': {
    backgroundColor: 'rgba(19, 64, 255, 0.08)',
    color: '#1340FF',
    borderColor: 'rgba(19, 64, 255, 0.2)',
  },
  ...(isActive && {
    backgroundColor: 'rgba(19, 64, 255, 0.08)',
    borderColor: 'rgba(19, 64, 255, 0.3)',
  }),
  // Responsive adjustments
  [theme.breakpoints.down('md')]: {
    height: 32,
    fontSize: '0.8rem',
    marginBottom: theme.spacing(0.5),
  },
  [theme.breakpoints.down('sm')]: {
    height: 28,
    fontSize: '0.75rem',
    marginBottom: theme.spacing(0.5),
  },
}));

const StyledTabButton = styled(Button)(({ theme, isActive }) => ({
  width: '100%',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(1.25, 1.5),
  borderRadius: theme.spacing(1),
  fontSize: '0.8rem',
  fontWeight: 600,
  textAlign: 'left',
  border: '1px solid #E7E7E7',
  backgroundColor: 'transparent',
  color: isActive ? '#1340FF' : '#48484A',
  textTransform: 'none',
  minHeight: 40,
  marginBottom: theme.spacing(0.75),
  position: 'relative',
  transition: theme.transitions.create(['all'], {
    duration: theme.transitions.duration.standard,
    easing: theme.transitions.easing.easeInOut,
  }),
  '&:hover': {
    backgroundColor: 'rgba(19, 64, 255, 0.08)',
    color: '#1340FF',
    borderColor: 'rgba(19, 64, 255, 0.2)',
  },
  ...(isActive && {
    backgroundColor: 'rgba(19, 64, 255, 0.08)',
    borderColor: 'rgba(19, 64, 255, 0.3)',
  }),
  // Responsive adjustments
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(1, 1.25),
    fontSize: '0.75rem',
    minHeight: 36,
    marginBottom: theme.spacing(0.5),
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.875, 1),
    fontSize: '0.7rem',
    minHeight: 32,
    marginBottom: theme.spacing(0.5),
  },
}));

const StyledInlineCloseButton = styled(IconButton)(({ theme }) => ({
  width: 20,
  height: 20,
  minWidth: 20,
  color: '#8E8E93',
  backgroundColor: 'transparent',
  borderRadius: theme.spacing(0.5),
  padding: 0,
  marginLeft: theme.spacing(1),
  flexShrink: 0,
  transition: theme.transitions.create(['all'], {
    duration: theme.transitions.duration.standard,
    easing: theme.transitions.easing.easeInOut,
  }),
  '&:hover': {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    color: '#FF3B30',
    transform: 'scale(1.1)',
  },
  '& .MuiSvgIcon-root': {
    fontSize: '14px',
  },
  // Responsive adjustments
  [theme.breakpoints.down('md')]: {
    width: 18,
    height: 18,
    minWidth: 18,
    '& .MuiSvgIcon-root': {
      fontSize: '12px',
    },
  },
  [theme.breakpoints.down('sm')]: {
    width: 16,
    height: 16,
    minWidth: 16,
    '& .MuiSvgIcon-root': {
      fontSize: '10px',
    },
  },
}));

export default function CampaignTabsNavigation({ filter = 'active' }) {
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [filteredTabs, setFilteredTabs] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOnCampaignDetailPage, setIsOnCampaignDetailPage] = useState(false);
  
  const router = useRouter();
  const location = useLocation();
  const settings = useSettingsContext();
  
  // Direct dependency on settings.themeLayout to ensure re-renders
  const mainNavIsExpanded = settings.themeLayout === 'vertical';
  
  // Watch for main navigation state changes
  useEffect(() => {
    // If main nav is expanded (vertical layout), collapse campaign tabs
    if (mainNavIsExpanded) {
      setIsCollapsed(true);
    } else {
      // If main nav is collapsed (mini layout), expand campaign tabs to show names
      setIsCollapsed(false);
    }
  }, [mainNavIsExpanded, settings.themeLayout]);
  
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

  // Handle collapse - restore main navigation
  const handleCollapse = useCallback(() => {
    // Clear all campaign tabs
    window.campaignTabs = [];
    setTabs([]);
    
    try {
      localStorage.setItem('campaignTabs', JSON.stringify([]));
    } catch (error) {
      console.error('Error saving campaign tabs to localStorage:', error);
    }
    
    // Restore main navigation to expanded state
    settings.onUpdate('themeLayout', 'vertical');
    
    // Navigate back to campaigns list
    router.push(paths.dashboard.campaign.root);
  }, [settings, router]);

  // Handle campaign tabs navigation collapse toggle
  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed]);
  
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
    <StyledNavContainer isCollapsed={isCollapsed}>
      {/* Header */}
      <StyledHeaderContainer isCollapsed={isCollapsed}>
        {!isCollapsed && (
          <>
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
                '@media (max-width: 960px)': {
                  height: 26,
                  padding: '5px 8px',
                },
                '@media (max-width: 600px)': {
                  height: 24,
                  padding: '4px 6px',
                },
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
                  '@media (max-width: 960px)': {
                    fontSize: '0.7rem',
                  },
                  '@media (max-width: 600px)': {
                    fontSize: '0.65rem',
                  },
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
                  '@media (max-width: 960px)': {
                    height: '12px',
                  },
                  '@media (max-width: 600px)': {
                    height: '10px',
                  },
                }}
              />
              
              <Box
                sx={{
                  backgroundColor: '#E0E0E0',
                  borderRadius: 0.75,
                  padding: '2px 6px',
                  minWidth: 'auto',
                  '@media (max-width: 960px)': {
                    padding: '1px 4px',
                  },
                  '@media (max-width: 600px)': {
                    padding: '1px 3px',
                  },
                }}
              >
                <Typography
                  sx={{
                    color: '#666666',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    lineHeight: 1,
                    letterSpacing: '0.01em',
                    '@media (max-width: 960px)': {
                      fontSize: '0.6rem',
                    },
                    '@media (max-width: 600px)': {
                      fontSize: '0.55rem',
                    },
                  }}
                >
                  {filteredTabs.length}
                </Typography>
              </Box>
            </Box>

            {/* Action Buttons Container */}
            <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
              {/* Collapse Button */}
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
                <StyledActionButton onClick={handleCollapse} size="small" className="close-all-button">
                  <Iconify icon="solar:close-circle-bold" width={14} sx={{ color: '#666666' }} />
                </StyledActionButton>
              </Tooltip>

              {/* Toggle Collapse Button */}
              <Tooltip 
                title="Minimize" 
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
                <StyledActionButton onClick={handleToggleCollapse}>
                  <Iconify icon="solar:minimize-bold" width={14} sx={{ color: '#666666' }} />
                </StyledActionButton>
              </Tooltip>
            </Stack>
          </>
        )}

        {isCollapsed && (
          /* Toggle Expand Button for collapsed state */
          <Tooltip 
            title="Expand" 
            arrow 
            placement="right"
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
            <StyledActionButton onClick={handleToggleCollapse}>
              <Iconify icon="solar:maximize-bold" width={14} sx={{ color: '#666666' }} />
            </StyledActionButton>
          </Tooltip>
        )}
      </StyledHeaderContainer>

      {/* Navigation Content */}
      <StyledNavContent isCollapsed={isCollapsed}>
        {!isCollapsed && (
          <>
            {/* Breadcrumb */}
            {isOnCampaignDetailPage && (
              <Box sx={{ mb: 2, px: 0.5 }}>
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
                    '@media (max-width: 960px)': {
                      fontSize: '0.75rem',
                    },
                    '@media (max-width: 600px)': {
                      fontSize: '0.7rem',
                    },
                    '&:hover': {
                      textDecoration: 'underline',
                      color: '#0F2DB8',
                    }
                  }}
                >
                  <Iconify 
                    icon="solar:arrow-left-linear" 
                    width={12} 
                    sx={{ 
                      mr: 0.5,
                      '@media (max-width: 960px)': {
                        width: 11,
                      },
                      '@media (max-width: 600px)': {
                        width: 10,
                      },
                    }} 
                  />
                  Back to {getCampaignTypeText()}
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* Campaign Tabs */}
        <Stack spacing={0}>
          {filteredTabs.map((tab, index) => {
            const isActive = activeTabId === tab.id;
            const tabNumber = index + 1;
            
            if (isCollapsed) {
              // Collapsed view - show campaign image or initials with better design
              const getInitials = (name) => {
                if (!name) return tabNumber.toString();
                return name
                  .split(' ')
                  .map(word => word.charAt(0))
                  .join('')
                  .substring(0, 2)
                  .toUpperCase();
              };

              const hasImage = tab.image && tab.image.trim() !== '';

              return (
                <Box
                  key={tab.id}
                  sx={{
                    position: 'relative',
                    mb: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5,
                    padding: '10px',
                    margin: '0 -10px 1px -10px',
                    '&:hover .close-button': {
                      opacity: 1,
                      transform: 'scale(1)',
                    },
                    '&:hover': {
                      '& .campaign-card': {
                        borderColor: '#1340FF',
                        backgroundColor: 'rgba(19, 64, 255, 0.08)',
                        transform: 'scale(1.02)',
                      },
                    },
                  }}
                >
                  <Tooltip 
                    title={tab.name} 
                    arrow 
                    placement="right"
                    slotProps={{
                      tooltip: {
                        sx: {
                          bgcolor: 'rgba(0, 0, 0, 0.9)',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 500,
                          maxWidth: 200,
                        },
                      },
                      arrow: {
                        sx: {
                          color: 'rgba(0, 0, 0, 0.9)',
                        },
                      },
                    }}
                  >
                    <Box
                      onClick={() => handleTabClick(tab.id)}
                      className="campaign-card"
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 1.5,
                        border: '2px solid',
                        borderColor: isActive ? '#1340FF' : '#E7E7E7',
                        backgroundColor: (() => {
                          if (hasImage) return 'transparent';
                          return isActive ? 'rgba(19, 64, 255, 0.08)' : '#FFFFFF';
                        })(),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                        '@media (max-width: 960px)': {
                          width: 40,
                          height: 40,
                        },
                        '@media (max-width: 600px)': {
                          width: 36,
                          height: 36,
                        },
                      }}
                    >
                      {hasImage ? (
                        <Box
                          component="img"
                          src={tab.image}
                          alt={tab.name}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: 'calc(1.5 * 8px - 2px)',
                          }}
                        />
                      ) : (
                        <Typography
                          sx={{
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            color: isActive ? '#1340FF' : '#666666',
                            lineHeight: 1,
                            letterSpacing: '0.5px',
                            '@media (max-width: 960px)': {
                              fontSize: '0.7rem',
                            },
                            '@media (max-width: 600px)': {
                              fontSize: '0.65rem',
                            },
                          }}
                        >
                          {getInitials(tab.name)}
                        </Typography>
                      )}
                      
                      {/* Close button overlay - positioned outside the card */}
                      <IconButton
                        onClick={(e) => handleCloseTab(e, tab.id)}
                        size="small"
                        className="close-button"
                        sx={{
                          position: 'absolute',
                          top: -10,
                          right: -10,
                          width: 20,
                          height: 20,
                          minWidth: 20,
                          backgroundColor: '#FF3B30',
                          color: 'white',
                          borderRadius: '50%',
                          border: '2px solid white',
                          opacity: 0,
                          transform: 'scale(0.8)',
                          transition: 'all 0.2s ease',
                          zIndex: 10,
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                          '&:hover': {
                            backgroundColor: '#D70015',
                            transform: 'scale(1.1)',
                            boxShadow: '0 3px 6px rgba(0, 0, 0, 0.3)',
                          },
                          '& .MuiSvgIcon-root': {
                            fontSize: '12px',
                          },
                          '@media (max-width: 960px)': {
                            width: 18,
                            height: 18,
                            minWidth: 18,
                            top: -9,
                            right: -9,
                            '& .MuiSvgIcon-root': {
                              fontSize: '11px',
                            },
                          },
                          '@media (max-width: 600px)': {
                            width: 16,
                            height: 16,
                            minWidth: 16,
                            top: -8,
                            right: -8,
                            '& .MuiSvgIcon-root': {
                              fontSize: '10px',
                            },
                          },
                        }}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  </Tooltip>
                </Box>
              );
            }

            // Expanded view - show campaign names
            return (
              <StyledTabButton
                key={tab.id}
                variant="text"
                isActive={isActive}
                onClick={() => handleTabClick(tab.id)}
              >
                <Box sx={{ flex: 1, minWidth: 0, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 1 }}>
                  {/* Small campaign image */}
                  {tab.image && tab.image.trim() !== '' ? (
                    <Box
                      component="img"
                      src={tab.image}
                      alt={tab.name}
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: 0.5,
                        objectFit: 'cover',
                        flexShrink: 0,
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        '@media (max-width: 960px)': {
                          width: 18,
                          height: 18,
                        },
                        '@media (max-width: 600px)': {
                          width: 16,
                          height: 16,
                        },
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: 0.5,
                        backgroundColor: isActive ? '#1340FF' : '#E0E0E0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        '@media (max-width: 960px)': {
                          width: 18,
                          height: 18,
                        },
                        '@media (max-width: 600px)': {
                          width: 16,
                          height: 16,
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '8px',
                          fontWeight: 700,
                          color: isActive ? 'white' : '#666666',
                          lineHeight: 1,
                          '@media (max-width: 960px)': {
                            fontSize: '7px',
                          },
                          '@media (max-width: 600px)': {
                            fontSize: '6px',
                          },
                        }}
                      >
                        {tab.name?.charAt(0)?.toUpperCase() || tabNumber}
                      </Typography>
                    </Box>
                  )}
                  
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      lineHeight: 1.4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'inherit',
                      flex: 1,
                      letterSpacing: '-0.01em',
                      '@media (max-width: 960px)': {
                        fontSize: '0.75rem',
                      },
                      '@media (max-width: 600px)': {
                        fontSize: '0.7rem',
                      },
                    }}
                  >
                    {tab.name}
                  </Typography>
                </Box>
                
                <StyledInlineCloseButton
                  onClick={(e) => handleCloseTab(e, tab.id)}
                >
                  <CloseIcon />
                </StyledInlineCloseButton>
              </StyledTabButton>
            );
          })}
        </Stack>
      </StyledNavContent>
    </StyledNavContainer>
  );
}

CampaignTabsNavigation.propTypes = {
  filter: PropTypes.string,
}; 