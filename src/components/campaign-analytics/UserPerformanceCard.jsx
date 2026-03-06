import PropTypes from 'prop-types';
import { m, AnimatePresence } from 'framer-motion';
import React, { useRef, useState, useEffect } from 'react';

import {
  Box,
  Grid,
  Link,
  Alert,
  Stack,
  Avatar,
  Tooltip,
  Divider,
  Skeleton,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';

import useGetCreatorById from 'src/hooks/useSWR/useGetCreatorById';

import { formatNumber, getMetricValue } from 'src/utils/socialMetricsCalculator';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------
// ScrollingName — auto-scrolls text that overflows its container
// ----------------------------------------------------------------------

export function ScrollingName({ name, variant = 'subtitle1', fontWeight = 600, ...other }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const textWidth = textRef.current.scrollWidth;
        const needsScroll = textWidth > containerWidth;
        setShouldScroll(needsScroll);
        if (needsScroll) {
          setScrollDistance(textWidth - containerWidth);
        } else {
          setScrollDistance(0);
        }
      }
    };

    const timeoutId = setTimeout(checkOverflow, 0);
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [name]);

  const animationName = `scroll-${scrollDistance}`;

  return (
    <>
      {shouldScroll && scrollDistance > 0 && (
        <style>
          {`
            @keyframes ${animationName} {
              0%, 25% { transform: translateX(0); }
              50%, 75% { transform: translateX(-${scrollDistance}px); }
              100% { transform: translateX(0); }
            }
          `}
        </style>
      )}
      <Box
        ref={containerRef}
        sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden', position: 'relative' }}
      >
        <Tooltip title={name} arrow>
          <Typography
            ref={textRef}
            variant={variant}
            fontWeight={fontWeight}
            {...other}
            sx={{
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              display: 'inline-block',
              ...(shouldScroll && scrollDistance > 0 && {
                animation: `${animationName} 8s ease-in-out infinite`,
              }),
              ...other.sx,
            }}
          >
            {name}
          </Typography>
        </Tooltip>
      </Box>
    </>
  );
}

ScrollingName.propTypes = {
  name: PropTypes.string.isRequired,
  variant: PropTypes.string,
  fontWeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

// ----------------------------------------------------------------------
// AnimatedNumber — count-up animation when value changes
// ----------------------------------------------------------------------

export function AnimatedNumber({ value, suffix = '', formatFn }) {
  const [displayValue, setDisplayValue] = useState(value);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);
  const startValueRef = useRef(value);
  const prevValueRef = useRef(value);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (prevValueRef.current === value && hasAnimatedRef.current) {
      return undefined;
    }

    const duration = 1200;
    startValueRef.current = displayValue;
    startTimeRef.current = null;
    prevValueRef.current = value;
    hasAnimatedRef.current = true;

    const animate = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - (1 - progress) ** 3;
      const currentValue = startValueRef.current + (value - startValueRef.current) * easeOut;
      setDisplayValue(currentValue);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatted = formatFn ? formatFn(displayValue) : displayValue;
  return (
    <span>
      {formatted}
      {suffix}
    </span>
  );
}

AnimatedNumber.propTypes = {
  value: PropTypes.number.isRequired,
  suffix: PropTypes.string,
  formatFn: PropTypes.func,
};

// ----------------------------------------------------------------------
// MetricsSkeleton — shimmer placeholder while insights load
// ----------------------------------------------------------------------

export function MetricsSkeleton({ showSaves = false, isMobile = false }) {
  const metricCount = showSaves ? 5 : 4;

  if (isMobile) {
    return (
      <Box display="flex" justifyContent="space-between" width="100%" maxWidth={340} mb={1.5} px={1}>
        {Array.from({ length: metricCount }).map((_, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <React.Fragment key={i}>
            <Box sx={{ flex: 1, textAlign: 'left' }}>
              <Skeleton animation="wave" variant="text" width={i === 0 ? 50 : 40} height={16} sx={{ bgcolor: 'rgba(99, 99, 102, 0.1)' }} />
              <Skeleton animation="wave" variant="text" width={45} height={32} sx={{ bgcolor: 'rgba(19, 64, 255, 0.1)' }} />
            </Box>
            {i < metricCount - 1 && (
              <Skeleton animation="wave" variant="rectangular" width={1} height={40} sx={{ mx: 1, bgcolor: 'rgba(19, 64, 255, 0.15)' }} />
            )}
          </React.Fragment>
        ))}
      </Box>
    );
  }

  return (
    <Box display="flex" alignItems="center" flex={1} justifyContent="space-between" sx={{ mx: { md: 2, lg: 4, xl: 6 } }}>
      {Array.from({ length: metricCount }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <React.Fragment key={i}>
          <Box sx={{ textAlign: 'left', flex: 1 }}>
            <Skeleton animation="wave" variant="text" width={i === 0 ? 110 : 60} height={22} sx={{ bgcolor: 'rgba(99, 99, 102, 0.1)' }} />
            <Skeleton animation="wave" variant="text" width={70} height={48} sx={{ bgcolor: 'rgba(19, 64, 255, 0.1)' }} />
          </Box>
          {i < metricCount - 1 && (
            <Skeleton animation="wave" variant="rectangular" width={1} height={55} sx={{ mx: { md: 1.5, lg: 2.5 }, bgcolor: 'rgba(19, 64, 255, 0.15)' }} />
          )}
        </React.Fragment>
      ))}
    </Box>
  );
}

MetricsSkeleton.propTypes = {
  showSaves: PropTypes.bool,
  isMobile: PropTypes.bool,
};

// ----------------------------------------------------------------------
// UserPerformanceCard
// ----------------------------------------------------------------------

export default function UserPerformanceCard({ engagementRate, submission, insightData, loadingInsights: isLoadingInsights }) {
  const { data: creator, isLoading: loadingCreator } = useGetCreatorById(submission.user);

  const creatorHandle =
    creator?.user?.creator?.instagram || creator?.user?.creator?.tiktok;

  const creatorHandleHref = creator?.user?.creator?.instagram
    ? `https://instagram.com/${creator.user.creator.instagram.replace('@', '')}`
    : `https://tiktok.com/@${(creator?.user?.creator?.tiktok || '').replace('@', '')}`;

  const isInstagram = submission?.platform === 'Instagram';

  return (
    <Grid item xs={12}>
      <Box borderRadius={1} border="2px solid #F5F5F5">
        <Box sx={{ py: 0.5 }}>
          {/* ── Desktop Layout (md+) ── */}
          <Box
            px={2}
            display={{ xs: 'none', md: 'flex' }}
            alignItems="center"
            gap={{ md: 1, lg: 1.5 }}
            sx={{ minWidth: 0, overflow: 'hidden' }}
          >
            {/* Left: Creator Info */}
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              flex={1}
              sx={{ maxWidth: 210, flexShrink: 0, overflow: 'hidden' }}
            >
              <Avatar
                src={creator?.user?.photoURL}
                sx={{
                  width: 44,
                  height: 44,
                  bgcolor: isInstagram ? '#E4405F' : '#000000',
                  border: '1px solid #EBEBEB',
                }}
              >
                {loadingCreator ? (
                  <CircularProgress size={18} />
                ) : (
                  creator?.user?.name?.charAt(0) || 'U'
                )}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                {loadingCreator ? (
                  <Typography variant="subtitle1" fontWeight={600}>Loading...</Typography>
                ) : (
                  <ScrollingName name={creator?.user?.name || 'Unknown Creator'} />
                )}
                {creatorHandle && (
                  <Link
                    href={creatorHandleHref}
                    target="_blank"
                    rel="noopener"
                    underline="hover"
                    sx={{
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: '#636366',
                      fontSize: '0.875rem',
                      '&:hover': { color: '#1340FF' },
                    }}
                  >
                    {creatorHandle}
                  </Link>
                )}
              </Box>
            </Stack>

            {/* Center: Metrics */}
            <AnimatePresence mode="wait">
              {insightData && (
                <Box
                  component={m.div}
                  key="metrics-content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  display="flex"
                  alignItems="center"
                  flex={1}
                  justifyContent="space-between"
                  sx={{ mx: 1, minWidth: 0, overflow: 'hidden' }}
                >
                  {/* Engagement Rate */}
                  <Box sx={{ textAlign: 'left', minWidth: { md: 0, lg: 110 }, pr: { md: 1, lg: 1.5 } }}>
                    <Typography fontFamily="Aileron" fontSize={{ md: 14, lg: 16, xl: 18 }} fontWeight={600} color="#636366" sx={{ whiteSpace: 'nowrap' }}>
                      <Box component="span" pr={1.5} sx={{ display: { xs: 'none', xl: 'inline' } }}>Engagement Rate</Box>
                      <Box component="span" sx={{ display: { xs: 'inline', xl: 'none' } }}>Eng. Rate</Box>
                    </Typography>
                    <Typography fontFamily="Instrument Serif" fontSize={{ md: 28, lg: 36, xl: 40 }} fontWeight={400} color="#1340FF" lineHeight={1.1}>
                      <AnimatedNumber value={parseFloat(engagementRate) || 0} suffix="%" formatFn={(val) => val.toFixed(2)} />
                    </Typography>
                  </Box>

                  <Divider sx={{ width: '1px', height: '55px', backgroundColor: '#1340FF', flexShrink: 0 }} />

                  {/* Views */}
                  <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0, overflow: 'hidden', px: 1 }}>
                    <Typography fontFamily="Aileron" fontSize={{ md: 14, lg: 16, xl: 18 }} fontWeight={600} color="#636366" sx={{ whiteSpace: 'nowrap' }}>Views</Typography>
                    <Typography fontFamily="Instrument Serif" fontSize={{ md: 28, lg: 36, xl: 40 }} fontWeight={400} color="#1340FF" lineHeight={1.1}>
                      <AnimatedNumber value={getMetricValue(insightData.insight, 'views')} formatFn={formatNumber} />
                    </Typography>
                  </Box>

                  <Divider sx={{ width: '1px', height: '55px', backgroundColor: '#1340FF', flexShrink: 0 }} />

                  {/* Likes */}
                  <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0, overflow: 'hidden', px: 1 }}>
                    <Typography fontFamily="Aileron" fontSize={{ md: 14, lg: 16, xl: 18 }} fontWeight={600} color="#636366" sx={{ whiteSpace: 'nowrap' }}>Likes</Typography>
                    <Typography fontFamily="Instrument Serif" fontSize={{ md: 28, lg: 36, xl: 40 }} fontWeight={400} color="#1340FF" lineHeight={1.1}>
                      <AnimatedNumber value={getMetricValue(insightData.insight, 'likes')} formatFn={formatNumber} />
                    </Typography>
                  </Box>

                  <Divider sx={{ width: '1px', height: '55px', backgroundColor: '#1340FF', flexShrink: 0 }} />

                  {/* Comments */}
                  <Box sx={{ textAlign: 'left', flex: 1, overflow: 'hidden', minWidth: 0, px: 1 }}>
                    <Typography fontFamily="Aileron" fontSize={{ md: 14, lg: 16, xl: 18 }} fontWeight={600} color="#636366" sx={{ whiteSpace: 'nowrap' }}>Comments</Typography>
                    <Typography fontFamily="Instrument Serif" fontSize={{ md: 28, lg: 36, xl: 40 }} fontWeight={400} color="#1340FF" lineHeight={1.1}>
                      <AnimatedNumber value={getMetricValue(insightData.insight, 'comments')} formatFn={formatNumber} />
                    </Typography>
                  </Box>

                  <Divider sx={{ width: '1px', height: '55px', backgroundColor: '#1340FF', flexShrink: 0, ml: 2 }} />

                  {/* Shares */}
                  <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0, overflow: 'hidden', px: 1 }}>
                    <Typography fontFamily="Aileron" fontSize={{ md: 14, lg: 16, xl: 18 }} fontWeight={600} color="#636366" sx={{ whiteSpace: 'nowrap' }}>Shares</Typography>
                    <Typography fontFamily="Instrument Serif" fontSize={{ md: 28, lg: 36, xl: 40 }} fontWeight={400} color="#1340FF" lineHeight={1.1}>
                      <AnimatedNumber value={getMetricValue(insightData.insight, 'shares')} formatFn={formatNumber} />
                    </Typography>
                  </Box>

                  {/* Saves — Instagram only; transparent placeholder for TikTok alignment */}
                  {isInstagram ? (
                    <>
                      <Divider sx={{ width: '1px', height: '55px', backgroundColor: '#1340FF', flexShrink: 0 }} />
                      <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0, overflow: 'hidden', px: 1 }}>
                        <Typography fontFamily="Aileron" fontSize={{ md: 14, lg: 16, xl: 18 }} fontWeight={600} color="#636366" sx={{ whiteSpace: 'nowrap' }}>Saves</Typography>
                        <Typography fontFamily="Instrument Serif" fontSize={{ md: 28, lg: 36, xl: 40 }} fontWeight={400} color="#1340FF" lineHeight={1.1}>
                          <AnimatedNumber value={getMetricValue(insightData.insight, 'saved')} formatFn={formatNumber} />
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <>
                      <Divider sx={{ width: '1px', height: '55px', backgroundColor: 'transparent', flexShrink: 0 }} />
                      <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0, px: 1 }}>
                        <Box sx={{ height: { md: 20, lg: 22, xl: 24 } }} />
                        <Box sx={{ position: 'relative', minHeight: 44, display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ height: { md: 28, lg: 36, xl: 40 } }} />
                        </Box>
                      </Box>
                    </>
                  )}
                </Box>
              )}

              {/* Skeleton */}
              {!insightData && isLoadingInsights && (
                <Box component={m.div} key="metrics-skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                  <MetricsSkeleton showSaves={isInstagram} />
                </Box>
              )}

              {/* Empty state */}
              {!insightData && !isLoadingInsights && (
                <Box component={m.div} key="metrics-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} flex={1} sx={{ mx: { md: 2, lg: 4 } }}>
                  <Alert severity="info" sx={{ m: 1 }}>Analytics data not available for this post.</Alert>
                </Box>
              )}
            </AnimatePresence>

            {/* Right: Thumbnail */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0, minWidth: 0 }}>
              <AnimatePresence mode="wait">
                {insightData && (
                  <Box component={m.div} key="thumbnail-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }} sx={{ flexShrink: 0 }}>
                    <Link
                      href={insightData.postUrl}
                      target="_blank"
                      rel="noopener"
                      sx={{
                        display: 'block',
                        textDecoration: 'none',
                        position: 'relative',
                        '&:hover .play-overlay': { bgcolor: 'rgba(176, 176, 176, 1)' },
                        '&:hover img': { filter: 'brightness(1)', opacity: 1 },
                      }}
                    >
                      <Box
                        component="img"
                        src={insightData.thumbnail || insightData.video?.media_url}
                        alt="Post thumbnail"
                        sx={{ width: 140, height: 80, borderRadius: 2, objectFit: 'cover', border: '1px solid #e0e0e0', filter: 'brightness(0.95)', opacity: 0.9, transition: 'filter 0.3s ease, opacity 0.3s ease' }}
                      />
                      <Box
                        className="play-overlay"
                        sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 28, height: 28, borderRadius: '50%', bgcolor: 'rgba(176, 176, 176, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s ease' }}
                      >
                        <Iconify icon="solar:play-bold" sx={{ color: '#FFFFFF', width: 14, height: 14, ml: 0.2 }} />
                      </Box>
                    </Link>
                  </Box>
                )}

                {!insightData && isLoadingInsights && (
                  <Box component={m.div} key="thumbnail-skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} sx={{ flexShrink: 0 }}>
                    <Skeleton animation="wave" variant="rounded" sx={{ width: 140, height: 80, borderRadius: 2, bgcolor: 'rgba(0, 0, 0, 0.08)' }} />
                  </Box>
                )}

                {!insightData && !isLoadingInsights && (
                  <Box component={m.div} key="thumbnail-fallback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} sx={{ width: 140, height: 80, borderRadius: 2, bgcolor: '#F5F5F5', border: '1px dashed #BDBDBD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Iconify icon="mdi:image-off-outline" width={24} sx={{ color: '#BDBDBD' }} />
                  </Box>
                )}

                <Box sx={{ width: 36 }} />
              </AnimatePresence>
            </Stack>
          </Box>

          {/* ── Mobile Layout (xs) ── */}
          <Box display={{ xs: 'flex', md: 'none' }} flexDirection="column" alignItems="center" sx={{ py: 1.5 }}>
            {/* Creator Info */}
            <Box display="flex" mb={1.5} width={300}>
              <Avatar
                src={creator?.user?.photoURL}
                sx={{ width: 38, height: 38, bgcolor: isInstagram ? '#E4405F' : '#000000', mr: 1.5 }}
              >
                {loadingCreator ? <CircularProgress size={16} /> : (creator?.user?.name?.charAt(0) || 'U')}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                {loadingCreator ? (
                  <Typography variant="subtitle2" fontWeight={600}>Loading...</Typography>
                ) : (
                  <ScrollingName name={creator?.user?.name || 'Unknown Creator'} variant="subtitle2" />
                )}
                {creatorHandle && (
                  <Link
                    href={creatorHandleHref}
                    target="_blank"
                    rel="noopener"
                    underline="hover"
                    sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px', color: '#636366', fontSize: '0.75rem', '&:hover': { color: '#1340FF' } }}
                  >
                    {creatorHandle}
                  </Link>
                )}
              </Box>
            </Box>

            {/* Metrics */}
            <AnimatePresence mode="wait">
              {insightData && (
                <Box
                  component={m.div}
                  key="mobile-metrics-content"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  display="flex"
                  justifyContent="space-between"
                  width="100%"
                  maxWidth={340}
                  mb={1.5}
                  px={1}
                >
                  <Box sx={{ flex: 1, textAlign: 'left' }}>
                    <Typography fontFamily="Aileron" fontSize={11} fontWeight={700} color="#636366">Engage.</Typography>
                    <Typography fontFamily="Instrument Serif" fontSize={24} fontWeight={400} color="#1340FF">
                      <AnimatedNumber value={parseFloat(engagementRate) || 0} suffix="%" formatFn={(val) => val.toFixed(2)} />
                    </Typography>
                  </Box>
                  <Divider sx={{ width: '1px', height: '40px', backgroundColor: '#1340FF', mx: 1 }} />
                  <Box sx={{ flex: 1, textAlign: 'left' }}>
                    <Typography fontFamily="Aileron" fontSize={11} fontWeight={700} color="#636366">Views</Typography>
                    <Typography fontFamily="Instrument Serif" fontSize={24} fontWeight={400} color="#1340FF">
                      <AnimatedNumber value={getMetricValue(insightData.insight, 'views')} formatFn={formatNumber} />
                    </Typography>
                  </Box>
                  <Divider sx={{ width: '1px', height: '40px', backgroundColor: '#1340FF', mx: 1 }} />
                  <Box sx={{ flex: 1, textAlign: 'left' }}>
                    <Typography fontFamily="Aileron" fontSize={11} fontWeight={700} color="#636366">Likes</Typography>
                    <Typography fontFamily="Instrument Serif" fontSize={24} fontWeight={400} color="#1340FF">
                      <AnimatedNumber value={getMetricValue(insightData.insight, 'likes')} formatFn={formatNumber} />
                    </Typography>
                  </Box>
                  <Divider sx={{ width: '1px', height: '40px', backgroundColor: '#1340FF', mx: 1 }} />
                  <Box sx={{ flex: 1, textAlign: 'left' }}>
                    <Typography fontFamily="Aileron" fontSize={11} fontWeight={700} color="#636366">Comments</Typography>
                    <Typography fontFamily="Instrument Serif" fontSize={24} fontWeight={400} color="#1340FF">
                      <AnimatedNumber value={getMetricValue(insightData.insight, 'comments')} formatFn={formatNumber} />
                    </Typography>
                  </Box>
                  <Divider sx={{ width: '1px', height: '40px', backgroundColor: '#1340FF', mx: 1 }} />
                  <Box sx={{ flex: 1, textAlign: 'left' }}>
                    <Typography fontFamily="Aileron" fontSize={11} fontWeight={700} color="#636366">Shares</Typography>
                    <Typography fontFamily="Instrument Serif" fontSize={24} fontWeight={400} color="#1340FF">
                      <AnimatedNumber value={getMetricValue(insightData.insight, 'shares')} formatFn={formatNumber} />
                    </Typography>
                  </Box>

                  {isInstagram ? (
                    <>
                      <Divider sx={{ width: '1px', height: '40px', backgroundColor: '#1340FF', mx: 1 }} />
                      <Box sx={{ flex: 1, textAlign: 'left' }}>
                        <Typography fontFamily="Aileron" fontSize={11} fontWeight={700} color="#636366">Saves</Typography>
                        <Typography fontFamily="Instrument Serif" fontSize={24} fontWeight={400} color="#1340FF">
                          <AnimatedNumber value={getMetricValue(insightData.insight, 'saved')} formatFn={formatNumber} />
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <>
                      <Divider sx={{ width: '1px', height: '40px', backgroundColor: 'transparent' }} />
                      <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0, px: 1 }}>
                        <Box sx={{ height: 16 }} />
                        <Box sx={{ height: 24 }} />
                      </Box>
                    </>
                  )}
                </Box>
              )}

              {!insightData && isLoadingInsights && (
                <Box component={m.div} key="mobile-metrics-skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                  <MetricsSkeleton showSaves={isInstagram} isMobile />
                </Box>
              )}

              {!insightData && !isLoadingInsights && (
                <Box component={m.div} key="mobile-metrics-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Alert severity="info" sx={{ my: 1.5 }}>Analytics data not available for this post.</Alert>
                </Box>
              )}
            </AnimatePresence>

            {/* Thumbnail */}
            <AnimatePresence mode="wait">
              {insightData && (
                <Box component={m.div} key="mobile-thumbnail-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }} display="flex" justifyContent="center">
                  <Link
                    href={insightData.postUrl}
                    target="_blank"
                    rel="noopener"
                    sx={{ display: 'block', textDecoration: 'none', position: 'relative', '&:hover .play-overlay': { bgcolor: 'rgba(176, 176, 176, 1)' }, '&:hover img': { filter: 'brightness(1)', opacity: 1 } }}
                  >
                    <Box component="img" src={insightData.thumbnail || insightData.video?.media_url} alt="Post thumbnail" sx={{ width: 280, height: 80, borderRadius: 2, objectFit: 'cover', border: '1px solid #e0e0e0', filter: 'brightness(0.95)', opacity: 0.9, transition: 'filter 0.3s ease, opacity 0.3s ease' }} />
                    <Box className="play-overlay" sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 28, height: 28, borderRadius: '50%', bgcolor: 'rgba(176, 176, 176, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s ease' }}>
                      <Iconify icon="solar:play-bold" sx={{ color: '#FFFFFF', width: 14, height: 14, ml: 0.2 }} />
                    </Box>
                  </Link>
                </Box>
              )}

              {!insightData && isLoadingInsights && (
                <Box component={m.div} key="mobile-thumbnail-skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} display="flex" justifyContent="center">
                  <Skeleton animation="wave" variant="rounded" sx={{ width: 280, height: 80, borderRadius: 2, bgcolor: 'rgba(0, 0, 0, 0.08)' }} />
                </Box>
              )}

              {!insightData && !isLoadingInsights && (
                <Box component={m.div} key="mobile-thumbnail-fallback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} display="flex" justifyContent="center">
                  <Tooltip title="View Post">
                    <IconButton component={Link} href={submission.postUrl} target="_blank" rel="noopener" size="small">
                      <Iconify icon="solar:external-link-outline" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </AnimatePresence>
          </Box>
        </Box>
      </Box>
    </Grid>
  );
}

UserPerformanceCard.propTypes = {
  engagementRate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  submission: PropTypes.shape({
    id: PropTypes.string,
    user: PropTypes.string,
    platform: PropTypes.string,
    postUrl: PropTypes.string,
  }).isRequired,
  insightData: PropTypes.object,
  loadingInsights: PropTypes.bool,
};
