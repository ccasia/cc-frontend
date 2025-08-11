import { m } from 'framer-motion';
import React, { useState, useEffect } from 'react';

import { useTheme } from '@mui/material/styles';
import { Box, Stack, Button, Typography, CircularProgress } from '@mui/material';

import Iconify from './iconify';

const InstagramOAuthWarning = ({ 
  onProceed, 
  onCancel, 
  autoRedirect = true, 
  redirectDelay = 3,
  redirectUrl 
}) => {
  const theme = useTheme();
  const [countdown, setCountdown] = useState(redirectDelay);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!autoRedirect) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsRedirecting(true);
          clearInterval(timer);
          setTimeout(() => {
            if (redirectUrl) {
              window.location.href = redirectUrl;
            } else if (onProceed) {
              onProceed();
            }
          }, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRedirect, redirectUrl, onProceed]);

  const handleProceedNow = () => {
    setIsRedirecting(true);
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else if (onProceed) {
      onProceed();
    }
  };

  return (
    <Box
      component={m.div}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        p: 2,
      }}
    >
      <Box
        component={m.div}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        sx={{
          bgcolor: 'white',
          borderRadius: 3,
          p: { xs: 3, sm: 4 },
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Warning Icon */}
        <Box
          component={m.div}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: '#FFF3E0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <Iconify 
            icon="material-symbols:warning-rounded" 
            width={40} 
            sx={{ color: '#FF9800' }} 
          />
        </Box>

        {/* Title */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: '#231F20',
            mb: 2,
            fontFamily: 'Aileron, sans-serif',
          }}
        >
          Connecting to Instagram
        </Typography>

        {/* Warning Message */}
        <Box
          sx={{
            bgcolor: '#FFF8E1',
            border: '1px solid #FFE082',
            borderRadius: 2,
            p: 2.5,
            mb: 3,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Iconify 
              icon="material-symbols:info-rounded" 
              width={24} 
              sx={{ color: '#F57C00', mt: 0.2, flexShrink: 0 }} 
            />
            <Typography
              sx={{
                color: '#E65100',
                fontWeight: 600,
                fontSize: '0.95rem',
                lineHeight: 1.5,
                textAlign: 'left',
              }}
            >
              ⚠️ Stay in your browser. Don't tap 'Open Instagram App' if prompted — the connection may fail.
            </Typography>
          </Stack>
        </Box>



        {/* Countdown and Actions */}
        {!isRedirecting ? (
          <>
            {autoRedirect && (
              <Typography
                sx={{
                  color: '#666',
                  fontSize: '0.9rem',
                  mb: 3,
                  fontFamily: 'Aileron, sans-serif',
                }}
              >
                Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
              </Typography>
            )}

            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2} 
              justifyContent="center"
            >
              <Button
                variant="contained"
                onClick={handleProceedNow}
                disabled={isRedirecting}
                sx={{
                  backgroundColor: '#E1306C',
                  color: '#FFFFFF',
                  borderRadius: 1.5,
                  px: 3,
                  py: 1.5,
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(225, 48, 108, 0.3)',
                  '&:hover': {
                    backgroundColor: '#C13584',
                    boxShadow: '0 6px 15px rgba(225, 48, 108, 0.4)',
                  },
                  '&:disabled': {
                    backgroundColor: '#E1306C',
                    opacity: 0.7,
                  },
                }}
                startIcon={<Iconify icon="mingcute:link-line" width={20} />}
              >
                Connect Now
              </Button>

              {onCancel && (
                <Button
                  variant="outlined"
                  onClick={onCancel}
                  disabled={isRedirecting}
                  sx={{
                    borderColor: '#E7E7E7',
                    color: '#666',
                    borderRadius: 1.5,
                    px: 3,
                    py: 1.5,
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: '#D0D0D0',
                      bgcolor: '#F5F5F5',
                    },
                    '&:disabled': {
                      opacity: 0.5,
                    },
                  }}
                >
                  Cancel
                </Button>
              )}
            </Stack>
          </>
        ) : (
          <Box sx={{ py: 2 }}>
            <CircularProgress 
              size={32} 
              sx={{ 
                color: '#E1306C',
                mb: 2,
              }} 
            />
            <Typography
              sx={{
                color: '#666',
                fontSize: '0.9rem',
                fontFamily: 'Aileron, sans-serif',
              }}
            >
              Redirecting to Instagram...
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default InstagramOAuthWarning; 