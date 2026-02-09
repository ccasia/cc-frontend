import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';
import { enqueueSnackbar } from 'notistack';
import { m, AnimatePresence } from 'framer-motion';

import { Box, Stack, Dialog, TextField, Typography } from '@mui/material';
import { Star as StarIcon, StarBorder as StarBorderIcon } from '@mui/icons-material';
import LoadingButton from '@mui/lab/LoadingButton';

import axiosInstance, { endpoints } from 'src/utils/axios';

// Confetti particle component
function ConfettiParticle({ delay, x, color }) {
  return (
    <m.div
      initial={{ opacity: 1, y: 0, x: 0, scale: 1, rotate: 0 }}
      animate={{
        opacity: [1, 1, 0],
        y: [0, -60, 30],
        x: [0, x],
        scale: [0.5, 1, 0.3],
        rotate: [0, Math.random() * 360],
      }}
      transition={{ duration: 1.2, delay, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        width: 6,
        height: 6,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
        backgroundColor: color,
      }}
    />
  );
}

ConfettiParticle.propTypes = {
  delay: PropTypes.number.isRequired,
  x: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
};

const CONFETTI_COLORS = ['#FFAB00', '#1340FF', '#FF5630', '#22C55E', '#8E33FF', '#00B8D9'];

function ConfettiBurst() {
  const particles = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    delay: Math.random() * 0.25,
    x: (Math.random() - 0.5) * 160,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  }));

  return (
    <Box sx={{ position: 'absolute', top: '40%', left: '50%', pointerEvents: 'none' }}>
      {particles.map((p) => (
        <ConfettiParticle key={p.id} delay={p.delay} x={p.x} color={p.color} />
      ))}
    </Box>
  );
}

// Star rating with hover scale + fill cascade
function AnimatedStarRating({ value, onChange }) {
  const [hoverValue, setHoverValue] = useState(-1);
  const [cascadeTarget, setCascadeTarget] = useState(0);

  const handleClick = useCallback(
    (starIndex) => {
      setCascadeTarget(starIndex + 1);
      onChange(starIndex + 1);
    },
    [onChange]
  );

  const displayValue = hoverValue >= 0 ? hoverValue + 1 : value;

  return (
    <Box
      sx={{ display: 'flex', gap: 0.75 }}
      onMouseLeave={() => setHoverValue(-1)}
    >
      {[0, 1, 2, 3, 4].map((index) => {
        const isFilled = index < displayValue;
        const isCascading = index < cascadeTarget;

        return (
          <m.div
            key={index}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.95 }}
            animate={
              isCascading
                ? {
                    scale: [1, 1.25, 1],
                    transition: { delay: index * 0.06, duration: 0.3 },
                  }
                : {}
            }
            onAnimationComplete={() => {
              if (index === cascadeTarget - 1) setCascadeTarget(0);
            }}
            style={{ cursor: 'pointer', display: 'flex' }}
            onMouseEnter={() => setHoverValue(index)}
            onClick={() => handleClick(index)}
          >
            {isFilled ? (
              <StarIcon sx={{ fontSize: 40, color: hoverValue >= 0 ? '#FFD666' : '#FFAB00' }} />
            ) : (
              <StarBorderIcon sx={{ fontSize: 40, color: '#C4CDD5' }} />
            )}
          </m.div>
        );
      })}
    </Box>
  );
}

AnimatedStarRating.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};

// Success view after submission
function SuccessView() {
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        padding: '8px 0',
      }}
    >
      <ConfettiBurst />
      <m.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            bgcolor: '#22C55E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
          }}
        >
          🎉
        </Box>
      </m.div>
      <Typography
        sx={{
          fontFamily: 'Instrument Serif',
          fontSize: 30,
          fontWeight: 400,
          textAlign: 'center',
          lineHeight: 1.2,
        }}
      >
        Thank you!
      </Typography>
      <Typography variant="body2" sx={{ color: '#636366', textAlign: 'center' }}>
        Your feedback helps us improve.
      </Typography>
    </m.div>
  );
}

export default function NpsFeedbackModal({ open, onSuccess, onMutate }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open) {
      setRating(0);
      setFeedback('');
      setLoading(false);
      setSubmitted(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (rating < 1) {
      enqueueSnackbar('Please select a rating', { variant: 'warning' });
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.post(endpoints.npsFeedback.root, {
        rating,
        feedback: feedback.trim() || undefined,
      });
      setSubmitted(true);
      onMutate?.();
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to submit feedback', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#F4F4F4',
          borderRadius: 2,
          py: 3,
          px: 3,
          overflow: 'hidden',
          position: 'relative',
        },
      }}
      TransitionProps={{
        timeout: 400,
      }}
    >
      <AnimatePresence mode="wait">
        {submitted ? (
          <m.div key="success">
            <SuccessView />
          </m.div>
        ) : (
          <m.div
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
          >
            <Stack spacing={2.5} alignItems="center">
              {/* Emoji circle */}
              <m.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.15 }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    bgcolor: '#1340FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                  }}
                >
                  💬
                </Box>
              </m.div>

              {/* Title */}
              <Typography
                sx={{
                  fontFamily: 'Instrument Serif',
                  fontSize: 30,
                  fontWeight: 400,
                  textAlign: 'center',
                  lineHeight: 1.2,
                }}
              >
                How would you rate your experience?
              </Typography>

              {/* Animated Stars */}
              <AnimatedStarRating value={rating} onChange={setRating} />

              {/* Feedback field */}
              <Box sx={{ width: '100%' }}>
                <Typography variant="body2" sx={{ color: '#636366', mb: 0.75 }}>
                  What&apos;s the main reason for your rating?
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Your feedback (optional)"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      bgcolor: '#FFFFFF',
                      fontSize: 14,
                      '& fieldset': {
                        borderColor: '#E5E5EA',
                      },
                      '&:hover fieldset': {
                        borderColor: '#E5E5EA',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#1340FF',
                      },
                    },
                  }}
                />
              </Box>

              {/* Submit button */}
              <LoadingButton
                fullWidth
                variant="contained"
                loading={loading}
                onClick={handleSubmit}
                disabled={rating < 1}
                sx={{
                  bgcolor: '#1340FF',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  py: 1.2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: 15,
                  boxShadow: '0px -3px 0px 0px #102387 inset',
                  '&:hover': {
                    bgcolor: '#1935dd',
                    boxShadow: '0px -3px 0px 0px #102387 inset',
                  },
                  '&:active': {
                    boxShadow: '0px 0px 0px 0px #102387 inset',
                    transform: 'translateY(1px)',
                  },
                  '&.Mui-disabled': {
                    bgcolor: '#1340FF',
                    color: '#FFFFFF',
                    opacity: 0.5,
                    boxShadow: '0px -3px 0px 0px #102387 inset',
                  },
                }}
              >
                Submit Feedback
              </LoadingButton>
            </Stack>
          </m.div>
        )}
      </AnimatePresence>
    </Dialog>
  );
}

NpsFeedbackModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onSuccess: PropTypes.func,
  onMutate: PropTypes.func,
};
