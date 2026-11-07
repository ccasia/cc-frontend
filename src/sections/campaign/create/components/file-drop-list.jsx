import PropTypes from 'prop-types';
import { useDropzone } from 'react-dropzone';
import { useController, useFormContext } from 'react-hook-form';

import { grey } from '@mui/material/colors';
import { Box, Stack, IconButton, Typography, FormHelperText } from '@mui/material';

import { fData } from 'src/utils/format-number';

import Iconify from 'src/components/iconify';

import { BLUE } from './option-card';
import { FIELD_HEIGHT } from './field-styles';

const hoverOnly = (styles) => ({ '@media (hover: hover) and (pointer: fine)': styles });

// An item is a new File, a saved URL, or a draft upload ({ url, name, size, type })
const describe = (item) => {
  if (typeof item === 'string') {
    const name = item.split('?')[0].split('/').pop() || 'File';
    let decoded = name;
    try {
      decoded = decodeURIComponent(name);
    } catch {
      // Keep the raw name
    }
    return { name: decoded, url: item };
  }
  return {
    name: item?.name || 'File',
    size: item?.size,
    type: item?.type,
    url: item?.preview || item?.url,
  };
};

const isImage = ({ name = '', type = '' }) =>
  type.startsWith('image/') || /\.(png|jpe?g|webp|gif|heic)$/i.test(name);

const dropSx = ({ compact, dragging, error }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: compact ? FIELD_HEIGHT : 120,
  px: 2,
  border: '1px solid',
  borderColor: grey[300],
  borderRadius: 1,
  bgcolor: '#FFFFFF',
  cursor: 'pointer',
  outline: 'none',
  transition: 'border-color 150ms ease, background-color 150ms ease',
  ...hoverOnly({ '&:hover': { borderColor: BLUE, bgcolor: '#F5F7FF' } }),
  '&:focus-visible': { outline: `2px solid ${BLUE}`, outlineOffset: 2 },
  ...(dragging && { borderColor: BLUE, borderStyle: 'dashed', bgcolor: '#EEF2FF' }),
  ...(error && { borderColor: 'error.main', bgcolor: 'rgba(255, 86, 48, 0.08)' }),
});

const listSx = {
  m: 0,
  p: 0,
  listStyle: 'none',
  border: '1px solid #E8E8E8',
  borderRadius: 1,
  overflow: 'hidden',
  '& > li + li': { borderTop: '1px solid #F0F0F0' },
};

// Several files in one field: a drop area, then one row per file.
// The drop area gets small once there is a file, so the list stays in view.
export default function FileDropList({ name, accept, maxSize, typesLabel }) {
  const { control } = useFormContext();
  const {
    field,
    fieldState: { error },
  } = useController({ name, control });

  const files = Array.isArray(field.value) ? field.value : [];

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    accept,
    maxSize,
    multiple: true,
    onDrop: (accepted) => {
      if (!accepted.length) return;
      const added = accepted.map((file) =>
        Object.assign(file, { preview: URL.createObjectURL(file) })
      );
      field.onChange([...files, ...added]);
    },
  });

  const remove = (item) => {
    if (item instanceof File && item.preview) URL.revokeObjectURL(item.preview);
    field.onChange(files.filter((file) => file !== item));
  };

  const compact = files.length > 0;
  const rejections = fileRejections.map(({ file, errors }) =>
    errors[0]?.code === 'file-too-large'
      ? `${file.name} is over ${fData(maxSize)}.`
      : `${file.name} is not a ${typesLabel} file.`
  );
  const messages = [error?.message, ...rejections].filter(Boolean);

  return (
    <Stack spacing={1}>
      <Box
        {...getRootProps({
          role: 'button',
          'aria-label': compact ? 'Add more files' : 'Choose files to upload',
        })}
        sx={dropSx({ compact, dragging: isDragActive, error: messages.length > 0 })}
      >
        <input {...getInputProps()} />
        {compact ? (
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ color: BLUE }}>
            <Iconify icon="mingcute:add-line" width={16} />
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'inherit' }}>
              Add more files
            </Typography>
          </Stack>
        ) : (
          <Stack alignItems="center" spacing={1}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: BLUE,
                color: '#FFFFFF',
              }}
            >
              <Iconify icon="mingcute:add-line" width={16} />
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#231F20' }}>
                Choose files or drag them here
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#8E8E93' }}>
                {typesLabel} · Max {fData(maxSize)} each
              </Typography>
            </Box>
          </Stack>
        )}
      </Box>

      {compact && (
        <Box component="ul" sx={listSx}>
          {files.map((item) => {
            const file = describe(item);
            return (
              <Stack
                component="li"
                key={file.url || file.name}
                direction="row"
                alignItems="center"
                spacing={1.25}
                sx={{ height: 48, pl: 1.5, pr: 0.75 }}
              >
                <Iconify
                  icon={isImage(file) ? 'solar:gallery-linear' : 'solar:document-text-linear'}
                  width={20}
                  sx={{ flexShrink: 0, color: '#8E8E93' }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    noWrap
                    component={file.url ? 'a' : 'p'}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={file.name}
                    sx={{
                      display: 'block',
                      fontSize: 14,
                      fontWeight: 500,
                      lineHeight: '20px',
                      color: '#231F20',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      ...hoverOnly({ '&[href]:hover': { textDecoration: 'underline' } }),
                      '&:focus-visible': { outline: `2px solid ${BLUE}`, outlineOffset: 1 },
                    }}
                  >
                    {file.name}
                  </Typography>
                  {!!file.size && (
                    <Typography sx={{ fontSize: 12, lineHeight: '16px', color: '#8E8E93' }}>
                      {fData(file.size)}
                    </Typography>
                  )}
                </Box>
                <IconButton
                  size="small"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => remove(item)}
                  sx={{ flexShrink: 0, color: '#8E8E93' }}
                >
                  <Iconify icon="mingcute:close-line" width={16} />
                </IconButton>
              </Stack>
            );
          })}
        </Box>
      )}

      {messages.map((message) => (
        <FormHelperText key={message} error sx={{ mt: '0 !important' }}>
          {message}
        </FormHelperText>
      ))}
    </Stack>
  );
}

FileDropList.propTypes = {
  name: PropTypes.string.isRequired,
  accept: PropTypes.object.isRequired,
  maxSize: PropTypes.number.isRequired,
  typesLabel: PropTypes.string.isRequired,
};
