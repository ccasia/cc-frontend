import { useForm } from 'react-hook-form';

import { LoadingButton } from '@mui/lab';
import { Box, Stack, Button, Typography } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import { typography } from 'src/theme/typography';

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
    <Stack spacing={3}>
      <Stack spacing={4} sx={{ maxWidth: { xs: '100%', sm: 500 } }}>
        {/* Instagram Connection */}
        <Box>
          <Typography
            variant="body2"
            sx={{
              fontSize: '13px',
              mb: 0.75,
              color: '#636366',
              fontWeight: typography.fontWeightMedium,
              letterSpacing: '0.01em',
            }}
          >
            Instagram Account
          </Typography>

          <Stack
            direction="row"
            alignItems="center"
            sx={{
              bgcolor: 'white',
              borderRadius: '6px',
              border: '1px solid #E7E7E7',
              transition: 'all 0.2s ease-in-out',
              overflow: 'hidden',
              '&:hover': {
                borderColor: '#D0D0D0',
              },
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{
                flex: 1,
                px: 1.5,
                py: 1.25,
                minHeight: 42,
              }}
            >
              <Iconify
                icon="mdi:instagram"
                width={24}
                height={24}
                sx={{
                  color: user?.creator?.isFacebookConnected ? '#231F20' : '#B0B0B0',
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: user?.creator?.isFacebookConnected ? '#231F20' : '#B0B0B0',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                {user?.creator?.isFacebookConnected ? 'Connected' : 'Not connected'}
              </Typography>
            </Stack>

            {user?.creator?.isFacebookConnected ? (
              <LoadingButton
                variant="text"
                onClick={disconnectInstagram}
                loading={facebookLoading.value}
                sx={{
                  height: '100%',
                  px: 2,
                  py: 1.25,
                  color: '#FF3500',
                  borderLeft: '1px solid #E7E7E7',
                  borderRadius: 0,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  '&:hover': {
                    bgcolor: '#FFF5F5',
                  },
                }}
              >
                Disconnect
              </LoadingButton>
            ) : (
              <Button
                LinkComponent="a"
                // Later need to change
                href="https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=945958120199185&redirect_uri=https://app.cultcreativeasia.com/api/social/auth/instagram/callback&response_type=code&scope=instagram_business_basic"
                // %2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights
                onClick={() => {
                  const authUrl = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=945958120199185&redirect_uri=https://staging.cultcreativeasia.com/api/social/v2/auth/instagram/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_insights`;
                  window.location.href = authUrl; // Same window for both mobile and desktop
                }}
                startIcon={<Iconify icon="material-symbols:add-rounded" width={18} height={18} />}
                sx={{
                  height: '100%',
                  px: 2,
                  py: 1.25,
                  bgcolor: '#1340FF',
                  color: '#FFFFFF',
                  borderRadius: 0,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  '&:hover': {
                    bgcolor: '#0030e0',
                  },
                }}
              >
                Connect
              </Button>
            )}
          </Stack>
        </Box>

        {/* TikTok Connection */}
        <Box>
          <Typography
            variant="body2"
            sx={{
              fontSize: '13px',
              mb: 0.75,
              color: '#636366',
              fontWeight: typography.fontWeightMedium,
              letterSpacing: '0.01em',
            }}
          >
            TikTok Account
          </Typography>

          <Stack
            direction="row"
            alignItems="center"
            sx={{
              bgcolor: 'white',
              borderRadius: '6px',
              border: '1px solid #E7E7E7',
              transition: 'all 0.2s ease-in-out',
              overflow: 'hidden',
              '&:hover': {
                borderColor: '#D0D0D0',
              },
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{
                flex: 1,
                px: 1.5,
                py: 1.25,
                minHeight: 42,
              }}
            >
              <Iconify
                icon="ic:baseline-tiktok"
                width={24}
                height={24}
                sx={{
                  color: user?.creator?.isTiktokConnected ? '#231F20' : '#B0B0B0',
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: user?.creator?.isTiktokConnected ? '#231F20' : '#B0B0B0',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                {user?.creator?.isTiktokConnected ? 'Connected' : 'Not connected'}
              </Typography>
            </Stack>

            {user?.creator?.isTiktokConnected ? (
              <LoadingButton
                variant="text"
                onClick={disconnectTiktok}
                loading={tikTokLoading.value}
                sx={{
                  height: '100%',
                  px: 2,
                  py: 1.25,
                  color: '#FF3500',
                  borderLeft: '1px solid #E7E7E7',
                  borderRadius: 0,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  '&:hover': {
                    bgcolor: '#FFF5F5',
                  },
                }}
              >
                Disconnect
              </LoadingButton>
            ) : (
              <Button
                onClick={connectTiktok}
                startIcon={<Iconify icon="material-symbols:add-rounded" width={18} height={18} />}
                sx={{
                  height: '100%',
                  px: 2,
                  py: 1.25,
                  bgcolor: '#1340FF',
                  color: '#FFFFFF',
                  borderRadius: 0,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  '&:hover': {
                    bgcolor: '#0030e0',
                  },
                }}
              >
                Connect
              </Button>
            )}
          </Stack>
        </Box>
      </Stack>
    </Stack>
  );
}
