import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { Button, Typography } from '@mui/material';

import axiosInstance from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form';
import { useSnackbar } from 'src/components/snackbar';

// ----------------------------------------------------------------------

export default function AccountSocialLinks({ socialLinks }) {
  const { enqueueSnackbar } = useSnackbar();

  const defaultValues = {
    facebook: socialLinks.facebook,
    instagram: socialLinks.instagram,
    linkedin: socialLinks.linkedin,
    twitter: socialLinks.twitter,
  };

  const methods = useForm({
    defaultValues,
  });

  const { handleSubmit } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      enqueueSnackbar('Update success!');
      console.info('DATA', data);
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Stack component={Card} spacing={3} sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" px={1.5}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Iconify icon="skill-icons:instagram" />
            <Typography variant="subtitle1">Instagram</Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption" color="GrayText">
              required
            </Typography>
            <Button
              LinkComponent="a"
              target="__blank"
              href="https://api.instagram.com/oauth/authorize?client_id=1027488538993176&redirect_uri=https://app.cultcreativeasia.com/dashboard/user/profile&scope=user_profile,user_media&response_type=code"
              // href="https://www.facebook.com/v20.0/dialog/oauth?response_type=token&display=popup&client_id=409133052006045&redirect_uri=https%3A%2F%2Fdevelopers.facebook.com%2Ftools%2Fexplorer%2Fcallback&auth_type=rerequest&scope=email%2Cpages_show_list%2Cbusiness_management%2Cinstagram_basic%2Cinstagram_manage_comments%2Cinstagram_manage_insights%2Cinstagram_content_publish%2Cinstagram_manage_messages%2Cpages_manage_metadata"
              variant="contained"
              color="info"
              size="medium"
            >
              Connect
            </Button>
          </Stack>
        </Stack>

        <Stack direction="row" alignItems="center" justifyContent="space-between" px={1.5}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Iconify icon="logos:tiktok-icon" />
            <Typography variant="subtitle1">Tiktok</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption" color="GrayText">
              optional
            </Typography>
            <Button
              variant="contained"
              color="info"
              size="medium"
              onClick={async () => {
                try {
                  const response = await axiosInstance.get('/api/tiktokOuth');
                  console.log(response);
                  window.location.href = response.data.url;
                } catch (error) {
                  console.log(error);
                }
              }}
            >
              Connect
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </FormProvider>
  );
}

AccountSocialLinks.propTypes = {
  socialLinks: PropTypes.object,
};
