import jsPDF from 'jspdf';
import { m } from 'framer-motion';
import { toPng } from 'html-to-image';
import React, { useRef, useMemo, useState, useCallback } from 'react';

import {
  Box,
  Chip,
  Menu,
  Stack,
  Alert,
  Avatar,
  Button,
  Dialog,
  useTheme,
  MenuItem,
  Backdrop,
  Snackbar,
  Container,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useResponsive } from 'src/hooks/use-responsive';
import { useSWRGetCreatorByID } from 'src/hooks/use-get-creators';

import Iconify from 'src/components/iconify';

import MediaKitSocial from './media-kit-social-view';

// import MediaKitSocial from './media-kit-social/view';
// import { formatNumber } from '../media-kit/view-instagram';

// import MediaKitSocial from '../media-kit-creator-view/media-kit-social/view';
// import { formatNumber } from '../media-kit-creator-view/media-kit-social/media-kit-social-content/view-instagram';

const calculateEngagementRate = (totalLikes, followers) => {
  if (!(totalLikes || followers)) return null;
  return ((parseInt(totalLikes, 10) / parseInt(followers, 10)) * 100).toFixed(2);
};

// Utility function to format numbers
const formatNumber = (num) => {
  if (!num && num !== 0) return '0';

  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}G`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

// eslint-disable-next-line react/prop-types
const MediaKit = ({ id, noBigScreen }) => {
  const theme = useTheme();
  const router = useRouter();
  const smDown = useResponsive('down', 'sm');
  const mdDown = useResponsive('down', 'md');
  const isDesktop = useResponsive('up', 'md');

  const { data, isLoading, isError } = useSWRGetCreatorByID(id);
  const [currentTab, setCurrentTab] = useState('instagram');

  // Share functionality
  const containerRef = useRef(null);
  const desktopShareButtonRef = useRef(null);
  const mobileShareButtonRef = useRef(null);
  const desktopLayoutRef = useRef(null);
  const backButtonRef = useRef(null);
  const logoContainerRef = useRef(null);
  const [captureLoading, setCaptureLoading] = useState(false);
  const [captureState, setCaptureState] = useState('idle');
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const menuOpen = Boolean(menuAnchorEl);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Mobile preview state
  const [mobilePreview, setMobilePreview] = useState({
    open: false,
    imageUrl: '',
  });

  const socialMediaAnalytics = useMemo(() => {
    if (currentTab === 'instagram') {
      return {
        followers: data?.creator?.instagramUser?.followers_count || 0,
        engagement_rate: `${
          calculateEngagementRate(
            (data?.creator?.instagramUser?.totalLikes ?? 0) +
              (data?.creator?.instagramUser?.totalComments ?? 0),
            data?.creator?.instagramUser?.followers_count
          ) || 0
        }`,
        averageLikes: data?.creator?.instagramUser?.averageLikes || 0,
        averageComments: data?.creator?.instagramUser?.averageComments || 0,
        username: data?.creator?.instagramUser?.username,
      };
    }

    if (currentTab === 'tiktok') {
      return {
        followers: data?.creator?.tiktokUser?.follower_count || 0,
        engagement_rate: data?.creator?.tiktokUser?.follower_count || 0,
        averageLikes: data?.creator?.tiktokUser?.likes_count || 0,
        averageComments: data?.creator?.tiktokUser?.averageComments || 0,
      };
    }

    return {
      followers: 0,
      engagement_rate: 0,
      averageLikes: 0,
    };
  }, [data, currentTab]);

  // Helper function for screenshot styles
  const getScreenshotStyles = useCallback(
    () => `
      .desktop-screenshot-view .MuiBox-root[style*="border-radius: 2px"] {
        margin-bottom: 16px !important;
        padding-bottom: 16px !important;
      }
      .desktop-screenshot-view .desktop-screenshot-mediakit > .MuiBox-root {
        margin-bottom: 16px !important;
        padding-bottom: 0 !important;
      }
      .desktop-screenshot-view .desktop-screenshot-mediakit .MuiGrid-container {
        margin-bottom: 0 !important;
      }
      .desktop-screenshot-view .desktop-screenshot-mediakit .MuiGrid-item {
        padding-bottom: 8px !important;
      }
      .desktop-screenshot-view {
        padding-bottom: 24px !important;
      }
      .desktop-screenshot-view .MuiContainer-root {
        padding-bottom: 16px !important;
      }
      .desktop-screenshot-view .MuiBox-root {
        padding-bottom: 0 !important;
        margin-bottom: 2px !important;
      }
      .desktop-screenshot-view .MuiGrid-container {
        margin-bottom: 0 !important;
      }
      .desktop-screenshot-view .MuiGrid-item {
        padding-bottom: 8px !important;
      }
      .desktop-screenshot-view .MuiStack-root[spacing="8"] > :nth-child(2) {
        max-width: 45% !important;
      }
      .desktop-screenshot-view iframe {
        border: none !important;
        height: 550px !important;
        width: 100% !important;
        border-radius: 4px !important;
      }
      .desktop-screenshot-view .desktop-screenshot-mediakit > div > div {
        display: flex !important;
        flex-direction: row !important;
        gap: 32px !important;
        width: 100% !important;
        justify-content: flex-start !important;
      }
      .desktop-screenshot-view .desktop-screenshot-mediakit > div > div > div {
        width: 350px !important;
        min-width: 350px !important;
        max-width: 350px !important;
      }
      .desktop-screenshot-view .media-kit-engagement-icons {
        bottom: 20px !important;
      }
      .desktop-screenshot-view .media-kit-caption {
        font-size: 0.875rem !important;
        line-height: 1.5 !important;
        font-weight: 500 !important;
      }
    `,
    []
  );

  // Helper function to ensure all content is loaded
  const ensureContentLoaded = useCallback(async (element) => {
    // Ensure images are loaded
    const images = element.querySelectorAll('img');
    const imageLoadPromises = Array.from(images).map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; // Handle error case too
      });
    });

    // Ensure iframes are loaded (best effort)
    const iframes = element.querySelectorAll('iframe');
    const iframeLoadPromises = Array.from(iframes).map(
      (iframe) =>
        new Promise((resolve) => {
          if (iframe.contentDocument?.readyState === 'complete') {
            resolve();
            return;
          }

          iframe.onload = resolve;
          // Set a backup timeout in case iframe doesn't load
          setTimeout(resolve, 2000);
        })
    );

    // Wait for all content to load
    await Promise.all([...imageLoadPromises, ...iframeLoadPromises]);

    // Additional delay to ensure all rendering is complete
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setCaptureState('capturing');
  }, []);

  // Function to capture screenshot
  const captureScreenshot = useCallback(
    async (isMobile = false) => {
      try {
        setCaptureLoading(true);
        setCaptureState('preparing');

        // Choose which element to capture based on screen size
        const element = isDesktop ? containerRef.current : desktopLayoutRef.current;

        if (!element) {
          setSnackbar({
            open: true,
            message: 'Could not find media kit element',
            severity: 'error',
          });
          return;
        }

        if (isDesktop) {
          // Desktop direct capture method
          // Save current scroll position
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

          // Hide share buttons and back button during capture
          let desktopButtonDisplay = null;
          let backButtonDisplay = null;
          let logoContainerOriginalMargin = null;

          if (desktopShareButtonRef.current) {
            desktopButtonDisplay = desktopShareButtonRef.current.style.display;
            desktopShareButtonRef.current.style.display = 'none';
          }

          if (backButtonRef.current) {
            backButtonDisplay = backButtonRef.current.style.display;
            backButtonRef.current.style.display = 'none';
          }

          // Add top margin to logo container to compensate for hidden back button
          if (logoContainerRef.current) {
            logoContainerOriginalMargin = logoContainerRef.current.style.marginTop;
            logoContainerRef.current.style.marginTop = '32px';
          }

          // Scroll to top to ensure entire content is visible
          window.scrollTo(0, 0);

          // Ensure all images and iframes are loaded
          await ensureContentLoaded(element);

          // Take the screenshot
          const dataUrl = await toPng(element, {
            quality: 0.95,
            pixelRatio: 2,
            backgroundColor: '#ffffff',
            height: element.scrollHeight,
            width: 1200,
            cacheBust: true,
          });

          // Restore share button and back button visibility
          if (desktopShareButtonRef.current) {
            desktopShareButtonRef.current.style.display = desktopButtonDisplay;
          }

          if (backButtonRef.current) {
            backButtonRef.current.style.display = backButtonDisplay;
          }

          // Restore logo container margin
          if (logoContainerRef.current) {
            logoContainerRef.current.style.marginTop = logoContainerOriginalMargin;
          }

          // Restore scroll position
          window.scrollTo(0, scrollTop);

          setCaptureState('processing');

          if (!isMobile) {
            // Create and trigger download for desktop
            const link = document.createElement('a');
            link.download = `${data?.creator?.mediaKit?.displayName || data?.name}_Media_Kit.png`;
            link.href = dataUrl;
            link.click();
          } else {
            // Open in-page preview for mobile
            setMobilePreview({
              open: true,
              imageUrl: dataUrl,
            });
          }
        } else {
          // Small screen method using hidden desktop layout
          // Temporarily apply a style fix to remove extra padding
          const styleFixForMedia = document.createElement('style');
          styleFixForMedia.textContent = getScreenshotStyles();
          document.head.appendChild(styleFixForMedia);

          // Make the desktop layout visible just for the capture
          const originalVisibility = element.style.visibility;
          const originalPosition = element.style.position;
          const originalLeft = element.style.left;
          const originalZIndex = element.style.zIndex;

          // Add class for CSS override
          element.classList.add('desktop-screenshot-view');

          // Temporarily make the element visible but off-screen for rendering
          element.style.visibility = 'visible';
          element.style.position = 'fixed';
          element.style.left = '0';
          element.style.top = '0';
          element.style.zIndex = '-1';

          // Ensure all images and iframes are loaded
          await ensureContentLoaded(element);

          // Take the screenshot
          const dataUrl = await toPng(element, {
            quality: 0.95,
            pixelRatio: 2,
            backgroundColor: '#ffffff',
            height: element.scrollHeight,
            width: element.scrollWidth,
            cacheBust: true,
          });

          // Restore original styles
          element.style.visibility = originalVisibility;
          element.style.position = originalPosition;
          element.style.left = originalLeft;
          element.style.zIndex = originalZIndex;
          element.classList.remove('desktop-screenshot-view');

          // Remove temporary style fix
          document.head.removeChild(styleFixForMedia);

          setCaptureState('processing');

          if (!isMobile) {
            // Create and trigger download for desktop
            const link = document.createElement('a');
            link.download = `${data?.creator?.mediaKit?.displayName || data?.name}_Media_Kit.png`;
            link.href = dataUrl;
            link.click();
          } else {
            // Open in-page preview for mobile
            setMobilePreview({
              open: true,
              imageUrl: dataUrl,
            });
          }
        }

        const successMessage = isMobile ? 'Done!' : 'Screenshot saved successfully!';

        setSnackbar({
          open: true,
          message: successMessage,
          severity: 'success',
        });
        setCaptureState('complete');
      } catch (error) {
        console.error('Error capturing screenshot:', error);
        setSnackbar({
          open: true,
          message: 'Failed to capture screenshot',
          severity: 'error',
        });
      } finally {
        setTimeout(() => {
          setCaptureLoading(false);
          setCaptureState('idle');
        }, 500);
      }
    },
    [
      data?.creator?.mediaKit?.displayName,
      data?.name,
      isDesktop,
      getScreenshotStyles,
      ensureContentLoaded,
    ]
  );

  // Function to capture PDF
  const capturePdf = useCallback(async () => {
    try {
      setCaptureLoading(true);
      setCaptureState('preparing');

      const element = isDesktop ? containerRef.current : desktopLayoutRef.current;

      if (!element) {
        setSnackbar({
          open: true,
          message: 'Could not find media kit element',
          severity: 'error',
        });
        return;
      }

      let dataUrl;

      if (isDesktop) {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        let desktopButtonDisplay = null;
        let backButtonDisplay = null;
        let logoContainerOriginalMargin = null;
        
        if (desktopShareButtonRef.current) {
          desktopButtonDisplay = desktopShareButtonRef.current.style.display;
          desktopShareButtonRef.current.style.display = 'none';
        }
        
        if (backButtonRef.current) {
          backButtonDisplay = backButtonRef.current.style.display;
          backButtonRef.current.style.display = 'none';
        }
        
        // Add top margin to logo container to compensate for hidden back button
        if (logoContainerRef.current) {
          logoContainerOriginalMargin = logoContainerRef.current.style.marginTop;
          logoContainerRef.current.style.marginTop = '32px';
        }
        
        window.scrollTo(0, 0);

        // Ensure all images and iframes are loaded
        await ensureContentLoaded(element);

        dataUrl = await toPng(element, {
          quality: 1.0,
          pixelRatio: 4,
          backgroundColor: '#ffffff',
          height: element.scrollHeight,
          width: 1200,
          cacheBust: true,
        });

        if (desktopShareButtonRef.current) {
          desktopShareButtonRef.current.style.display = desktopButtonDisplay;
        }
        
        if (backButtonRef.current) {
          backButtonRef.current.style.display = backButtonDisplay;
        }
        
        // Restore logo container margin
        if (logoContainerRef.current) {
          logoContainerRef.current.style.marginTop = logoContainerOriginalMargin;
        }
        
        window.scrollTo(0, scrollTop);
      } else {
        const styleFixForMedia = document.createElement('style');
        styleFixForMedia.textContent = getScreenshotStyles();
        document.head.appendChild(styleFixForMedia);

        element.classList.add('desktop-screenshot-view');
        const originalVisibility = element.style.visibility;
        const originalPosition = element.style.position;
        const originalLeft = element.style.left;
        const originalZIndex = element.style.zIndex;

        element.style.visibility = 'visible';
        element.style.position = 'fixed';
        element.style.left = '0';
        element.style.top = '0';
        element.style.zIndex = '-1';

        // Ensure all images and iframes are loaded
        await ensureContentLoaded(element);

        dataUrl = await toPng(element, {
          quality: 1.0,
          pixelRatio: 4,
          backgroundColor: '#ffffff',
          height: element.scrollHeight,
          width: element.scrollWidth,
          cacheBust: true,
        });

        element.style.visibility = originalVisibility;
        element.style.position = originalPosition;
        element.style.left = originalLeft;
        element.style.zIndex = originalZIndex;
        element.classList.remove('desktop-screenshot-view');
        document.head.removeChild(styleFixForMedia);
      }

      setCaptureState('processing');
      // Create a new image to get the dimensions
      const img = new Image();
      img.src = dataUrl;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Use a standard A4 page size (595.28 x 841.89 points in portrait)
      const pdfWidth = 595.28;
      const pdfHeight = 841.89;

      // Calculate the aspect ratio of the image
      const imgRatio = img.width / img.height;

      // Calculate dimensions to fit the image within the PDF page
      // while maintaining aspect ratio
      let imgWidth = pdfWidth;
      let imgHeight = pdfWidth / imgRatio;

      // If the height is too large, scale based on height instead
      if (imgHeight > pdfHeight) {
        imgHeight = pdfHeight;
        imgWidth = pdfHeight * imgRatio;
      }

      // Center the image on the page
      const xOffset = (pdfWidth - imgWidth) / 2;
      const yOffset = (pdfHeight - imgHeight) / 2;

      // eslint-disable-next-line new-cap
      const pdf = new jsPDF({
        orientation: 'p', // portrait
        unit: 'pt', // points
        format: 'a4', // A4 paper size
        compress: false, // Disable compression for better quality
      });

      // Add the image to the PDF with proper scaling and high quality
      pdf.addImage(dataUrl, 'PNG', xOffset, yOffset, imgWidth, imgHeight, undefined, 'FAST');

      pdf.save(`${data?.creator?.mediaKit?.displayName || data?.name}_Media_Kit.pdf`);

      setSnackbar({
        open: true,
        message: 'PDF saved successfully!',
        severity: 'success',
      });
      setCaptureState('complete');
    } catch (error) {
      console.error('Error capturing PDF:', error);
      setSnackbar({
        open: true,
        message: 'Failed to capture PDF',
        severity: 'error',
      });
    } finally {
      setTimeout(() => {
        setCaptureLoading(false);
        setCaptureState('idle');
      }, 500);
    }
  }, [
    data?.creator?.mediaKit?.displayName,
    data?.name,
    isDesktop,
    getScreenshotStyles,
    ensureContentLoaded,
  ]);

  // Helper functions for the menu
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event) => {
    if (event) event.stopPropagation();
    setMenuAnchorEl(null);
  };

  // Function to close mobile preview
  const closeMobilePreview = () => {
    setMobilePreview({
      open: false,
      imageUrl: '',
    });
  };

  // Helper function to get button text based on loading state
  const getButtonText = useCallback(() => {
    if (!captureLoading) return 'Share';

    switch (captureState) {
      case 'rendering':
        return 'Loading...';
      case 'capturing':
        return 'Capturing...';
      case 'processing':
        return 'Processing...';
      default:
        return 'Working...';
    }
  }, [captureLoading, captureState]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress
          thickness={7}
          size={25}
          sx={{
            color: theme.palette.common.black,
            strokeLinecap: 'round',
          }}
        />
      </Box>
    );
  }

  if (isError) {
    return <div>Error loading creator data</div>;
  }

  return (
    <>
      <Container
        maxWidth="xl"
        sx={{
          position: 'relative',
          bgcolor: '#FFFFFF',
          minHeight: '100vh',
          pb: 8,
          mb: 6,
          overflow: 'visible',
          height: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
        ref={containerRef}
      >
        {/* Back Button */}
        <Box sx={{ mb: 2, mt: 2 }} ref={backButtonRef}>
          <IconButton
            onClick={() => router.push(paths.dashboard.creator.mediaKitLists)}
            sx={{
              backgroundColor: 'white',
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
            }}
          >
            <Iconify icon="eva:arrow-back-fill" width={24} />
          </IconButton>
        </Box>

        {/* Desktop View */}
        <Box
          sx={{
            display: { xs: 'none', md: 'block' },
            position: 'absolute',
            top: 20,
            right: 24,
            zIndex: 10,
          }}
          ref={desktopShareButtonRef}
        >
          <Button
            variant="contained"
            onClick={handleMenuOpen}
            disabled={captureLoading}
            sx={{
              backgroundColor: '#1340FF',
              color: '#FFFFFF',
              borderRadius: 1.25,
              borderBottom: '3px solid #10248c',
              '&:hover': {
                backgroundColor: '#1340FF',
                opacity: 0.9,
                borderBottom: '3px solid #10248c',
              },
              px: 3,
              fontWeight: 600,
              fontSize: 16,
              height: 44,
            }}
          >
            {getButtonText()}
          </Button>
          <Menu
            anchorEl={menuAnchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
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
                  mt: 1,
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
              onClick={(event) => {
                event.stopPropagation();
                captureScreenshot();
                handleMenuClose();
              }}
              sx={{
                borderRadius: 1,
                backgroundColor: 'white',
                color: 'black',
                fontWeight: 600,
                fontSize: '0.95rem',
                p: 1.5,
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              Download as Image
            </MenuItem>
            <MenuItem
              onClick={(event) => {
                event.stopPropagation();
                capturePdf();
                handleMenuClose();
              }}
              sx={{
                borderRadius: 1,
                backgroundColor: 'white',
                color: 'black',
                fontWeight: 600,
                fontSize: '0.95rem',
                p: 1.5,
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              Download as PDF
            </MenuItem>
          </Menu>
        </Box>

        {/* Mobile View */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          width="100%"
          mb={{ xs: 3, sm: 4, md: 6 }}
          ref={logoContainerRef}
        >
          <Box
            component="img"
            src="/logo/cultcreativelogo.svg"
            alt="Cult Creative Logo"
            draggable="false"
            sx={{
              height: { xs: 60, sm: 100, md: 120 },
            }}
          />
          {/* Mobile Share Button */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }} ref={mobileShareButtonRef}>
            <Button
              variant="contained"
              onClick={handleMenuOpen}
              disabled={captureLoading}
              sx={{
                backgroundColor: '#1340FF',
                color: '#FFFFFF',
                borderRadius: 1.25,
                borderBottom: '3px solid #10248c',
                '&:hover': {
                  backgroundColor: '#1340FF',
                  opacity: 0.9,
                  borderBottom: '3px solid #10248c',
                },
                px: 3,
                fontWeight: 600,
                fontSize: 14,
                height: 40,
              }}
            >
              {getButtonText()}
            </Button>
            <Menu
              anchorEl={menuAnchorEl}
              open={menuOpen}
              onClose={handleMenuClose}
              onClick={handleMenuClose}
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
                    mt: 1,
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
                onClick={(event) => {
                  event.stopPropagation();
                  captureScreenshot(mdDown);
                  handleMenuClose();
                }}
                sx={{
                  borderRadius: 1,
                  backgroundColor: 'white',
                  color: 'black',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  p: 1.5,
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                }}
              >
                {mdDown ? 'Download as Image' : 'Download as Image'}
              </MenuItem>
              <MenuItem
                onClick={(event) => {
                  event.stopPropagation();
                  capturePdf();
                  handleMenuClose();
                }}
                sx={{
                  borderRadius: 1,
                  backgroundColor: 'white',
                  color: 'black',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  p: 1.5,
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                }}
              >
                Download as PDF
              </MenuItem>
            </Menu>
          </Box>
        </Stack>

        {/* Creator Details */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 4, md: 15 }}
          justifyContent="space-between"
        >
          <Stack flex="1">
            <Stack direction="row" alignItems="center">
              <Typography
                sx={{
                  fontFamily: 'Aileron, sans-serif',
                  fontWeight: 400,
                  fontSize: 40,
                }}
              >
                {data?.creator?.mediaKit?.displayName ?? data?.name}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography fontSize={16} color="#231F20">
                {data?.creator?.pronounce}
              </Typography>
              <Iconify icon="mdi:dot" color="#231F20" />
              <Typography fontSize={16} color="#231F20">
                {data?.country}
              </Typography>
              <Iconify icon="mdi:dot" color="#231F20" />
              <Typography fontSize={16} color="#231F20">
                {data?.email}
              </Typography>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1} mt={2} flexWrap="wrap">
              {data?.creator?.interests.map((interest) => (
                <Chip
                  key={interest?.id}
                  label={interest.name.toUpperCase()}
                  sx={{
                    bgcolor: '#FFF',
                    border: 1,
                    borderColor: '#EBEBEB',
                    borderRadius: 0.8,
                    color: '#8E8E93',
                    height: '32px',
                    boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
                    '& .MuiChip-label': {
                      fontWeight: 600,
                      px: 1.5,
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '-3px',
                    },
                    '&:hover': { bgcolor: '#FFF' },
                  }}
                />
              ))}
            </Stack>

            <Avatar
              sx={{
                mt: 2,
                width: { xs: 150, sm: 200, md: 240 },
                height: { xs: 150, sm: 200, md: 240 },
              }}
              src={data?.photoURL}
            />

            <Typography
              sx={{
                fontSize: 14,
                color: '#231F20',
                fontWeight: 400,
                fontFamily: 'Aileron, sans-serif',
              }}
              my={1}
              mt={2}
              mb={2}
            >
              {data?.creator?.mediaKit?.about}
            </Typography>
          </Stack>

          {/* Social Media Stats */}
          <Stack
            flex="1"
            alignItems={{ xs: 'start', md: 'flex-start' }}
            spacing={3}
            sx={{
              mt: { xs: 4, md: 0 },
              ml: { xs: 0, md: 18 },
              width: '100%',
            }}
          >
            {/* Divider for mobile screens only */}
            <Box
              sx={{
                display: { xs: 'block', sm: 'none' },
                width: '100%',
                height: '1px',
                backgroundColor: '#E7E7E7',
                mb: 2,
              }}
            />

            {/* Total Audience Section */}
            <Stack alignItems="flex-start" sx={{ pl: { xs: 0, sm: 0 } }}>
              <Typography
                variant="h2"
                color="#231F20"
                fontFamily="Aileron, sans-serif"
                fontWeight={900}
                component={m.div}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{
                  duration: 1,
                  type: 'spring',
                }}
                lineHeight={0.5}
                mb={1}
                align="left"
                sx={{ fontSize: { xs: '3rem', md: '4rem' } }}
              >
                {/* Total audience value - can be added later */}
                {formatNumber(socialMediaAnalytics.followers)}
              </Typography>
              <Box
                component="span"
                sx={{
                  color: '#231F20',
                  fontSize: { xs: '2rem', md: '3rem' },
                  fontFamily: 'Aileron, sans-serif',
                  fontWeight: 300,
                  // letterSpacing: '0.05em',
                  textAlign: 'left',
                  display: 'block',
                }}
              >
                Total Audience
              </Box>
            </Stack>

            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              my={2}
              color="text.secondary"
              sx={{ pl: { xs: 0, sm: 0 } }}
            >
              <Button
                variant="outlined"
                startIcon={<Iconify icon="mdi:instagram" width={24} />}
                sx={{
                  fontSize: '1rem',
                  py: 1.5,
                  px: 3,
                  minWidth: '140px',
                  height: '48px',
                  borderWidth: 2,
                  borderColor: currentTab === 'instagram' ? '#1340FF' : 'rgba(0, 0, 0, 0.12)',
                  ...(currentTab === 'instagram' && {
                    color: theme.palette.mode === 'light' ? '#1340FF' : '#4e70ff',
                    boxShadow: 'none',
                    borderColor: '#1340FF',
                    borderWidth: 2,
                  }),
                }}
                onClick={() => setCurrentTab('instagram')}
              >
                Instagram
              </Button>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="ic:baseline-tiktok" width={24} />}
                sx={{
                  fontSize: '1rem',
                  py: 1.5,
                  px: 3,
                  minWidth: '140px',
                  height: '48px',
                  borderWidth: 2,
                  borderColor: currentTab === 'tiktok' ? '#1340FF' : 'rgba(0, 0, 0, 0.12)',
                  ...(currentTab === 'tiktok' && {
                    color: theme.palette.mode === 'light' ? '#1340FF' : '#4e70ff',
                    boxShadow: 'none',
                    borderColor: '#1340FF',
                    borderWidth: 2,
                  }),
                }}
                onClick={() => setCurrentTab('tiktok')}
              >
                TikTok
              </Button>
            </Stack>

            {!smDown && (
              <Stack width="100%">
                <Stack
                  direction="row"
                  alignItems="flex-start"
                  justifyContent="flex-start"
                  spacing={6}
                  flexWrap={{ xs: 'wrap', md: 'nowrap' }}
                  sx={{
                    p: 2,
                  }}
                >
                  <Stack spacing={2}>
                    {/* Followers */}
                    <Stack alignItems="flex-start">
                      <Typography
                        color="#1340FF"
                        fontFamily="Instrument Serif"
                        fontWeight={400}
                        component={m.div}
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        transition={{
                          duration: 1,
                          type: 'spring',
                        }}
                        lineHeight={1}
                        mb={1}
                        align="left"
                        sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' } }}
                      >
                        {formatNumber(socialMediaAnalytics.followers)}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="#1340FF"
                        fontFamily="Aileron, sans-serif"
                        fontWeight={600}
                        align="left"
                        sx={{ fontSize: { xs: '0.9rem', md: '1.3rem' } }}
                      >
                        Followers
                      </Typography>
                    </Stack>

                    {/* Divider */}
                    <Box
                      sx={{
                        width: 140,
                        height: '1px',
                        backgroundColor: '#1340FF',
                        mt: 3,
                        mb: 2,
                      }}
                    />

                    {/* Average likes */}
                    <Stack alignItems="flex-start">
                      <Typography
                        color="#1340FF"
                        fontWeight={400}
                        fontFamily="Instrument Serif"
                        component={m.div}
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        transition={{
                          duration: 1,
                          type: 'spring',
                        }}
                        lineHeight={1}
                        mb={1}
                        align="left"
                        sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' } }}
                      >
                        {socialMediaAnalytics.averageLikes?.toFixed(2)}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="#1340FF"
                        fontFamily="Aileron, sans-serif"
                        fontWeight={600}
                        align="left"
                        sx={{ fontSize: { xs: '0.9rem', md: '1.3rem' } }}
                      >
                        Avg Likes
                      </Typography>
                    </Stack>
                  </Stack>

                  <Stack spacing={2}>
                    {/* Average Comments */}
                    <Stack alignItems="flex-start">
                      <Typography
                        fontWeight={400}
                        color="#1340FF"
                        fontFamily="Instrument Serif"
                        component={m.div}
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        transition={{
                          duration: 1,
                          type: 'spring',
                        }}
                        lineHeight={1}
                        mb={1}
                        align="left"
                        sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' } }}
                      >
                        {socialMediaAnalytics.averageComments?.toFixed(2)}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="#1340FF"
                        fontFamily="Aileron, sans-serif"
                        fontWeight={600}
                        align="left"
                        sx={{ fontSize: { xs: '0.9rem', md: '1.3rem' } }}
                      >
                        Avg Comments
                      </Typography>
                    </Stack>

                    {/* Divider */}
                    <Box
                      sx={{
                        width: 140,
                        height: '1px',
                        backgroundColor: '#1340FF',
                        mt: 3,
                        mb: 2,
                      }}
                    />

                    {/* Total Engagement */}
                    <Stack alignItems="flex-start">
                      <Typography
                        fontWeight={400}
                        color="#1340FF"
                        fontFamily="Instrument Serif"
                        component={m.div}
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        transition={{
                          duration: 1,
                          type: 'spring',
                        }}
                        lineHeight={1}
                        mb={1}
                        align="left"
                        sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' } }}
                      >
                        {socialMediaAnalytics.engagement_rate}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="#1340FF"
                        fontFamily="Aileron, sans-serif"
                        fontWeight={600}
                        align="left"
                        sx={{ fontSize: { xs: '0.9rem', md: '1.3rem' } }}
                      >
                        Total Engagement
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
              </Stack>
            )}
          </Stack>
        </Stack>

        {smDown && (
          <Stack spacing={3} sx={{ py: 2, my: 2 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              spacing={0.5}
              sx={{ width: '100%', pl: 1, pr: 1 }}
            >
              {/* Followers */}
              <Stack alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="h6"
                  color="#1340FF"
                  fontWeight={700}
                  fontFamily="Instrument Serif"
                  mb={0.5}
                  align="left"
                  sx={{ fontSize: { xs: '2rem', sm: '2.5rem' } }}
                >
                  {formatNumber(socialMediaAnalytics.followers)}
                </Typography>
                <Typography
                  variant="caption"
                  color="#1340FF"
                  fontFamily="Aileron, sans-serif"
                  fontWeight={600}
                  align="left"
                  sx={{ fontSize: { xs: '0.75rem', sm: '1rem' } }}
                >
                  Followers
                </Typography>
              </Stack>

              {/* Average likes */}
              <Stack alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="h6"
                  color="#1340FF"
                  fontWeight={700}
                  fontFamily="Instrument Serif"
                  mb={0.5}
                  align="left"
                  sx={{ fontSize: { xs: '2rem', sm: '2.5rem' } }}
                >
                  {socialMediaAnalytics.averageLikes?.toFixed(2)}
                </Typography>
                <Typography
                  variant="caption"
                  color="#1340FF"
                  fontFamily="Aileron, sans-serif"
                  fontWeight={600}
                  align="left"
                  sx={{ fontSize: { xs: '0.75rem', sm: '1rem' } }}
                >
                  Avg Likes
                </Typography>
              </Stack>

              {/* Average Comments */}
              <Stack alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="h6"
                  color="#1340FF"
                  fontWeight={700}
                  fontFamily="Instrument Serif"
                  mb={0.5}
                  align="left"
                  sx={{ fontSize: { xs: '2rem', sm: '2.5rem' } }}
                >
                  {socialMediaAnalytics.averageComments?.toFixed(2)}
                </Typography>
                <Typography
                  variant="caption"
                  color="#1340FF"
                  fontFamily="Aileron, sans-serif"
                  fontWeight={600}
                  align="left"
                  sx={{ fontSize: { xs: '0.75rem', sm: '1rem' } }}
                >
                  Avg Comments
                </Typography>
              </Stack>

              {/* Total Engagement */}
              <Stack alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="h6"
                  color="#1340FF"
                  fontWeight={700}
                  fontFamily="Instrument Serif"
                  mb={0.5}
                  align="left"
                  sx={{ fontSize: { xs: '2rem', sm: '2.5rem' } }}
                >
                  {socialMediaAnalytics.engagement_rate}
                </Typography>
                <Typography
                  variant="caption"
                  color="#1340FF"
                  fontFamily="Aileron, sans-serif"
                  fontWeight={600}
                  align="left"
                  sx={{ fontSize: { xs: '0.75rem', sm: '1rem' } }}
                >
                  Total Engagement
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        )}

        {/* <Divider sx={{ my: 3 }} /> */}
        {/* Bottom View */}

        <Typography fontWeight={700} fontFamily="Aileron, sans-serif" fontSize="24px" mb={1} mt={3}>
          Top Content{' '}
          {/* {socialMediaAnalytics?.username && `of ${socialMediaAnalytics?.username}`} */}
        </Typography>

        <MediaKitSocial currentTab={currentTab} data={data} sx={{ mb: 4 }} />
      </Container>

      {/* ----------------------------------------------------------------------------------------------------------------------------------------------------------*/}

      {/* Hidden Desktop-only Layout for Screenshot */}
      <Container
        maxWidth="xl"
        sx={{
          position: 'absolute',
          left: '-9999px',
          visibility: 'hidden',
          bgcolor: '#FFFFFF',
          width: '1200px',
          height: 'auto',
          overflow: 'visible',
          pb: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
        ref={desktopLayoutRef}
        className="desktop-screenshot-view"
      >
        {/* Logo Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          width="100%"
          mb={4}
          mt={2}
        >
          <Box
            component="img"
            src="/logo/cultcreativelogo.svg"
            alt="Cult Creative Logo"
            draggable="false"
            sx={{ height: 120 }}
          />
        </Stack>

        {/* Creator Details - Desktop Layout with adjusted spacing */}
        <Stack direction="row" spacing={8} justifyContent="space-between">
          <Stack flex="1.2">
            <Stack direction="row" alignItems="center">
              <Typography
                sx={{
                  fontFamily: 'Aileron, sans-serif',
                  fontWeight: 400,
                  fontSize: 48,
                }}
              >
                {data?.creator?.mediaKit?.displayName ?? data?.name}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography fontSize={16} color="#231F20">
                {data?.creator?.pronounce}
              </Typography>
              <Iconify icon="mdi:dot" color="#231F20" />
              <Typography fontSize={16} color="#231F20">
                {data?.country}
              </Typography>
              <Iconify icon="mdi:dot" color="#231F20" />
              <Typography fontSize={16} color="#231F20">
                {data?.email}
              </Typography>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1} mt={2} flexWrap="wrap">
              {data?.creator?.interests.map((interest) => (
                <Chip
                  key={interest?.id}
                  label={interest.name.toUpperCase()}
                  sx={{
                    bgcolor: '#FFF',
                    border: 1,
                    borderColor: '#EBEBEB',
                    borderRadius: 0.8,
                    color: '#8E8E93',
                    height: '32px',
                    boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
                    '& .MuiChip-label': {
                      fontWeight: 600,
                      px: 1.5,
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '-3px',
                    },
                    '&:hover': { bgcolor: '#FFF' },
                  }}
                />
              ))}
            </Stack>

            <Avatar
              sx={{
                mt: 2,
                width: 240,
                height: 240,
              }}
              src={data?.photoURL}
            />

            <Typography
              sx={{
                fontSize: 14,
                color: '#231F20',
                fontWeight: 400,
                fontFamily: 'Aileron, sans-serif',
              }}
              my={1}
              mt={2}
              mb={2}
            >
              {data?.creator?.mediaKit?.about}
            </Typography>
          </Stack>

          {/* Social Media Stats - with reduced width */}
          <Stack flex="0.8" alignItems="flex-start" spacing={3}>
            {/* Total Audience Section */}
            <Stack alignItems="flex-start">
              <Typography
                variant="h2"
                color="#231F20"
                fontFamily="Aileron, sans-serif"
                fontWeight={900}
                lineHeight={0.5}
                mb={1}
                align="left"
                sx={{ fontSize: '4rem' }}
              >
                {formatNumber(socialMediaAnalytics.followers)}
              </Typography>
              <Box
                component="span"
                sx={{
                  color: '#231F20',
                  fontSize: '3rem',
                  fontFamily: 'Aileron, sans-serif',
                  fontWeight: 300,
                  textAlign: 'left',
                  display: 'block',
                }}
              >
                Total Audience
              </Box>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1} my={2} color="text.secondary">
              <Button
                variant="outlined"
                startIcon={<Iconify icon="mdi:instagram" width={24} />}
                sx={{
                  fontSize: '1rem',
                  py: 1.5,
                  px: 3,
                  minWidth: '140px',
                  height: '48px',
                  borderWidth: 2,
                  borderColor: currentTab === 'instagram' ? '#1340FF' : 'rgba(0, 0, 0, 0.12)',
                  ...(currentTab === 'instagram' && {
                    color: '#1340FF',
                    boxShadow: 'none',
                    borderColor: '#1340FF',
                    borderWidth: 2,
                  }),
                }}
              >
                Instagram
              </Button>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="ic:baseline-tiktok" width={24} />}
                sx={{
                  fontSize: '1rem',
                  py: 1.5,
                  px: 3,
                  minWidth: '140px',
                  height: '48px',
                  borderWidth: 2,
                  borderColor: currentTab === 'tiktok' ? '#1340FF' : 'rgba(0, 0, 0, 0.12)',
                  ...(currentTab === 'tiktok' && {
                    color: '#1340FF',
                    boxShadow: 'none',
                    borderColor: '#1340FF',
                    borderWidth: 2,
                  }),
                }}
              >
                TikTok
              </Button>
            </Stack>

            <Stack width="100%">
              <Stack
                direction="row"
                alignItems="flex-start"
                justifyContent="flex-start"
                spacing={6}
                sx={{ p: 2 }}
              >
                <Stack spacing={2}>
                  {/* Followers */}
                  <Stack alignItems="flex-start">
                    <Typography
                      fontWeight={400}
                      color="#1340FF"
                      fontFamily="Instrument Serif"
                      lineHeight={1}
                      mb={1}
                      align="left"
                      sx={{ fontSize: '3.5rem' }}
                    >
                      {formatNumber(socialMediaAnalytics.followers)}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="#1340FF"
                      fontFamily="Aileron, sans-serif"
                      fontWeight={600}
                      align="left"
                      sx={{ fontSize: '1.3rem' }}
                    >
                      Followers
                    </Typography>
                  </Stack>

                  {/* Divider */}
                  <Box
                    sx={{
                      width: 140,
                      height: '1px',
                      backgroundColor: '#1340FF',
                      mt: 3,
                      mb: 2,
                    }}
                  />

                  {/* Average likes */}
                  <Stack alignItems="flex-start">
                    <Typography
                      fontWeight={400}
                      color="#1340FF"
                      fontFamily="Instrument Serif"
                      lineHeight={1}
                      mb={1}
                      align="left"
                      sx={{ fontSize: '3.5rem' }}
                    >
                      {socialMediaAnalytics.averageLikes?.toFixed(2)}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="#1340FF"
                      fontFamily="Aileron, sans-serif"
                      fontWeight={600}
                      align="left"
                      sx={{ fontSize: '1.3rem' }}
                    >
                      Avg Likes
                    </Typography>
                  </Stack>
                </Stack>

                <Stack spacing={2}>
                  {/* Average Comments */}
                  <Stack alignItems="flex-start">
                    <Typography
                      fontWeight={400}
                      color="#1340FF"
                      fontFamily="Instrument Serif"
                      lineHeight={1}
                      mb={1}
                      align="left"
                      sx={{ fontSize: '3.5rem' }}
                    >
                      {socialMediaAnalytics.averageComments?.toFixed(2)}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="#1340FF"
                      fontFamily="Aileron, sans-serif"
                      fontWeight={600}
                      align="left"
                      sx={{ fontSize: '1.3rem' }}
                    >
                      Avg Comments
                    </Typography>
                  </Stack>

                  {/* Divider */}
                  <Box
                    sx={{
                      width: 140,
                      height: '1px',
                      backgroundColor: '#1340FF',
                      mt: 3,
                      mb: 2,
                    }}
                  />

                  {/* Total Engagement */}
                  <Stack alignItems="flex-start">
                    <Typography
                      fontWeight={400}
                      color="#1340FF"
                      fontFamily="Instrument Serif"
                      lineHeight={1}
                      mb={1}
                      align="left"
                      sx={{ fontSize: '3.5rem' }}
                    >
                      {socialMediaAnalytics.engagement_rate}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="#1340FF"
                      fontFamily="Aileron, sans-serif"
                      fontWeight={600}
                      align="left"
                      sx={{ fontSize: '1.3rem' }}
                    >
                      Total Engagement
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Stack>
          </Stack>
        </Stack>

        <Box sx={{ flexGrow: 1 }}>
          <Typography
            fontWeight={700}
            fontFamily="Aileron, sans-serif"
            fontSize="24px"
            mb={1}
            mt={3}
          >
            Top Content
          </Typography>

          <MediaKitSocial
            currentTab={currentTab}
            className="desktop-screenshot-mediakit"
            forceDesktop
            sx={{
              '& > div > div': {
                flexDirection: 'row !important',
                width: '100%',
                justifyContent: 'flex-start !important',
                gap: '32px !important',
                '& > div': {
                  width: '350px !important',
                  minWidth: '350px !important',
                  maxWidth: '350px !important',
                  '& > div:first-of-type': {
                    height: '550px !important',
                  },
                },
              },
              '& iframe': {
                border: 'none !important',
                borderRadius: '4px !important',
                height: '100% !important',
                width: '100% !important',
              },
            }}
            data={data}
          />
        </Box>
      </Container>

      {/* Feedback Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Loading Backdrop */}
      <Backdrop
        sx={{
          color: '#fff',
          // zIndex: captureState === 'capturing' ? -1 : theme.zIndex.drawer + 1,
          zIndex: theme.zIndex.drawer + 1,
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          transition: 'all 0.3s ease-in-out',
        }}
        open={captureLoading}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.98)',
            borderRadius: 2,
            py: 4,
            px: { xs: 3, sm: 4 },
            width: { xs: '85%', sm: '340px' },
            boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            animation: captureLoading ? 'fadeIn 0.4s ease-out forwards' : 'none',
            '@keyframes fadeIn': {
              from: { opacity: 0, transform: 'scale(0.95)' },
              to: { opacity: 1, transform: 'scale(1)' },
            },
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: 80,
              height: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1,
              animation: captureLoading ? 'fadeInSpin 0.5s ease-out forwards' : 'none',
              '@keyframes fadeInSpin': {
                from: { opacity: 0, transform: 'rotate(-20deg)' },
                to: { opacity: 1, transform: 'rotate(0deg)' },
              },
            }}
          >
            {/* backdrop for circle */}
            <Box
              sx={{
                position: 'absolute',
                width: 70,
                height: 70,
                borderRadius: '50%',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                overflow: 'hidden',
                backgroundColor: '#2E3033',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                animation: captureLoading ? 'pulseIn 0.6s ease-out forwards' : 'none',
                '@keyframes pulseIn': {
                  '0%': { opacity: 0, transform: 'scale(0.9)' },
                  '70%': { opacity: 1, transform: 'scale(1.05)' },
                  '100%': { opacity: 1, transform: 'scale(1)' },
                },
              }}
            >
              {/* progress fill */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: (() => {
                    switch (captureState) {
                      case 'complete':
                        return '100%';
                      case 'processing':
                        return '75%';
                      case 'capturing':
                        return '50%';
                      case 'rendering':
                        return '25%';
                      default:
                        return '10%';
                    }
                  })(),
                  backgroundColor: '#1340FF',
                  transition: 'width 0.8s ease-out',
                }}
              />
            </Box>

            {/* Cult logo in the center */}
            <Box
              component="img"
              src="/logo/newlogo.svg"
              alt="Cult Creative"
              sx={{
                width: 32,
                height: 32,
                position: 'relative',
                zIndex: 2,
                filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
                animation: captureLoading ? 'popIn 0.6s 0.2s ease-out forwards' : 'none',
                opacity: 0,
                '@keyframes popIn': {
                  '0%': { opacity: 0, transform: 'scale(0.8)' },
                  '70%': { opacity: 1, transform: 'scale(1.1)' },
                  '100%': { opacity: 1, transform: 'scale(1)' },
                },
              }}
            />
          </Box>

          <Typography
            sx={{
              mt: 1.5,
              mb: 0.5,
              fontWeight: 600,
              fontSize: 16,
              color: '#231F20',
              fontFamily: 'Aileron, sans-serif',
              textAlign: 'center',
              letterSpacing: '0.01em',
              animation: captureLoading ? 'slideUp 0.5s 0.3s ease-out forwards' : 'none',
              opacity: 0,
              transform: 'translateY(10px)',
              '@keyframes slideUp': {
                to: { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            {captureState === 'preparing' && 'Preparing media kit...'}
            {captureState === 'rendering' && 'Loading all content...'}
            {captureState === 'capturing' && 'Capturing...'}
            {captureState === 'processing' && 'Finalizing download...'}
            {captureState === 'complete' && 'Download complete!'}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(0, 0, 0, 0.6)',
              fontFamily: 'Aileron, sans-serif',
              textAlign: 'center',
              maxWidth: '240px',
              fontSize: 13,
              lineHeight: 1.4,
              animation: captureLoading ? 'fadeIn 0.5s 0.4s ease-out forwards' : 'none',
              opacity: 0,
              '@keyframes fadeIn': {
                to: { opacity: 1 },
              },
            }}
          >
            Please wait while we prepare your Media Kit
          </Typography>
        </Box>
      </Backdrop>

      {/* Mobile Image Preview Modal */}
      <Dialog
        open={mobilePreview.open}
        onClose={closeMobilePreview}
        fullScreen
        PaperProps={{
          sx: {
            backgroundColor: 'rgb(0, 0, 0)',
            overflow: 'visible',
            position: 'relative',
          },
        }}
        sx={{
          zIndex: 9999,
          '& .MuiDialog-container': {
            alignItems: 'center',
            justifyContent: 'center',
          },
          '& .MuiDialog-paper': {
            m: 0,
            width: '100%',
            height: '100%',
          },
        }}
      >
        {/* Close button */}
        <Button
          onClick={closeMobilePreview}
          sx={{
            position: 'fixed',
            top: 20,
            right: 20,
            minWidth: '38px',
            width: '38px',
            height: '38px',
            p: 0,
            bgcolor: '#FFFFFF',
            color: '#000000',
            border: '1px solid #E7E7E7',
            borderBottom: '3px solid #E7E7E7',
            borderRadius: '8px',
            fontWeight: 650,
            zIndex: 9999,
            '&:hover': {
              bgcolor: '#F5F5F5',
            },
          }}
        >
          X
        </Button>

        {/* Image */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}
        >
          <Box
            component="img"
            src={mobilePreview.imageUrl}
            alt={`${data?.creator?.mediaKit?.displayName || data?.name} Media Kit`}
            sx={{
              maxWidth: '100%',
              maxHeight: '90vh',
              objectFit: 'contain',
            }}
          />
        </Box>

        {/* Instructions */}
        <Box
          className="instructions"
          sx={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'auto',
            maxWidth: '80%',
            backgroundColor: 'white',
            color: 'black',
            textAlign: 'center',
            padding: '8px 16px',
            fontFamily: 'sans-serif',
            borderRadius: 1.5,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          <svg
            width="18"
            height="20"
            viewBox="0 0 21 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20.4159 23.1476C17.8419 24.0328 15.2707 24.3719 12.6612 23.4632C12.1137 23.2722 11.6098 22.9566 11.0851 22.6993C9.16651 21.7591 7.24192 20.8303 5.33006 19.8767C3.9858 19.2066 2.92968 18.186 2.06322 16.9791C-2.48356 10.6471 0.867047 1.96836 8.37175 0.274291C11.2761 -0.381088 14.0035 0.148978 16.5198 1.74655C16.5975 1.79614 16.6833 1.8397 16.7469 1.9047C17.9592 3.13303 19.1688 4.36405 20.4152 5.63192V23.1476H20.4159ZM15.0086 2.41131C11.3203 0.561104 6.39354 1.38602 3.54486 5.14809C0.755807 8.83175 1.13778 14.0105 4.43009 17.2853C7.69894 20.5374 12.3576 20.4718 14.9966 18.9935V13.5916C13.0686 15.9552 9.82524 15.9913 7.88926 14.1338C6.05245 12.372 5.96065 9.42347 7.67348 7.50156C9.29919 5.67749 12.8321 5.12464 15.0086 7.82389V2.41131Z"
              fill="#1340FF"
            />
          </svg>
          Long-press the image to save to your gallery
        </Box>
      </Dialog>
    </>
  );
};

export default MediaKit;

// export default withPermission(['read'], 'admin', MediaKit);
