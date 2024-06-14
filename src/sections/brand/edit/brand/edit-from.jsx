import React from 'react';
import PropTypes from 'prop-types';

import {
  Box,
  Chip,
  Stack,
  Button,
  Tooltip,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

import { intersList } from 'src/sections/creator/form/creatorForm';

const BrandEditForm = ({ fieldsArray, methods }) => {
  const { fields, append, remove } = fieldsArray;

  const {
    register,
    formState: { errors },
  } = methods;

  return (
    <Stack spacing={1} px={4}>
      <Box
        rowGap={2}
        columnGap={3}
        display="grid"
        mt={1}
        gridTemplateColumns={{
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
        }}
      >
        <RHFTextField key="brandName" name="brandName" label="Brand Name" />
        <RHFTextField key="brandEmail" name="brandEmail" label="Brand Email" />
        <RHFTextField key="brandPhone" name="brandPhone" label="Brand Phone" />
        <RHFTextField key="brandAbout" name="brandAbout" label="Brand About" />

        <RHFAutocomplete
          name="brandIndustries"
          placeholder="+ Brand Industries"
          multiple
          freeSolo="true"
          disableCloseOnSelect
          options={intersList.map((option) => option)}
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
      <Stack mt={5}>
        <Typography variant="h5">Social Media</Typography>

        <Stack
          direction="row"
          spacing={3}
          my={2}
          sx={{
            flexWrap: {
              xs: 'wrap',
              md: 'nowrap',
            },
          }}
        >
          <RHFTextField
            key="brandInstagram"
            name="brandInstagram"
            label="Instagram"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="ant-design:instagram-filled" />
                </InputAdornment>
              ),
            }}
          />
          <RHFTextField
            key="brandTiktok"
            name="brandTiktok"
            label="Tiktok"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="ic:baseline-tiktok" />
                </InputAdornment>
              ),
            }}
          />
          <RHFTextField
            key="brandWebsite"
            name="brandWebsite"
            label="Website"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="fluent-mdl2:website" />
                </InputAdornment>
              ),
            }}
          />
        </Stack>
      </Stack>

      <Stack mt={5}>
        <Typography variant="h5">Objectives</Typography>

        <Stack
          direction="column"
          spacing={3}
          my={2}
          sx={{
            flexWrap: {
              xs: 'wrap',
              md: 'nowrap',
            },
          }}
        >
          {fields.map((field, index) => (
            <Stack direction="row" gap={1} alignItems="center">
              <TextField
                fullWidth
                key={field.id}
                name={`brandObjectives[${index}]`}
                label={`Objective ${index + 1}`}
                {...register(`brandObjectives.${index}.value`)}
                error={errors?.brandObjectives && errors?.brandObjectives[index]}
                helperText={
                  errors?.brandObjectives &&
                  errors?.brandObjectives[index] &&
                  errors?.brandObjectives[index]?.value?.message
                }
              />
              <Tooltip title={`Remove objective ${index + 1}`}>
                <IconButton onClick={() => remove(index)}>
                  <Iconify icon="material-symbols:remove" />
                </IconButton>
              </Tooltip>
            </Stack>
          ))}
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" onClick={() => append({ value: '' })}>
            Add Objective
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default BrandEditForm;

BrandEditForm.propTypes = {
  fieldsArray: PropTypes.object,
  methods: PropTypes.object,
};
