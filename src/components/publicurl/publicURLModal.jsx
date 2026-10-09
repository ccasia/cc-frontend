import { useState } from 'react';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';

import {
  Box,
  Stack,
  Button,
  Dialog,
  Tooltip,
  IconButton,
  Typography,
  DialogContent,
  DialogActions,
} from '@mui/material';

import Iconify from 'src/components/iconify';

const FIELD_SX = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
  border: '1px solid #E7E7E7',
  borderRadius: '10px',
  pl: 1.75,
  pr: 0.75,
  py: 0.75,
  bgcolor: '#FFFFFF',
  transition: 'border-color 0.15s',
  '&:hover': { borderColor: '#D1D1D6' },
};

const ICON_BUTTON_SX = {
  color: '#8E8E93',
  '&:hover': { bgcolor: 'rgba(19, 64, 255, 0.08)', color: '#1340FF' },
};

const PublicUrlModal = ({ open, onClose, publicUrl, password }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const handleCopy = async (value, field, label) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      enqueueSnackbar(`${label} copied to clipboard!`, { variant: 'success' });
      setTimeout(() => setCopiedField((current) => (current === field ? null : current)), 1800);
    } catch {
      enqueueSnackbar(`Failed to copy ${label.toLowerCase()}`, { variant: 'error' });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: '20px' } }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 16,
          top: 16,
          color: '#8E8E93',
          '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
        }}
      >
        <Iconify icon="eva:close-fill" width={20} />
      </IconButton>

      <DialogContent sx={{ px: 4, pt: 5, pb: 1 }}>
        <Stack alignItems="center" spacing={1} sx={{ mb: 3.5, textAlign: 'center' }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: 'rgba(19, 64, 255, 0.10)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 0.5,
            }}
          >
            <Iconify icon="eva:link-2-fill" width={26} sx={{ color: '#1340FF' }} />
          </Box>

          <Typography
            sx={{
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
              fontWeight: 500,
              fontSize: '28px',
              letterSpacing: '-0.01em',
              color: '#221F20',
            }}
          >
            Public Access Generated
          </Typography>

          <Typography
            sx={{
              color: '#8E8E93',
              fontSize: '14px',
              lineHeight: 1.5,
              maxWidth: 360,
            }}
          >
            Share this link and password with anyone who needs access.
          </Typography>
        </Stack>

        <Stack spacing={2}>
          <Stack spacing={0.75}>
            <Typography
              sx={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#8E8E93',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                pl: 0.25,
              }}
            >
              Link
            </Typography>
            <Box sx={FIELD_SX}>
              <Typography
                component="a"
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  flex: 1,
                  minWidth: 0,
                  wordBreak: 'break-all',
                  fontSize: '13.5px',
                  color: '#1340FF',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {publicUrl}
              </Typography>
              <Tooltip title={copiedField === 'url' ? 'Copied!' : 'Copy link'}>
                <IconButton
                  size="small"
                  onClick={() => handleCopy(publicUrl, 'url', 'Link')}
                  sx={ICON_BUTTON_SX}
                >
                  <Iconify
                    icon={copiedField === 'url' ? 'eva:checkmark-fill' : 'eva:copy-outline'}
                    width={17}
                  />
                </IconButton>
              </Tooltip>
            </Box>
          </Stack>

          <Stack spacing={0.75}>
            <Typography
              sx={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#8E8E93',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                pl: 0.25,
              }}
            >
              Password
            </Typography>
            <Box sx={FIELD_SX}>
              <Typography
                sx={{
                  flex: 1,
                  minWidth: 0,
                  wordBreak: 'break-all',
                  fontSize: '13.5px',
                  fontFamily: 'monospace',
                  color: '#221F20',
                  letterSpacing: showPassword ? 'normal' : '0.1em',
                }}
              >
                {showPassword ? password : '•'.repeat(Math.max(password?.length || 0, 8))}
              </Typography>
              <Tooltip title={showPassword ? 'Hide password' : 'Show password'}>
                <IconButton
                  size="small"
                  onClick={() => setShowPassword((prev) => !prev)}
                  sx={ICON_BUTTON_SX}
                >
                  <Iconify
                    icon={showPassword ? 'eva:eye-off-outline' : 'eva:eye-outline'}
                    width={17}
                  />
                </IconButton>
              </Tooltip>
              <Tooltip title={copiedField === 'password' ? 'Copied!' : 'Copy password'}>
                <IconButton
                  size="small"
                  onClick={() => handleCopy(password, 'password', 'Password')}
                  sx={ICON_BUTTON_SX}
                >
                  <Iconify
                    icon={copiedField === 'password' ? 'eva:checkmark-fill' : 'eva:copy-outline'}
                    width={17}
                  />
                </IconButton>
              </Tooltip>
            </Box>
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 4, pt: 2, pb: 4 }}>
        <Button
          fullWidth
          onClick={onClose}
          variant="contained"
          sx={{
            height: 46,
            borderRadius: '10px',
            bgcolor: '#1340FF',
            fontWeight: 600,
            fontSize: '15px',
            textTransform: 'none',
            boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.15) inset',
            '&:hover': {
              bgcolor: '#0F35D6',
              boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.15) inset',
            },
          }}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};

PublicUrlModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  publicUrl: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,
};

export default PublicUrlModal;
