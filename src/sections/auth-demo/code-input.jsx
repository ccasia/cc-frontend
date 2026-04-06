import { m } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { MuiOtpInput } from 'mui-one-time-password-input';

import { LoadingButton } from '@mui/lab';
import { Box, Link, colors, Typography } from '@mui/material';

import FormProvider from 'src/components/hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

const MotionBox = m(Box);

const schmea = yup.object().shape({
  code: yup.string().required('Code is required'),
});

const CodeInput = () => {
  const methods = useForm({
    resolver: yupResolver(schmea),
    defaultValues: { code: '' },
    mode: 'onChange',
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      console.log(data);
    } catch (error) {
      console.log(error);
    }
  });

  const handleOpenTerms = () => {
    window.open('https://cultcreativeasia.com/my/terms-and-conditions', '_blank');
  };

  const handleOpenPrivacy = () => {
    window.open('https://cultcreativeasia.com/my/privacy-policy', '_blank');
  };

  const renderTerms = (
    <Typography
      component="div"
      sx={{
        mt: 2.5,
        textAlign: 'center',
        typography: 'caption',
        color: '#8E8E93',
        fontSize: '13px',
      }}
    >
      By signing up, I agree to
      <Link
        component="button"
        underline="always"
        onClick={handleOpenTerms}
        type="button"
        sx={{
          verticalAlign: 'baseline',
          fontSize: '13px',
          lineHeight: 1,
          p: 0,
          color: '#231F20',
          mx: 0.5,
        }}
      >
        Terms of Service
      </Link>
      and
      <Link
        component="button"
        underline="always"
        onClick={handleOpenPrivacy}
        type="button"
        sx={{
          verticalAlign: 'baseline',
          fontSize: '13px',
          lineHeight: 1,
          p: 0,
          color: '#231F20',
          mx: 0.5,
        }}
      >
        Privacy Policy.
      </Link>
    </Typography>
  );

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
        }}
      >
        <Typography
          sx={{
            fontFamily: (theme) => theme.typography.fontSecondaryFamily,
            fontSize: '40px',
            fontWeight: 400,
            mb: -0.5,
          }}
        >
          Join The Cult 👽
        </Typography>
        <Typography variant="subtitle2" sx={{ mt: 2, color: colors.grey[600] }}>
          Enter the code sent to +60175890307 to continue
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
          <Typography
            component={Link}
            variant="caption"
            sx={{ cursor: 'pointer', color: colors.grey[500] }}
          >
            Didn&apos;t received code ?
          </Typography>
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
        {renderTerms}
      </MotionBox>
    </FormProvider>
  );
};

export default CodeInput;
