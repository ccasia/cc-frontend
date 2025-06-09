// import PropTypes from 'prop-types';
// import { useState, useEffect } from 'react';

// import Box from '@mui/material/Box';
// import Drawer from '@mui/material/Drawer';
// import { styled } from '@mui/material/styles';
// import { Tooltip, Typography, IconButton } from '@mui/material';

// import { usePathname } from 'src/routes/hooks';

// import { useResponsive } from 'src/hooks/use-responsive';

// import { useAuthContext } from 'src/auth/hooks';

// import Image from 'src/components/image';
// import Scrollbar from 'src/components/scrollbar';
// import { useSettingsContext } from 'src/components/settings';
// import { NavSectionVertical } from 'src/components/nav-section';

// import { NAV } from '../config-layout';
// import { useNavData } from './config-navigation';
// // ----------------------------------------------------------------------

// const StyledNavContainer = styled(Box)(({ theme, collapsed }) => ({
//   width: collapsed ? NAV.W_MINI : NAV.W_VERTICAL,
//   height: '97vh',
//   margin: theme.spacing(1.5),
//   marginRight: theme.spacing(1),
//   borderRadius: theme.spacing(2),
//   backgroundColor: theme.palette.background.paper,
//   border: `1px solid ${theme.palette.divider}`,
//   boxShadow: theme.shadows[1],
//   overflow: 'hidden',
//   position: 'fixed',
//   zIndex: theme.zIndex.drawer,
//   cursor: 'default',
//   transition: theme.transitions.create(['width', 'box-shadow', 'border-color'], {
//     duration: theme.transitions.duration.standard,
//     easing: theme.transitions.easing.easeInOut,
//   }),
// }));

// const StyledHeaderContainer = styled(Box)(({ theme, collapsed }) => ({
//   padding: theme.spacing(2),
//   borderBottom: `1px solid ${theme.palette.divider}`,
//   minHeight: collapsed ? 64 : 80,
//   display: 'flex',
//   alignItems: 'center',
//   gap: theme.spacing(1.5),
//   flexDirection: 'row',
//   justifyContent: 'flex-start',
//   position: 'relative',
//   transition: theme.transitions.create(['padding', 'min-height'], {
//     duration: theme.transitions.duration.standard,
//     easing: theme.transitions.easing.easeInOut,
//   }),
// }));

// const StyledLogoContainer = styled(Box)(({ theme, collapsed }) => ({
//   position: 'relative',
//   width: 40,
//   height: 40,
//   borderRadius: theme.spacing(1),
//   flexShrink: 0,
//   transition: theme.transitions.create(['width', 'height'], {
//     duration: theme.transitions.duration.standard,
//     easing: theme.transitions.easing.easeInOut,
//   }),
// }));

// const StyledTextContainer = styled(Box)(({ theme, collapsed }) => ({
//   flex: 1,
//   minWidth: 0,
//   opacity: collapsed ? 0 : 1,
//   transform: collapsed ? 'translateX(-20px)' : 'translateX(0)',
//   transition: theme.transitions.create(['opacity', 'transform'], {
//     duration: theme.transitions.duration.standard,
//     easing: theme.transitions.easing.easeInOut,
//   }),
//   overflow: 'hidden',
//   pointerEvents: collapsed ? 'none' : 'auto',
// }));

// const StyledCollapseButton = styled(IconButton)(({ theme, collapsed }) => ({
//   width: 32,
//   height: 32,
//   borderRadius: theme.spacing(0.75),
//   border: `1px solid ${theme.palette.divider}`,
//   backgroundColor: theme.palette.background.paper,
//   flexShrink: 0,
//   opacity: collapsed ? 0 : 1,
//   visibility: collapsed ? 'hidden' : 'visible',
//   position: collapsed ? 'absolute' : 'static',
//   top: collapsed ? '50%' : 'auto',
//   right: collapsed ? theme.spacing(1) : 'auto',
//   transform: collapsed ? 'translateY(-50%)' : 'none',
//   transition: theme.transitions.create(
//     ['transform', 'background-color', 'position', 'top', 'right', 'opacity', 'visibility'],
//     {
//       duration: theme.transitions.duration.standard,
//       easing: theme.transitions.easing.easeInOut,
//     }
//   ),
//   '&:hover': {
//     backgroundColor: theme.palette.action.hover,
//     transform: collapsed ? 'translateY(-50%) scale(1.05)' : 'scale(1.05)',
//   },
//   '& img': {
//     width: 16,
//     height: 16,
//     transition: theme.transitions.create(['transform'], {
//       duration: theme.transitions.duration.standard,
//       easing: theme.transitions.easing.easeInOut,
//     }),
//   },
// }));

// const StyledNavContent = styled(Box)(({ theme, collapsed }) => ({
//   padding: theme.spacing(1.5, 1),
//   height: collapsed ? 'calc(100% - 64px - 52px)' : 'calc(100% - 80px)',
//   overflow: 'hidden auto',
//   transition: theme.transitions.create(['padding', 'height'], {
//     duration: theme.transitions.duration.standard,
//     easing: theme.transitions.easing.easeInOut,
//   }),
//   scrollbarWidth: 'none',
//   '&::-webkit-scrollbar': {
//     width: 4,
//   },
//   '&::-webkit-scrollbar-track': {
//     background: 'transparent',
//   },
//   '&::-webkit-scrollbar-thumb': {
//     background: theme.palette.divider,
//     borderRadius: 2,
//   },
//   '&::-webkit-scrollbar-thumb:hover': {
//     background: theme.palette.text.disabled,
//   },
// }));

// const StyledExpandButton = styled(IconButton)(({ theme }) => ({
//   width: 32,
//   height: 32,
//   borderRadius: theme.spacing(0.75),
//   border: `1px solid ${theme.palette.divider}`,
//   backgroundColor: theme.palette.background.paper,
//   margin: '0 auto',
//   display: 'flex',
//   transition: theme.transitions.create(['background-color', 'transform'], {
//     duration: theme.transitions.duration.standard,
//     easing: theme.transitions.easing.easeInOut,
//   }),
//   '&:hover': {
//     backgroundColor: theme.palette.action.hover,
//     transform: 'scale(1.05)',
//   },
//   '& svg': {
//     width: 16,
//     height: 16,
//     color: theme.palette.text.secondary,
//   },
// }));

// export default function NavVertical({ openNav, onCloseNav }) {
//   const { user } = useAuthContext();
//   const settings = useSettingsContext();
//   const pathname = usePathname();
//   const lgUp = useResponsive('up', 'lg');
//   const navData = useNavData();

//   const [isCollapsed, setIsCollapsed] = useState(settings.themeLayout === 'mini');

//   useEffect(() => {
//     setIsCollapsed(settings.themeLayout === 'mini');
//   }, [settings.themeLayout]);

//   useEffect(() => {
//     if (openNav && !lgUp) {
//       onCloseNav();
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [pathname]);

//   const handleToggleCollapse = () => {
//     if (!lgUp) {
//       // On mobile, close the drawer instead of collapsing
//       onCloseNav();
//     } else {
//       // On desktop, toggle between vertical and mini layouts
//       const newLayout = settings.themeLayout === 'vertical' ? 'mini' : 'vertical';
//       settings.onUpdate('themeLayout', newLayout);
//     }
//   };

//   const renderContent = (
//     <Scrollbar
//       sx={{
//         height: 1,
//         '& .simplebar-content': {
//           height: 1,
//           display: 'flex',
//           flexDirection: 'column',
//         },
//       }}
//     >
//       <StyledHeaderContainer collapsed={isCollapsed}>
//         <StyledLogoContainer collapsed={isCollapsed}>
//           <Image
//             src="/assets/icons/navbar/ic_navlogo.svg"
//             alt="Cult Creative Logo"
//             style={{
//               width: '100%',
//               height: '100%',
//               borderRadius: 'inherit',
//             }}
//           />
//         </StyledLogoContainer>

//         <StyledTextContainer collapsed={isCollapsed}>
//           {!isCollapsed && (
//             <>
//               <Typography
//                 variant="subtitle2"
//                 sx={{
//                   fontWeight: 700,
//                   fontSize: '14px',
//                   lineHeight: 1.2,
//                   whiteSpace: 'nowrap',
//                   overflow: 'hidden',
//                   textOverflow: 'ellipsis',
//                 }}
//               >
//                 CULT CREATIVE
//               </Typography>
//               <Typography
//                 variant="caption"
//                 sx={{
//                   color: 'text.secondary',
//                   fontSize: '12px',
//                   fontWeight: 500,
//                   whiteSpace: 'nowrap',
//                   overflow: 'hidden',
//                   textOverflow: 'ellipsis',
//                 }}
//               >
//                 {`${user?.role.slice(0, 1).toUpperCase()}${user?.role.slice(1)}`}
//               </Typography>
//             </>
//           )}
//         </StyledTextContainer>

//         {!isCollapsed && (
//           <Tooltip title={!lgUp ? 'Close' : 'Collapse'} placement="left" arrow>
//             <StyledCollapseButton
//               collapsed={isCollapsed}
//               onClick={handleToggleCollapse}
//               size="small"
//             >
//               {!lgUp ? (
//                 // Close icon for mobile
//                 <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
//                   <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
//                 </svg>
//               ) : (
//                 // Collapse/Expand icon for desktop
//                 <img
//                   src={
//                     isCollapsed
//                       ? '/assets/icons/navbar/ic_nav_expand.svg'
//                       : '/assets/icons/navbar/ic_nav_collapse.svg'
//                   }
//                   alt={isCollapsed ? 'Expand' : 'Collapse'}
//                 />
//               )}
//             </StyledCollapseButton>
//           </Tooltip>
//         )}
//       </StyledHeaderContainer>

//       {/* Expand button for collapsed state - positioned below header */}
//       {isCollapsed && (
//         <Box sx={{ px: 1.5, pt: 1.5, pb: -2 }}>
//           <Tooltip title="Expand" placement="right" arrow>
//             <StyledExpandButton onClick={handleToggleCollapse} aria-label="Expand navigation">
//               <img src="/assets/icons/navbar/ic_nav_expand.svg" alt="Expand" />
//             </StyledExpandButton>
//           </Tooltip>
//         </Box>
//       )}

//       <StyledNavContent collapsed={isCollapsed}>
//         <NavSectionVertical
//           data={navData}
//           collapsed={isCollapsed}
//           slotProps={{
//             currentRole: user?.role,
//           }}
//         />
//       </StyledNavContent>

//       <Box sx={{ flexGrow: 1 }} />
//     </Scrollbar>
//   );

//   return (
//     <Box
//       sx={{
//         flexShrink: { lg: 0 },
//         width: {
//           lg: isCollapsed ? NAV.W_MINI + 24 : NAV.W_VERTICAL + 24,
//         },
//         transition: (theme) =>
//           theme.transitions.create(['width'], {
//             duration: theme.transitions.duration.standard,
//             easing: theme.transitions.easing.easeInOut,
//           }),
//       }}
//     >
//       {lgUp ? (
//         <StyledNavContainer collapsed={isCollapsed}>{renderContent}</StyledNavContainer>
//       ) : (
//         <Drawer
//           open={openNav}
//           onClose={onCloseNav}
//           PaperProps={{
//             sx: {
//               width: NAV.W_VERTICAL,
//               borderRadius: 2,
//               margin: 1.5,
//               height: 'calc(100vh - 24px)',
//             },
//           }}
//         >
//           {renderContent}
//         </Drawer>
//       )}
//     </Box>
//   );
// }

// NavVertical.propTypes = {
//   openNav: PropTypes.bool,
//   onCloseNav: PropTypes.func,
// };

import { useEffect } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import { Typography, IconButton } from '@mui/material';

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

export default function NavVertical({ openNav, onCloseNav }) {
  const { user } = useAuthContext();

  const settings = useSettingsContext();

  const pathname = usePathname();

  const lgUp = useResponsive('up', 'lg');

  const navData = useNavData();

  // const { data } = useGetTokenExpiry();

  // const date = new Date(data?.lastRefreshToken || new Date());

  // const formatter = new Intl.DateTimeFormat('en-US', {
  //   day: '2-digit',
  //   month: '2-digit',
  //   year: 'numeric',
  // });
  // const formattedDate = formatter.format(date);

  // const handleActivateXero = async () => {
  //   try {
  //     const response = await axios.get(endpoints.invoice.xero, { withCredentials: true });
  //     window.location.href = response.data.url;
  //   } catch (error) {
  //     console.error('Error connecting to Xero:', error);
  //   }
  // };

  useEffect(() => {
    if (openNav) {
      onCloseNav();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const logo = (
    <Box
      component="div"
      sx={{
        position: 'relative',
        width: 40,
        height: 40,
        borderRadius: 1,
      }}
    >
      <Image
        src="/assets/icons/navbar/ic_navlogo.svg"
        alt="Cult Creative Logo"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 'inherit',
        }}
      />
      {/* <Avatar
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 30,
          height: 30,
          borderRadius: 0,
        }}
        src="/assets/icons/navbar/ic_nav_logo.svg"
      /> */}
    </Box>
  );

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
      {/* <Logo sx={{ mt: 3, ml: 4, mb: 1 }} /> */}
      <Stack
        sx={{
          p: 2,
        }}
        direction="row"
        alignItems="center"
        spacing={1.5}
      >
        {logo}
        <Stack flexGrow={1}>
          <Typography fontSize="14px" fontWeight={800}>
            CULT CREATIVE
          </Typography>
          <Typography fontSize="12px" color="#636366" fontWeight={500}>
            {`${user?.role.slice(0, 1).toUpperCase()}${user?.role.slice(1)}`}
          </Typography>
        </Stack>
        <IconButton
          sx={{
            borderRadius: 1.2,
            border: '1.8px solid',
            borderBottom: '4px solid',
            borderColor: '#e7e7e7',
            bgcolor: 'white',
            width: '40px',
            height: '32px',
          }}
          onClick={() => {
            onCloseNav();
            settings.onUpdate(
              'themeLayout',
              settings.themeLayout === 'vertical' ? 'mini' : 'vertical'
            );
          }}
        >
          <img
            src="/assets/icons/navbar/ic_nav_collapse.svg"
            alt="CollapseButton"
            style={{ width: '16px', height: '16px', color: 'black' }}
          />
        </IconButton>
      </Stack>

      <NavSectionVertical
        data={navData}
        slotProps={{
          currentRole: user?.role,
        }}
      />
      {/* {!data?.tokenStatus && user.role === 'admin' && user.admin.role.name === 'Finance' ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: 1,
            borderTop: (theme) => `dashed 1px ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h6" sx={{ mx: 1, mb: 1 }}>
            Update xero
          </Typography>

          <Button
            onClick={handleActivateXero}
            variant="contained"
            color="info"
            sx={{
              mx: 1,
              mb: 1,
              width: 'calc(100% - 100px)',
            }}
          >
            Click me
          </Button>
          <p
            style={{
              opacity: 0.5,
            }}
          >
            {' '}
            Last modified {formattedDate}
          </p>
        </Box>
      ) : null} */}

      <Box sx={{ flexGrow: 1 }} />
    </Scrollbar>
  );

  return (
    <Box
      sx={{
        flexShrink: { lg: 0 },
        width: { lg: NAV.W_VERTICAL },
      }}
    >
      {/* <NavToggleButton /> */}

      {lgUp ? (
        <Stack
          sx={{
            height: 1,
            position: 'fixed',
            width: NAV.W_VERTICAL,
            // boxShadow: 5,
            // borderRight: (theme) => `dashed 1px ${theme.palette.divider}`,
          }}
        >
          {renderContent}
        </Stack>
      ) : (
        <Drawer
          open={openNav}
          onClose={onCloseNav}
          PaperProps={{
            sx: {
              width: NAV.W_VERTICAL,
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
