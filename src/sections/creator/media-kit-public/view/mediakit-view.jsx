import { m } from 'framer-motion';
import React, { useMemo, useState } from 'react';

import {
  Box,
  Chip,
  Stack,
  Avatar,
  Button,
  Divider,
  useTheme,
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


// Format number function (conversion is like this: 50000 -> 50K, 50100 -> 50.1K)
const formatNumber = (num) => {
  if (!num && num !== 0) return '0';

  if (num >= 1000000000) {
    const formatted = (num / 1000000000).toFixed(1);
    return formatted.endsWith('.0') ? `${Math.floor(num / 1000000000)}G` : `${formatted}G`;
  }
  if (num >= 1000000) {
    const formatted = (num / 1000000).toFixed(1);
    return formatted.endsWith('.0') ? `${Math.floor(num / 1000000)}M` : `${formatted}M`;
  }
  if (num >= 1000) {
    const formatted = (num / 1000).toFixed(1);
    return formatted.endsWith('.0') ? `${Math.floor(num / 1000)}K` : `${formatted}K`;
  }
  // For 1s, 10s, 100s: show as integer, no decimals
  return Math.floor(num).toString();
};

// Utility function to format total audience numbers with commas
const formatTotalAudience = (num) => {
  if (!num && num !== 0) return '0';
  return num.toLocaleString();
};

// eslint-disable-next-line react/prop-types
const MediaKit = ({ id, noBigScreen }) => {
  const theme = useTheme();
  const router = useRouter();
  const smDown = useResponsive('down', 'sm');
  const { data, isLoading, isError } = useSWRGetCreatorByID(id);

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


  const [currentTab, setCurrentTab] = useState('instagram');

  const socialMediaAnalytics = useMemo(() => {
    if (currentTab === 'instagram') {
      return {
        followers: data?.creator?.instagramUser?.followers_count || 0,
        engagement_rate: `${
          calculateEngagementRate(
            data?.creator?.instagramUser?.instagramVideo?.reduce(
              (sum, acc) => sum + parseInt(acc.like_count, 10),
              0
            ),
            data?.creator?.instagramUser?.followers_count
          ) || 0
        }%`,
        averageLikes: data?.creator?.instagramUser?.average_like || 0,
        username: data?.creator?.instagramUser?.username,
      };
    }

    if (currentTab === 'tiktok') {
      return {
        followers: data?.creator?.tiktokUser?.follower_count || 0,
        engagement_rate: data?.creator?.tiktokUser?.follower_count || 0,
        averageLikes: data?.creator?.tiktokUser?.likes_count || 0,
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
      .desktop-screenshot-view {
        padding-bottom: 24px !important;
        padding-right: 24px !important;
        padding-left: 38px !important;
        box-sizing: border-box !important;
      }
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

  // Helper function to ensure all content is loaded
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

  // Function to capture screenshot
  const captureScreenshot = useCallback(
    async (isMobile = false) => {
      try {
        setCaptureLoading(true);
        setCaptureState('preparing');

        // Choose which element to capture based on screen size
        // const element = isDesktop ? containerRef.current : desktopLayoutRef.current;

        // Always use the hidden desktop layout for consistent output regardless of screen size
        const element = desktopLayoutRef.current;

        if (!element) {
          setSnackbar({
            open: true,
            message: 'Could not find media kit element',
            severity: 'error',
          });
          return;
        }

        // if (isDesktop) {
        //   // Desktop direct capture method
        //   // Save current scroll position
        //   const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        //   // Hide share buttons and back button during capture
        //   let desktopButtonDisplay = null;
        //   let backButtonDisplay = null;
        //   let logoContainerOriginalMargin = null;

        //   if (desktopShareButtonRef.current) {
        //     desktopButtonDisplay = desktopShareButtonRef.current.style.display;
        //     desktopShareButtonRef.current.style.display = 'none';
        //   }

        //   if (backButtonRef.current) {
        //     backButtonDisplay = backButtonRef.current.style.display;
        //     backButtonRef.current.style.display = 'none';
        //   }

        //   // Add top margin to logo container to compensate for hidden back button
        //   if (logoContainerRef.current) {
        //     logoContainerOriginalMargin = logoContainerRef.current.style.marginTop;
        //     logoContainerRef.current.style.marginTop = '32px';
        //   }

        //   // Scroll to top to ensure entire content is visible
        //   window.scrollTo(0, 0);

        //   // Ensure all images and iframes are loaded
        //   await ensureContentLoaded(element);

        //   const elementWidth = element.scrollWidth;
        //   const canvasWidth = 1200;
        //   const horizontalPadding = (canvasWidth - elementWidth) / 2;

        //   // Take the screenshot
        //   const dataUrl = await toPng(element, {
        //     quality: 0.95,
        //     pixelRatio: 2,
        //     backgroundColor: '#ffffff',
        //     height: element.scrollHeight + 80,
        //     width: canvasWidth,
        //     cacheBust: true,
        //     style: {
        //       transform: `translate(${horizontalPadding}px, 40px)`, // centering horizontally and add top margin
        //       transformOrigin: 'top left',
        //     },
        //   });

        //   // Restore share button and back button visibility
        //   if (desktopShareButtonRef.current) {
        //     desktopShareButtonRef.current.style.display = desktopButtonDisplay;
        //   }

        //   if (backButtonRef.current) {
        //     backButtonRef.current.style.display = backButtonDisplay;
        //   }

        //   // Restore logo container margin
        //   if (logoContainerRef.current) {
        //     logoContainerRef.current.style.marginTop = logoContainerOriginalMargin;
        //   }

        //   // Restore scroll position
        //   window.scrollTo(0, scrollTop);

        //   setCaptureState('processing');

        //   if (!isMobile) {
        //     // Create and trigger download for desktop
        //     const link = document.createElement('a');
        //     link.download = `${data?.creator?.mediaKit?.displayName || data?.name}_Media_Kit.png`;
        //     link.href = dataUrl;
        //     link.click();
        //   } else {
        //     // Open in-page preview for mobile
        //     setMobilePreview({
        //       open: true,
        //       imageUrl: dataUrl,
        //     });
        //   }
        // } else {
        //   // Small screen method using hidden desktop layout
        //   // Temporarily apply a style fix to remove extra padding
        //   const styleFixForMedia = document.createElement('style');
        //   styleFixForMedia.textContent = getScreenshotStyles();
        //   document.head.appendChild(styleFixForMedia);

        // Use hidden desktop layout method for all captures
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

        // Calculate the actual width of the element to center it properly
        const elementWidth = element.scrollWidth;
        const canvasWidth = 1200;
        const horizontalPadding = (canvasWidth - elementWidth) / 2;

        // Take the screenshot with centering
        const dataUrl = await toPng(element, {
          quality: 0.95,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          height: element.scrollHeight + 80, // padding top/bottom
          width: canvasWidth, // canvas width
          cacheBust: true,
          style: {
            transform: `translate(${horizontalPadding}px, 40px)`, // centering horizontally and add top margin
            transformOrigin: 'top left',
          },
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

        // if (!isMobile) {
        //   // Create and trigger download for desktop
        //   const link = document.createElement('a');
        //   link.download = `${data?.creator?.mediaKit?.displayName || data?.name}_Media_Kit.png`;
        //   link.href = dataUrl;
        //   link.click();
        // } else {
        //   // Open in-page preview for mobile
        //   setMobilePreview({
        //     open: true,
        //     imageUrl: dataUrl,
        //   });
        // }

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
      // isDesktop,
      getScreenshotStyles,
      ensureContentLoaded,
    ]
  );

  // Function to capture PDF
  const capturePdf = useCallback(async () => {
    try {
      setCaptureLoading(true);
      setCaptureState('preparing');

      // const element = isDesktop ? containerRef.current : desktopLayoutRef.current;

      // Always use the hidden desktop layout for consistent output regardless of screen size
      const element = desktopLayoutRef.current;

      if (!element) {
        setSnackbar({
          open: true,
          message: 'Could not find media kit element',
          severity: 'error',
        });
        return;
      }

      // let dataUrl;

      // if (isDesktop) {
      //   const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      //   let desktopButtonDisplay = null;
      //   let backButtonDisplay = null;
      //   let logoContainerOriginalMargin = null;
      //   
      //   if (desktopShareButtonRef.current) {
      //     desktopButtonDisplay = desktopShareButtonRef.current.style.display;
      //     desktopShareButtonRef.current.style.display = 'none';
      //   }
      //   
      //   if (backButtonRef.current) {
      //     backButtonDisplay = backButtonRef.current.style.display;
      //     backButtonRef.current.style.display = 'none';
      //   }
      //   
      //   // Add top margin to logo container to compensate for hidden back button
      //   if (logoContainerRef.current) {
      //     logoContainerOriginalMargin = logoContainerRef.current.style.marginTop;
      //     logoContainerRef.current.style.marginTop = '32px';
      //   }
      //   
      //   window.scrollTo(0, 0);

      //   // Ensure all images and iframes are loaded
      //   await ensureContentLoaded(element);

      //   const elementWidth = element.scrollWidth;
      //   const canvasWidth = 1200;
      //   const horizontalPadding = (canvasWidth - elementWidth) / 2;

      //   dataUrl = await toPng(element, {
      //     quality: 1.0,
      //     pixelRatio: 4,
      //     backgroundColor: '#ffffff',
      //     height: element.scrollHeight + 80,
      //     width: canvasWidth,
      //     cacheBust: true,
      //     style: {
      //       transform: `translate(${horizontalPadding}px, 40px)`, // centering horizontally and add top margin
      //       transformOrigin: 'top left',
      //     },
      //   });

      //   if (desktopShareButtonRef.current) {
      //     desktopShareButtonRef.current.style.display = desktopButtonDisplay;
      //   }
      //   
      //   if (backButtonRef.current) {
      //     backButtonRef.current.style.display = backButtonDisplay;
      //   }
      //   
      //   // Restore logo container margin
      //   if (logoContainerRef.current) {
      //     logoContainerRef.current.style.marginTop = logoContainerOriginalMargin;
      //   }
      //   
      //   window.scrollTo(0, scrollTop);
      // } else {
      //   const styleFixForMedia = document.createElement('style');
      //   styleFixForMedia.textContent = getScreenshotStyles();
      //   document.head.appendChild(styleFixForMedia);
        
      // Use hidden desktop layout method for all PDF captures
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

      // Calculate the actual width of the element to center it properly
      const elementWidth = element.scrollWidth;
      const canvasWidth = 1200;
      const horizontalPadding = (canvasWidth - elementWidth) / 2;

      // dataUrl = await toPng(element, {
      //   quality: 1.0,
      //   pixelRatio: 4,
      //   backgroundColor: '#ffffff',
      //   height: element.scrollHeight + 80,
      //   width: canvasWidth,
      //   cacheBust: true,
      //   style: {
      //     transform: `translate(${horizontalPadding}px, 40px)`,
      //     transformOrigin: 'top left',
      //   },
      // });

      const dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 4,
        backgroundColor: '#ffffff',
        height: element.scrollHeight + 80,
        width: canvasWidth,
        cacheBust: true,
        style: {
          transform: `translate(${horizontalPadding}px, 40px)`,
          transformOrigin: 'top left',
        },
      });

      // element.style.visibility = originalVisibility;
      // element.style.position = originalPosition;
      // element.style.left = originalLeft;
      // element.style.zIndex = originalZIndex;
      // element.classList.remove('desktop-screenshot-view');
      // document.head.removeChild(styleFixForMedia);

      element.style.visibility = originalVisibility;
      element.style.position = originalPosition;
      element.style.left = originalLeft;
      element.style.zIndex = originalZIndex;
      element.classList.remove('desktop-screenshot-view');
      document.head.removeChild(styleFixForMedia);

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
    // isDesktop,
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
    <Container maxWidth="xl" sx={{ position: 'relative' }}>
      <Box sx={{ mb: 2, mt: 2 }}>
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

        <Button
          variant="contained"
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
          Share
        </Button>
      </Box>


      {/* Mobile View */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        width="100%"
        mb={{ xs: 3, sm: 4, md: 6 }}
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
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <Button
            variant="contained"
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
            Share
          </Button>
        </Box>
      </Stack>

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

          {/* Social Media Stats */}
          <Stack
            flex="1"
            alignItems={{ xs: 'start', md: 'flex-start' }}
            spacing={3}
            sx={{
              mt: { xs: 4, md: 0 },
              ml: { xs: 0, md: 18, lg: -2, xl: -4 },
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
                {formatTotalAudience(socialMediaAnalytics.followers)}
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
                onClick={() => setCurrentTab('tiktok')}
              >
                TikTok
              </Button>
            </Stack>

            {!mdDown && (
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
                        {formatNumber(socialMediaAnalytics.averageLikes)}
                        {/* {socialMediaAnalytics.averageLikes?.toFixed(2)} */}
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
                        {formatNumber(socialMediaAnalytics.averageComments)}
                        {/* {socialMediaAnalytics.averageComments?.toFixed(2)} */}
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
                        {formatNumber(socialMediaAnalytics.engagement_rate)}
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

        {mdDown && (
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
                  {formatNumber(socialMediaAnalytics.averageLikes)}
                  {/* {socialMediaAnalytics.averageLikes?.toFixed(2)} */}
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
                  {formatNumber(socialMediaAnalytics.averageComments)}
                  {/* {socialMediaAnalytics.averageComments?.toFixed(2)} */}
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
                  {formatNumber(socialMediaAnalytics.engagement_rate)}
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
          px: 0,
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

        {/* Social Media Stats */}
//         <Stack flex="1" alignItems={{ xs: 'start', md: 'flex-start' }} spacing={3}>
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
          <Stack alignItems="flex-start" sx={{ pl: { xs: 1, sm: 0 } }}>
            <Typography
              variant="h2"
              color="#231F20"
              fontFamily="Aileron, sans-serif"
              fontWeight={600}
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
              {socialMediaAnalytics.followers}
            </Typography>
            <Box
              component="span"
              sx={{
                color: '#231F20',
                fontSize: { xs: '2rem', md: '3rem' },
                fontFamily: 'Aileron, sans-serif',
                fontWeight: 300,
                letterSpacing: '0.05em',
                textAlign: 'left',
                display: 'block',
              }}
            >
              Total Audience
            </Box>
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
                {formatTotalAudience(socialMediaAnalytics.followers)}
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

          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            my={2}
            color="text.secondary"
            sx={{ pl: { xs: 1, sm: 0 } }}
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
                      variant="h3"
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
                      {socialMediaAnalytics.followers}
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
                      variant="h3"
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

                      {formatNumber(socialMediaAnalytics.averageLikes)}

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
                      variant="h3"
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
                      {formatNumber(socialMediaAnalytics.averageComments)}
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
                      variant="h3"
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
                      {formatNumber(socialMediaAnalytics.engagement_rate)}
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
                {socialMediaAnalytics.followers}
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
                0 {/* Change to actual number later */}
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
                {socialMediaAnalytics.averageLikes}
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

      <Divider sx={{ my: 3 }} />
      {/* Bottom View */}

      <Typography fontWeight={600} fontFamily="Aileron, sans-serif" fontSize="24px" mb={1}>
        Top Content {socialMediaAnalytics?.username && `of ${socialMediaAnalytics?.username}`}
      </Typography>

      <MediaKitSocial currentTab={currentTab} data={data} />
    </Container>
  );
};

export default MediaKit;

// export default withPermission(['read'], 'admin', MediaKit);
