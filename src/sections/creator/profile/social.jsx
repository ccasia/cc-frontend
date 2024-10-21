import { useForm } from 'react-hook-form';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import { InputAdornment } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

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

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Stack component={Card} spacing={3} sx={{ p: 3 }} alignItems="flex-end">
        <RHFTextField
          name="instagram"
          label="Instagram"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="mdi:instagram" width={20} />
              </InputAdornment>
            ),
          }}
        />
        <RHFTextField
          name="tiktok"
          label="Tiktok"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="ic:baseline-tiktok" width={20} />
              </InputAdornment>
            ),
          }}
        />
        <LoadingButton
          type="submit"
          variant="outlined"
          disabled={!isDirty}
          size="small"
          loading={isSubmitting}
        >
          Save changes
        </LoadingButton>
      </Stack>
    </FormProvider>
  );
}
