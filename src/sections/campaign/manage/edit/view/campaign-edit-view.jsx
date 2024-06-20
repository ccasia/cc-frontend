import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';

import {
  Box,
  Card,
  Chip,
  Grid,
  Stack,
  Button,
  Container,
  Typography,
  IconButton,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import axiosInstance, { endpoints } from 'src/utils/axios';

import withPermission from 'src/auth/guard/withPermissions';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import FormProvider from 'src/components/hook-form/form-provider';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';
import { RHFTextField, RHFDatePicker, RHFAutocomplete } from 'src/components/hook-form';

import { interestsList } from 'src/sections/creator/form/creatorForm';

const CampaignEditView = ({ id }) => {
  const settings = useSettingsContext();

  const [campaign, setCampaign] = useState();
  const [loading, setLoading] = useState(true);

  const methods = useForm({
    defaultValues: {
      interests: [],
      industries: [],
    },
  });

  const { control, setValue, handleSubmit } = methods;

  const {
    fields: doFields,
    append: doAppend,
    remove: doRemove,
  } = useFieldArray({
    name: 'campaignsDo',
    control,
  });

  const {
    fields: dontFields,
    append: dontAppend,
    remove: dontRemove,
  } = useFieldArray({
    name: 'campaignsDont',
    control,
  });

  useEffect(() => {
    const getCampaign = async () => {
      try {
        const res = await axiosInstance.get(endpoints.campaign.getCampaignById(id));
        setCampaign(res.data);
      } catch (error) {
        enqueueSnackbar('Error', {
          variant: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    getCampaign();
  }, [id]);

  useEffect(() => {
    setValue('name', campaign?.name);
    setValue('description', campaign?.description);
    setValue('interests', campaign?.campaignBrief?.interests);
    setValue('industries', campaign?.campaignBrief?.industries);
    setValue('startDate', dayjs(campaign?.campaignBrief?.startDate));
    setValue('endDate', dayjs(campaign?.campaignBrief?.endDate));
    setValue('campaignsDo', campaign?.campaignBrief?.campaigns_do);
    setValue('campaignsDont', campaign?.campaignBrief?.campaigns_dont);
  }, [campaign, setValue]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      console.log(data);
    } catch (error) {
      enqueueSnackbar('Error saving data', {
        variant: 'error',
      });
    }
  });

  const renderCampaignInfo = (
    <Box component={Card} p={2}>
      <Typography variant="h5">Campaign Information</Typography>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: 'repeat(1, 1fr)',
            md: 'repeat(2, 1fr)',
          },
          mt: 2,
        }}
      >
        <RHFTextField name="name" label="Title" />
        <RHFAutocomplete
          name="interests"
          label="Interests"
          multiple
          freeSolo
          options={interestsList.map((option) => option)}
          renderTags={(selected, getTagProps) =>
            selected.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={option}
                label={option}
                size="small"
                color="info"
                variant="soft"
              />
            ))
          }
        />
        <RHFAutocomplete
          name="industries"
          label="Industries"
          multiple
          freeSolo
          options={interestsList.map((option) => option)}
          renderTags={(selected, getTagProps) =>
            selected.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={option}
                label={option}
                size="small"
                color="info"
                variant="soft"
              />
            ))
          }
        />
        <RHFTextField multiline name="description" label="Description" />
      </Box>
    </Box>
  );

  const renderCampaignDates = (
    <Box component={Card} p={2}>
      <Typography variant="h5">Dates</Typography>
      <Stack spacing={2} mt={2}>
        <RHFDatePicker name="startDate" label="Start Date" />
        <RHFDatePicker name="endDate" label="End Date" />
      </Stack>
    </Box>
  );

  const renderCampaignDosAndDonts = (
    <Box component={Card} p={2}>
      <Typography variant="h5">Do&apos;s and Dont&apos;s</Typography>
      <Box
        display="grid"
        gridTemplateColumns={{ xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' }}
        mt={2}
        gap={2}
      >
        <Box>
          <Typography
            variant="body"
            sx={{
              color: (theme) => theme.palette.success.main,
            }}
          >
            Do&apos;s
          </Typography>
          <Stack spacing={1.5} mt={1}>
            {doFields.map((item, index) => (
              <Box position="relative">
                <RHFTextField
                  key={item.id}
                  name={`campaignsDo[${index}].value`}
                  label={`Campaign Do ${index + 1}`}
                  multiline
                />
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: -15,
                    right: -15,
                    color: (theme) => theme.palette.error.main,
                  }}
                  onClick={() => doRemove(index)}
                >
                  <Iconify icon="typcn:delete" width={20} />
                </IconButton>
              </Box>
            ))}
            <Button variant="contained" onClick={() => doAppend({ value: '' })}>
              Add Do&apos;s
            </Button>
          </Stack>
        </Box>
        <Box>
          <Typography
            variant="body"
            sx={{
              color: (theme) => theme.palette.error.main,
            }}
          >
            Dont&apos;s
          </Typography>
          <Stack spacing={1.5} mt={1}>
            {dontFields.map((item, index) => (
              <Box position="relative">
                <RHFTextField
                  key={item.id}
                  name={`campaignsDont[${index}].value`}
                  label={`Campaign Donts ${index + 1}`}
                  multiline
                />
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: -15,
                    right: -15,
                    color: (theme) => theme.palette.error.main,
                  }}
                  onClick={() => dontRemove(index)}
                >
                  <Iconify icon="typcn:delete" width={20} />
                </IconButton>
              </Box>
            ))}
            <Button variant="contained" onClick={() => dontAppend({ value: '' })}>
              Add Dont&apos;s
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="List"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          {
            name: 'Campaign',
            href: paths.dashboard.campaign.manage,
          },
          { name: 'Edit' },
          { name: id },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      {/* {campaign && JSON.stringify(campaign)} */}
      {campaign && (
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              {renderCampaignInfo}
            </Grid>
            <Grid item xs={12} md={4}>
              {renderCampaignDates}
            </Grid>
            <Grid item xs={12}>
              {renderCampaignDosAndDonts}
            </Grid>
          </Grid>

          {/* <Box> */}
          <Button
            type="submit"
            color="success"
            variant="contained"
            sx={{
              position: 'sticky',
              bottom: 10,
              mt: 5,
              ml: 'auto',
              display: 'block',
              width: 90,
            }}
          >
            Save
          </Button>
          {/* </Box> */}
        </FormProvider>
      )}
    </Container>
  );
};

export default withPermission(['update, view'], 'campaign', CampaignEditView);

CampaignEditView.propTypes = {
  id: PropTypes.string,
};
