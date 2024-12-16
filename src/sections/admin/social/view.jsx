/* eslint-disable jsx-a11y/media-has-caption */
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';

import { LoadingButton } from '@mui/lab';
import { Box, Stack, MenuItem, Container, Typography, ListItemText } from '@mui/material';

import axiosInstance from 'src/utils/axios';

import EmptyContent from 'src/components/empty-content';
import FormProvider, { RHFSelect, RHFTextField, RHFRadioGroup } from 'src/components/hook-form';

const SocialMedia = () => {
  const [socialData, setSocialData] = useState(
    JSON.parse(localStorage.getItem('socialData')) || null
  );

  const methods = useForm({
    defaultValues: {
      platform: 'Instagram' || '',
      type: 'username',
      username: '',
      contenturl: '',
    },
  });

  const {
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = methods;

  const dataType = watch().type;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.post('/api/creator/social', data);
      setSocialData(res?.data);
      localStorage.setItem('socialData', JSON.stringify(res?.data));
      reset();
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    }
  });

  return (
    <Container maxWidth="md">
      <Typography
        variant="h2"
        align="center"
        gutterBottom
        sx={{
          fontFamily: (theme) => theme.typography.fontSecondaryFamily,
          fontWeight: 400,
        }}
      >
        Social Media Data
      </Typography>

      <Box border={1} borderRadius={1} borderColor="#EBEBEB" p={2}>
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <Stack spacing={2} mb={2}>
            <RHFSelect name="platform" label="Social Platform">
              <MenuItem value="Instagram">Instagram</MenuItem>
              <MenuItem value="Tiktok">Tiktok</MenuItem>
            </RHFSelect>

            <RHFRadioGroup
              label="Select type"
              row
              name="type"
              options={[
                { label: 'Username', value: 'username' },
                { label: 'Content url', value: 'contenturl' },
              ]}
            />

            {dataType === 'username' ? (
              <RHFTextField
                required
                name="username"
                label="Username"
                placeholder="Eg. cultcreativeasia"
                helperText="Retrieves all the latest 30 contents"
              />
            ) : (
              <RHFTextField
                required
                name="contenturl"
                label="Content Url"
                placeholder="Eg. https://www.instagram.com/cultcreativeasia/reel/DDomHB8z7Q5"
                helperText="Only works for one specific content"
              />
            )}
          </Stack>

          <Box sx={{ textAlign: 'end' }}>
            <LoadingButton variant="outlined" type="submit" loading={isSubmitting}>
              Get data
            </LoadingButton>
          </Box>
        </FormProvider>
      </Box>

      {socialData && (
        <Box border={1} borderRadius={1} borderColor="#EBEBEB" p={2} mt={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems="center"
            spacing={1}
            border={1}
            p={1}
            borderRadius={1}
            borderColor="#EBEBEE"
            mb={1.5}
          >
            <ListItemText primary="Platform" secondary={socialData?.platform || 'N/A'} />
            {socialData?.contenturl ? (
              <ListItemText primary="Content Url" secondary={socialData?.contenturl || 'N/A'} />
            ) : (
              <ListItemText primary="Username" secondary={socialData?.username || 'N/A'} />
            )}
          </Stack>
          {socialData?.data?.data?.length > 0 ? (
            <>
              {socialData?.data?.data?.map((elem, index) => (
                <Box
                  key={index}
                  display="grid"
                  gridTemplateColumns={{
                    xs: 'repeat(1,1fr)',
                    sm: 'repeat(2,1fr)',
                    md: 'repeat(2,1fr)',
                  }}
                  gap={1}
                  mb={2}
                >
                  <Box height={500}>
                    <video
                      autoPlay
                      width="100%"
                      height="100%"
                      controls
                      style={{
                        borderRadius: 10,
                      }}
                    >
                      <source src={elem?.media_url} />
                    </video>
                  </Box>
                  <Box border={1} borderRadius={1} borderColor="#EBEBEB" p={1}>
                    <Box
                      display="grid"
                      gridTemplateColumns="repeat(2,1fr)"
                      gap={1}
                      border={1}
                      borderRadius={1}
                      borderColor="#EBEBEB"
                      p={1}
                    >
                      <ListItemText primary="Title" secondary={elem?.title || 'N/A'} />
                      <ListItemText primary="Description" secondary={elem?.description || 'N/A'} />
                      <ListItemText
                        primary="Published At"
                        secondary={dayjs(elem?.published_at).format('LL') || 'N/A'}
                      />
                      <ListItemText primary="Format" secondary={elem?.format || 'N/A'} />
                      <ListItemText primary="Type" secondary={elem?.type || 'N/A'} />
                      <ListItemText primary="Duration" secondary={elem?.duration || 'N/A'} />
                    </Box>
                    <Box
                      display="grid"
                      gridTemplateColumns="repeat(2,1fr)"
                      gap={1}
                      border={1}
                      borderRadius={1}
                      borderColor="#EBEBEB"
                      p={1}
                      my={2}
                    >
                      <ListItemText
                        primary="Like Count"
                        secondary={elem?.engagement?.like_count || 'N/A'}
                      />
                      <ListItemText
                        primary="Comment Count"
                        secondary={elem?.engagement?.comment_count || 'N/A'}
                      />
                      <ListItemText
                        primary="View Count"
                        secondary={elem?.engagement?.view_count || 'N/A'}
                      />
                      <ListItemText
                        primary="Share Count"
                        secondary={elem?.engagement?.share_count || 'N/A'}
                      />
                      <ListItemText
                        primary="Save Count"
                        secondary={elem?.engagement?.save_count || 'N/A'}
                      />
                    </Box>
                  </Box>
                </Box>
              ))}
            </>
          ) : (
            <EmptyContent title="Data not found" />
          )}
        </Box>
      )}
    </Container>
  );
};

export default SocialMedia;
