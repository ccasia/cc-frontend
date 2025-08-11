import React, { memo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  Box,
  Stack,
  Grid,
  MenuItem,
  FormLabel,
  IconButton,
  TextField,
  Chip,
  Typography,
  Button,
} from '@mui/material';

import { RHFSelect, RHFTextField, RHFMultiSelect } from 'src/components/hook-form';
import CustomRHFMultiSelect from './custom-rhf-multi-select';
import Iconify from 'src/components/iconify';
import { interestsLists } from 'src/contants/interestLists';
import { langList } from 'src/contants/language';

import { langList } from 'src/contants/language';

// Form field component with consistent styling
const FormField = ({ label, children, required = true }) => (
  <Stack spacing={0.5}>
    <FormLabel
      required={required}
      sx={{
        fontWeight: 700,
        color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
        fontSize: '0.875rem',
        mb: 0.5,
      }}
    >
      {label}
    </FormLabel>
    {children}
  </Stack>
);

const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'nonbinary', label: 'Non-Binary' },
];

const AGE_OPTIONS = [
  { value: '18-25', label: '18-25' },
  { value: '26-34', label: '26-34' },
  { value: '35-40', label: '35-40' },
  { value: '>40', label: '>40' },
];

const LANGUAGE_OPTIONS = langList.sort().map((lang) => ({
  value: lang,
  label: lang,
}));

const LOCATION_OPTIONS = [
  { value: 'KlangValley', label: 'Klang Valley' },
  { value: 'Selangor', label: 'Selangor' },
  { value: 'KualaLumpur', label: 'Kuala Lumpur' },
  { value: 'MainCities', label: 'Main cities in Malaysia' },
  { value: 'EastMalaysia', label: 'East Malaysia' },
  { value: 'Others', label: 'Others' },
];

const CREATOR_PERSONA_OPTIONS = interestsLists.map((item) => ({
  value: item.toLowerCase(),
  label: item,
}));

const SOCIAL_MEDIA_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
];

const VIDEO_ANGLE_OPTIONS = [
  { value: 'Product Demo/Review', label: 'Product Demo/Review' },
  { value: 'Service Demo/Review', label: 'Service Demo/Review' },
  { value: 'Testimonial', label: 'Testimonial' },
  { value: 'Story Telling', label: 'Story Telling' },
  { value: 'Organic (soft sell)', label: 'Organic (soft sell)' },
  {
    value: 'Point Of View (experience with product/service)',
    label: 'Point Of View (experience with product/service)',
  },
  { value: 'Walkthrough', label: 'Walkthrough' },
  { value: 'Problem vs Solution', label: 'Problem vs Solution' },
  { value: 'Trends', label: 'Trends' },
  { value: 'Up to cult creative to decide', label: 'Up to cult creative to decide' },
];

const CampaignTargetAudience = () => {
  const { control, setValue, watch } = useFormContext();

  const audienceLocation = watch('audienceLocation') || [];
  const showOthersLocation = audienceLocation.includes('Others');

  // For Do's and Don'ts - using local state for better control
  const [doItems, setDoItems] = useState([{ id: 1, value: '' }]);
  const [dontItems, setDontItems] = useState([{ id: 1, value: '' }]);

  // Handle Do's changes
  const handleDoChange = (index, value) => {
    const newItems = [...doItems];
    newItems[index].value = value;
    setDoItems(newItems);

    // Update the form values
    const formattedItems = newItems.map((item) => ({ value: item.value }));
    setValue('campaignDo', formattedItems);
  };

  // Handle Don'ts changes
  const handleDontChange = (index, value) => {
    const newItems = [...dontItems];
    newItems[index].value = value;
    setDontItems(newItems);

    // Update the form values
    const formattedItems = newItems.map((item) => ({ value: item.value }));
    setValue('campaignDont', formattedItems);
  };

  // Add a new Do item
  const handleAddDo = () => {
    const newId = doItems.length > 0 ? Math.max(...doItems.map((item) => item.id)) + 1 : 1;
    const newItems = [...doItems, { id: newId, value: '' }];
    setDoItems(newItems);

    // Update the form values
    const formattedItems = newItems.map((item) => ({ value: item.value }));
    setValue('campaignDo', formattedItems);
  };

  // Add a new Don't item
  const handleAddDont = () => {
    const newId = dontItems.length > 0 ? Math.max(...dontItems.map((item) => item.id)) + 1 : 1;
    const newItems = [...dontItems, { id: newId, value: '' }];
    setDontItems(newItems);

    // Update the form values
    const formattedItems = newItems.map((item) => ({ value: item.value }));
    setValue('campaignDont', formattedItems);
  };

  // Remove a Do item
  const handleRemoveDo = (id) => {
    const newItems = doItems.filter((item) => item.id !== id);
    setDoItems(newItems);

    // Update the form values
    const formattedItems = newItems.map((item) => ({ value: item.value }));
    setValue('campaignDo', formattedItems);
  };

  // Remove a Don't item
  const handleRemoveDont = (id) => {
    const newItems = dontItems.filter((item) => item.id !== id);
    setDontItems(newItems);

    // Update the form values
    const formattedItems = newItems.map((item) => ({ value: item.value }));
    setValue('campaignDont', formattedItems);
  };

  return (
    <Box sx={{ maxWidth: '650px', mx: 'auto', mb: 10 }}>
      {/* First row - Gender and User Persona */}
      <Grid container spacing={2} alignItems="stretch">
        {/* Left column - Audience Gender and City/Area */}
        <Grid item xs={12} sm={6}>
          <Stack spacing={2.5}>
            <FormField label="Gender">
                          <CustomRHFMultiSelect
              name="audienceGender"
              placeholder="Select Gender"
              options={GENDER_OPTIONS}
              size="small"
              sx={{ 
                '& .MuiOutlinedInput-root': { minHeight: '40px' },
              }}
            />
            </FormField>
            
            <FormField label="City/Area">
                          <CustomRHFMultiSelect
              name="audienceLocation"
              placeholder="Select city"
              options={LOCATION_OPTIONS}
              size="small"
              sx={{ 
                '& .MuiOutlinedInput-root': { minHeight: '40px' },
              }}
            />

            </FormField>

            {showOthersLocation && (
              <Box sx={{ mt: -1 }}>
                <RHFTextField
                  name="othersAudienceLocation"
                  placeholder="Specify other locations"
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { height: '40px' } }}
                />
              </Box>
            )}
          </Stack>
        </Grid>

        {/* Right column - User Persona */}
        <Grid item xs={12} sm={6}>
          <FormField label="User Persona">
            <RHFTextField
              name="audienceUserPersona"
              placeholder=" let us know who you want your campaign to reach!"
              size="small"
              multiline
              rows={5}
              sx={{
                '& .MuiOutlinedInput-root': { padding: '8px' },
                height: '100%',
              }}
            />
          </FormField>
        </Grid>
      </Grid>

      {/* Third row - Creator Persona and Social Media Platform */}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} sm={6}>
          <FormField label="Interests">
            <CustomRHFMultiSelect
              name="audienceCreatorPersona"
              placeholder="Select creator persona"
              options={CREATOR_PERSONA_OPTIONS}
              size="small"
              chip
              checkbox
              // sx={{
              //   '& .MuiOutlinedInput-root': { minHeight: '40px' },
              // }}
            />
          </FormField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormField label="Social Media Platform">
            <RHFMultiSelect
              name="socialMediaPlatform"
              placeholder="Select Platform"
              options={SOCIAL_MEDIA_OPTIONS}
              size="small"
              chip
              checkbox
              // sx={{
              //   '& .MuiOutlinedInput-root': { minHeight: '40px' },
              // }}
            />
          </FormField>
        </Grid>
      </Grid>

      {/* Fourth row - Age and Video Angle */}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} sm={6}>
          <FormField label="Age">
            <CustomRHFMultiSelect
              name="audienceAge"
              placeholder="Select Age"
              options={AGE_OPTIONS}
              size="small"
              chip
              checkbox
              // sx={{
              //   '& .MuiOutlinedInput-root': { minHeight: '40px' },
              // }}
            />
          </FormField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormField label="Video Angle">
            <RHFMultiSelect
              name="videoAngle"
              placeholder="Select Angle"
              options={VIDEO_ANGLE_OPTIONS}
              size="small"
              chip
              checkbox
              // sx={{
              //   '& .MuiOutlinedInput-root': { minHeight: '40px' },
              // }}
            />
          </FormField>
        </Grid>
      </Grid>

      {/* Fifth row - Language */}
      <Box sx={{ mt: 2 }}>
        <FormField label="Language">
          <CustomRHFMultiSelect
            name="audienceLanguage"
                          placeholder="Select Language"
            options={LANGUAGE_OPTIONS}
            size="small"
            chip
            checkbox
            // sx={{
            //   '& .MuiOutlinedInput-root': { minHeight: '40px' },
            // }}
          />
        </FormField>
      </Box>

      {/* Do's and Don'ts Section Header */}
      <Box sx={{ mt: 5, mb: 2, textAlign: 'center' }}>
        <Stack direction="row" justifyContent="center" alignItems="baseline" spacing={1}>
          <Typography
            sx={{
              fontWeight: 400,
              fontSize: 35,
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
            }}
          >
            Do's and Don'ts
          </Typography>
          <Typography variant="caption" sx={{ color: '#8E8E93', fontSize: '0.7rem' }}>
            OPTIONAL
          </Typography>
        </Stack>
      </Box>

      {/* Do's and Don'ts */}
      <Grid container spacing={2}>
        {/* Do's */}
        <Grid item xs={12} sm={6}>
          <Box
            sx={{
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              p: 1.5,
              height: '100%',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #4CAF50',
                  borderRadius: 0,
                  width: 20,
                  height: 20,
                }}
              >
                <Iconify icon="mdi:check" color="#4CAF50" width={12} height={12} />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>CAMPAIGN DO'S!</Typography>
            </Stack>

            {doItems.map((item, index) => (
              <Stack key={item.id} direction="row" spacing={1} sx={{ mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={`No. ${index + 1}`}
                  value={item.value}
                  onChange={(e) => handleDoChange(index, e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { height: '40px' } }}
                />
                <IconButton onClick={() => handleRemoveDo(item.id)} sx={{ p: 0.5 }}>
                  <Iconify icon="eva:trash-2-fill" />
                </IconButton>
              </Stack>
            ))}

            <Box
              sx={{
                mt: doItems.length > 0 ? 1 : 0,
                display: 'flex',
                justifyContent: 'center',
                cursor: 'pointer',
                width: '100%',
              }}
              onClick={handleAddDo}
            >
              <Box
                sx={{
                  bgcolor: '#FFFFFF',
                  color: '#000000',
                  border: '1.5px solid',
                  borderColor: '#e7e7e7',
                  borderBottom: 3,
                  borderBottomColor: '#e7e7e7',
                  borderRadius: 1.15,
                  py: 0.8,
                  px: 1.5,
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textTransform: 'none',
                  width: '100%',
                  maxWidth: '300px',
                  '&:hover': {
                    bgcolor: '#f5f5f5',
                    borderColor: '#1ABF66',
                  },
                }}
              >
                Add another Do
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* Don'ts */}
        <Grid item xs={12} sm={6}>
          <Box
            sx={{
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              p: 1.5,
              height: '100%',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #F44336',
                  borderRadius: 0,
                  width: 20,
                  height: 20,
                }}
              >
                <Iconify icon="mdi:close" color="#F44336" width={12} height={12} />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                CAMPAIGN DONT'S!
              </Typography>
            </Stack>

            {dontItems.map((item, index) => (
              <Stack key={item.id} direction="row" spacing={1} sx={{ mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={`No. ${index + 1}`}
                  value={item.value}
                  onChange={(e) => handleDontChange(index, e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { height: '40px' } }}
                />
                <IconButton onClick={() => handleRemoveDont(item.id)} sx={{ p: 0.5 }}>
                  <Iconify icon="eva:trash-2-fill" />
                </IconButton>
              </Stack>
            ))}

            <Box
              sx={{
                mt: dontItems.length > 0 ? 1 : 0,
                display: 'flex',
                justifyContent: 'center',
                cursor: 'pointer',
                width: '100%',
              }}
              onClick={handleAddDont}
            >
              <Box
                sx={{
                  bgcolor: '#FFFFFF',
                  color: '#000000',
                  border: '1.5px solid',
                  borderColor: '#e7e7e7',
                  borderBottom: 3,
                  borderBottomColor: '#e7e7e7',
                  borderRadius: 1.15,
                  py: 0.8,
                  px: 1.5,
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textTransform: 'none',
                  width: '100%',
                  maxWidth: '300px',
                  '&:hover': {
                    bgcolor: '#f5f5f5',
                    borderColor: '#D4321C',
                  },
                }}
              >
                Add another Don't
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default memo(CampaignTargetAudience);
