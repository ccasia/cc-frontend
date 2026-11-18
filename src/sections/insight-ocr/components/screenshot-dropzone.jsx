import PropTypes from 'prop-types';
import { useDropzone } from 'react-dropzone';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

import { ACCENT, MAX_SCREENSHOTS } from '../constants';
import { IMAGE_ACCEPT } from '../hooks/use-add-screenshots';

const TABS = ['Overview', 'Engagement', 'Audience'];
const PASTE_KEY = typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent) ? '⌘V' : 'Ctrl+V';

const Kbd = ({ children }) => (
  <Box
    component="kbd"
    sx={{
      px: 0.75,
      py: 0.25,
      borderRadius: 0.5,
      border: '1px solid #E7E7E7',
      borderBottomWidth: 2,
      bgcolor: 'white',
      fontFamily: 'inherit',
      fontSize: 12,
      fontWeight: 600,
    }}
  >
    {children}
  </Box>
);

Kbd.propTypes = { children: PropTypes.node };

export default function ScreenshotDropzone({ onAdd, compact, disabled }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: IMAGE_ACCEPT,
    multiple: true,
    disabled,
    noDragEventsBubbling: true,
    onDrop: (accepted, rejected) => onAdd(accepted, rejected.length),
  });

  const sx = {
    cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: 2,
    border: '1.5px dashed',
    borderColor: isDragActive ? ACCENT : '#D4D4D4',
    bgcolor: isDragActive ? 'rgba(19, 64, 255, 0.04)' : '#FAFAFA',
    opacity: disabled ? 0.4 : 1,
    transition: 'border-color 150ms ease, background-color 150ms ease',
    '&:hover': !disabled && { borderColor: ACCENT, bgcolor: 'rgba(19, 64, 255, 0.02)' },
  };

  if (compact) {
    return (
      <Box
        {...getRootProps()}
        title="Add screenshots"
        sx={{ ...sx, borderRadius: 1, width: 64, height: 116, flexShrink: 0, display: 'grid', placeItems: 'center' }}
      >
        <input {...getInputProps()} />
        <Iconify icon="mingcute:add-line" width={20} sx={{ color: 'text.secondary' }} />
      </Box>
    );
  }

  return (
    <Box {...getRootProps()} sx={{ ...sx, py: { xs: 6, md: 9 }, px: 3 }}>
      <input {...getInputProps()} />

      <Stack alignItems="center" textAlign="center" spacing={2.5}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            bgcolor: isDragActive ? ACCENT : 'white',
            color: isDragActive ? 'white' : ACCENT,
            border: '1px solid #E7E7E7',
            transform: isDragActive ? 'scale(1.08)' : 'scale(1)',
            transition: 'transform 200ms cubic-bezier(0.23, 1, 0.32, 1), background-color 150ms ease',
          }}
        >
          <Iconify icon={isDragActive ? 'mingcute:download-2-line' : 'solar:gallery-add-linear'} width={28} />
        </Box>

        <Box>
          <Typography variant="h6">{isDragActive ? 'Drop to start reading' : 'Add Instagram or TikTok insight screenshots'}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Drag and drop, paste with <Kbd>{PASTE_KEY}</Kbd>, or choose files. Reading starts at once.
          </Typography>
        </Box>

        <Button component="span" variant="contained" startIcon={<Iconify icon="solar:upload-linear" />}>
          Choose files
        </Button>

        <Stack direction="row" flexWrap="wrap" justifyContent="center" alignItems="center" gap={1}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            For full data, add all 3 tabs:
          </Typography>
          {TABS.map((tab) => (
            <Box
              key={tab}
              sx={{ px: 1, py: 0.25, borderRadius: 0.75, border: '1px solid #E7E7E7', bgcolor: 'white', typography: 'caption' }}
            >
              {tab}
            </Box>
          ))}
        </Stack>

        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          JPG, PNG, or WEBP · up to {MAX_SCREENSHOTS} images · about $0.002 each
        </Typography>
      </Stack>
    </Box>
  );
}

ScreenshotDropzone.propTypes = {
  onAdd: PropTypes.func.isRequired,
  compact: PropTypes.bool,
  disabled: PropTypes.bool,
};
