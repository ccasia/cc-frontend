// import { debounce } from 'lodash';
// import useSWRInfinite from 'swr/infinite';
// import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

// import { useTheme } from '@mui/material/styles';
// import {
//   Box,
//   Stack,
//   Button,
//   Dialog,
//   // MenuItem,
//   Tooltip,
//   Container,
//   InputBase,
//   Typography,
//   IconButton,
//   // Tab,
//   // Tabs,
//   // Menu,
//   CircularProgress,
// } from '@mui/material';

// import { paths } from 'src/routes/paths';
// import { useRouter } from 'src/routes/hooks';

// import { useBoolean } from 'src/hooks/use-boolean';
// import { useResponsive } from 'src/hooks/use-responsive';
// import useGetCampaigns from 'src/hooks/use-get-campaigns';

// import { fetcher } from 'src/utils/axios';

// import { useAuthContext } from 'src/auth/hooks';
// import { useMainContext } from 'src/layouts/dashboard/hooks/dsahboard-context';

// import Iconify from 'src/components/iconify';
// import { useSettingsContext } from 'src/components/settings';
// import EmptyContent from 'src/components/empty-content/empty-content';
// import CampaignTabsMobile from 'src/components/campaign/CampaignTabsMobile';

// import CreateCampaignForm from 'src/sections/campaign/create/form';

// import CampaignLists from '../campaign-list';

// const CampaignView = () => {
//   const settings = useSettingsContext();
//   const router = useRouter();

//   const [search, setSearch] = useState({
//     query: '',
//     results: [],
//   });

//   const [debouncedQuery, setDebouncedQuery] = useState('');

//   // Search input ref for keyboard shortcut focus
//   const searchInputRef = useRef(null);

//   // Keyboard shortcut handler
//   useEffect(() => {
//     const handleKeyDown = (event) => {
//       // Check for CMD+K (Mac) or Ctrl+K (Windows/Linux)
//       if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
//         event.preventDefault();
//         searchInputRef.current?.focus();
//       }
//     };

//     document.addEventListener('keydown', handleKeyDown);
//     return () => {
//       document.removeEventListener('keydown', handleKeyDown);
//     };
//   }, []);

//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   const debouncedSetQuery = useCallback(
//     debounce((q) => setDebouncedQuery(q), 300), // 300ms delay
//     []
//   );

//   const { campaigns } = useGetCampaigns();

//   const create = useBoolean();

//   const [filter, setFilter] = useState('active');

//   const theme = useTheme();

//   // const [anchorEl, setAnchorEl] = useState(null);

//   // const open = Boolean(anchorEl);

//   const { user } = useAuthContext();

//   const { mainRef } = useMainContext();

//   const lgUp = useResponsive('up', 'lg');

//   const isDisabled = useMemo(
//     () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
//     [user]
//   );

//   const getKey = (pageIndex, previousPageData) => {
//     // If there's no previous page data, start from the first page
//     if (pageIndex === 0)
//       return `/api/campaign/getAllCampaignsByAdminId/${user?.id}?search=${encodeURIComponent(debouncedQuery)}&status=${filter.toUpperCase()}&limit=${10}`;

//     // If there's no more data (previousPageData is empty or no nextCursor), stop fetching
//     if (!previousPageData?.metaData?.lastCursor) return null;

//     // Otherwise, use the nextCursor to get the next page
//     return `/api/campaign/getAllCampaignsByAdminId/${user?.id}?search=${encodeURIComponent(debouncedQuery)}&status=${filter.toUpperCase()}&limit=${10}&cursor=${previousPageData?.metaData?.lastCursor}`;
//   };

//   const {
//     data,
//     size,
//     setSize,
//     isValidating,
//     mutate: mutateCampaigns,
//     isLoading,
//   } = useSWRInfinite(getKey, fetcher);

//   const smDown = useResponsive('down', 'sm');

//   // const handleClick = (event) => {
//   //   setAnchorEl(event.currentTarget);
//   // };

//   // const handleClose = () => {
//   //   setAnchorEl(null);
//   // };

//   const handleNewCampaign = () => {
//     create.onTrue();
//     // handleClose();
//   };

//   const activeCampaigns = useMemo(
//     () => campaigns?.filter((campaign) => campaign?.status === 'ACTIVE') || [],
//     [campaigns]
//   );
//   const completedCampaigns = useMemo(
//     () => campaigns?.filter((campaign) => campaign?.status === 'COMPLETED') || [],
//     [campaigns]
//   );

//   const activeCount = activeCampaigns.length;
//   const completedCount = completedCampaigns.length;

//   const dataFiltered = useMemo(
//     () => (data ? data?.flatMap((item) => item?.data?.campaigns) : []),
//     [data]
//   );

//   const handleScroll = useCallback(() => {
//     const scrollContainer = lgUp ? mainRef?.current : document.documentElement;

//     const bottom =
//       scrollContainer.scrollHeight <= scrollContainer.scrollTop + scrollContainer.clientHeight + 1;

//     if (bottom && !isValidating && data[data.length - 1]?.metaData?.lastCursor) {
//       setSize(size + 1);
//     }
//   }, [data, isValidating, setSize, size, mainRef, lgUp]);

//   useEffect(() => {
//     const scrollContainer = lgUp ? mainRef?.current : window;

//     scrollContainer.addEventListener('scroll', handleScroll);

//     return () => {
//       scrollContainer.removeEventListener('scroll', handleScroll);
//     };
//   }, [handleScroll, mainRef, lgUp]);

//   const tabs = [
//     { id: 'active', label: 'Active', count: activeCount },
//     { id: 'completed', label: 'Completed', count: completedCount },
//     // { id: 'paused', label: 'Paused', count: pausedCount },
//   ];

//   return (
//     <Container maxWidth={settings.themeStretch ? false : 'xl'} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
//       <Typography
//         variant="h2"
//         sx={{
//           mb: 3,
//           fontFamily: 'fontSecondaryFamily',
//           fontWeight: 'normal',
//         }}
//       >
//         Manage Campaigns ✨
//       </Typography>

//       {/* Main Controls Container */}
//       <Box
//         sx={{
//           border: '1px solid #e7e7e7',
//           borderRadius: 1,
//           p: 1,
//           display: 'flex',
//           flexDirection: { xs: 'column', md: 'row' },
//           alignItems: { xs: 'stretch', md: 'center' },
//           justifyContent: 'space-between',
//           gap: { xs: 1.5, md: 1.5 },
//           bgcolor: 'background.paper',
//           mb: 2.5,
//         }}
//       >
//         {/* Tab Buttons */}
//         <Stack
//           direction="row"
//           spacing={1}
//           sx={{
//             flex: { xs: 'none', md: '0 0 auto' },
//           }}
//         >
//           {tabs.map((tab) => {
//             // Define colors for each tab - using consistent #1340FF
//             const getTabColors = (tabId, isActive) => {
//               const colors = {
//                 active: { bg: '#1340FF', hover: 'rgba(19, 64, 255, 0.08)' },
//                 completed: { bg: '#1340FF', hover: 'rgba(19, 64, 255, 0.08)' },
//                 paused: { bg: '#1340FF', hover: 'rgba(19, 64, 255, 0.08)' },
//               };
//               return colors[tabId] || colors.active;
//             };

//             // Define count badge colors for better visibility
//             const getCountBadgeColors = (tabId, isActive) => {
//               if (isActive) {
//                 const badgeColors = {
//                   active: { bg: 'rgba(255, 255, 255, 0.25)', color: '#ffffff' },
//                   completed: { bg: 'rgba(255, 255, 255, 0.25)', color: '#ffffff' },
//                   paused: { bg: 'rgba(255, 255, 255, 0.25)', color: '#ffffff' },
//                 };
//                 return badgeColors[tabId] || badgeColors.active;
//               }
//               return { bg: '#f5f5f5', color: '#666666' };
//             };

//             const tabColors = getTabColors(tab.id, filter === tab.id);
//             const badgeColors = getCountBadgeColors(tab.id, filter === tab.id);
//             const isActive = filter === tab.id;

//             return (
//               <Button
//                 key={tab.id}
//                 onClick={() => setFilter(tab.id)}
//                 sx={{
//                   px: 2,
//                   py: 1,
//                   minHeight: '38px',
//                   height: '38px',
//                   minWidth: 'fit-content',
//                   color: isActive ? '#ffffff' : '#666666',
//                   bgcolor: isActive ? tabColors.bg : 'transparent',
//                   fontSize: '0.95rem',
//                   fontWeight: 600,
//                   borderRadius: 0.75,
//                   textTransform: 'none',
//                   position: 'relative',
//                   transition: 'all 0.2s ease',
//                   '&::before': {
//                     content: '""',
//                     position: 'absolute',
//                     top: '1px',
//                     left: '1px',
//                     right: '1px',
//                     bottom: '1px',
//                     borderRadius: 0.75,
//                     backgroundColor: 'transparent',
//                     transition: 'background-color 0.2s ease',
//                     zIndex: -1,
//                   },
//                   '&:hover::before': {
//                     backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : tabColors.hover,
//                   },
//                   '&:hover': {
//                     bgcolor: isActive ? tabColors.bg : 'transparent',
//                     color: isActive ? '#ffffff' : tabColors.bg,
//                     transform: 'scale(0.98)',
//                   },
//                   '&:focus': {
//                     outline: 'none',
//                   },
//                 }}
//               >
//                 <Stack direction="row" alignItems="center" spacing={1}>
//                   <span>{tab.label}</span>
//                   <Box
//                     sx={{
//                       px: 0.75,
//                       py: 0.25,
//                       borderRadius: 0.5,
//                       bgcolor: badgeColors.bg,
//                       color: badgeColors.color,
//                       fontSize: '0.75rem',
//                       fontWeight: 600,
//                       minWidth: 20,
//                       textAlign: 'center',
//                       lineHeight: 1,
//                     }}
//                   >
//                     {tab.count}
//                   </Box>
//                 </Stack>
//               </Button>
//             );
//           })}
//         </Stack>

//         {/* Search and Action Controls */}
//         <Stack
//           direction={{ xs: 'column', sm: 'row' }}
//           spacing={1.5}
//           sx={{
//             flex: { xs: 'none', md: '1 1 auto' },
//             justifyContent: { xs: 'stretch', md: 'flex-end' },
//             alignItems: { xs: 'stretch', sm: 'center' },
//           }}
//         >
//           {/* Search Box */}
//           <Box
//             sx={{
//               width: { xs: '100%', sm: '240px', md: '280px' },
//               border: '1px solid #e7e7e7',
//               borderRadius: 0.75,
//               bgcolor: 'background.paper',
//               display: 'flex',
//               alignItems: 'center',
//               height: '38px',
//               transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
//               position: 'relative',
//               '&:hover': {
//                 borderColor: '#1340ff',
//                 transform: 'translateY(-1px)',
//                 boxShadow: '0 2px 8px rgba(19, 64, 255, 0.1)',
//               },
//               '&:focus-within': {
//                 borderColor: '#1340ff',
//                 boxShadow: '0 0 0 3px rgba(19, 64, 255, 0.1)',
//                 transform: 'translateY(-1px)',
//               },
//             }}
//           >
//             <InputBase
//               inputRef={searchInputRef}
//               value={search.query}
//               onChange={(e) => {
//                 setSearch((prev) => ({ ...prev, query: e.target.value }));
//                 debouncedSetQuery(e.target.value);
//               }}
//               placeholder="Search"
//               startAdornment={
//                 <Iconify
//                   icon="eva:search-fill"
//                   sx={{
//                     width: 18,
//                     height: 18,
//                     color: 'text.disabled',
//                     ml: 1.5,
//                     mr: 1,
//                     transition: 'color 0.2s ease',
//                   }}
//                 />
//               }
//               endAdornment={
//                 <Box
//                   sx={{
//                     display: { xs: 'none', md: 'flex' },
//                     alignItems: 'center',
//                     gap: 0.25,
//                     mr: 1.5,
//                     ml: 1,
//                   }}
//                 >
//                   <Box
//                     sx={{
//                       display: 'flex',
//                       alignItems: 'center',
//                       gap: 0.5,
//                       px: 1,
//                       py: 0.5,
//                       bgcolor: '#f5f5f5',
//                       borderRadius: 0.5,
//                       border: '1px solid #e0e0e0',
//                       minHeight: '22px',
//                       transition: 'all 0.2s ease',
//                       cursor: 'pointer',
//                       '&:hover': {
//                         bgcolor: '#eeeeee',
//                         borderColor: '#d0d0d0',
//                         transform: 'scale(1.05)',
//                       },
//                       '&:active': {
//                         transform: 'scale(0.95)',
//                       },
//                     }}
//                     onClick={() => searchInputRef.current?.focus()}
//                   >
//                     <Typography
//                       variant="caption"
//                       sx={{
//                         fontSize: '11px',
//                         fontWeight: 700,
//                         color: '#666666',
//                         lineHeight: 1,
//                         fontFamily: 'monospace',
//                       }}
//                     >
//                       {navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}
//                     </Typography>
//                     <Typography
//                       variant="caption"
//                       sx={{
//                         fontSize: '11px',
//                         fontWeight: 700,
//                         color: '#666666',
//                         lineHeight: 1,
//                         fontFamily: 'monospace',
//                       }}
//                     >
//                       K
//                     </Typography>
//                   </Box>
//                 </Box>
//               }
//               sx={{
//                 width: '100%',
//                 color: 'text.primary',
//                 fontSize: '0.95rem',
//                 '& input': {
//                   py: 1,
//                   px: 1,
//                   height: '100%',
//                   transition: 'all 0.2s ease',
//                   '&::placeholder': {
//                     color: '#999999',
//                     opacity: 1,
//                     transition: 'color 0.2s ease',
//                   },
//                   '&:focus::placeholder': {
//                     color: '#cccccc',
//                   },
//                 },
//               }}
//             />
//           </Box>

//           {/* New Campaign Button - Desktop */}
//           <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
//             <Button
//               onClick={handleNewCampaign}
//               disabled={isDisabled}
//               sx={{
//                 bgcolor: isDisabled ? '#e0e0e0' : '#203ff5',
//                 color: isDisabled ? '#9e9e9e' : 'white',
//                 borderRadius: 0.75,
//                 px: 2,
//                 py: 1,
//                 height: '38px',
//                 minWidth: '140px',
//                 fontSize: '0.95rem',
//                 fontWeight: 600,
//                 textTransform: 'none',
//                 cursor: isDisabled ? 'not-allowed' : 'pointer',
//                 transition: 'all 0.2s ease',
//                 '&:hover': {
//                   bgcolor: isDisabled ? '#e0e0e0' : '#1a35d1',
//                   transform: isDisabled ? 'none' : 'translateY(-1px)',
//                   boxShadow: isDisabled ? 'none' : '0 2px 8px rgba(32, 63, 245, 0.2)',
//                 },
//               }}
//             >
//               New Campaign
//             </Button>

//             {/* Settings Button */}
//             <Tooltip
//               title="Campaign Settings"
//               arrow
//               placement="bottom"
//               slotProps={{
//                 tooltip: {
//                   sx: {
//                     bgcolor: 'rgba(0, 0, 0, 0.9)',
//                     color: 'white',
//                     fontSize: '12px',
//                     fontWeight: 500,
//                   },
//                 },
//                 arrow: {
//                   sx: {
//                     color: 'rgba(0, 0, 0, 0.9)',
//                   },
//                 },
//               }}
//             >
//               <Button
//                 onClick={() => router.push(paths.dashboard.campaign.settings)}
//                 sx={{
//                   minWidth: '38px',
//                   width: '38px',
//                   height: '38px',
//                   p: 0,
//                   color: '#666666',
//                   border: '1px solid #e7e7e7',
//                   borderRadius: '8px',
//                   fontWeight: 650,
//                   position: 'relative',
//                   transition: 'all 0.2s ease',
//                   '&:hover': {
//                     bgcolor: '#f5f5f5',
//                     borderColor: '#d0d0d0',
//                     color: '#333333',
//                   },
//                 }}
//               >
//                 <Iconify icon="eva:settings-outline" width={16} />
//               </Button>
//             </Tooltip>
//           </Box>
//         </Stack>
//       </Box>

//       {/* Mobile Campaign Tabs - Only show on smaller screens */}
//       <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
//         <CampaignTabsMobile filter={filter} />
//       </Box>

//       {/* Mobile FAB */}
//       <IconButton
//         onClick={handleNewCampaign}
//         disabled={isDisabled}
//         sx={{
//           display: { xs: 'flex', sm: 'none' },
//           position: 'fixed',
//           right: 20,
//           bottom: 20,
//           width: 56,
//           height: 56,
//           bgcolor: isDisabled ? '#e0e0e0' : '#203ff5',
//           color: isDisabled ? '#9e9e9e' : 'white',
//           zIndex: 1100,
//           boxShadow: isDisabled ? 'none' : '0 2px 12px rgba(32, 63, 245, 0.3)',
//           cursor: isDisabled ? 'not-allowed' : 'pointer',
//           '&:hover': {
//             bgcolor: isDisabled ? '#e0e0e0' : '#203ff5',
//             opacity: isDisabled ? 1 : 0.9,
//           },
//         }}
//       >
//         <Iconify icon="eva:plus-fill" width={24} height={24} />
//       </IconButton>

//       {/* <Menu
//         anchorEl={anchorEl}
//         open={open}
//         onClose={handleClose}
//         anchorOrigin={{
//           vertical: 'bottom',
//           horizontal: 'right',
//         }}
//         transformOrigin={{
//           vertical: 'top',
//           horizontal: 'right',
//         }}
//         PaperProps={{
//           sx: {
//             mt: { xs: -8, sm: 0 },
//             mb: { xs: 1, sm: 1 },
//             width: 200,
//             bgcolor: 'white',
//             border: '1px solid #e7e7e7',
//             borderBottom: '2px solid #e7e7e7',
//             borderRadius: 1,
//             '& .MuiMenuItem-root': {
//               px: 2,
//               py: 1.5,
//               borderRadius: 1,
//               color: '#000000',
//               fontWeight: 600,
//               fontSize: '0.95rem',
//               '&:hover': {
//                 bgcolor: 'action.hover',
//               },
//             },
//           },
//         }}
//       >
//         <MenuItem onClick={handleNewCampaign} disabled={isDisabled}>
//           <Iconify icon="ph:sparkle-fill" width={20} height={20} sx={{ mr: 2 }} />
//           New Campaign
//         </MenuItem>
//       </Menu> */}

//       {isLoading && (
//         <Box sx={{ position: 'relative', top: 200, textAlign: 'center' }}>
//           <CircularProgress
//             thickness={7}
//             size={25}
//             sx={{
//               color: theme.palette.common.black,
//               strokeLinecap: 'round',
//             }}
//           />
//         </Box>
//       )}

//       {!isLoading &&
//         (dataFiltered?.length > 0 ? (
//           <Box mt={2}>
//             <CampaignLists campaigns={dataFiltered} />
//             {isValidating && (
//               <Box sx={{ textAlign: 'center', my: 2 }}>
//                 <CircularProgress
//                   thickness={7}
//                   size={25}
//                   sx={{
//                     color: theme.palette.common.black,
//                     strokeLinecap: 'round',
//                   }}
//                 />
//               </Box>
//             )}
//           </Box>
//         ) : (
//           <EmptyContent
//             title={`No ${filter === 'active' ? 'active' : 'completed'} campaigns available`}
//           />
//         ))}

//       <Dialog
//         fullWidth
//         fullScreen
//         PaperProps={{
//           sx: {
//             // bgcolor: '#FFF',
//             bgcolor: theme.palette.background.paper,
//             borderRadius: 2,
//             p: 4,
//             m: 2,
//             height: '97vh',
//             overflow: 'hidden',
//             ...(smDown && {
//               height: 1,
//               m: 0,
//             }),
//           },
//         }}
//         scroll="paper"
//         open={create.value}
//       >
//         <CreateCampaignForm onClose={create.onFalse} mutate={mutateCampaigns} />
//       </Dialog>
//     </Container>
//   );
// };

// export default CampaignView;
import { debounce } from 'lodash';
import useSWRInfinite from 'swr/infinite';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Stack,
  Button,
  Dialog,
  Container,
  InputBase,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import useGetCampaigns from 'src/hooks/use-get-campaigns';

import { fetcher } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import { useMainContext } from 'src/layouts/dashboard/hooks/dsahboard-context';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import CampaignTabs from 'src/components/campaign/CampaignTabs';
import EmptyContent from 'src/components/empty-content/empty-content';

import CreateCampaignForm from 'src/sections/campaign/create/form';

import CampaignLists from '../campaign-list';

const CampaignView = () => {
  const settings = useSettingsContext();

  const [search, setSearch] = useState({
    query: '',
    results: [],
  });

  const [debouncedQuery, setDebouncedQuery] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetQuery = useCallback(
    debounce((q) => setDebouncedQuery(q), 300), // 300ms delay
    []
  );

  const { campaigns } = useGetCampaigns();

  const create = useBoolean();

  const [filter, setFilter] = useState('active');

  const theme = useTheme();

  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);

  const { user } = useAuthContext();

  const { mainRef } = useMainContext();

  const lgUp = useResponsive('up', 'lg');

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );

  const getKey = (pageIndex, previousPageData) => {
    // If there's no previous page data, start from the first page
    if (pageIndex === 0)
      return `/api/campaign/getAllCampaignsByAdminId/${user?.id}?search=${encodeURIComponent(debouncedQuery)}&status=${filter.toUpperCase()}&limit=${10}`;

    // If there's no more data (previousPageData is empty or no nextCursor), stop fetching
    if (!previousPageData?.metaData?.lastCursor) return null;

    // Otherwise, use the nextCursor to get the next page
    return `/api/campaign/getAllCampaignsByAdminId/${user?.id}?search=${encodeURIComponent(debouncedQuery)}&status=${filter.toUpperCase()}&limit=${10}&cursor=${previousPageData?.metaData?.lastCursor}`;
  };

  const { data, size, setSize, isValidating, mutate, isLoading } = useSWRInfinite(getKey, fetcher);

  const smDown = useResponsive('down', 'sm');

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNewCampaign = () => {
    create.onTrue();
    handleClose();
  };

  const activeCampaigns = useMemo(
    () => campaigns?.filter((campaign) => campaign?.status === 'ACTIVE') || [],
    [campaigns]
  );
  const completedCampaigns = useMemo(
    () => campaigns?.filter((campaign) => campaign?.status === 'COMPLETED') || [],
    [campaigns]
  );
  const pausedCampaigns = useMemo(
    () => campaigns?.filter((campaign) => campaign?.status === 'PAUSED') || [],
    [campaigns]
  );

  const activeCount = activeCampaigns.length;
  const completedCount = completedCampaigns.length;
  const pausedCount = pausedCampaigns.length;

  // Store campaign status information for each campaign
  useEffect(() => {
    if (!campaigns) return;

    const statusMap = {};
    campaigns.forEach((campaign) => {
      statusMap[campaign.id] = {
        status: campaign.status,
      };
    });

    // Make this available globally
    window.campaignTabsStatus = statusMap;
  }, [campaigns]);

  const dataFiltered = useMemo(
    () => (data ? data?.flatMap((item) => item?.data?.campaigns) : []),
    [data]
  );

  const handleScroll = useCallback(() => {
    const scrollContainer = lgUp ? mainRef?.current : document.documentElement;

    const bottom =
      scrollContainer.scrollHeight <= scrollContainer.scrollTop + scrollContainer.clientHeight + 1;

    if (bottom && !isValidating && data[data.length - 1]?.metaData?.lastCursor) {
      setSize(size + 1);
    }
  }, [data, isValidating, setSize, size, mainRef, lgUp]);

  useEffect(() => {
    const scrollContainer = lgUp ? mainRef?.current : window;

    scrollContainer.addEventListener('scroll', handleScroll);

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll, mainRef, lgUp]);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
      <Typography
        variant="h2"
        sx={{
          mb: 2,
          fontFamily: 'fontSecondaryFamily',
          fontWeight: 'normal',
        }}
      >
        Manage Campaigns ✨
      </Typography>

      {/* Campaign Tabs */}
      <CampaignTabs filter={filter} />

      <Box sx={{ mb: 2.5 }}>
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            position: 'relative',
            width: '100%',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '1px',
              bgcolor: 'divider',
            },
          }}
        >
          <Stack
            direction="row"
            spacing={0.5}
            sx={{
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            <Button
              disableRipple
              size="large"
              onClick={() => setFilter('active')}
              sx={{
                px: 0.5,
                py: 0.5,
                pb: 1,
                minWidth: 'fit-content',
                color: filter === 'active' ? theme.palette.common : '#8e8e93',
                position: 'relative',
                fontSize: '1.05rem',
                fontWeight: 650,
                transition: 'transform 0.1s ease-in-out',
                '&:focus': {
                  outline: 'none',
                  bgcolor: 'transparent',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                  bgcolor: 'transparent',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  width: filter === 'active' ? '100%' : '0%',
                  bgcolor: '#1340ff',
                  transition: 'all 0.3s ease-in-out',
                  transform: 'scaleX(1)',
                  transformOrigin: 'left',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                  '&::after': {
                    width: '100%',
                    opacity: filter === 'active' ? 1 : 0.5,
                  },
                },
              }}
            >
              Active ({activeCount})
            </Button>
            <Button
              disableRipple
              size="large"
              onClick={() => setFilter('completed')}
              sx={{
                px: 1,
                py: 0.5,
                pb: 1,
                ml: 2,
                minWidth: 'fit-content',
                color: filter === 'completed' ? theme.palette.common : '#8e8e93',
                position: 'relative',
                fontSize: '1.05rem',
                fontWeight: 650,
                transition: 'transform 0.1s ease-in-out',
                '&:focus': {
                  outline: 'none',
                  bgcolor: 'transparent',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                  bgcolor: 'transparent',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  width: filter === 'completed' ? '100%' : '0%',
                  bgcolor: '#1340ff',
                  transition: 'all 0.3s ease-in-out',
                  transform: 'scaleX(1)',
                  transformOrigin: 'left',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                  '&::after': {
                    width: '100%',
                    opacity: filter === 'completed' ? 1 : 0.5,
                  },
                },
              }}
            >
              Completed ({completedCount})
            </Button>
            <Button
              disableRipple
              size="large"
              onClick={() => setFilter('paused')}
              sx={{
                px: 1,
                py: 0.5,
                pb: 1,
                ml: 2,
                minWidth: 'fit-content',
                color: filter === 'paused' ? theme.palette.common : '#8e8e93',
                position: 'relative',
                fontSize: '1.05rem',
                fontWeight: 650,
                transition: 'transform 0.1s ease-in-out',
                '&:focus': {
                  outline: 'none',
                  bgcolor: 'transparent',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                  bgcolor: 'transparent',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  width: filter === 'paused' ? '100%' : '0%',
                  bgcolor: '#1340ff',
                  transition: 'all 0.3s ease-in-out',
                  transform: 'scaleX(1)',
                  transformOrigin: 'left',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                  '&::after': {
                    width: '100%',
                    opacity: filter === 'paused' ? 1 : 0.5,
                  },
                },
              }}
            >
              Paused ({pausedCount})
            </Button>
          </Stack>

          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Button
              onClick={handleClick}
              endIcon={<Iconify icon="eva:chevron-down-fill" width={20} height={20} />}
              disabled={isDisabled}
              sx={{
                bgcolor: isDisabled ? '#e0e0e0' : '#203ff5',
                color: isDisabled ? '#9e9e9e' : 'white',
                borderBottom: isDisabled ? '3px solid #bdbdbd' : '3px solid #102387',
                borderRadius: '8px',
                padding: '8px 20px',
                position: 'absolute',
                right: 0,
                top: -3,
                minWidth: '150px',
                fontSize: '0.9rem',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                '&:hover': {
                  bgcolor: isDisabled ? '#e0e0e0' : '#203ff5',
                  opacity: isDisabled ? 1 : 0.9,
                },
              }}
            >
              New Campaign
            </Button>
          </Box>

          <IconButton
            onClick={handleClick}
            sx={{
              display: { xs: 'flex', sm: 'none' },
              position: 'fixed',
              right: 20,
              bottom: 20,
              width: 56,
              height: 56,
              bgcolor: '#203ff5',
              color: 'white',
              zIndex: 1100,
              boxShadow: '0 2px 12px rgba(32, 63, 245, 0.3)',
              '&:hover': {
                bgcolor: '#203ff5',
                opacity: 0.9,
              },
            }}
          >
            <Iconify icon="eva:plus-fill" width={24} height={24} />
          </IconButton>
        </Stack>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: 'white',
              backgroundImage: 'none',
              boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e7e7e7',
              borderBottom: '2px solid #e7e7e7',
              borderRadius: 1,
              mt: { xs: -8, sm: 0 },
              mb: { xs: 1, sm: 1 },
              width: 200,
              overflow: 'visible',
            },
          },
        }}
        MenuListProps={{
          sx: {
            backgroundColor: 'white',
            p: 0.5,
          },
        }}
      >
        <MenuItem
          onClick={handleNewCampaign}
          disabled={isDisabled}
          sx={{
            borderRadius: 1,
            backgroundColor: 'white',
            color: isDisabled ? '#9e9e9e' : 'black',
            fontWeight: 600,
            fontSize: '0.95rem',
            p: 1.5,
            '&:hover': {
              backgroundColor: isDisabled ? 'white' : '#f5f5f5',
            },
            '&.Mui-disabled': {
              opacity: 0.7,
            },
          }}
        >
          <Iconify icon="ph:sparkle-fill" width={20} height={20} sx={{ mr: 2 }} />
          New Campaign
        </MenuItem>
        {/* <MenuItem onClick={handleClose}>
          <Iconify icon="mdi:note-text" width={20} height={20} sx={{ mr: 2 }} />
          Drafts
        </MenuItem> */}
      </Menu>

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
          value={search.query}
          onChange={(e) => {
            setSearch((prev) => ({ ...prev, query: e.target.value }));
            debouncedSetQuery(e.target.value);
          }}
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

      {isLoading && (
        <Box sx={{ position: 'relative', top: 200, textAlign: 'center' }}>
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

      {!isLoading &&
        (dataFiltered?.length > 0 ? (
          <Box mt={2}>
            <CampaignLists campaigns={dataFiltered} />
            {isValidating && (
              <Box sx={{ textAlign: 'center', my: 2 }}>
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
          </Box>
        ) : (
          <EmptyContent title={`No ${filter} campaigns available`} />
        ))}
      {/* <CampaignFilter
        open={openFilters.value}
        onOpen={openFilters.onTrue}
        onClose={openFilters.onFalse}
        //
        filters={filters}
        onFilters={handleFilters}
        reset={handleResetFitlers}
        brands={brandOptions}
      /> */}
      <Dialog
        fullWidth
        fullScreen
        PaperProps={{
          sx: {
            // bgcolor: '#FFF',
            bgcolor: theme.palette.background.paper,
            borderRadius: 2,
            p: 4,
            m: 2,
            height: '97vh',
            overflow: 'hidden',
            ...(smDown && {
              height: 1,
              m: 0,
            }),
          },
        }}
        scroll="paper"
        open={create.value}
      >
        <CreateCampaignForm onClose={create.onFalse} mutate={mutate} />
      </Dialog>
    </Container>
  );
};

export default CampaignView;
