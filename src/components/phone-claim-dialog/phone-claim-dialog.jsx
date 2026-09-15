import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { useRef, useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Dialog,
  Button,
  Divider,
  MenuItem,
  TextField,
  IconButton,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';
import { toE164, parseStoredPhone, dialCodeFromIso } from 'src/utils/format-phone-number';

import { countries } from 'src/assets/data';
import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

const inputSx = {
  width: '100%',
  '& .MuiInputBase-root': {
    bgcolor: 'white',
    borderRadius: 1,
    height: 48,
  },
  '& .MuiInputLabel-root': {
    display: 'none',
  },
  '& .MuiInputBase-input::placeholder': {
    color: '#B0B0B0',
    fontSize: '16px',
    opacity: 1,
  },
};

const onlyDigits = (value) => value.replace(/\D/g, '');

// ----------------------------------------------------------------------

const FormField = ({ label, children }) => (
  <Stack spacing={1} alignItems="start" width={1}>
    <Typography
      component="label"
      sx={{
        fontWeight: 500,
        fontSize: '13px',
        color: '#636366',
      }}
    >
      {label}
      <Box component="span" sx={{ color: 'error.main', ml: 0.25 }}>
        *
      </Box>
    </Typography>
    {children}
  </Stack>
);

FormField.propTypes = {
  label: PropTypes.string,
  children: PropTypes.node,
};

// ----------------------------------------------------------------------

const CodeInput = ({ value, onChange, onComplete, disabled }) => {
  const inputsRef = useRef([]);

  const setDigits = (digits) => {
    onChange(digits.join('').slice(0, CODE_LENGTH));
  };

  const currentDigits = () => {
    const digits = value.split('');
    return Array.from({ length: CODE_LENGTH }, (_, i) => digits[i] ?? '');
  };

  const focusBox = (index) => {
    const target = inputsRef.current[Math.max(0, Math.min(CODE_LENGTH - 1, index))];
    target?.focus();
    target?.select();
  };

  const handleChange = (index) => (event) => {
    const typed = onlyDigits(event.target.value);

    if (!typed) {
      const digits = currentDigits();
      digits[index] = '';
      setDigits(digits);
      return;
    }

    const digits = currentDigits();
    typed.split('').forEach((digit, offset) => {
      if (index + offset < CODE_LENGTH) digits[index + offset] = digit;
    });

    const next = digits.join('').slice(0, CODE_LENGTH);
    onChange(next);

    const nextIndex = Math.min(index + typed.length, CODE_LENGTH - 1);
    focusBox(nextIndex);

    if (next.length === CODE_LENGTH) onComplete?.(next);
  };

  const handleKeyDown = (index) => (event) => {
    const digits = currentDigits();

    if (event.key === 'Backspace') {
      event.preventDefault();

      if (digits[index]) {
        digits[index] = '';
        setDigits(digits);
        return;
      }

      if (index > 0) {
        digits[index - 1] = '';
        setDigits(digits);
        focusBox(index - 1);
      }
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusBox(index - 1);
    }

    if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      event.preventDefault();
      focusBox(index + 1);
    }
  };

  const handlePaste = (index) => (event) => {
    const pasted = onlyDigits(event.clipboardData.getData('text'));
    if (!pasted) return;

    event.preventDefault();

    const digits = currentDigits();
    pasted.split('').forEach((digit, offset) => {
      if (index + offset < CODE_LENGTH) digits[index + offset] = digit;
    });

    const next = digits.join('').slice(0, CODE_LENGTH);
    onChange(next);
    focusBox(index + pasted.length);

    if (next.length === CODE_LENGTH) onComplete?.(next);
  };

  return (
    <Stack direction="row" spacing={1} justifyContent="space-between" width={1}>
      {Array.from({ length: CODE_LENGTH }, (_, index) => (
        <TextField
          key={index}
          value={currentDigits()[index]}
          disabled={disabled}
          onChange={handleChange(index)}
          onKeyDown={handleKeyDown(index)}
          onPaste={handlePaste(index)}
          onFocus={(event) => event.target.select()}
          inputRef={(el) => {
            inputsRef.current[index] = el;
          }}
          inputProps={{
            inputMode: 'numeric',
            autoComplete: index === 0 ? 'one-time-code' : 'off',
            'aria-label': `Digit ${index + 1}`,
            style: { textAlign: 'center', padding: 0 },
          }}
          sx={{
            flex: 1,
            '& .MuiInputBase-root': {
              bgcolor: 'white',
              borderRadius: 1,
              height: 56,
              fontSize: 24,
              fontWeight: 600,
            },
          }}
        />
      ))}
    </Stack>
  );
};

CodeInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  onComplete: PropTypes.func,
  disabled: PropTypes.bool,
};

// ----------------------------------------------------------------------

export default function PhoneClaimDialog({ open, onClose }) {
  const { user, initialize } = useAuthContext();

  const stored = parseStoredPhone(user?.phoneNumber);

  const [step, setStep] = useState('number');
  const [iso, setIso] = useState(stored.iso);
  const [nationalNumber, setNationalNumber] = useState(stored.nationalNumber);
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!open) return;

    const current = parseStoredPhone(user?.phoneNumber);
    setStep('number');
    setIso(current.iso);
    setNationalNumber(current.nationalNumber);
    setCode('');
    setSentTo('');
    setError('');
    setCooldown(0);
  }, [open, user?.phoneNumber]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;

    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSend = async () => {
    // Each click is a real send, so drop repeats while one is in flight.
    if (isSending) return;

    setIsSending(true);

    try {
      const res = await axiosInstance.post(endpoints.auth.claimPhone, {
        phoneNumber: toE164(iso, nationalNumber),
      });

      setError('');
      setSentTo(res?.data?.phoneNumber || toE164(iso, nationalNumber));
      setCode('');
      setStep('code');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      const message = err?.message || 'Could not send the code. Please try again.';

      setError((prev) => (prev === message ? prev : message));
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = useCallback(
    async (submitted) => {
      const value = (submitted ?? code).trim();
      if (value.length !== CODE_LENGTH || isVerifying) return;

      setIsVerifying(true);

      try {
        await axiosInstance.patch(endpoints.auth.verifyPhoneClaim, { code: value });
        setError('');
        enqueueSnackbar('Phone number verified');
        initialize();
        onClose();
      } catch (err) {
        const message = err?.message || 'Could not verify the code. Please try again.';
        setError((prev) => (prev === message ? prev : message));
      } finally {
        setIsVerifying(false);
      }
    },
    [code, isVerifying, initialize, onClose]
  );

  const isNumberStep = step === 'number';
  const canSend = Boolean(nationalNumber) && !isSending;
  const canVerify = code.length === CODE_LENGTH && !isVerifying;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          bgcolor: '#F4F4F4',
          borderRadius: 2,
          '@media (max-width: 600px)': {
            margin: '16px',
            maxHeight: 'calc(100% - 32px)',
          },
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <DialogTitle sx={{ pb: 2 }}>
          <Typography
            sx={{
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
              fontSize: { xs: 24, sm: 30 },
              fontWeight: 300,
            }}
          >
            {isNumberStep ? '📱 Verify your phone number' : '💬 Enter your code'}
          </Typography>
        </DialogTitle>
        <IconButton onClick={onClose} sx={{ mt: 2, mr: 2 }}>
          <Iconify icon="charm:cross" width={20} />
        </IconButton>
      </Stack>

      <Divider sx={{ mx: 4 }} />

      <DialogContent sx={{ py: 3 }}>
        <Stack spacing={2.5}>
          {isNumberStep ? (
            <>
              <Typography sx={{ fontSize: 14, color: '#636366' }}>
                We&apos;ll send you a 6-digit code on WhatsApp to confirm this number is yours.
              </Typography>

              <FormField label="Phone Number">
                <Stack direction="row" spacing={1} width={1}>
                  <TextField
                    select
                    value={iso}
                    onChange={(event) => setIso(event.target.value)}
                    sx={{
                      ...inputSx,
                      width: 110,
                      flexShrink: 0,
                    }}
                  >
                    {countries
                      .filter((item) => item.phone)
                      .sort((a, b) => {
                        const phoneA = parseInt(a.phone.replace(/-/g, ''), 10);
                        const phoneB = parseInt(b.phone.replace(/-/g, ''), 10);
                        return phoneA - phoneB;
                      })
                      .map((item) => (
                        <MenuItem key={item.code} value={item.code}>
                          {item.code} +{item.phone}
                        </MenuItem>
                      ))}
                  </TextField>

                  <TextField
                    fullWidth
                    type="tel"
                    value={nationalNumber}
                    placeholder="Phone Number"
                    onChange={(event) => setNationalNumber(onlyDigits(event.target.value))}
                    sx={inputSx}
                  />
                </Stack>
              </FormField>

              <Typography sx={{ fontSize: 13, color: '#B0B0B0' }}>
                Sending to +{dialCodeFromIso(iso)} {nationalNumber || '—'}
              </Typography>
            </>
          ) : (
            <>
              <Typography sx={{ fontSize: 14, color: '#636366' }}>
                We sent a code to{' '}
                <Box component="span" sx={{ fontWeight: 600, color: '#231F20' }}>
                  {sentTo}
                </Box>{' '}
                on WhatsApp.
              </Typography>

              <CodeInput
                value={code}
                onChange={setCode}
                onComplete={handleVerify}
                disabled={isVerifying}
              />

              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => setStep('number')}
                  sx={{ fontWeight: 600, color: '#636366' }}
                >
                  Change number
                </Button>
                <Button
                  size="small"
                  disabled={cooldown > 0 || isSending}
                  onClick={handleSend}
                  startIcon={<Iconify icon="eva:refresh-fill" width={16} />}
                  sx={{ fontWeight: 600, color: '#1340FF' }}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </Button>
              </Stack>
            </>
          )}

          {error && (
            <Stack
              direction="row"
              spacing={1}
              alignItems="flex-start"
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: '#FFF1F0',
                border: '1px solid #FFCCC7',
              }}
            >
              <Iconify
                icon="solar:danger-circle-bold"
                width={18}
                sx={{ color: '#D4380D', flexShrink: 0, mt: '1px' }}
              />
              <Typography sx={{ fontSize: 14, color: '#A8071A' }}>{error}</Typography>
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <LoadingButton
          variant="contained"
          loading={isNumberStep ? isSending : isVerifying}
          disabled={isNumberStep ? !canSend : !canVerify}
          onClick={isNumberStep ? handleSend : () => handleVerify()}
          sx={{
            background: '#1340FF',
            boxShadow: '0px -3px 0px 0px rgba(68, 68, 77, 0.45) inset',
            fontSize: '16px',
            fontWeight: 600,
            borderRadius: '10px',
            height: '44px',
            px: 3,
            '&:hover': {
              background: '#1340FF',
            },
            '&.Mui-disabled': {
              background: '#B0B0B0',
              color: 'white',
            },
          }}
        >
          {isNumberStep ? 'Send Code' : 'Verify Number'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

PhoneClaimDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};
