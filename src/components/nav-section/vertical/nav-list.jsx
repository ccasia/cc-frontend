import PropTypes from 'prop-types';
import { useRef, useState, useEffect, useCallback } from 'react';

import Collapse from '@mui/material/Collapse';
import { Box, Fade, Stack, Paper, Tooltip, ClickAwayListener } from '@mui/material';

import { usePathname } from 'src/routes/hooks';
import { useActiveLink } from 'src/routes/hooks/use-active-link';

import NavItem from './nav-item';

// ----------------------------------------------------------------------

// Helper function to generate unique keys from navigation items
const getNavItemKey = (item, index) => {
  if (item.path) {
    return item.path;
  }
  
  // If title is a React element, try to extract text content
  if (typeof item.title === 'object' && item.title?.props?.children) {
    return `nav-${item.title.props.children.replace(/\s+/g, '-').toLowerCase()}-${index}`;
  }
  
  // If title is a string
  if (typeof item.title === 'string') {
    return `nav-${item.title.replace(/\s+/g, '-').toLowerCase()}-${index}`;
  }
  
  // Fallback to index
  return `nav-item-${index}`;
};

export default function NavList({ data, depth, collapsed, slotProps }) {
  const pathname = usePathname();

  const active = useActiveLink(data.path, !!data.children);

  const [openMenu, setOpenMenu] = useState(active);
  const [showSlidePanel, setShowSlidePanel] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ left: 0, top: 0 });
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (!active) {
      handleCloseMenu();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleToggleMenu = useCallback((event) => {
    if (data.children) {
      if (collapsed) {
        // Force close tooltip immediately
        setTooltipOpen(false);
        
        const rect = event.currentTarget.getBoundingClientRect();
        const panelHeight = data.children.length * 40 + 40;
        const viewportHeight = window.innerHeight;
        
        let {top} = rect;
        if (rect.top + panelHeight > viewportHeight) {
          top = Math.max(10, viewportHeight - panelHeight - 10);
        }
        
        setPanelPosition({
          left: rect.right + 8,
          top,
        });
        setShowSlidePanel(true);
      } else {
        setOpenMenu((prev) => !prev);
      }
    }
  }, [data.children, collapsed]);

  const handleCloseMenu = useCallback(() => {
    setOpenMenu(false);
  }, []);

  const handleCloseSlidePanel = useCallback(() => {
    setShowSlidePanel(false);
  }, []);

  const handleTooltipOpen = useCallback(() => {
    if (!showSlidePanel) {
      setTooltipOpen(true);
    }
  }, [showSlidePanel]);

  const handleTooltipClose = useCallback(() => {
    setTooltipOpen(false);
  }, []);

  const renderNavItem = (
    <NavItem
      open={openMenu}
      onClick={handleToggleMenu}
      //
      title={data.title}
      path={data.path}
      icon={data.icon}
      info={data.info}
      roles={data.roles}
      caption={data.caption}
      msgcounter={data.msgcounter}
      disabled={data.disabled}
      //
      depth={depth}
      collapsed={collapsed}
      hasChild={!!data.children}
      externalLink={data.path?.includes('http')}
      currentRole={slotProps?.currentRole}
      //
      active={active}
      className={active ? 'active' : ''}
      sx={{
        mb: 0,
        ...(depth === 1 ? slotProps?.rootItem : slotProps?.subItem),
      }}
    />
  );

  if (collapsed && depth === 1) {
    return (
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-start', pl: 0.5, position: 'relative' }}>
        {data.children ? (
          <>
            <Tooltip 
              title={data.title} 
              placement="right" 
              arrow
              open={collapsed ? tooltipOpen : false}
              onOpen={handleTooltipOpen}
              onClose={handleTooltipClose}
              ref={tooltipRef}
            >
              <Box 
                sx={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}
                onMouseEnter={handleTooltipOpen}
                onMouseLeave={handleTooltipClose}
              >
                {renderNavItem}
              </Box>
            </Tooltip>
            
            {/* Ultra-simple panel positioned from button */}
            {showSlidePanel && (
              <ClickAwayListener onClickAway={handleCloseSlidePanel}>
                <Fade in={showSlidePanel} timeout={150}>
                  <Paper
                    elevation={0}
                    sx={{
                      position: 'fixed',
                      left: panelPosition.left,
                      top: panelPosition.top,
                      width: 180,
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E8E8E8',
                      borderRadius: '8px',
                      boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
                      zIndex: 1300,
                      overflow: 'hidden',
                      py: 0.5,
                    }}
                  >
                    {/* Simple navigation items */}
                    <Stack spacing={0}>
                      {data.children.map((child, index) => (
                        <Box
                          key={getNavItemKey(child, index)}
                          onClick={handleCloseSlidePanel}
                          sx={{
                            position: 'relative',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: '4px',
                              left: '4px',
                              right: '4px',
                              bottom: '4px',
                              borderRadius: '4px',
                              backgroundColor: 'transparent',
                              transition: 'background-color 0.2s ease',
                              zIndex: -1,
                            },
                            '&:hover::before': {
                              backgroundColor: '#F5F5F5',
                            },
                            '& .MuiListItemButton-root': {
                              borderRadius: 0,
                              minHeight: 40,
                              px: 2,
                              py: 1,
                              fontSize: '14px',
                              fontWeight: 500,
                              backgroundColor: 'transparent !important',
                              transition: 'none',
                              '&:hover': {
                                backgroundColor: 'transparent !important',
                              },
                              '& .label': {
                                fontSize: '14px',
                                fontWeight: 500,
                                color: '#333333',
                              },
                            },
                          }}
                        >
                          <NavList 
                            data={child} 
                            depth={depth + 1} 
                            collapsed={false}
                            slotProps={slotProps} 
                          />
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                </Fade>
              </ClickAwayListener>
            )}
          </>
        ) : (
          <Tooltip 
            title={data.title} 
            placement="right" 
            arrow
            disableHoverListener={!collapsed}
          >
            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              {renderNavItem}
            </Box>
          </Tooltip>
        )}
      </Box>
    );
  }

  return (
    <Box>
      {renderNavItem}
      {!!data.children && !collapsed && (
        <Collapse in={openMenu} unmountOnExit>
          <Stack spacing={0.25} sx={{ mt: 0.25, ml: 2 }}>
            {data.children.map((child, index) => (
              <NavList 
                key={getNavItemKey(child, index)}
                data={child} 
                depth={depth + 1} 
                collapsed={collapsed}
                slotProps={slotProps} 
              />
            ))}
          </Stack>
        </Collapse>
      )}
    </Box>
  );
}

NavList.propTypes = {
  data: PropTypes.object,
  depth: PropTypes.number,
  collapsed: PropTypes.bool,
  slotProps: PropTypes.object,
};

// ----------------------------------------------------------------------

function NavSubList({ data, depth, collapsed, slotProps }) {
  return (
    <>
      {data.map((list, index) => (
        <NavList 
          key={getNavItemKey(list, index)} 
          data={list} 
          depth={depth + 1} 
          collapsed={collapsed}
          slotProps={slotProps} 
        />
      ))}
    </>
  );
}

NavSubList.propTypes = {
  data: PropTypes.array,
  depth: PropTypes.number,
  collapsed: PropTypes.bool,
  slotProps: PropTypes.object,
};
