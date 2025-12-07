import PropTypes from 'prop-types';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Stack,
  Button,
  TextField,
  Divider,
} from '@mui/material';
import { useAuthContext } from 'src/auth/hooks';
import axiosInstance, { endpoints } from 'src/utils/axios';

// Validation schema
const SocialLinksSchema = Yup.object().shape({
  instagramProfileLink: Yup.string()
    .test('social-media-required', 'Please provide at least one social media profile', (value, context) => {
      const { tiktokProfileLink } = context.parent;
      return !!(value || tiktokProfileLink);
    })
    .test('instagram-format', 'URL must contain www.instagram.com or instagram.com', (value) => {
      if (!value) return true;
      return /instagram\.com/.test(value.toLowerCase());
    }),
  tiktokProfileLink: Yup.string()
    .test('social-media-required', 'Please provide at least one social media profile', (value, context) => {
      const { instagramProfileLink } = context.parent;
      return !!(value || instagramProfileLink);
    })
    .test('tiktok-format', 'URL must contain www.tiktok.com or tiktok.com', (value) => {
      if (!value) return true;
      return /tiktok\.com/.test(value.toLowerCase());
    }),
});

export default function SocialLinksModal({ open, onClose }) {
  const { initialize } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: yupResolver(SocialLinksSchema),
    defaultValues: {
      instagramProfileLink: '',
      tiktokProfileLink: '',
    },
  });

  const instagramValue = watch('instagramProfileLink');
  const tiktokValue = watch('tiktokProfileLink');

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      // Update creator profile with social links
      await axiosInstance.put(endpoints.auth.updateCreator, {
        instagramProfileLink: data.instagramProfileLink || '',
        tiktokProfileLink: data.tiktokProfileLink || '',
      });

      // Refresh user context without page reload
      await initialize();
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error updating social links:', error);
      alert('Failed to update social links. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get error message for the "at least one required" validation
  const getGeneralError = () => {
    if (!instagramValue && !tiktokValue) {
      return errors.instagramProfileLink?.message || errors.tiktokProfileLink?.message;
    }
    return null;
  };

  const generalError = getGeneralError();

  return (
    <Dialog
      open={open}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: '580px',
          height: 'auto',
          maxHeight: '90vh',
          borderRadius: '16px',
          padding: '24px',
          gap: '24px',
          backgroundColor: '#F4F4F4',
          boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.15)',
        },
      }}
      // Prevent closing by clicking outside or pressing ESC
      disableEscapeKeyDown
      onClose={(event, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2}>
            {/* Title */}
            <Typography
              sx={{
                fontFamily: 'Instrument Serif, serif',
                fontWeight: 400,
                fontSize: '36px',
                lineHeight: '40px',
                letterSpacing: '0%',
                color: '#231F20',
              }}
            >
              Welcome back! 👋
            </Typography>

            {/* Description */}
            <Typography
              sx={{
                fontFamily: 'Inter Display, sans-serif',
                fontWeight: 400,
                fontSize: '16px',
                lineHeight: '20px',
                letterSpacing: '0%',
                color: '#8E8E93',
              }}
            >
              Looks like your social links are missing. We&apos;ll need them before you can start joining campaigns.
            </Typography>

            {/* Divider */}
            <Divider sx={{ borderColor: '#E5E5EA' }} />

            {/* Instagram Profile Link */}
            <Box>
              <Typography
                sx={{
                  fontFamily: 'Inter Display, sans-serif',
                  fontWeight: 500,
                  fontSize: '12px',
                  lineHeight: '16px',
                  letterSpacing: '0%',
                  color: '#636366',
                  mb: 1,
                }}
              >
                Instagram profile link
              </Typography>
              <TextField
                {...register('instagramProfileLink')}
                placeholder="www.instagram.com/username"
                fullWidth
                error={!!errors.instagramProfileLink && errors.instagramProfileLink.message !== 'Please provide at least one social media profile'}
                helperText={
                  errors.instagramProfileLink?.message !== 'Please provide at least one social media profile'
                    ? errors.instagramProfileLink?.message
                    : ''
                }
                sx={{
                  '& .MuiInputBase-root': {
                    height: '48px',
                    borderRadius: '8px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E5EA',
                    '&:hover': {
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E5E5EA',
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#FFFFFF',
                      borderColor: '#1340FF',
                    },
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none',
                  },
                  '& .MuiInputBase-input': {
                    padding: '12px 14px',
                    fontFamily: 'Inter Display, sans-serif',
                    fontSize: '14px',
                    color: '#231F20',
                    '&::placeholder': {
                      color: '#C7C7CC',
                      opacity: 1,
                    },
                  },
                }}
              />
            </Box>

            {/* OR divider */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                sx={{
                  fontFamily: 'Inter Display, sans-serif',
                  fontWeight: 400,
                  fontSize: '16px',
                  lineHeight: '20px',
                  letterSpacing: '0%',
                  color: '#636366',
                }}
              >
                or
              </Typography>
            </Box>

            {/* TikTok Profile Link */}
            <Box>
              <Typography
                sx={{
                  fontFamily: 'Inter Display, sans-serif',
                  fontWeight: 500,
                  fontSize: '12px',
                  lineHeight: '16px',
                  letterSpacing: '0%',
                  color: '#636366',
                  mb: 1,
                }}
              >
                TikTok profile link
              </Typography>
              <TextField
                {...register('tiktokProfileLink')}
                placeholder="www.tiktok.com/username"
                fullWidth
                error={!!errors.tiktokProfileLink && errors.tiktokProfileLink.message !== 'Please provide at least one social media profile'}
                helperText={
                  errors.tiktokProfileLink?.message !== 'Please provide at least one social media profile'
                    ? errors.tiktokProfileLink?.message
                    : ''
                }
                sx={{
                  '& .MuiInputBase-root': {
                    height: '48px',
                    borderRadius: '8px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E5EA',
                    '&:hover': {
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E5E5EA',
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#FFFFFF',
                      borderColor: '#1340FF',
                    },
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none',
                  },
                  '& .MuiInputBase-input': {
                    padding: '12px 14px',
                    fontFamily: 'Inter Display, sans-serif',
                    fontSize: '14px',
                    color: '#231F20',
                    '&::placeholder': {
                      color: '#C7C7CC',
                      opacity: 1,
                    },
                  },
                }}
              />
            </Box>

            {/* General error message */}
            {generalError && (
              <Typography
                sx={{
                  color: '#d32f2f',
                  fontSize: '12px',
                  fontFamily: 'Inter Display, sans-serif',
                  textAlign: 'center',
                }}
              >
                {generalError}
              </Typography>
            )}

            {/* Confirm Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                type="submit"
                disabled={isSubmitting || (!instagramValue && !tiktokValue)}
                sx={{
                  width: '111px',
                  height: '44px',
                  backgroundColor: '#1340FF',
                  color: '#FFFFFF',
                  fontFamily: 'Inter Display, sans-serif',
                  fontWeight: 600,
                  fontSize: '16px',
                  lineHeight: '20px',
                  textTransform: 'none',
                  borderRadius: '8px',
                  padding: '10px 24px 13px 24px',
                  gap: '6px',
                  boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
                  '&:hover': {
                    backgroundColor: '#0F35CC',
                    boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
                  },
                  '&.Mui-disabled': {
                    background: 'linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6)), linear-gradient(0deg, #3A3A3C, #3A3A3C)',
                    color: '#FFFFFF',
                    boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.1) inset',
                  },
                }}
              >
                {isSubmitting ? 'Saving...' : 'Confirm'}
              </Button>
            </Box>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}

SocialLinksModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
