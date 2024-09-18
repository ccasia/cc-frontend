import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';

import {
  Box,
  Button,
  Dialog,
  TextField,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { langList } from 'src/contants/language';

import FormProvider from 'src/components/hook-form/form-provider';
import { RHFTextField, RHFMultiSelect, RHFAutocomplete } from 'src/components/hook-form';

import { interestsLists } from 'src/sections/campaign/create/form';

export const EditRequirements = ({ open, campaign, onClose }) => {
  const methods = useForm({
    defaultValues: {
      audienceGender: campaign?.campaignRequirement?.gender || [],
      audienceAge: campaign?.campaignRequirement?.age || [],
      audienceLocation: campaign?.campaignRequirement?.geoLocation || [],
      audienceLanguage: campaign?.campaignRequirement?.language || [],
      audienceCreatorPersona: campaign?.campaignRequirement?.creator_persona || [],
      audienceUserPersona: campaign?.campaignRequirement?.user_persona || '',
    },
  });

  const { watch, handleSubmit } = methods;

  const audienceLocation = watch('audienceLocation');

  const closeDialog = () => onClose('campaignRequirements');

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.patch(endpoints.campaign.editCampaignRequirements, {
        ...data,
        campaignId: campaign.id,
      });
      mutate(endpoints.campaign.getCampaignById(campaign.id));
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar('Failed to update requirements', {
        variant: 'error',
      });
    }
  });

  return (
    <Dialog
      open={open.campaignRequirements}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      fullWidth
      maxWidth="md"
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle id="alert-dialog-title">Edit Requirements</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description" p={1.5}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(1, 1fr)',
                  md: 'repeat(2, 1fr)',
                },
                gap: 2,
              }}
            >
              <RHFMultiSelect
                name="audienceGender"
                checkbox
                chip
                options={[
                  { value: 'female', label: 'Female' },
                  { value: 'male', label: 'Male' },
                  { value: 'nonbinary', label: 'Non-Binary' },
                ]}
                label="Audience Gender"
              />

              <RHFMultiSelect
                name="audienceAge"
                checkbox
                chip
                options={[
                  { value: '18-25', label: '18-25' },
                  { value: '26-34', label: '26-34' },
                  { value: '35-40', label: '35-40' },
                  { value: '>40', label: '>40' },
                ]}
                label="Audience Age"
              />

              <RHFMultiSelect
                name="audienceLocation"
                label="Audience Geo Location"
                checkbox
                chip
                options={[
                  { value: 'KlangValley', label: 'Klang Valley' },
                  { value: 'Selangor', label: 'Selangor' },
                  { value: 'KualaLumpur', label: 'Kuala Lumpur' },
                  { value: 'MainCities', label: 'Main cities in Malaysia' },
                  { value: 'EastMalaysia', label: 'East Malaysia' },
                  { value: 'Others', label: 'Others' },
                ]}
              />
              {audienceLocation === 'Others' && (
                <TextField
                  name="audienceLocation"
                  label="Specify Other Location"
                  variant="outlined"
                />
              )}

              <RHFAutocomplete
                multiple
                disableCloseOnSelect
                name="audienceLanguage"
                label="Audience Language"
                options={langList.sort()}
                getOptionLabel={(option) => option || ''}
              />

              {/* <RHFMultiSelect
                name="audienceLanguage"
                label="Audience Language"
                checkbox
                chip
                options={langList.sort()}
                // options={[
                //   { value: 'Malay', label: 'Malay' },
                //   { value: 'English', label: 'English' },
                //   { value: 'Chinese', label: 'Chinese' },
                //   { value: 'Tamil', label: 'Tamil' },
                //   { value: 'Korean', label: 'Korean' },
                // ]}
              /> */}

              <RHFMultiSelect
                name="audienceCreatorPersona"
                label="Audience Creator Persona"
                checkbox
                chip
                options={
                  interestsLists.map((item) => ({
                    value: item.toLowerCase(),
                    label: item,
                  }))

                  //   [
                  //   { value: 'lifestyle', label: 'LifeStyle' },
                  //   { value: 'fashion', label: 'Fashion' },
                  //   { value: 'beauty', label: 'Beauty' },
                  //   { value: 'tech', label: 'Tech' },
                  //   { value: 'sports', label: 'Sports & Fitness' },
                  //   { value: 'health', label: 'Health & wellness' },
                  //   { value: 'family', label: 'Family & motherhood' },
                  //   { value: 'finance', label: 'Finance' },
                  //   { value: 'education', label: 'Education' },
                  //   { value: 'music', label: 'Music' },
                  //   { value: 'gamer', label: 'Gamer' },
                  //   { value: 'entertainment', label: 'Entertainment' },
                  //   { value: 'travel', label: 'Travel' },
                  // ]
                }
              />

              <RHFTextField
                name="audienceUserPersona"
                label="User Persona"
                placeholder="let us know who you want your campaign to reach!"
              />
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button type="submit" onClick={closeDialog} autoFocus color="primary">
            Save
          </Button>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
};

EditRequirements.propTypes = {
  open: PropTypes.object,
  campaign: PropTypes.object,
  onClose: PropTypes.func,
};
