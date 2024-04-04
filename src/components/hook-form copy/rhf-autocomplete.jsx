import PropTypes from 'prop-types';
import { Controller, useFormContext } from 'react-hook-form';

import { Chip, TextField, Autocomplete, InputAdornment } from '@mui/material';

import { countries } from 'src/assets/data';

import Iconify from '../iconify';

// ----------------------------------------------------------------------

export default function RHFAutocomplete({ name, label, type, helperText, placeholder, ...other }) {
  const { control, setValue } = useFormContext();

  // return (
  //   <Controller
  //     name={name}
  //     control={control}
  //     render={({ field, fieldState: { error } }) => {
  //       <Autocomplete
  //         {...field}
  //         id={`autocomplete-${name}`}
  //         onChange={(newValue) => setValue(name, newValue)}
  //         renderOption={(props, option) => {
  //           const country = getCountry(option);

  //           if (!country.label) {
  //             return null;
  //           }

  //           return (
  //             <li {...props} key={country.label}>
  //               <Iconify
  //                 key={country.label}
  //                 icon={`circle-flags:${country.code?.toLowerCase()}`}
  //                 sx={{ mr: 1 }}
  //               />
  //               {country.label} ({country.code}) +{country.phone}
  //             </li>
  //           );
  //         }}

  //         renderInput={(params) => {
  //           const country = getCountry(params.inputProps.value);

  //           const baseField = {
  //             ...params,
  //             label,
  //             placeholder,
  //             inputProps: {
  //               ...params.inputProps,
  //               autoComplete: 'new-password',
  //             },
  //           };

  //           return (
  //             <TextField
  //               {...baseField}
  //               InputProps={{
  //                 ...params.InputProps,
  //                 startAdornment: (
  //                   <InputAdornment
  //                     position="start"
  //                     sx={{
  //                       ...(!country.code && {
  //                         display: 'none',
  //                       }),
  //                     }}
  //                   >
  //                     <Iconify
  //                       icon={`circle-flags:${country.code?.toLowerCase()}`}
  //                       sx={{ mr: -0.5, ml: 0.5 }}
  //                     />
  //                   </InputAdornment>
  //                 ),
  //               }}
  //             />
  //           );
  //         }}

  //         renderTags={(selected, getTagProps) =>
  //           selected.map((option, index) => {
  //             const country = getCountry(option);

  //             return (
  //               <Chip
  //                 {...getTagProps({ index })}
  //                 key={country.label}
  //                 label={country.label}
  //                 icon={<Iconify icon={`circle-flags:${country.code?.toLowerCase()}`} />}
  //                 size="small"
  //                 variant="soft"
  //               />
  //             );
  //           })
  //         }
  //         {...other}
  //       />;
  //     }}
  //   />
  // );
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        if (type === 'country') {
          return (
            <Autocomplete
              {...field}
              id={`autocomplete-${name}`}
              onChange={(event, newValue) => setValue(name, newValue)}
              renderOption={(props, option) => {
                const country = getCountry(option);

                if (!country.label) {
                  return null;
                }

                return (
                  <li {...props} key={country.label}>
                    <Iconify
                      key={country.label}
                      icon={`circle-flags:${country.code?.toLowerCase()}`}
                      sx={{ mr: 1 }}
                    />
                    {country.label} ({country.code}) +{country.phone}
                  </li>
                );
              }}
              renderInput={(params) => {
                const country = getCountry(params.inputProps.value);

                const baseField = {
                  ...params,
                  label,
                  placeholder,
                  error: !!error,
                  helperText: error ? error?.message : helperText,
                  inputProps: {
                    ...params.inputProps,
                    autoComplete: 'new-password',
                  },
                };

                return (
                  <TextField
                    {...baseField}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment
                          position="start"
                          sx={{
                            ...(!country.code && {
                              display: 'none',
                            }),
                          }}
                        >
                          <Iconify
                            icon={`circle-flags:${country.code?.toLowerCase()}`}
                            sx={{ mr: -0.5, ml: 0.5 }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                );
              }}
              renderTags={(selected, getTagProps) =>
                selected.map((option, index) => {
                  const country = getCountry(option);

                  return (
                    <Chip
                      {...getTagProps({ index })}
                      key={country.label}
                      label={country.label}
                      icon={<Iconify icon={`circle-flags:${country.code?.toLowerCase()}`} />}
                      size="small"
                      variant="soft"
                    />
                  );
                })
              }
              {...other}
            />
          );
        }

        return (
          <Autocomplete
            {...field}
            id={`autocomplete-${name}`}
            onChange={(event, newValue) => setValue(name, newValue, { shouldValidate: true })}
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                placeholder={placeholder}
                error={!!error}
                helperText={error ? error?.message : helperText}
                inputProps={{
                  ...params.inputProps,
                  autoComplete: 'new-password',
                }}
              />
            )}
            {...other}
          />
        );
      }}
    />
  );
}

RHFAutocomplete.propTypes = {
  name: PropTypes.string,
  type: PropTypes.string,
  label: PropTypes.string,
  helperText: PropTypes.node,
  placeholder: PropTypes.string,
};

// ----------------------------------------------------------------------

export function getCountry(inputValue) {
  const option = countries.filter((country) => country.label === inputValue)[0];

  return {
    ...option,
  };
}
