import React from 'react';
import PropTypes from 'prop-types';

import { Chip, Stack, FormLabel, ListItemText } from '@mui/material';
import { primaryFont } from 'src/theme/typography';

import { langList } from 'src/contants/language';
import { interestsLists } from 'src/contants/interestLists';

import { RHFAutocomplete } from 'src/components/hook-form';

// import { interestsList } from '../creatorForm';

// const interestsList = [
//   'Art',
//   'Beauty',
//   'Business',
//   'Fashion',
//   'Fitness',
//   'Food',
//   'Gaming',
//   'Health',
//   'Lifestyle',
//   'Music',
//   'Sports',
//   'Technology',
//   'Travel',
//   'Entertainment',
// ];

const FourthStep = ({ item }) => (
  <>
    <ListItemText
      sx={{
        mt: 4,
        textAlign: 'center',
      }}
      primary={item.title}
      secondary={item.description}
      primaryTypographyProps={{
        fontFamily: '"Instrument Serif", serif',
        fontSize: '40px',
        fontWeight: 400,
        color: '#231F20',
      }}
      secondaryTypographyProps={{
        fontFamily: "InterDisplay",
        fontSize: '16px',
        fontWeight: 400,
        color: '#636366',
      }}
    />

    <Stack
      gap={4}
      sx={{
        width: { sm: 400 },
        mx: 'auto',
        my: 5,
      }}
    >
      <Stack spacing={1}>
        <FormLabel required sx={{ fontWeight: 600, color: 'black', fontFamily: primaryFont, fontSize: '14px' }}>
          Languages
        </FormLabel>
        <RHFAutocomplete
          name="languages"
          placeholder="Choose at least 1 option"
          multiple
          freeSolo={false}
          disableCloseOnSelect
          options={langList.sort((a, b) => a.localeCompare(b)).map((option) => option)}
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
      </Stack>

      <Stack spacing={1}>
        <FormLabel required sx={{ fontWeight: 600, color: 'black', fontFamily: primaryFont, fontSize: '14px' }}>
          Your interests
        </FormLabel>
        <RHFAutocomplete
          name="interests"
          placeholder="Choose at least 3 options"
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
      </Stack>
    </Stack>
  </>
);

export default FourthStep;

FourthStep.propTypes = {
  item: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
  }),
};
