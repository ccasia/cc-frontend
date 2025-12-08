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
  Dialog,
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
  const [captureType, setCaptureType] = useState(''); // 'pdf' or 'image'
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [pdfReadyState, setPdfReadyState] = useState({ ready: false, pdfUrl: null });
  const menuOpen = Boolean(menuAnchorEl);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // New state for mobile preview
  const [mobilePreview, setMobilePreview] = useState({
    open: false,
    imageUrl: '',
  });

  const [currentTab, setCurrentTab] = useState('instagram');

  const desktopLayoutRef = useRef(null);

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

  const getInstagram = useCallback(async () => {
    try {
      instaLoading.onTrue();
      const res = await axiosInstance.get(endpoints.creators.social.instagramV2(user?.id));
      setInstagram(res.data);
    } catch (error) {
      console.error('Error fetching Instagram data:', error);
      return;
    } finally {
      instaLoading.onFalse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setInstagram]);

  const getTiktok = useCallback(async () => {
    try {
      isLoading.onTrue();
      const res = await axiosInstance.get(endpoints.creators.social.tiktokV2(user?.id));
      console.log('TikTok API Response (Frontend):', {
        status: res.status,
        data: res.data,
        hasMedias: !!res.data?.medias,
        hasSortedVideos: !!res.data?.medias?.sortedVideos,
        videosCount: res.data?.medias?.sortedVideos?.length || 0
      });
      setTiktok(res.data);
    } catch (error) {
      console.error('TikTok API Error (Frontend):', error);
      return;
    } finally {
      isLoading.onFalse();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setTiktok]);

  const calculateTotalEngagement = useCallback((totalLikes, totalComments) => {
    const likes = parseInt(totalLikes, 10) || 0;
    const comments = parseInt(totalComments, 10) || 0;
    
    return likes + comments;
  }, []);

  const socialMediaAnalytics = useMemo(() => {
    if (currentTab === 'instagram') {
      const totalEngagement =
        (instagram?.medias?.totalLikes ?? 0) + (instagram?.medias?.totalComments ?? 0);
      return {
        followers: instagram?.instagramUser?.followers_count || 0,
        engagement_rate: totalEngagement,
        averageLikes: instagram?.instagramUser?.averageLikes || 0,
        username: instagram?.instagramUser?.username || 'Creator',
        averageComments: instagram?.instagramUser?.averageComments || 0,
      };
    }

    if (currentTab === 'tiktok') {
      const totalEngagement =
        (tiktok?.medias?.totalLikes ?? 0) + (tiktok?.medias?.totalComments ?? 0) + (tiktok?.medias?.totalShares ?? 0);
      return {
        followers: tiktok?.overview?.follower_count || 0,
        engagement_rate: totalEngagement,
        averageLikes: tiktok?.medias?.averageLikes || 0,
        username: tiktok?.tiktokUser?.display_name || 'Creator',
        averageComments: tiktok?.medias?.averageComments || 0,
      };
    }

    return {
      followers: 0,
      engagement_rate: '0',
      averageLikes: 0,
    };
  }, [currentTab, tiktok, instagram]);

  // Helper function to detect iOS Safari specifically (not other browsers on iOS)
  const isIOSSafari = useCallback(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;

    // Check if it's specifically Safari on iOS (not Chrome, Firefox, etc.)
    const isSafari = /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(userAgent);

    return isIOS && isSafari;
  }, []);

  // Helper function to ensure all images, iframes, and charts are loaded
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

    // Wait for chart SVGs to render and apply blue styling
    const chartSvgs = Array.from(element.querySelectorAll('svg')).filter(svg => {
      // Exclude engagement icons and other UI icons
      const isEngagementIcon = svg.closest('.media-kit-engagement-icons');
      const isIconify = svg.closest('[class*="iconify"], [data-icon]');
      return !isEngagementIcon && !isIconify;
    });

    const svgLoadPromises = chartSvgs.map(svg => 
      new Promise((resolve) => {
        const applyChartStyling = () => {
          
          // Target all chart paths since MUI uses CSS styling, not attributes
          const paths = svg.querySelectorAll('path');
          
          paths.forEach((path, index) => {
            const d = path.getAttribute('d');
            
            if (d && d.includes('M')) {
              // Check if this is the main chart line (has L commands for line segments)
              if (d.includes('L')) {
                console.log(`Styling chart line path ${index} to blue`);
                path.style.setProperty('stroke', '#1340FF', 'important');
                path.style.setProperty('stroke-width', '2', 'important');
                path.style.setProperty('fill', 'none', 'important');
                path.style.setProperty('opacity', '1', 'important');
                path.style.setProperty('visibility', 'visible', 'important');
              }
              // Check if this is a data point marker (has A commands for arcs/circles)
              else if (d.includes('A')) {
                console.log(`Styling chart marker path ${index} to blue`);
                path.style.setProperty('fill', '#1340FF', 'important');
                path.style.setProperty('stroke', '#1340FF', 'important');
                path.style.setProperty('stroke-width', '1', 'important');
                path.style.setProperty('opacity', '1', 'important');
                path.style.setProperty('visibility', 'visible', 'important');
              }
            }
          });
          
          // Style only the bottom grid line (above months), hide others
          const lines = svg.querySelectorAll('line');
          lines.forEach((line, index) => {
            const y1 = parseFloat(line.getAttribute('y1') || 0);
            const y2 = parseFloat(line.getAttribute('y2') || 0);
            
            console.log(`Grid line ${index}: y1=${y1}, y2=${y2}`);
            
            // Find the line with the highest Y value (closest to bottom/months)
            const isBottomLine = lines.length > 0 && 
              Array.from(lines).every(otherLine => {
                const otherY1 = parseFloat(otherLine.getAttribute('y1') || 0);
                return otherY1 <= y1 || otherLine === line;
              });
            
            if (isBottomLine) {
              console.log(`Styling bottom grid line ${index} (above months)`);
              line.style.setProperty('stroke', 'black', 'important');
              line.style.setProperty('stroke-width', '1', 'important');
              line.style.setProperty('opacity', '1', 'important');
              line.style.setProperty('visibility', 'visible', 'important');
            } else {
              console.log(`Hiding grid line ${index} (not the bottom one)`);
              line.style.setProperty('opacity', '0', 'important');
              line.style.setProperty('visibility', 'hidden', 'important');
            }
          });
        };

        // Apply styling multiple times to ensure it persists
        setTimeout(applyChartStyling, 300);
        setTimeout(applyChartStyling, 400);
        setTimeout(applyChartStyling, 500);
        
        setTimeout(resolve, 800);
      })
    );

    // Wait for all content to load
    await Promise.all([...imageLoadPromises, ...iframeLoadPromises, ...svgLoadPromises]);

    // Additional delay to ensure all rendering is complete, especially for charts
    await new Promise((resolve) => setTimeout(resolve, 2500));
    setCaptureState('capturing');
  }, []);

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
      /* Target only the analytics boxes container (Engagement Rate and Monthly Interactions) */
      .desktop-screenshot-view .desktop-screenshot-mediakit > div > div:last-child {
        display: flex !important;
        flex-direction: row !important;
        width: 100% !important;
        gap: 25px;
        padding-left: 7px;
      }
      .desktop-screenshot-view .desktop-screenshot-mediakit > div > div:last-child > div {
        width: auto !important;
        min-width: 536px !important;
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

  const captureScreenshot = useCallback(
    async (isMobile = false) => {
      try {
        setCaptureLoading(true);
        setCaptureState('preparing');
        setCaptureType('image');

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

        // Take the screenshot with centering (shifted 2px to the right)
        const dataUrl = await toPng(element, {
          quality: 0.95,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          height: element.scrollHeight + 80, // padding top/bottom
          width: canvasWidth, // canvas width
          cacheBust: true,
          style: {
            transform: `translate(${horizontalPadding + 3}px, 40px)`, // centering horizontally and add top margin, shifted 2px right
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

        if (!isMobile) {
          // Create and trigger download for desktop
          const link = document.createElement('a');
          link.download = `${user?.creator?.mediaKit?.displayName || user?.name}_Media_Kit.png`;
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

        // Reset loading state after a short delay
        setTimeout(() => {
          setCaptureLoading(false);
          setCaptureState('idle');
          setCaptureType('');
        }, 500);
      } catch (error) {
        console.error('Error capturing screenshot:', error);
        setSnackbar({
          open: true,
          message: 'Failed to capture screenshot',
          severity: 'error',
        });

        // Reset loading state on error
        setCaptureLoading(false);
        setCaptureState('idle');
        setCaptureType('');
      }
    },
    [
      user?.creator?.mediaKit?.displayName,
      user?.name,
      // isDesktop,
      getScreenshotStyles,
      ensureContentLoaded,
      // isIOSSafari,
    ]
  );

  // New function to close mobile preview
  const closeMobilePreview = () => {
    setMobilePreview({
      open: false,
      imageUrl: '',
    });

    // Reset loading state when closing image preview
    setCaptureLoading(false);
    setCaptureState('idle');
    setCaptureType('');
  };

  const capturePdf = useCallback(async () => {
    try {
      setCaptureLoading(true);
      setCaptureState('preparing');
      setCaptureType('pdf');

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

      const dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 4,
        backgroundColor: '#ffffff',
        height: element.scrollHeight + 80,
        width: canvasWidth,
        cacheBust: true,
        style: {
          transform: `translate(${horizontalPadding + 3}px, 40px)`,
          transformOrigin: 'top left',
        },
      });

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

      const fileName = `${user?.creator?.mediaKit?.displayName || user?.name}_Media_Kit.pdf`;

      // Check if iOS Safari and handle accordingly
      if (isIOSSafari()) {
        // For iOS Safari, prepare PDF and show instructions
        setCaptureState('complete');

        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);

        // Set PDF ready state to show instructions
        setTimeout(() => {
          setPdfReadyState({ ready: true, pdfUrl });
        }, 500);
      } else {
        // For other browsers, use normal download
        pdf.save(fileName);

        setSnackbar({
          open: true,
          message: 'PDF saved successfully!',
          severity: 'success',
        });

        setCaptureState('complete');
        setTimeout(() => {
          setCaptureLoading(false);
          setCaptureState('idle');
          setCaptureType('');
        }, 500);
      }

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
    isIOSSafari,
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

  // Helper function to get loading message based on state and platform
  const getLoadingMessage = useCallback(() => {
    if (!captureLoading && !pdfReadyState.ready) return '';

    if (pdfReadyState.ready) {
      return 'PDF ready to share!';
    }

    if (isIOSSafari() && captureType === 'pdf') {
      switch (captureState) {
        case 'preparing':
          return 'Preparing your Media Kit...';
        case 'rendering':
          return 'Loading all content...';
        case 'capturing':
          return 'Capturing...';
        case 'processing':
          return 'Almost ready! PDF will be available shortly...';
        case 'complete':
          return 'PDF is ready!';
        default:
          return 'Preparing your Media Kit...';
      }
    } else {
      switch (captureState) {
        case 'preparing':
          return 'Preparing media kit...';
        case 'rendering':
          return 'Loading all content...';
        case 'capturing':
          return 'Capturing...';
        case 'processing':
          return captureType === 'pdf' ? 'Finalizing download...' : 'Processing...';
        case 'complete':
          return captureType === 'pdf' ? 'Download complete!' : 'Download complete!';
        default:
          return 'Working...';
      }
    }
  }, [captureLoading, captureState, captureType, pdfReadyState.ready, isIOSSafari]);

  // Function to handle sharing the PDF using Web Share API for iOS Safari
  const handleSharePdf = useCallback(async () => {
    if (pdfReadyState.pdfUrl) {
      try {
        // Convert the PDF blob URL to a File object for sharing
        const response = await fetch(pdfReadyState.pdfUrl);
        const blob = await response.blob();
        const fileName = `${user?.creator?.mediaKit?.displayName || user?.name}_Media_Kit.pdf`;
        const file = new File([blob], fileName, { type: 'application/pdf' });

        // Check if iOS Safari and Web Share API is supported
        if (
          isIOSSafari() &&
          navigator.share &&
          navigator.canShare &&
          navigator.canShare({ files: [file] })
        ) {
          // For iOS Safari, only use Web Share API - don't fallback to blob download
          try {
            await navigator.share({
              files: [file],
              title: `${user?.creator?.mediaKit?.displayName || user?.name} - Media Kit`,
              text: 'Check out my media kit!',
            });

            setSnackbar({
              open: true,
              message: 'PDF shared successfully!',
              severity: 'success',
            });
            return;
          } catch (shareError) {
            // If user cancels share dialog, don't show error or fallback
            if (shareError.name === 'AbortError') {
              console.log('User cancelled share dialog');
              return;
            }

            console.error('Error sharing PDF:', shareError);
            setSnackbar({
              open: true,
              message: 'Share was cancelled or failed',
              severity: 'info',
            });
            return;
          }
        } else {
          // Direct download for non-iOS Safari browsers
          window.location.href = pdfReadyState.pdfUrl;

          setSnackbar({
            open: true,
            message: 'PDF downloaded successfully!',
            severity: 'success',
          });
        }
      } catch (error) {
        console.error('Error preparing PDF:', error);
        setSnackbar({
          open: true,
          message: 'Failed to prepare PDF',
          severity: 'error',
        });
      }

      // Clean up - only for non-iOS Safari browsers
      if (!isIOSSafari()) {
        setTimeout(() => {
          URL.revokeObjectURL(pdfReadyState.pdfUrl);
          setPdfReadyState({ ready: false, pdfUrl: null });
          setCaptureLoading(false);
          setCaptureState('idle');
          setCaptureType('');
        }, 1000);
      }
    }
  }, [pdfReadyState.pdfUrl, user?.creator?.mediaKit?.displayName, user?.name, isIOSSafari]);

  // Function to handle closing the PDF ready state
  const handleClosePdfReady = useCallback(() => {
    if (pdfReadyState.pdfUrl) {
      URL.revokeObjectURL(pdfReadyState.pdfUrl);
    }
    setPdfReadyState({ ready: false, pdfUrl: null });
    setCaptureLoading(false);
    setCaptureState('idle');
    setCaptureType('');
  }, [pdfReadyState.pdfUrl]);

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
          spacing={{ xs: 2, md: 15 }} // Reduced mobile spacing to bring sections closer
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
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{
                flexWrap: 'wrap',
                maxWidth: '100%',
                overflow: 'hidden',
              }}
            >
              <Typography
                fontSize={{ xs: 12, sm: 14, md: 16 }}
                color="#231F20"
                sx={{
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content',
                }}
              >
                {user?.creator?.pronounce}
              </Typography>
              <Iconify
                icon="mdi:dot"
                color="#231F20"
                sx={{
                  fontSize: { xs: 12, sm: 14, md: 16 },
                  minWidth: 'fit-content',
                  flexShrink: 0,
                }}
              />
              <Typography
                fontSize={{ xs: 12, sm: 14, md: 16 }}
                color="#231F20"
                sx={{
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content',
                }}
              >
                {user?.city ? `${user?.city}, ${user?.country}` : user?.country}
              </Typography>
              <Iconify
                icon="mdi:dot"
                color="#231F20"
                sx={{
                  fontSize: { xs: 12, sm: 14, md: 16 },
                  minWidth: 'fit-content',
                  flexShrink: 0,
                }}
              />
              <Typography
                fontSize={{ xs: 12, sm: 14, md: 16 }}
                color="#231F20"
                sx={{
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: { xs: '120px', sm: '200px', md: 'none' },
                }}
              >
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
              mt={1} // Reduced top margin to bring closer to avatar
              mb={2} // Small gap before social media stats
            >
              {user?.creator?.mediaKit?.about}
            </Typography>
          </Stack>

          {/* Social Media Stats */}
          <Stack
            flex="1"
            alignItems={{ xs: 'start', md: 'flex-start' }}
            spacing={2} // Reduced spacing between social media elements
            sx={{
              mt: { xs: 2, md: 0 }, // Small gap on mobile after about text
              width: '100%',
              ml: { xs: 0, md: 18, lg: -2, xl: -4 },
            }}
          >
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
                {formatTotalAudience(socialMediaAnalytics.followers)}
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

              {/* Avg Likes */}
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

              {/* Avg Comments */}
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
                  Avg
                  <br />
                  Comments
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
        )}

        {/* <Divider sx={{ my: 3 }} /> */}
        {/* Bottom View */}

        <Typography fontWeight={600} fontFamily="Aileron, sans-serif" fontSize="24px" mb={1}>
          Top Content {socialMediaAnalytics?.username && `of ${socialMediaAnalytics?.username}`}
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
              TikTok
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
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{
                flexWrap: 'wrap',
                maxWidth: '100%',
                overflow: 'hidden',
              }}
            >
              <Typography
                fontSize={16}
                color="#231F20"
                sx={{
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content',
                }}
              >
                {user?.creator?.pronounce}
              </Typography>
              <Iconify
                icon="mdi:dot"
                color="#231F20"
                sx={{
                  fontSize: 16,
                  minWidth: 'fit-content',
                  flexShrink: 0,
                }}
              />
              <Typography
                fontSize={16}
                color="#231F20"
                sx={{
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content',
                }}
              >
                {user?.city ? `${user?.city}, ${user?.country}` : user?.country}
              </Typography>
              <Iconify
                icon="mdi:dot"
                color="#231F20"
                sx={{
                  fontSize: 16,
                  minWidth: 'fit-content',
                  flexShrink: 0,
                }}
              />
              <Typography
                fontSize={16}
                color="#231F20"
                sx={{
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '300px',
                }}
              >
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
              mt={1} // Reduced top margin to bring closer to avatar
              mb={2} // Small gap before social media stats
            >
              {user?.creator?.mediaKit?.about}
            </Typography>
          </Stack>

          {/* Social Media Stats - with reduced width */}
          <Stack flex="0.8" alignItems="flex-start" spacing={2}>
            {' '}
            {/* Reduced spacing */}
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
                  // letterSpacing: '0.05em',
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
                      {formatNumber(socialMediaAnalytics.averageLikes)}
                      {/* {socialMediaAnalytics.averageLikes.toFixed(2)} */}
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
                      {formatNumber(socialMediaAnalytics.averageComments)}
                      {/* {socialMediaAnalytics.averageComments?.toFixed(2)} */}
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
            // data={{ instagram, tiktok }}
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
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          transition: 'all 0.3s ease-in-out',
        }}
        open={captureLoading || pdfReadyState.ready}
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
            position: 'relative',
            '@keyframes fadeIn': {
              from: { opacity: 0, transform: 'scale(0.95)' },
              to: { opacity: 1, transform: 'scale(1)' },
            },
          }}
        >
          {/* Close button for PDF ready state only */}
          {pdfReadyState.ready && (
            <Button
              onClick={handleClosePdfReady}
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
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
                zIndex: 10,
                '&:hover': {
                  bgcolor: '#F5F5F5',
                },
              }}
            >
              X
            </Button>
          )}
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
                    if (pdfReadyState.ready) {
                      return '100%';
                    }
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
                animation:
                  captureLoading || pdfReadyState.ready
                    ? 'popIn 0.6s 0.2s ease-out forwards'
                    : 'none',
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
              animation:
                captureLoading || pdfReadyState.ready
                  ? 'slideUp 0.5s 0.3s ease-out forwards'
                  : 'none',
              opacity: 0,
              transform: 'translateY(10px)',
              '@keyframes slideUp': {
                to: { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            {getLoadingMessage()}
          </Typography>

          {/* Open PDF and Save text for PDF ready state */}
          {pdfReadyState.ready && (
            <Typography
              sx={{
                mt: 1,
                fontWeight: 500,
                fontSize: 14,
                color: '#666',
                fontFamily: 'Aileron, sans-serif',
                textAlign: 'center',
                animation: 'fadeInUp 0.5s 0.4s ease-out forwards',
                opacity: 0,
                transform: 'translateY(8px)',
                '@keyframes fadeInUp': {
                  to: { opacity: 1, transform: 'translateY(0)' },
                },
              }}
            >
              Tap button to open Share menu
            </Typography>
          )}

          {/* iOS Safari Instructions - Show during rendering/capturing states for PDF only */}
          {isIOSSafari() &&
            captureType === 'pdf' &&
            (captureState === 'rendering' ||
              captureState === 'capturing' ||
              captureState === 'processing') && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  backgroundColor: 'rgba(19, 64, 255, 0.05)',
                  border: '1px solid rgba(19, 64, 255, 0.15)',
                  borderRadius: 2,
                  maxWidth: '280px',
                  animation: captureLoading ? 'slideInUp 0.5s 0.6s ease-out forwards' : 'none',
                  opacity: 0,
                  transform: 'translateY(15px)',
                  '@keyframes slideInUp': {
                    to: { opacity: 1, transform: 'translateY(0)' },
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#1340FF',
                    fontFamily: 'Aileron, sans-serif',
                    textAlign: 'center',
                    mb: 1,
                  }}
                >
                  📱 Almost ready! Next step:
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5,
                    fontSize: 12,
                    color: '#333',
                    fontFamily: 'Aileron, sans-serif',
                    textAlign: 'center',
                    lineHeight: 1.4,
                  }}
                >
                  <span>Download PDF</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="#666"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ margin: '0 2px' }}
                  >
                    <path d="M0 0h24v24H0V0z" fill="none" />
                    <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z" />
                  </svg>
                  <span>→ Save to Files</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 1024 1024"
                    fill="#666"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ marginLeft: '2px' }}
                  >
                    <path d="M960 238c0-26.6-18.8-46-45.6-46H397.8c-5.6 0-8.6-1.2-12.2-4.8l-45-45-0.4-0.4c-9.8-9.2-17.8-13.8-34.6-13.8H113.4C85.8 128 64 148.6 64 174v147.4c0 3.2 3.4 3 6 1.4s10-2.8 14-2.8h856c4 0 11.4 1.2 14 2.8 2.6 1.6 6 1.8 6-1.4V238zM64 832.8c0 35 28.4 63.2 63.2 63.2H896c35.2 0 64-28.8 64-64V408c0-17.6-14.4-32-32-32H96c-17.6 0-32 14.4-32 32v424.8z" />
                  </svg>
                </Box>
              </Box>
            )}

          {/* iOS Safari Open PDF Button - Show when PDF is ready */}
          {pdfReadyState.ready && (
            <Box
              sx={{
                mt: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                animation: 'slideInUp 0.5s ease-out forwards',
                '@keyframes slideInUp': {
                  from: { opacity: 0, transform: 'translateY(15px)' },
                  to: { opacity: 1, transform: 'translateY(0)' },
                },
              }}
            >
              <Box
                sx={{
                  p: 2,
                  backgroundColor: 'rgba(19, 64, 255, 0.05)',
                  border: '1px solid rgba(19, 64, 255, 0.15)',
                  borderRadius: 2,
                  maxWidth: '280px',
                }}
              >
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#1340FF',
                    fontFamily: 'Aileron, sans-serif',
                    textAlign: 'center',
                    mb: 1,
                  }}
                >
                  📱 Download PDF
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5,
                    fontSize: 12,
                    color: '#333',
                    fontFamily: 'Aileron, sans-serif',
                    textAlign: 'center',
                    lineHeight: 1.4,
                  }}
                >
                  <span> Download PDF </span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="#666"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ margin: '0 2px' }}
                  >
                    <path d="M0 0h24v24H0V0z" fill="none" />
                    <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z" />
                  </svg>
                  <span>→ Save to Files</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 1024 1024"
                    fill="#666"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ marginLeft: '2px' }}
                  >
                    <path d="M960 238c0-26.6-18.8-46-45.6-46H397.8c-5.6 0-8.6-1.2-12.2-4.8l-45-45-0.4-0.4c-9.8-9.2-17.8-13.8-34.6-13.8H113.4C85.8 128 64 148.6 64 174v147.4c0 3.2 3.4 3 6 1.4s10-2.8 14-2.8h856c4 0 11.4 1.2 14 2.8 2.6 1.6 6 1.8 6-1.4V238zM64 832.8c0 35 28.4 63.2 63.2 63.2H896c35.2 0 64-28.8 64-64V408c0-17.6-14.4-32-32-32H96c-17.6 0-32 14.4-32 32v424.8z" />
                  </svg>
                </Box>
              </Box>

              <Button
                variant="contained"
                onClick={handleSharePdf}
                sx={{
                  backgroundColor: '#1340FF',
                  color: '#FFFFFF',
                  borderRadius: 1.5,
                  borderBottom: '3px solid #10248c',
                  '&:hover': {
                    backgroundColor: '#1340FF',
                    opacity: 0.9,
                    borderBottom: '3px solid #10248c',
                  },
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  fontSize: 16,
                  textTransform: 'none',
                }}
              >
                Download PDF
              </Button>
            </Box>
          )}

          {/* Default subtitle for non-iOS PDF or any image downloads */}
          {(!isIOSSafari() ||
            captureType === 'image' ||
            captureState === 'preparing' ||
            captureState === 'processing') &&
            !pdfReadyState.ready && (
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
            )}
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
            alt={`${user?.creator?.mediaKit?.displayName || user?.name} Media Kit`}
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

export default MediaKitCreator;
