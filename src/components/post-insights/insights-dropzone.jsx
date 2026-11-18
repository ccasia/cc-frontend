import PropTypes from 'prop-types';
import { useMemo, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

import { MAX_SCREENSHOTS } from 'src/sections/insight-ocr/constants';

const ACCEPT = { 'image/jpeg': [], 'image/png': [], 'image/webp': [] };
const BLUE = '#1340FF';

function Thumb({ file, onRemove, disabled }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  return (
    <Box sx={{ position: 'relative', width: 72, height: 128, flexShrink: 0 }}>
      <Box
        component="img"
        src={url}
        alt={file.name}
        sx={{
          width: 1,
          height: 1,
          objectFit: 'cover',
          borderRadius: 1,
          border: '1px solid #EBEBEB',
        }}
      />
      {!disabled && (
        <IconButton
          size="small"
          aria-label={`Remove ${file.name}`}
          onClick={onRemove}
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            p: 0.25,
            bgcolor: 'rgba(0,0,0,0.6)',
            color: '#fff',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
          }}
        >
          <Iconify icon="eva:close-fill" width={14} />
        </IconButton>
      )}
    </Box>
  );
}

Thumb.propTypes = {
  file: PropTypes.object.isRequired,
  onRemove: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default function InsightsDropzone({
  files,
  onChange,
  disabled,
  max = MAX_SCREENSHOTS,
  tabs = 'Insight tabs',
}) {
  const remaining = max - files.length;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPT,
    disabled: disabled || remaining <= 0,
    onDrop: (accepted) => onChange([...files, ...accepted.slice(0, remaining)]),
  });

  return (
    <Stack spacing={1.5}>
      <Box
        {...getRootProps()}
        sx={{
          px: 2,
          py: 3,
          textAlign: 'center',
          cursor: disabled || remaining <= 0 ? 'default' : 'pointer',
          borderRadius: 1.5,
          border: '1.5px dashed',
          borderColor: isDragActive ? BLUE : '#D1D1D1',
          bgcolor: isDragActive ? 'rgba(19, 64, 255, 0.04)' : '#FFFFFF',
          transition: 'border-color 120ms ease, background-color 120ms ease',
        }}
      >
        <input {...getInputProps()} />
        <Iconify
          icon="solar:gallery-add-linear"
          width={28}
          sx={{ color: isDragActive ? BLUE : '#8E8E93' }}
        />
        <Typography sx={{ mt: 1, fontSize: 14, fontWeight: 600, color: '#231F20' }}>
          {isDragActive ? 'Drop to add' : 'Drop screenshots here, or click to choose'}
        </Typography>
        <Typography sx={{ mt: 0.25, fontSize: 12, color: '#8E8E93' }}>
          {tabs} · JPG, PNG or WEBP · up to {max}
        </Typography>
      </Box>

      {!!files.length && (
        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
          {files.map((file, index) => (
            <Thumb
              key={`${file.name}-${file.lastModified}-${index}`}
              file={file}
              disabled={disabled}
              onRemove={() => onChange(files.filter((_, i) => i !== index))}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

InsightsDropzone.propTypes = {
  files: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  max: PropTypes.number,
  tabs: PropTypes.string,
};
