import jsPDF from 'jspdf';
import { m } from 'framer-motion';
import { toPng } from 'html-to-image';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import {
  Box,
  Chip,
  Menu,
  Stack,
  Alert,
  Avatar,
  Button,
  useTheme,
  Snackbar,
  MenuItem,
  Backdrop,
  Container,
  Typography,
  CircularProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import { useSocialMediaData } from 'src/utils/store';
import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';

import MediaKitSocial from './media-kit-social-view';

const MediaKitCreator = () => {
  const theme = useTheme();
  const smDown = useResponsive('down', 'sm');
  const mdDown = useResponsive('down', 'md');
  const isDesktop = useResponsive('up', 'md');
  const { user } = useAuthContext();
  const setTiktok = useSocialMediaData((state) => state.setTiktok);
  const setInstagram = useSocialMediaData((state) => state.setInstagram);
  const tiktok = useSocialMediaData((state) => state.tiktok);
  const instagram = useSocialMediaData((state) => state.instagram);
  const isLoading = useBoolean();
  const instaLoading = useBoolean();
  const containerRef = useRef(null);
  const desktopShareButtonRef = useRef(null);
  const mobileShareButtonRef = useRef(null);
  const [captureLoading, setCaptureLoading] = useState(false);
  const [captureState, setCaptureState] = useState('idle');
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const menuOpen = Boolean(menuAnchorEl);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const [currentTab, setCurrentTab] = useState('instagram');
  const [openSetting, setOpenSetting] = useState(false);

  const desktopLayoutRef = useRef(null);

  // Formatter for 1000+ numbers (e.g., 1000 => 1K)
  const formatNumber = useCallback((value) => {
    if (!value) return '0';
    const numValue = parseInt(value, 10);
    return numValue >= 1000 ? `${Math.floor(numValue / 1000)}K` : numValue.toString();
  }, []);

  const getInstagram = useCallback(async () => {
    try {
      instaLoading.onTrue();
      const res = await axiosInstance.get(endpoints.creators.social.instagramV2(user?.id));
      setInstagram(res.data);
    } catch (error) {
      return;
    } finally {
      instaLoading.onFalse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setInstagram]);

  const getTiktok = useCallback(async () => {
    try {
      isLoading.onTrue();
      const res = await axiosInstance.get(endpoints.creators.social.tiktok(user?.id));
      setTiktok(res.data);
    } catch (error) {
      return;
    } finally {
      isLoading.onFalse();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setTiktok]);

  const calculateEngagementRate = useCallback((totalLikes, followers) => {
    if (!(totalLikes || followers)) return null;
    return ((parseInt(totalLikes, 10) / parseInt(followers, 10)) * 100).toFixed(2);
  }, []);

  const socialMediaAnalytics = useMemo(() => {
    if (currentTab === 'instagram') {
      return {
        followers: instagram?.overview?.followers_count || 0,
        engagement_rate: `${
          calculateEngagementRate(
            (instagram?.medias?.totalLikes ?? 0) + (instagram?.medias?.totalComments ?? 0),
            instagram?.overview?.followers_count
          ) || 0
        }`,
        averageLikes: instagram?.medias?.averageLikes || 0,
        averageComments: instagram?.medias?.averageComments || 0,
        username: instagram?.instagramUser?.username,
      };
    }

    if (currentTab === 'tiktok') {
      return {
        followers: tiktok?.creator?.tiktokUser?.follower_count || 0,
        engagement_rate: tiktok?.creator?.tiktokUser?.follower_count || 0,
        averageLikes: tiktok?.creator?.tiktokUser?.likes_count || 0,
      };
    }

    return {
      followers: 0,
      engagement_rate: 0,
      averageLikes: 0,
    };
  }, [currentTab, tiktok, instagram, calculateEngagementRate]);

  // const handleClose = () => {
  //   setOpenSetting(!openSetting);
  // };

  // Helper function to ensure all images and iframes are loaded
  const ensureContentLoaded = useCallback(async (element) => {
    setCaptureState('rendering');
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
      /* Simple placeholder for Instagram/TikTok not connected */
      .desktop-screenshot-view .desktop-screenshot-mediakit [style*="height: 280px"] {
        height: 550px !important;
        width: 350px !important;
        min-width: 350px !important;
        max-width: 350px !important;
        background-color: #f5f5f5 !important;
        border: 1px solid #e0e0e0 !important;
        border-radius: 8px !important;
        position: relative !important;
      }
      
      /* Hide all existing content */
      .desktop-screenshot-view .desktop-screenshot-mediakit [style*="height: 280px"] > * {
        display: none !important;
      }
      
      /* Add "Instagram not connected" text using ::after */
      .desktop-screenshot-view .desktop-screenshot-mediakit [style*="height: 280px"]::after {
        content: "Instagram not connected" !important;
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        font-size: 16px !important;
        color: #666 !important;
        font-weight: 500 !important;
        text-align: center !important;
        font-family: 'Aileron, sans-serif' !important;
      }
    `,
    []
  );

  const captureScreenshot = useCallback(async () => {
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

        // Hide share buttons during capture
        let desktopButtonDisplay = null;

        if (desktopShareButtonRef.current) {
          desktopButtonDisplay = desktopShareButtonRef.current.style.display;
          desktopShareButtonRef.current.style.display = 'none';
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

        // Restore share button visibility
        if (desktopShareButtonRef.current) {
          desktopShareButtonRef.current.style.display = desktopButtonDisplay;
        }

        // Restore scroll position
        window.scrollTo(0, scrollTop);

        setCaptureState('processing');
        // Create and trigger download
        const link = document.createElement('a');
        link.download = `${user?.creator?.mediaKit?.displayName || user?.name}_Media_Kit.png`;
        link.href = dataUrl;
        link.click();
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
        // Create and trigger download
        const link = document.createElement('a');
        link.download = `${user?.creator?.mediaKit?.displayName || user?.name}_Media_Kit.png`;
        link.href = dataUrl;
        link.click();
      }

      setSnackbar({
        open: true,
        message: 'Screenshot saved successfully!',
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
  }, [
    user?.creator?.mediaKit?.displayName,
    user?.name,
    isDesktop,
    getScreenshotStyles,
    ensureContentLoaded,
  ]);

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
        if (desktopShareButtonRef.current) {
          desktopButtonDisplay = desktopShareButtonRef.current.style.display;
          desktopShareButtonRef.current.style.display = 'none';
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

      // Also make a higher resolution version available for download
      const highResLink = document.createElement('a');
      highResLink.download = `${user?.creator?.mediaKit?.displayName || user?.name}_Media_Kit_HighRes.png`;
      highResLink.href = dataUrl;

      pdf.save(`${user?.creator?.mediaKit?.displayName || user?.name}_Media_Kit.pdf`);

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
    user?.creator?.mediaKit?.displayName,
    user?.name,
    isDesktop,
    getScreenshotStyles,
    ensureContentLoaded,
  ]);

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

  useEffect(() => {
    getInstagram();
    getTiktok();
  }, [getInstagram, getTiktok]);

  if (isLoading.value || instaLoading.value) {
    return (
      <Box position="absolute" top="50%" left="50%">
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
          mt={{ xs: 2, sm: 1.5, md: 2 }}
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
                  fontSize: 48,
                }}
              >
                {user?.creator?.mediaKit?.displayName ?? user?.name}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography fontSize={16} color="#231F20">
                {user?.creator?.pronounce}
              </Typography>
              <Iconify icon="mdi:dot" color="#231F20" />
              <Typography fontSize={16} color="#231F20">
                {user?.country}
              </Typography>
              <Iconify icon="mdi:dot" color="#231F20" />
              <Typography fontSize={16} color="#231F20">
                {user?.email}
              </Typography>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1} mt={2} flexWrap="wrap">
              {user?.creator?.interests.map((interest) => (
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
              src={user?.photoURL}
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
              {user?.creator?.mediaKit?.about}
            </Typography>
          </Stack>

          {/* Social Media Stats */}
          <Stack
            flex="1"
            alignItems={{ xs: 'start', md: 'flex-start' }}
            spacing={3}
            sx={{
              mt: { xs: 4, md: 0 },
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
                0 {/* Change to actual number later */}
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
                Tiktok
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
              spacing={1}
              sx={{ width: '100%', pl: 2 }}
            >
              {/* Followers */}
              <Stack alignItems="flex-start" sx={{ flex: 1 }}>
                <Typography
                  variant="h5"
                  color="#1340FF"
                  fontWeight={400}
                  fontFamily="Instrument Serif"
                  mb={1}
                  align="left"
                  sx={{ fontSize: { xs: '3rem', sm: '2.5rem' } }}
                >
                  {formatNumber(socialMediaAnalytics.followers)}
                </Typography>
                <Typography
                  variant="caption"
                  color="#1340FF"
                  fontFamily="Aileron, sans-serif"
                  fontWeight={600}
                  align="left"
                  sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                >
                  Followers
                </Typography>
              </Stack>

              {/* Average Comments */}
              <Stack alignItems="flex-start" sx={{ flex: 1 }}>
                <Typography
                  variant="h5"
                  color="#1340FF"
                  fontWeight={400}
                  fontFamily="Instrument Serif"
                  mb={1}
                  align="left"
                  sx={{ fontSize: { xs: '3rem', sm: '2.5rem' } }}
                >
                  {socialMediaAnalytics.averageComments?.toFixed(2)}
                </Typography>
                <Typography
                  variant="caption"
                  color="#1340FF"
                  fontFamily="Aileron, sans-serif"
                  fontWeight={600}
                  align="left"
                  sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                >
                  Avg Comments
                </Typography>
              </Stack>

              {/* Average likes */}
              <Stack alignItems="flex-start" sx={{ flex: 1 }}>
                <Typography
                  variant="h5"
                  color="#1340FF"
                  fontWeight={400}
                  fontFamily="Instrument Serif"
                  mb={1}
                  align="left"
                  sx={{ fontSize: { xs: '3rem', sm: '2.5rem' } }}
                >
                  {socialMediaAnalytics.averageLikes?.toFixed(2)}
                </Typography>
                <Typography
                  variant="caption"
                  color="#1340FF"
                  fontFamily="Aileron, sans-serif"
                  fontWeight={600}
                  align="left"
                  sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                >
                  Avg Likes
                </Typography>
              </Stack>

              {/* Total Engagement */}
              <Stack alignItems="flex-start" sx={{ flex: 1 }}>
                <Typography
                  variant="h5"
                  color="#1340FF"
                  fontWeight={400}
                  fontFamily="Instrument Serif"
                  mb={1}
                  align="left"
                  sx={{ fontSize: { xs: '3rem', sm: '2.5rem' } }}
                >
                  {socialMediaAnalytics.engagement_rate}
                </Typography>
                <Typography
                  variant="caption"
                  color="#1340FF"
                  fontFamily="Aileron, sans-serif"
                  fontWeight={600}
                  align="left"
                  sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                >
                  Total Engagement
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        )}

        {/* <Divider sx={{ my: 3 }} /> */}
        {/* Bottom View */}

        <Typography fontWeight={600} fontFamily="Aileron, sans-serif" fontSize="24px" mb={1} mt={3}>
          Top Content{' '}
          {/* {socialMediaAnalytics?.username && `of ${socialMediaAnalytics?.username}`} */}
        </Typography>

        {/* {smDown && (
          <Stack direction="row" alignItems="center" spacing={1} my={2} color="text.secondary">
            <Button
              variant="outlined"
              startIcon={<Iconify icon="mdi:instagram" width={24} />}
              sx={{
                fontSize: '1rem',
                py: 1.5,
                px: 3,
                minWidth: '130px',
                height: '48px',
                borderWidth: 1,
                borderColor: currentTab === 'instagram' ? '#1340FF' : 'rgba(0, 0, 0, 0.12)',
                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
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
                minWidth: '130px',
                height: '48px',
                borderWidth: 1,
                borderColor: currentTab === 'tiktok' ? '#1340FF' : 'rgba(0, 0, 0, 0.12)',
                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                ...(currentTab === 'tiktok' && {
                  color: theme.palette.mode === 'light' ? '#1340FF' : '#4e70ff',
                  boxShadow: 'none',
                  borderColor: '#1340FF',
                  borderWidth: 2,
                }),
              }}
              onClick={() => setCurrentTab('tiktok')}
            >
              Tiktok
            </Button>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="mdi:partnership" width={20} />}
              sx={{
              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
              ...(currentTab === 'partnerships' && {
                color: theme.palette.mode === 'light' ? '#1340FF' : '#4e70ff',
                boxShadow: 'none',
              }),
            }}
            onClick={() => setCurrentTab('partnerships')}
          >
              Partnerships
            </Button>
          </Stack>
        )} */}

        <MediaKitSocial currentTab={currentTab} sx={{ mb: 4 }} />
        <Box sx={{ height: 60 }} />
        {/* <MediaKitSetting open={openSetting} handleClose={handleClose} user={user} /> */}
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
                {user?.creator?.mediaKit?.displayName ?? user?.name}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography fontSize={16} color="#231F20">
                {user?.creator?.pronounce}
              </Typography>
              <Iconify icon="mdi:dot" color="#231F20" />
              <Typography fontSize={16} color="#231F20">
                {user?.country}
              </Typography>
              <Iconify icon="mdi:dot" color="#231F20" />
              <Typography fontSize={16} color="#231F20">
                {user?.email}
              </Typography>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1} mt={2} flexWrap="wrap">
              {user?.creator?.interests.map((interest) => (
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
              src={user?.photoURL}
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
              {user?.creator?.mediaKit?.about}
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
                0 {/* Change to actual number later */}
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
                Tiktok
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
                      {socialMediaAnalytics.averageLikes.toFixed(2)}
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

        {/* <Divider sx={{ my: 3 }} /> */}

        <Box sx={{ flexGrow: 1 }}>
          <Typography
            fontWeight={600}
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
            data={(() => {
              if (currentTab === 'instagram') return { instagram };
              if (currentTab === 'tiktok') return { tiktok };
              return null;
            })()}
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
          zIndex: theme.zIndex.drawer + 1,
          flexDirection: 'column',
        }}
        open={captureLoading}
      >
        <CircularProgress color="inherit" size={50} thickness={4} />
        <Typography sx={{ mt: 2, fontWeight: 600, fontSize: 18 }}>
          {captureState === 'preparing' && 'Preparing media kit...'}
          {captureState === 'rendering' && 'Loading all content...'}
          {captureState === 'capturing' && 'Capturing...'}
          {captureState === 'processing' && 'Finalizing download...'}
          {captureState === 'complete' && 'Download complete!'}
        </Typography>
      </Backdrop>
    </>
  );
};

export default MediaKitCreator;
