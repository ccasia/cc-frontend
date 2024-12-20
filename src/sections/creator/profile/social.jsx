import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Stack, Button, Typography } from '@mui/material';

import { initFacebookSDK } from 'src/utils/FacebookSDK';
import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

// ----------------------------------------------------------------------

export default function AccountSocialLinks() {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();

  const methods = useForm({
    defaultValues: {
      instagram: user?.creator?.instagram || '',
      tiktok: user?.creator?.tiktok || '',
    },
  });

  const {
    handleSubmit,
    formState: { isDirty, isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.patch(endpoints.creators.updateSocialMediaUsername, data);
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    }
  });

  useEffect(() => {
    // Check if the Facebook SDK has loaded
    if (window.FB) {
      initFacebookSDK();
      window.FB.getLoginStatus((response) => {
        if (response.status === 'connected') {
          console.log('User is already logged in.');
        }
      });
    }
  }, []);

  const handleLogin = () => {
    window.FB.login(
      (response) => {
        if (response.authResponse) {
          console.log('Facebook login successful:', response);
        } else {
          console.log('Facebook login failed');
        }
      },
      { scope: 'public_profile,email' }
    );
  };

  const connectTiktok = async () => {
    try {
      const { data: url } = await axiosInstance.get('/api/social/oauth/tiktok');
      enqueueSnackbar('Redirecting...');
      window.location.href = url;
    } catch (error) {
      console.log(error);
    }
  };

  // return (
  //   <FormProvider methods={methods} onSubmit={onSubmit}>
  //     <Stack component={Card} spacing={3} sx={{ p: 3 }} alignItems="flex-end">
  //       <RHFTextField
  //         name="instagram"
  //         label="Instagram"
  //         InputProps={{
  //           startAdornment: (
  //             <InputAdornment position="start">
  //               <Iconify icon="mdi:instagram" width={20} />
  //             </InputAdornment>
  //           ),
  //         }}
  //       />
  //       <RHFTextField
  //         name="tiktok"
  //         label="Tiktok"
  //         InputProps={{
  //           startAdornment: (
  //             <InputAdornment position="start">
  //               <Iconify icon="ic:baseline-tiktok" width={20} />
  //             </InputAdornment>
  //           ),
  //         }}
  //       />
  //       <LoadingButton
  //         type="submit"
  //         variant="outlined"
  //         disabled={!isDirty}
  //         size="small"
  //         loading={isSubmitting}
  //       >
  //         Save changes
  //       </LoadingButton>
  //     </Stack>
  //   </FormProvider>
  // );
  return (
    <Stack spacing={2} border={1} p={2} borderRadius={2} borderColor="#EBEBEB" px={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" width={1}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Image src="/instagram/insta.webp" width={30} />
          <Typography variant="subtitle1">Instagram</Typography>
        </Stack>
        <Button
          variant="outlined"
          onClick={connectTiktok}
          startIcon={<Iconify icon="material-symbols:add-rounded" />}
          sx={{ borderRadius: 2 }}
        >
          Add account
        </Button>
      </Stack>
      <Stack direction="row" alignItems="center" justifyContent="space-between" width={1}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Image src="/tiktok/Tiktok_Login.png" width={30} />
          <Typography variant="subtitle1">TikTok</Typography>
        </Stack>
        <Button
          variant="outlined"
          onClick={connectTiktok}
          startIcon={<Iconify icon="material-symbols:add-rounded" />}
          sx={{ borderRadius: 2 }}
        >
          Add account
        </Button>
      </Stack>
    </Stack>
  );
}
