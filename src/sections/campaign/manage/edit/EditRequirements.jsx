import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import MenuItem from '@mui/material/MenuItem';
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
import { RHFSelect, RHFTextField } from 'src/components/hook-form';

export const EditRequirements = ({ open, campaign, onClose }) => {
  const methods = useForm();

  const { setValue } = methods;

  useEffect(() => {
    setValue('audienceGender', campaign?.campaignRequirement?.gender);
    setValue('audienceAge', campaign?.campaignRequirement?.age);
    setValue('audienceLocation', campaign?.campaignRequirement?.geoLocation);
    setValue('audienceLanguage', campaign?.campaignRequirement?.language);
    setValue('audienceCreatorPersona', campaign?.campaignRequirement?.creator_persona);
    setValue('audienceUserPersona', campaign?.campaignRequirement?.user_persona);
  }, [setValue, campaign]);

  return (
    <Dialog
      open={open.campaignRequirements}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      fullWidth
      maxWidth="md"
    >
      <DialogTitle id="alert-dialog-title">Requirements</DialogTitle>
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
              <RHFSelect name="audienceGender" label="Audience Gender">
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="male">Male </MenuItem>
                <MenuItem value="nonbinary">Non-Binary</MenuItem>
              </RHFSelect>

              <RHFSelect name="audienceAge" label="Audience Age">
                <MenuItem value="18-25">18-25</MenuItem>
                <MenuItem value="26-34">26-34</MenuItem>
                <MenuItem value="35-40">35-40</MenuItem>
                <MenuItem value=">40"> &gt; 40</MenuItem>
              </RHFSelect>

              <RHFSelect
                name="audienceLocation"
                label="Audience Geo Location"
                helperText="if others please specify"
              >
                <MenuItem value="KlangValley">Klang Valley </MenuItem>
                <MenuItem value="Selangor">Selangor</MenuItem>
                <MenuItem value="KualaLumpur">Kuala Lumpur</MenuItem>
                <MenuItem value="MainCities">Main cities in Malaysia</MenuItem>
                <MenuItem value="EastMalaysia">East Malaysia</MenuItem>
                <MenuItem value="Others">Others</MenuItem>
              </RHFSelect>

              {/* TODO TEMP: Ignore this for now */}
              {/* {audienceGeoLocation === 'Others' && (
                <TextField name="audienceLocation" label="Specify Other Location" variant="outlined" />
              )} */}

              <RHFSelect name="audienceLanguage" label="Audience Language">
                <MenuItem value="Malay">Malay</MenuItem>
                <MenuItem value="English">English</MenuItem>
                <MenuItem value="Chinese">Chinese</MenuItem>
                <MenuItem value="Tamil">Tamil</MenuItem>
                <MenuItem value="Korean">Korean</MenuItem>
                <MenuItem value="MalayEnglish">Malay + English</MenuItem>
                <MenuItem value="EnglishChinese">English + Chinese </MenuItem>
              </RHFSelect>

              <RHFSelect name="audienceCreatorPersona" label="Audience Creator Persona">
                <MenuItem value="lifeStyle">LifeStyle</MenuItem>
                <MenuItem value="Foodie">Foodie</MenuItem>
                <MenuItem value="fashion">Fashion</MenuItem>
                <MenuItem value="beauty">Beauty</MenuItem>
                <MenuItem value="tech">Tech</MenuItem>
                <MenuItem value="sports">Sports & Fitness</MenuItem>
                <MenuItem value="health">Health & wellness</MenuItem>
                <MenuItem value="family">Family & motherhood</MenuItem>
                <MenuItem value="finance">Finance</MenuItem>
                <MenuItem value="education">Education</MenuItem>
                <MenuItem value="music">Music</MenuItem>
                <MenuItem value="gamer">Gamer</MenuItem>
                <MenuItem value="entertainment">Entertainment</MenuItem>
                <MenuItem value="travel">Travel</MenuItem>
              </RHFSelect>

              <RHFTextField
                name="audienceUserPersona"
                label="User Persona"
                placeholder=" let us know who you want your campaign to reach!"
              />

              {/* TODO TEMP: Ignore this for now */}
              {/* {audienceGeoLocation === 'Others' && <Box flexGrow={1} />} */}
            </Box>
          </FormProvider>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose('campaignRequirements')}>Cancel</Button>
        <Button autoFocus color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

EditRequirements.propTypes = {
  open: PropTypes.bool,
  campaign: PropTypes.object,
  onClose: PropTypes.func,
};
