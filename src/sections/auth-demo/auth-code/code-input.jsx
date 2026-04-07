import * as yup from 'yup';
import { m } from 'framer-motion';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { MuiOtpInput } from 'mui-one-time-password-input';

import { LoadingButton } from '@mui/lab';
import { Box, Link, colors, Typography } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import useOtpCooldown from 'src/hooks/use-otp-cooldown';
import { useResendCooldown } from 'src/hooks/use-resend-cooldown';

import axiosInstance from 'src/utils/axios';

import FormProvider from 'src/components/hook-form';

import useAuthCodeContext from './hooks/use-auth-code';

const MotionBox = m(Box);

const schmea = yup.object().shape({
  code: yup.string().required('Code is required'),
});

const CodeInput = () => {
  const { cooldown, canResend, isLoading, restart } = useResendCooldown();
  const { phoneNumber } = useOtpCooldown();
  const { onChangeStep, mutate } = useAuthCodeContext();

  const router = useRouter();

  const methods = useForm({
    resolver: yupResolver(schmea),
    defaultValues: { code: '' },
    mode: 'onChange',
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    setValue,
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await axiosInstance.patch('/api/auth/verify-code', data);
      toast.success('Done');
      mutate();
      onChangeStep(1);
    } catch (error) {
      toast.error(error?.message);
    }
  });

  const handleResend = async () => {
    try {
      await axiosInstance.post('/api/auth/resend-code');
      setValue('code', '');
      restart();
    } catch (error) {
      if (error?.message.includes('Session expired')) {
        router.replace(paths.auth.jwt.register);
      }
      toast.error(error?.message ?? 'Error resend code');
    }
  };

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <MotionBox
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          transition: {
            duration: 0.4,
          },
        }}
        sx={{
          p: 3,
          bgcolor: '#F4F4F4',
          borderRadius: 2,
          width: { xs: 350, md: 470 },
          overflow: 'hidden',
          mx: 'auto',
        }}
      >
        <Typography variant="subtitle2" sx={{ mt: 2, color: colors.grey[600] }}>
          Your verification code is sent by WhatsApp to {phoneNumber}
        </Typography>
        <Box sx={{ pt: 2 }}>
          <Controller
            name="code"
            render={({ field }) => (
              <MuiOtpInput
                {...field}
                length={6}
                TextFieldsProps={{ placeholder: '-', size: 'medium' }}
                gap={1}
                validateChar={(val) => /\d/.test(val)}
              />
            )}
          />
          <Link
            variant="caption"
            sx={{ cursor: 'pointer', color: colors.grey[500], pointerEvents: !canResend && 'none' }}
            onClick={handleResend}
          >
            {/* eslint-disable-next-line no-nested-ternary */}
            {isLoading ? 'Loading...' : canResend ? 'Resend code' : `Resend in ${cooldown}s`}
          </Link>
          <LoadingButton
            loading={isSubmitting}
            fullWidth
            variant="contained"
            sx={{ mt: 2 }}
            size="large"
            type="submit"
          >
            Continue
          </LoadingButton>
        </Box>
      </MotionBox>
    </FormProvider>
  );
};

export default CodeInput;
