import { useForm } from 'react-hook-form';

import { LoadingButton } from '@mui/lab';
import { Stack, Button, Typography } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

// ----------------------------------------------------------------------

export default function AccountSocialLinks() {
  const { enqueueSnackbar } = useSnackbar();
  const { user, initialize } = useAuthContext();

  const tikTokLoading = useBoolean();
  const facebookLoading = useBoolean();

  const methods = useForm({
    defaultValues: {
      instagram: user?.creator?.instagram || '',
      tiktok: user?.creator?.tiktok || '',
    },
  });

  const { handleSubmit } = methods;

  // const onSubmit = handleSubmit(async (data) => {
  //   try {
  //     const res = await axiosInstance.patch(endpoints.creators.updateSocialMediaUsername, data);
  //     enqueueSnackbar(res?.data?.message);
  //   } catch (error) {
  //     enqueueSnackbar(error?.message, {
  //       variant: 'error',
  //     });
  //   }
  // });

  // useEffect(() => {
  //   // Check if the Facebook SDK has loaded
  //   if (window.FB) {
  //     initFacebookSDK();
  //     window.FB.getLoginStatus((response) => {
  //       if (response.status === 'connected') {
  //         console.log('User is already logged in.');
  //       }
  //     });
  //   }
  // }, []);

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

  const disconnectTiktok = async () => {
    try {
      tikTokLoading.onTrue();
      const res = await axiosInstance.post(`/api/social/tiktok/disconnect`, {
        userId: user.id,
      });

      initialize();
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar('Error disconnecting tiktok account', {
        variant: 'error',
      });
      console.log(error);
    } finally {
      tikTokLoading.onFalse();
    }
  };

  const disconnectFacebook = async () => {
    try {
      facebookLoading.onTrue();
      const res = await axiosInstance.post(`/api/social/facebook/disconnect`, {
        userId: user.id,
      });

      initialize();
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar('Error disconnecting tiktok account', {
        variant: 'error',
      });
      console.log(error);
    } finally {
      facebookLoading.onFalse();
    }
  };

  const connectFacebook = async () => {
    try {
      // const { data: url } = await axiosInstance.get('/api/social/auth/facebook');
      const { data: url } = await axiosInstance.get(
        'https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=529931609539167&redirect_uri=https://staging.cultcreativeasia.com/api/social/auth/facebook/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights'
      );
      enqueueSnackbar('Redirecting...');
      window.location.href = url;
    } catch (error) {
      console.log(error);
    }
  };

  const disconnectInstagram = async () => {
    try {
      const res = await axiosInstance.delete(`/api/social/instagram/permissions/${user.id}`);
      initialize();
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    }
  };

  return (
    <Stack spacing={2} border={1} p={2} borderRadius={2} borderColor="#EBEBEB" px={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" width={1}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Image src="/instagram/insta.webp" width={30} />
          <Typography variant="subtitle1">Instagram</Typography>
        </Stack>
        {user?.creator?.isFacebookConnected ? (
          <LoadingButton
            variant="outlined"
            // onClick={disconnectFacebook}
            onClick={disconnectInstagram}
            color="error"
            sx={{ borderRadius: 2 }}
            loading={facebookLoading.value}
          >
            Disconnect
          </LoadingButton>
        ) : (
          <Button
            LinkComponent="a"
            // Later need to change
            href="https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=945958120199185&redirect_uri=https://staging.cultcreativeasia.com/api/social/auth/instagram/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights"
            target="_blank"
            variant="outlined"
            // onClick={connectFacebook}
            startIcon={<Iconify icon="material-symbols:add-rounded" />}
            sx={{ borderRadius: 2 }}
          >
            Add account
          </Button>
        )}
      </Stack>

      <Stack direction="row" alignItems="center" justifyContent="space-between" width={1}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Image src="/tiktok/Tiktok_Login.png" width={30} />
          <Typography variant="subtitle1">TikTok</Typography>
        </Stack>
        {user?.creator?.isTiktokConnected ? (
          <LoadingButton
            variant="outlined"
            onClick={disconnectTiktok}
            color="error"
            sx={{ borderRadius: 2 }}
            loading={tikTokLoading.value}
          >
            Disconnect
          </LoadingButton>
        ) : (
          <Button
            variant="outlined"
            onClick={connectTiktok}
            startIcon={<Iconify icon="material-symbols:add-rounded" />}
            sx={{ borderRadius: 2 }}
          >
            Add account
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
