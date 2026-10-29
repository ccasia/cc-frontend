import { useState } from 'react';
import PropTypes from 'prop-types';

import { Box, Stack, Tooltip, ButtonBase, IconButton, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

import { STROKE_WIDTHS, ANNOTATION_TOOLS, ANNOTATION_COLOR_ROWS } from './annotation-shapes';

const ICON_SIZE = 20;

const buttonSx = {
  p: 0.875,
  // Squircle rather than MUI's round hover / selected background
  borderRadius: '10px',
  color: '#F4F4F4',
  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.12)' },
  '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.3)' },
};

const dividerSx = { width: '1px', height: 22, bgcolor: 'rgba(255, 255, 255, 0.24)', mx: 0.75 };

const SWATCH_SIZE = 18;

// Dark check on light swatches, light check on dark ones
const isLightColor = (hex) => {
  const value = parseInt(hex.slice(1), 16);
  // eslint-disable-next-line no-bitwise
  const [r, g, b] = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  return r * 0.299 + g * 0.587 + b * 0.114 > 160;
};

function Swatch({ value, selected, onClick }) {
  return (
    <Box
      component="button"
      type="button"
      title={value}
      aria-label={value}
      aria-pressed={selected}
      onClick={onClick}
      sx={{
        width: SWATCH_SIZE,
        height: SWATCH_SIZE,
        p: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        bgcolor: value,
        border: '1px solid rgba(255, 255, 255, 0.18)',
        cursor: 'pointer',
        transition: 'transform 100ms ease',
        '&:hover': { transform: 'scale(1.15)' },
      }}
    >
      {selected && (
        <Iconify
          icon="eva:checkmark-fill"
          width={14}
          sx={{ color: isLightColor(value) ? '#000' : '#FFF' }}
        />
      )}
    </Box>
  );
}

Swatch.propTypes = {
  value: PropTypes.string.isRequired,
  selected: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
};

// Google Sheets-style grid: one row per palette row
function SwatchGrid({ value, onPick }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${ANNOTATION_COLOR_ROWS[0].length}, ${SWATCH_SIZE}px)`,
        // Centred under the (wider) tool row
        justifyContent: 'center',
        gap: 0.5,
      }}
    >
      {ANNOTATION_COLOR_ROWS.flat().map((item) => (
        <Swatch key={item} value={item} selected={value === item} onClick={() => onPick(item)} />
      ))}
    </Box>
  );
}

SwatchGrid.propTypes = {
  value: PropTypes.string,
  onPick: PropTypes.func.isRequired,
};

// Toolbar button showing the current colour; opens its palette
function PaletteButton({ label, open, onClick, children }) {
  return (
    <Tooltip title={label}>
      <IconButton
        size="small"
        aria-label={label}
        aria-expanded={open}
        onClick={onClick}
        sx={{
          ...buttonSx,
          gap: 0.375,
          bgcolor: open ? 'rgba(255, 255, 255, 0.16)' : 'transparent',
        }}
      >
        {children}
        <Iconify icon={open ? 'eva:chevron-up-fill' : 'eva:chevron-down-fill'} width={14} />
      </IconButton>
    </Tooltip>
  );
}

PaletteButton.propTypes = {
  label: PropTypes.string.isRequired,
  open: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node,
};

// Line drawn at roughly the stroke's weight, for the button and its options
function StrokeLine({ value, color, width = ICON_SIZE }) {
  return (
    <Box
      sx={{
        width,
        height: Math.max(2, Math.round(value * 1.2)),
        borderRadius: 99,
        bgcolor: color,
      }}
    />
  );
}

StrokeLine.propTypes = {
  value: PropTypes.number.isRequired,
  color: PropTypes.string,
  width: PropTypes.number,
};

const previewSx = {
  width: ICON_SIZE,
  height: ICON_SIZE,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid rgba(255, 255, 255, 0.3)',
};

// Floating tool picker for the annotation canvas: tools, colour, line thickness (for lines
// and boxes), text background (for text), undo / clear / close. Palettes open inside the
// toolbar rather than in a popover, so they work when the video frame is fullscreen.
export default function AnnotationToolbar({
  tool,
  color,
  textBg = null,
  showTextBg = false,
  stroke,
  showStroke = false,
  canUndo,
  canClear,
  onUndo,
  onClear,
  onClose,
  onToolChange,
  onColorChange,
  onTextBgChange,
  onStrokeChange,
  sx,
}) {
  // Which palette is open: 'color' | 'textBg' | 'stroke' | null
  const [palette, setPalette] = useState(null);
  const hidden = (palette === 'textBg' && !showTextBg) || (palette === 'stroke' && !showStroke);
  const openPalette = hidden ? null : palette;

  const togglePalette = (name) => setPalette((prev) => (prev === name ? null : name));

  const pickStroke = (value) => {
    onStrokeChange(value);
    setPalette(null);
  };

  const pickColor = (value) => {
    onColorChange(value);
    setPalette(null);
  };

  const pickTextBg = (value) => {
    onTextBgChange(value);
    setPalette(null);
  };

  return (
    <Stack
      // Clicks here shouldn't reach the frame underneath (play / pause)
      onClick={(event) => event.stopPropagation()}
      gap={0.75}
      sx={{
        // Its own width even when centred with left: 50%, which would otherwise squeeze it
        // to half the frame and push the row off one side
        width: 'max-content',
        px: 1,
        py: 0.75,
        borderRadius: '14px',
        bgcolor: 'rgba(17, 17, 19, 0.85)',
        backdropFilter: 'blur(6px)',
        ...sx,
      }}
    >
      <Stack direction="row" alignItems="center" gap={0.5}>
        {ANNOTATION_TOOLS.map((item) => (
          <Tooltip key={item.id} title={`${item.label} (${item.key})`}>
            <IconButton
              size="small"
              aria-label={item.label}
              aria-pressed={tool === item.id}
              onClick={() => onToolChange(item.id)}
              sx={{
                ...buttonSx,
                color: tool === item.id ? 'common.white' : '#A0A0A8',
                bgcolor: tool === item.id ? 'rgba(255, 255, 255, 0.16)' : 'transparent',
              }}
            >
              <Iconify icon={item.icon} width={ICON_SIZE} />
            </IconButton>
          </Tooltip>
        ))}

        <Box sx={dividerSx} />

        <PaletteButton
          label="Colour"
          open={openPalette === 'color'}
          onClick={() => togglePalette('color')}
        >
          <Box sx={{ ...previewSx, borderRadius: '50%', bgcolor: color }} />
        </PaletteButton>

        {showStroke && (
          <PaletteButton
            label="Thickness"
            open={openPalette === 'stroke'}
            onClick={() => togglePalette('stroke')}
          >
            <Box sx={{ ...previewSx, border: 'none' }}>
              <StrokeLine value={stroke} color="#F4F4F4" />
            </Box>
          </PaletteButton>
        )}

        {showTextBg && (
          <PaletteButton
            label="Text background"
            open={openPalette === 'textBg'}
            onClick={() => togglePalette('textBg')}
          >
            <Box
              sx={{
                ...previewSx,
                borderRadius: '5px',
                fontSize: 12,
                fontWeight: 700,
                color,
                bgcolor: textBg || 'transparent',
              }}
            >
              A
            </Box>
          </PaletteButton>
        )}

        <Box sx={dividerSx} />

        <Tooltip title="Undo">
          <span>
            <IconButton
              size="small"
              aria-label="Undo"
              onClick={onUndo}
              disabled={!canUndo}
              sx={buttonSx}
            >
              <Iconify icon="mdi:undo" width={ICON_SIZE} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Clear all">
          <span>
            <IconButton
              size="small"
              aria-label="Clear all"
              onClick={onClear}
              disabled={!canClear}
              sx={buttonSx}
            >
              <Iconify icon="mdi:delete-outline" width={ICON_SIZE} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Discard drawing (esc)">
          <IconButton size="small" aria-label="Discard drawing" onClick={onClose} sx={buttonSx}>
            <Iconify icon="mdi:close" width={ICON_SIZE} />
          </IconButton>
        </Tooltip>
      </Stack>

      {openPalette && (
        <Stack gap={0.75} sx={{ px: 0.5, pt: 0.25, pb: 0.5 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 500, color: '#A0A0A8' }}>
            {{ color: 'Colour', textBg: 'Text background', stroke: 'Thickness' }[openPalette]}
          </Typography>

          {openPalette === 'stroke' && (
            <Stack direction="row" justifyContent="center" gap={0.5}>
              {STROKE_WIDTHS.map((item) => (
                <ButtonBase
                  key={item.value}
                  onClick={() => pickStroke(item.value)}
                  aria-pressed={stroke === item.value}
                  sx={{
                    flexDirection: 'column',
                    gap: 0.75,
                    width: 64,
                    py: 1,
                    borderRadius: '10px',
                    fontSize: 12,
                    color: '#F4F4F4',
                    bgcolor: stroke === item.value ? 'rgba(255, 255, 255, 0.16)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.12)' },
                  }}
                >
                  <StrokeLine value={item.value} color={color} width={36} />
                  {item.label}
                </ButtonBase>
              ))}
            </Stack>
          )}

          {openPalette === 'textBg' && (
            <ButtonBase
              onClick={() => pickTextBg(null)}
              aria-pressed={!textBg}
              sx={{
                alignSelf: 'flex-start',
                gap: 0.75,
                px: 1,
                py: 0.5,
                borderRadius: '8px',
                fontSize: 12.5,
                color: '#F4F4F4',
                bgcolor: !textBg ? 'rgba(255, 255, 255, 0.16)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.12)' },
              }}
            >
              <Iconify icon="mdi:format-color-marker-cancel" width={16} />
              No background
            </ButtonBase>
          )}

          {openPalette !== 'stroke' && (
            <SwatchGrid
              value={openPalette === 'color' ? color : textBg}
              onPick={openPalette === 'color' ? pickColor : pickTextBg}
            />
          )}
        </Stack>
      )}
    </Stack>
  );
}

AnnotationToolbar.propTypes = {
  tool: PropTypes.string,
  color: PropTypes.string,
  textBg: PropTypes.string,
  showTextBg: PropTypes.bool,
  stroke: PropTypes.number,
  showStroke: PropTypes.bool,
  canUndo: PropTypes.bool,
  canClear: PropTypes.bool,
  onUndo: PropTypes.func,
  onClear: PropTypes.func,
  onClose: PropTypes.func,
  onToolChange: PropTypes.func,
  onColorChange: PropTypes.func,
  onTextBgChange: PropTypes.func,
  onStrokeChange: PropTypes.func,
  sx: PropTypes.object,
};
