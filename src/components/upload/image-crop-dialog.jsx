import PropTypes from 'prop-types';
import Cropper from 'react-easy-crop';
import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Slider from '@mui/material/Slider';
import Tooltip from '@mui/material/Tooltip';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

import {
  TEXT_ACTION_SX,
  PRIMARY_ACTION_SX,
  SECONDARY_ACTION_SX,
} from 'src/components/campaign/action-button-styles';

import Iconify from '../iconify';
import CropHandles from './crop-handles';

const QUALITY = {
  sharp: { label: 'Sharp', color: '#22C55E' },
  good: { label: 'Good', color: '#22C55E' },
  low: { label: 'Low quality', color: '#FFAB00' },
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.1;
const START = { crop: { x: 0, y: 0 }, zoom: 1 };

const clampZoom = (value) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 100) / 100));

// A light checkerboard shows where the image has no pixels
const CHECKER = 'repeating-conic-gradient(#E7E7E7 0% 25%, #F4F4F4 0% 50%) 0 0 / 16px 16px';

const paperSx = {
  m: { xs: 1.5, sm: 2 },
  p: { xs: 2, sm: 3 },
  width: '100%',
  maxHeight: { xs: 'calc(100% - 24px)', sm: 'calc(100% - 32px)' },
  bgcolor: '#F4F4F4',
  backgroundImage: 'none',
  borderRadius: '12px',
  boxShadow: '0px 24px 48px rgba(35, 31, 32, 0.16)',
  '@keyframes cropDialogIn': {
    from: { transform: 'scale(0.98)' },
    to: { transform: 'scale(1)' },
  },
  animation: 'cropDialogIn 250ms cubic-bezier(0.23, 1, 0.32, 1)',
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
};

const iconButtonSx = {
  ...SECONDARY_ACTION_SX,
  width: 32,
  minWidth: 32,
  height: 32,
  p: 0,
  pb: '3px',
  color: '#3A3A3C',
  '&:active': { ...SECONDARY_ACTION_SX['&:active'], pb: '1px' },
};

const sliderSx = {
  flex: 1,
  color: '#3A3A3C',
  height: 4,
  py: '14px',
  '& .MuiSlider-rail': { bgcolor: '#D6D6D6', opacity: 1 },
  '& .MuiSlider-track': { border: 0 },
  '& .MuiSlider-thumb': {
    width: 18,
    height: 18,
    bgcolor: '#FFFFFF',
    border: '1px solid #D6D6D6',
    boxShadow: 'inset 0px -2px 0px #E7E7E7, 0px 1px 2px rgba(0, 0, 0, 0.08)',
    '&::before': { display: 'none' },
    '&:hover, &.Mui-focusVisible, &.Mui-active': {
      boxShadow: 'inset 0px -2px 0px #E7E7E7, 0px 0px 0px 4px rgba(58, 58, 60, 0.12)',
    },
  },
};

export default function ImageCropDialog({
  image,
  aspect = 16 / 9,
  title = 'Crop campaign image',
  applying = false,
  minOutputWidth = 1200,
  lowResNote = 'This may look blurry on the card. Zoom out or use a larger image.',
  onCancel,
  onApply,
  renderPreview,
}) {
  const [crop, setCrop] = useState(START.crop);
  const [zoom, setZoom] = useState(START.zoom);
  const [area, setArea] = useState(null);
  const [cropSize, setCropSize] = useState(null);

  const handleAreaChange = useCallback((areaPercent, areaPixels) => {
    setArea({ percent: areaPercent, pixels: areaPixels });
  }, []);

  const changeZoom = (value) => setZoom(clampZoom(value));
  const nudgeZoom = (delta) => setZoom((current) => clampZoom(current + delta));
  const reset = () => {
    setCrop(START.crop);
    setZoom(START.zoom);
  };

  const handleKeyDown = (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === '+' || event.key === '=') nudgeZoom(ZOOM_STEP);
    else if (event.key === '-' || event.key === '_') nudgeZoom(-ZOOM_STEP);
    else if (event.key === '0') reset();
    else return;
    event.preventDefault();
  };

  const handleCancel = () => {
    if (!applying) onCancel();
  };

  const outputWidth = Math.round(area?.pixels?.width ?? 0);
  const outputHeight = Math.round(area?.pixels?.height ?? 0);
  const isLowRes = outputWidth > 0 && outputWidth < minOutputWidth;
  let quality = 'good';
  if (isLowRes) quality = 'low';
  else if (outputWidth >= 1920) quality = 'sharp';
  const isReset = zoom === START.zoom && crop.x === 0 && crop.y === 0;

  const preview = area && (
    <Box sx={{ position: 'relative', width: 1, aspectRatio: `${aspect}`, overflow: 'hidden' }}>
      <Box
        component="img"
        src={image}
        alt=""
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          maxWidth: 'none',
          width: `${10000 / area.percent.width}%`,
          transform: `translate(${-area.percent.x}%, ${-area.percent.y}%)`,
          transformOrigin: '0 0',
        }}
      />
    </Box>
  );

  return (
    <Dialog
      open={!!image}
      onClose={handleCancel}
      maxWidth={false}
      onKeyDown={handleKeyDown}
      aria-labelledby="image-crop-title"
      PaperProps={{ sx: { ...paperSx, maxWidth: renderPreview ? 1040 : 640 } }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
        <Box>
          <Typography
            id="image-crop-title"
            component="h2"
            sx={{
              fontFamily: 'Instrument Serif, serif',
              fontWeight: 400,
              fontSize: { xs: 26, sm: 30 },
              lineHeight: { xs: '30px', sm: '34px' },
              color: '#231F20',
            }}
          >
            {title}
          </Typography>
          <Typography sx={{ mt: 0.5, fontSize: 14, lineHeight: '20px', color: '#636366' }}>
            Drag to move. Drag a corner to pick an area. Pinch, scroll or use the slider to zoom.
            <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
              {' '}
              Arrow keys nudge the image.
            </Box>
          </Typography>
        </Box>
        <ButtonBase aria-label="Close" onClick={handleCancel} disabled={applying} sx={iconButtonSx}>
          <Iconify icon="material-symbols:close" width={16} />
        </ButtonBase>
      </Stack>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={{ xs: 2.5, md: 4 }}
        sx={{ mt: 2.5 }}
        divider={
          renderPreview && (
            <Box
              aria-hidden
              sx={{
                flexShrink: 0,
                alignSelf: 'stretch',
                bgcolor: '#D1D1D6',
                width: { xs: 'auto', md: '1px' },
                height: { xs: '1px', md: 'auto' },
              }}
            />
          )
        }
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              position: 'relative',
              width: 1,
              aspectRatio: '16 / 10',
              borderRadius: 1,
              overflow: 'hidden',
              background: CHECKER,
              border: '1px solid #E7E7E7',
              // The library uses these class names for its focus outline
              '& .reactEasyCrop_CropArea:focus-visible': { outline: '2px solid #1340FF' },
            }}
          >
            {image && (
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                minZoom={MIN_ZOOM}
                maxZoom={MAX_ZOOM}
                aspect={aspect}
                zoomSpeed={0.4}
                keyboardStep={4}
                onCropChange={setCrop}
                onZoomChange={changeZoom}
                onCropAreaChange={handleAreaChange}
                onCropSizeChange={setCropSize}
                style={{
                  cropAreaStyle: {
                    border: '2px solid #FFFFFF',
                    color: 'rgba(35, 31, 32, 0.55)',
                    borderRadius: 4,
                  },
                }}
              />
            )}
            <CropHandles
              cropSize={cropSize}
              aspect={aspect}
              zoom={zoom}
              crop={crop}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              onChange={(next) => {
                setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next.zoom)));
                setCrop(next.crop);
              }}
            />
            {outputWidth > 0 && (
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.75}
                sx={{
                  position: 'absolute',
                  left: 8,
                  bottom: 8,
                  zIndex: 3,
                  px: 1,
                  py: 0.5,
                  borderRadius: '6px',
                  bgcolor: 'rgba(35, 31, 32, 0.72)',
                  backdropFilter: 'blur(8px)',
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 600,
                  lineHeight: '16px',
                  fontVariantNumeric: 'tabular-nums',
                  pointerEvents: 'none',
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: QUALITY[quality].color,
                    transition: 'background-color 150ms ease',
                  }}
                />
                <Box
                  component="span"
                  key={quality}
                  sx={{
                    '@keyframes qualityLabelIn': { from: { opacity: 0 }, to: { opacity: 1 } },
                    animation: 'qualityLabelIn 150ms ease',
                  }}
                >
                  {QUALITY[quality].label}
                </Box>
                <Box component="span" sx={{ opacity: 0.6 }}>
                  {outputWidth} × {outputHeight}
                </Box>
              </Stack>
            )}
          </Box>

          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mt: 2 }}>
            <ButtonBase
              aria-label="Zoom out"
              onClick={() => nudgeZoom(-ZOOM_STEP)}
              disabled={zoom <= MIN_ZOOM}
              sx={iconButtonSx}
            >
              <Iconify icon="eva:minus-fill" width={16} />
            </ButtonBase>
            <Slider
              aria-label="Zoom"
              value={zoom}
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              onChange={(_, value) => changeZoom(value)}
              sx={sliderSx}
            />
            <ButtonBase
              aria-label="Zoom in"
              onClick={() => nudgeZoom(ZOOM_STEP)}
              disabled={zoom >= MAX_ZOOM}
              sx={iconButtonSx}
            >
              <Iconify icon="eva:plus-fill" width={16} />
            </ButtonBase>
            <Typography
              sx={{
                width: 44,
                textAlign: 'right',
                fontSize: 14,
                fontWeight: 600,
                color: '#3A3A3C',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {Math.round(zoom * 100)}%
            </Typography>
            <Tooltip title="Reset position and zoom (0)" placement="top" arrow>
              <span>
                <Button
                  onClick={reset}
                  disabled={isReset}
                  startIcon={<Iconify icon="eva:refresh-fill" width={16} />}
                  aria-label="Reset"
                  sx={{
                    ...TEXT_ACTION_SX,
                    minWidth: 0,
                    px: 1,
                    '& .MuiButton-startIcon': { mr: { xs: 0, sm: 0.75 }, ml: 0 },
                  }}
                >
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                    Reset
                  </Box>
                </Button>
              </span>
            </Tooltip>
          </Stack>

          {/* The space is always kept, so the dialog does not change height when the note shows */}
          <Stack
            direction="row"
            alignItems="flex-start"
            spacing={0.75}
            aria-hidden={!isLowRes}
            sx={{
              mt: 1,
              minHeight: { xs: 36, sm: 20 },
              opacity: isLowRes ? 1 : 0,
              visibility: isLowRes ? 'visible' : 'hidden',
              transform: isLowRes ? 'none' : 'translateY(-4px)',
              transition: isLowRes
                ? 'opacity 200ms cubic-bezier(0.23, 1, 0.32, 1), transform 200ms cubic-bezier(0.23, 1, 0.32, 1), visibility 0s'
                : 'opacity 120ms ease-out, transform 120ms ease-out, visibility 0s 120ms',
              '@media (prefers-reduced-motion: reduce)': { transform: 'none' },
            }}
          >
            <Iconify
              icon="eva:alert-triangle-fill"
              width={16}
              sx={{ color: '#FFAB00', flexShrink: 0, mt: '1px' }}
            />
            <Typography sx={{ fontSize: 13, lineHeight: '18px', color: '#636366' }}>
              {lowResNote}
            </Typography>
          </Stack>
        </Box>

        {renderPreview && (
          <Box
            role="img"
            aria-label="Campaign card preview"
            sx={{ width: { xs: 1, md: 320 }, flexShrink: 0, alignSelf: { md: 'center' } }}
          >
            {renderPreview(preview)}
          </Box>
        )}
      </Stack>

      <Stack
        direction="row"
        justifyContent="flex-end"
        spacing={1}
        sx={{ mt: 3, '& > *': { flex: { xs: 1, sm: 'none' } } }}
      >
        <Button
          onClick={handleCancel}
          disabled={applying}
          sx={{ ...SECONDARY_ACTION_SX, minWidth: 112 }}
        >
          Cancel
        </Button>
        <LoadingButton
          onClick={() => onApply(area.pixels)}
          loading={applying}
          disabled={!area}
          sx={{ ...PRIMARY_ACTION_SX, minWidth: 112 }}
        >
          Apply
        </LoadingButton>
      </Stack>
    </Dialog>
  );
}

ImageCropDialog.propTypes = {
  image: PropTypes.string,
  aspect: PropTypes.number,
  title: PropTypes.string,
  applying: PropTypes.bool,
  minOutputWidth: PropTypes.number,
  lowResNote: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  renderPreview: PropTypes.func,
};
