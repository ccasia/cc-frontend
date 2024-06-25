import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import Chip from '@mui/material/Chip';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
} from '@mui/material';

import FormProvider from 'src/components/hook-form/form-provider';
import { RHFTextField, RHFDatePicker, RHFAutocomplete } from 'src/components/hook-form';

// TODO TEMP: Copied from `src/sections/campaign/create/form.jsx`, consider consolidating them sometime
const interestsLists = [
  'Art',
  'Beauty',
  'Business',
  'Fashion',
  'Fitness',
  'Food',
  'Gaming',
  'Health',
  'Lifestyle',
  'Music',
  'Sports',
  'Technology',
  'Travel',
];

export const EditCampaignInfo = ({ open, campaign, onClose }) => {
  const methods = useForm();

  const { setValue } = methods;

  useEffect(() => {
    setValue('name', campaign?.name);
    setValue('description', campaign?.description);
    // TODO BUG: Causes a white screen
    // setValue('campaignStartDate', campaign?.campaignBrief?.startDate);
    // setValue('campaignEndDate', campaign?.campaignBrief?.endDate);
    setValue('campaignInterests', campaign?.campaignBrief?.interests);
    setValue('campaignIndustries', campaign?.campaignBrief?.industries);
  }, [setValue, campaign]);

  return (
    <Dialog
      open={open.campaignInfo}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      fullWidth
      maxWidth="md"
    >
      <DialogTitle id="alert-dialog-title">Campaign Information</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description" p={1.5}>
          <FormProvider methods={methods}>
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
              <RHFTextField name="name" label="Campaign Name" fullWidth />
              <RHFTextField name="description" label="Campaign Description" multiline />
              <RHFDatePicker name="campaignStartDate" label="Start Date" />
              <RHFDatePicker name="campaignEndDate" label="End Date" />
              <RHFAutocomplete
                name="campaignInterests"
                placeholder="+ Interests"
                multiple
                freeSolo
                disableCloseOnSelect
                options={interestsLists.map((option) => option)}
                getOptionLabel={(option) => option}
                renderOption={(props, option) => (
                  <li {...props} key={option}>
                    {option}
                  </li>
                )}
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
                name="campaignIndustries"
                placeholder="+ Industries"
                multiple
                freeSolo
                disableCloseOnSelect
                options={interestsLists.map((option) => option)}
                getOptionLabel={(option) => option}
                renderOption={(props, option) => (
                  <li {...props} key={option}>
                    {option}
                  </li>
                )}
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
            </Box>
          </FormProvider>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose('campaignInfo')}>Cancel</Button>
        <Button autoFocus color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

EditCampaignInfo.propTypes = {
  open: PropTypes.bool,
  campaign: PropTypes.object,
  onClose: PropTypes.func,
};
