import { useState } from 'react';
import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';

import { Box, Stack, Button, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

import ConfirmPublishDialog from 'src/sections/campaign/create/confirm-publish-dialog';
import { EASE_OUT, EASE_IN_OUT } from 'src/sections/campaign/create/components/motion';

// ----------------------------------------------------------------------

// Same look as before; only the feel changes. Hover lifts the emoji and shades the
// card a little, a press sinks it quickly and the release eases back.
const choiceInteractionSx = {
  transition: `transform 160ms ${EASE_OUT}, background-color 150ms ease`,
  '& .choice-emoji': { transition: `transform 200ms ${EASE_OUT}` },
  '@media (hover: hover) and (pointer: fine)': {
    '&:hover': { bgcolor: '#EFEFEF' },
    '&:hover .choice-emoji': { transform: 'translateY(-4px)' },
  },
  '&:active': { transform: 'scale(0.98)', transitionDuration: '80ms' },
  '&:focus-visible': { outline: '2px solid #1340FF', outlineOffset: 3 },
  '@media (prefers-reduced-motion: reduce)': {
    '&:active': { transform: 'none' },
    '& .choice-emoji': { transform: 'none !important' },
  },
};

// Blue with a raised edge, so it reads first on the card. A light streak sweeps
// across now and then to draw the eye, then rests; no sweep with reduced motion.
const recommendedBadgeSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
  position: 'absolute',
  top: 15,
  left: 15,
  px: 1.2,
  py: 0.5,
  overflow: 'hidden',
  borderRadius: 0.8,
  bgcolor: '#1340FF',
  color: '#FFFFFF',
  boxShadow: 'inset 0px -2px 0px rgba(0, 0, 0, 0.25)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.04em',
  '@keyframes recommendedShimmer': {
    '0%': { transform: 'translateX(-100%)' },
    '35%, 100%': { transform: 'translateX(100%)' },
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(105deg, transparent 25%, rgba(255, 255, 255, 0.55) 50%, transparent 75%)',
    transform: 'translateX(-100%)',
    animation: `recommendedShimmer 3.2s ${EASE_IN_OUT} 600ms infinite`,
    pointerEvents: 'none',
  },
  '@media (prefers-reduced-motion: reduce)': { '&::after': { animation: 'none' } },
};

NextSteps.propTypes = {
  onPublish: PropTypes.func,
  onContinueAdditionalDetails: PropTypes.func,
  isLoading: PropTypes.bool,
  mode: PropTypes.oneOf(['create', 'activate']),
};

export default function NextSteps({
  onPublish,
  onContinueAdditionalDetails,
  isLoading = false,
  mode = 'create',
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { watch } = useFormContext();

  const campaignStartDate = watch('campaignStartDate');

  const isActivate = mode === 'activate';
  const publishCardLabel = isActivate ? 'Activate Campaign For Now' : 'Publish Campaign For Now';

  const handleOpenConfirm = () => setConfirmOpen(true);
  const handleCloseConfirm = () => setConfirmOpen(false);

  const handlePublish = () => {
    handleCloseConfirm();
    onPublish?.();
  };

  return (
    <Box sx={{ maxWidth: '800px', mx: 'auto', mb: { xs: 10, sm: 20 } }}>
      {/* Main Content - Publish Button */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          mb={{ xs: 2, sm: 4 }}
          sx={{ maxWidth: 500 }}
        >
          You may publish your campaign at this point, but completing the additional details
          encourages higher amounts of creator participation.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2, sm: 8 }} mt={3}>
          <Button
            variant="contained"
            size="large"
            disableRipple
            onClick={handleOpenConfirm}
            disabled={isLoading}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3,
              bgcolor: '#F5F5F5',
              maxWidth: 350,
              height: 400,
              px: 8,
              ':hover': {
                bgcolor: '#F5F5F5',
              },
              ...choiceInteractionSx,
            }}
          >
            <Typography className="choice-emoji" fontSize={100}>
              📕
            </Typography>
            <Typography
              variant="h3"
              color="#231F20"
              lineHeight={1.2}
              fontWeight={400}
              fontFamily="Instrument Serif"
            >
              {publishCardLabel}
            </Typography>
          </Button>

          <Button
            variant="contained"
            size="large"
            disableRipple
            onClick={onContinueAdditionalDetails}
            disabled={isLoading}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3,
              bgcolor: '#F5F5F5',
              maxWidth: 350,
              height: 400,
              px: 9,
              ':hover': {
                bgcolor: '#F5F5F5',
              },
              ...choiceInteractionSx,
            }}
          >
            <Box sx={recommendedBadgeSx}>
              <Iconify icon="solar:star-bold" width={12} />
              RECOMMENDED
            </Box>
            <Typography className="choice-emoji" fontSize={100}>
              📝
            </Typography>
            <Typography
              variant="h3"
              color="#231F20"
              lineHeight={1.2}
              fontWeight={400}
              fontFamily="Instrument Serif"
            >
              Continue Additional Details
            </Typography>
          </Button>
        </Stack>
      </Box>

      {/* Confirmation Dialog */}
      <ConfirmPublishDialog
        open={confirmOpen}
        onClose={handleCloseConfirm}
        onConfirm={handlePublish}
        loading={isLoading}
        activate={isActivate}
        startDate={campaignStartDate}
      />
    </Box>
  );
}
