import PropTypes from 'prop-types';
import React, { memo, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import { Box, Stack, Avatar, ListItemText, createFilterOptions } from '@mui/material';

import useGetCompany from 'src/hooks/use-get-company';

import { RHFCheckbox, RHFAutocomplete } from 'src/components/hook-form';

const filter = createFilterOptions();

const SelectBrand = ({ openBrand, openCompany }) => {
  const { data, isLoading } = useGetCompany();
  const { getValues } = useFormContext();
  const client = getValues('client');
  const brand = getValues('campaignBrand');
  const hasBrand = getValues('hasBrand');

  useEffect(() => {
    if (client && client.inputValue) {
      console.log('DASDSA');
      openCompany.onTrue();
    }
  }, [client, openCompany]);

  useEffect(() => {
    if (brand?.inputValue) {
      openBrand.onTrue();
    }
  }, [brand, openBrand]);

  return (
    <Box
      sx={{
        p: 2,
      }}
    >
      <RHFAutocomplete
        name="client"
        label="Select or Create Client"
        options={data || []}
        loading={isLoading}
        freeSolo
        getOptionLabel={(option) => {
          // Add "xxx" option created dynamically
          if (option.inputValue) {
            return option.inputValue;
          }
          // Regular option
          return option.name;
        }}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        selectOnFocus
        clearOnBlur
        renderOption={(props, option) => {
          //   eslint-disable-next-line react/prop-types
          const { ...optionProps } = props;

          return (
            <Stack
              component="li"
              direction="row"
              spacing={1}
              p={1}
              {...optionProps}
              key={option?.id}
            >
              <Avatar src={option?.logo} sx={{ width: 35, height: 35 }} />
              <ListItemText primary={option.name} />
            </Stack>
          );
        }}
        filterOptions={(options, params) => {
          const { inputValue } = params;

          const filtered = filter(options, params);

          // Suggest the creation of a new value
          const isExisting = options.some(
            (option) => option.name.toLowerCase() === inputValue.toLowerCase()
          );

          if (inputValue !== '' && !isExisting) {
            filtered.push({
              inputValue,
              name: `Add "${inputValue}"`,
            });
          }

          return filtered;
        }}
      />
      {client && <RHFCheckbox name="hasBrand" size="small" label="Is it an agency?" />}

      {client && hasBrand && (
        <Box mt={2}>
          <RHFAutocomplete
            name="campaignBrand"
            label="Select or Create Brand"
            options={client?.brand || []}
            loading={isLoading}
            freeSolo
            getOptionLabel={(option) => {
              // Add "xxx" option created dynamically
              if (option.inputValue) {
                return option.inputValue;
              }
              // Regular option
              return option.name;
            }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            selectOnFocus
            clearOnBlur
            renderOption={(props, option) => {
              //   eslint-disable-next-line react/prop-types
              const { ...optionProps } = props;

              return (
                <Stack
                  component="li"
                  direction="row"
                  spacing={1}
                  p={1}
                  {...optionProps}
                  key={option?.id}
                >
                  <Avatar src={option?.logo} sx={{ width: 35, height: 35 }} />
                  <ListItemText primary={option.name} />
                </Stack>
              );
            }}
            filterOptions={(options, params) => {
              const { inputValue } = params;

              const filtered = filter(options, params);

              // Suggest the creation of a new value
              const isExisting = options.some(
                (option) => option.name.toLowerCase() === inputValue.toLowerCase()
              );

              if (inputValue !== '' && !isExisting) {
                filtered.push({
                  inputValue,
                  name: `Add "${inputValue}"`,
                });
              }

              return filtered;
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default memo(SelectBrand);

SelectBrand.propTypes = {
  openCompany: PropTypes.object,
  openBrand: PropTypes.object,
};
