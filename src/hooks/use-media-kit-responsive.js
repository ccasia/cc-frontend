import { useTheme, useMediaQuery } from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';

/**
 * Custom hook for media kit responsive behavior
 * Consolidates the responsive logic used across Instagram and TikTok components
 */
export const useMediaKitResponsive = (forceDesktop = false) => {
  const theme = useTheme();
  const smDown = useResponsive('down', 'sm');
  const mdDown = useResponsive('down', 'md');
  const lgUp = useResponsive('up', 'lg');
  
  // Individual breakpoint checks
  const isMobileBreakpoint = useMediaQuery(theme.breakpoints.down('sm'));
  const isTabletBreakpoint = !smDown && mdDown; // iPad size
  
  // Use carousel for mobile and tablet, desktop layout only for large screens
  const isMobile = forceDesktop ? false : !lgUp;
  const isTablet = isTabletBreakpoint;
  const isDesktop = !isMobile;
  
  return {
    // Main responsive states
    isMobile,
    isTablet, 
    isDesktop,
    
    // Individual breakpoint states
    isMobileBreakpoint,
    isTabletBreakpoint,
    smDown,
    mdDown,
    lgUp,
    
    // Theme for additional usage
    theme,
  };
};