import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import { styled } from '@mui/material/styles';
import { Tooltip, Typography, IconButton } from '@mui/material';

import { usePathname } from 'src/routes/hooks';

import { useResponsive } from 'src/hooks/use-responsive';

import { useAuthContext } from 'src/auth/hooks';

import Image from 'src/components/image';
import Scrollbar from 'src/components/scrollbar';
import { useSettingsContext } from 'src/components/settings';
import { NavSectionVertical } from 'src/components/nav-section';

import { NAV } from '../config-layout';
import { useNavData } from './config-navigation';
// ----------------------------------------------------------------------

const StyledNavContainer = styled(Box)(({ theme, collapsed }) => ({
  width: collapsed ? NAV.W_MINI : NAV.W_VERTICAL,
  height: '97vh',
  margin: theme.spacing(1.5),
  marginRight: theme.spacing(1),
  borderRadius: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[1],
  overflow: 'hidden',
  position: 'fixed',
  zIndex: theme.zIndex.drawer,
  cursor: 'default',
  transition: theme.transitions.create(['width', 'box-shadow', 'border-color'], {
    duration: theme.transitions.duration.standard,
    easing: theme.transitions.easing.easeInOut,
  }),
}));

const StyledHeaderContainer = styled(Box)(({ theme, collapsed }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  minHeight: collapsed ? 64 : 80,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  flexDirection: 'row',
  justifyContent: 'flex-start',
  position: 'relative',
  transition: theme.transitions.create(['padding', 'min-height'], {
    duration: theme.transitions.duration.standard,
    easing: theme.transitions.easing.easeInOut,
  }),
}));

const StyledLogoContainer = styled(Box)(({ theme, collapsed }) => ({
  position: 'relative',
  width: 40,
  height: 40,
  borderRadius: theme.spacing(1),
  flexShrink: 0,
  transition: theme.transitions.create(['width', 'height'], {
    duration: theme.transitions.duration.standard,
    easing: theme.transitions.easing.easeInOut,
  }),
}));

const StyledTextContainer = styled(Box)(({ theme, collapsed }) => ({
  flex: 1,
  minWidth: 0,
  opacity: collapsed ? 0 : 1,
  transform: collapsed ? 'translateX(-20px)' : 'translateX(0)',
  transition: theme.transitions.create(['opacity', 'transform'], {
    duration: theme.transitions.duration.standard,
    easing: theme.transitions.easing.easeInOut,
  }),
  overflow: 'hidden',
  pointerEvents: collapsed ? 'none' : 'auto',
}));

const StyledCollapseButton = styled(IconButton)(({ theme, collapsed }) => ({
  width: 32,
  height: 32,
  borderRadius: theme.spacing(0.75),
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  flexShrink: 0,
  opacity: collapsed ? 0 : 1,
  visibility: collapsed ? 'hidden' : 'visible',
  position: collapsed ? 'absolute' : 'static',
  top: collapsed ? '50%' : 'auto',
  right: collapsed ? theme.spacing(1) : 'auto',
  transform: collapsed ? 'translateY(-50%)' : 'none',
  transition: theme.transitions.create(
    ['transform', 'background-color', 'position', 'top', 'right', 'opacity', 'visibility'],
    {
      duration: theme.transitions.duration.standard,
      easing: theme.transitions.easing.easeInOut,
    }
  ),
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    transform: collapsed ? 'translateY(-50%) scale(1.05)' : 'scale(1.05)',
  },
  '& img': {
    width: 16,
    height: 16,
    transition: theme.transitions.create(['transform'], {
      duration: theme.transitions.duration.standard,
      easing: theme.transitions.easing.easeInOut,
    }),
  },
}));

const StyledNavContent = styled(Box)(({ theme, collapsed }) => ({
  padding: theme.spacing(1.5, 1),
  height: collapsed ? 'calc(100% - 64px - 52px)' : 'calc(100% - 80px)',
  overflow: 'hidden auto',
  transition: theme.transitions.create(['padding', 'height'], {
    duration: theme.transitions.duration.standard,
    easing: theme.transitions.easing.easeInOut,
  }),
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': {
    width: 4,
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.divider,
    borderRadius: 2,
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: theme.palette.text.disabled,
  },
}));

const StyledExpandButton = styled(IconButton)(({ theme }) => ({
  width: 32,
  height: 32,
  borderRadius: theme.spacing(0.75),
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  margin: '0 auto',
  display: 'flex',
  transition: theme.transitions.create(['background-color', 'transform'], {
    duration: theme.transitions.duration.standard,
    easing: theme.transitions.easing.easeInOut,
  }),
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    transform: 'scale(1.05)',
  },
  '& svg': {
    width: 16,
    height: 16,
    color: theme.palette.text.secondary,
  },
}));

export default function NavVertical({ openNav, onCloseNav }) {
  const { user } = useAuthContext();
  const settings = useSettingsContext();
  const pathname = usePathname();
  const lgUp = useResponsive('up', 'lg');
  const navData = useNavData();

  const [isCollapsed, setIsCollapsed] = useState(settings.themeLayout === 'mini');

  useEffect(() => {
    setIsCollapsed(settings.themeLayout === 'mini');
  }, [settings.themeLayout]);

  useEffect(() => {
    if (openNav && !lgUp) {
      onCloseNav();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleToggleCollapse = () => {
    if (!lgUp) {
      // On mobile, close the drawer instead of collapsing
      onCloseNav();
    } else {
      // On desktop, toggle between vertical and mini layouts
      const newLayout = settings.themeLayout === 'vertical' ? 'mini' : 'vertical';
      settings.onUpdate('themeLayout', newLayout);
    }
  };

  const renderContent = (
    <Scrollbar
      sx={{
        height: 1,
        '& .simplebar-content': {
          height: 1,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <StyledHeaderContainer collapsed={isCollapsed}>
        <StyledLogoContainer collapsed={isCollapsed}>
          <Image
            src="/assets/icons/navbar/ic_navlogo.svg"
            alt="Cult Creative Logo"
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 'inherit',
            }}
          />
        </StyledLogoContainer>

        <StyledTextContainer collapsed={isCollapsed}>
          {!isCollapsed && (
            <>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  fontSize: '14px',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                CULT CREATIVE
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontSize: '12px',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {`${user?.role.slice(0, 1).toUpperCase()}${user?.role.slice(1)}`}
              </Typography>
            </>
          )}
        </StyledTextContainer>

        {!isCollapsed && (
          <Tooltip title={!lgUp ? 'Close' : 'Collapse'} placement="left" arrow>
            <StyledCollapseButton
              collapsed={isCollapsed}
              onClick={handleToggleCollapse}
              size="small"
            >
              {!lgUp ? (
                // Close icon for mobile
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              ) : (
                // Collapse/Expand icon for desktop
                <img
                  src={
                    isCollapsed
                      ? '/assets/icons/navbar/ic_nav_expand.svg'
                      : '/assets/icons/navbar/ic_nav_collapse.svg'
                  }
                  alt={isCollapsed ? 'Expand' : 'Collapse'}
                />
              )}
            </StyledCollapseButton>
          </Tooltip>
        )}
      </StyledHeaderContainer>

      {/* Expand button for collapsed state - positioned below header */}
      {isCollapsed && (
        <Box sx={{ px: 1.5, pt: 1.5, pb: -2 }}>
          <Tooltip title="Expand" placement="right" arrow>
            <StyledExpandButton onClick={handleToggleCollapse} aria-label="Expand navigation">
              <img src="/assets/icons/navbar/ic_nav_expand.svg" alt="Expand" />
            </StyledExpandButton>
          </Tooltip>
        </Box>
      )}

      <StyledNavContent collapsed={isCollapsed}>
        <NavSectionVertical
          data={navData}
          collapsed={isCollapsed}
          slotProps={{
            currentRole: user?.role,
          }}
        />
      </StyledNavContent>

      <Box sx={{ flexGrow: 1 }} />
    </Scrollbar>
  );

  return (
    <Box
      sx={{
        flexShrink: { lg: 0 },
        width: {
          lg: isCollapsed ? NAV.W_MINI + 24 : NAV.W_VERTICAL + 24,
        },
        transition: (theme) =>
          theme.transitions.create(['width'], {
            duration: theme.transitions.duration.standard,
            easing: theme.transitions.easing.easeInOut,
          }),
      }}
    >
      {lgUp ? (
        <StyledNavContainer collapsed={isCollapsed}>{renderContent}</StyledNavContainer>
      ) : (
        <Drawer
          open={openNav}
          onClose={onCloseNav}
          PaperProps={{
            sx: {
              width: NAV.W_VERTICAL,
              borderRadius: 2,
              margin: 1.5,
              height: 'calc(100vh - 24px)',
            },
          }}
        >
          {renderContent}
        </Drawer>
      )}
    </Box>
  );
}

NavVertical.propTypes = {
  openNav: PropTypes.bool,
  onCloseNav: PropTypes.func,
};
