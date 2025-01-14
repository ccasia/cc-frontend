import React, { memo, useMemo } from 'react';

import { Box, Chip, Stack, Avatar, FormLabel, CircularProgress } from '@mui/material';

import { useAuthContext } from 'src/auth/hooks';

import { RHFAutocomplete } from 'src/components/hook-form';

import { useGetAdmins } from '../hooks/get-am';

const CampaignAdminManager = () => {
  const { data: admins, isLoading } = useGetAdmins('active');
  const { user } = useAuthContext();

  const filteredAdmins = useMemo(
    () => !isLoading && admins.filter((item) => item.admin?.role?.name === 'CSM'),
    [admins, isLoading]
  );

  return (
    <>
      {isLoading && (
        <Box
          sx={{
            position: 'relative',
            top: 200,
            textAlign: 'center',
          }}
        >
          <CircularProgress
            thickness={7}
            size={25}
            sx={{
              color: (theme) => theme.palette.common.black,
              strokeLinecap: 'round',
            }}
          />
        </Box>
      )}
      {!isLoading && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignContent: 'center',
            gap: 2,
            p: 3,
          }}
        >
          <Stack spacing={1}>
            <FormLabel
              required
              sx={{
                fontWeight: 600,
                color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
              }}
            >
              Admin Managers
            </FormLabel>
            <RHFAutocomplete
              name="adminManager"
              multiple
              placeholder="Admin Manager"
              options={
                filteredAdmins.map((admin) => ({
                  id: admin?.id,
                  name: admin?.name,
                  role: admin?.admin?.role?.name,
                  photoURL: admin?.photoURL,
                })) || []
              }
              freeSolo
              isOptionEqualToValue={(option, value) => option.id === value.id}
              getOptionLabel={(option) => `${option.name}`}
              renderTags={(selected, getTagProps) =>
                selected.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    avatar={<Avatar src={option?.photoURL}>{option?.name?.slice(0, 1)}</Avatar>}
                    key={option?.id}
                    label={option?.id === user?.id ? 'Me' : option?.name || ''}
                    size="small"
                    variant="outlined"
                    sx={{
                      border: 1,
                      borderColor: '#EBEBEB',
                      boxShadow: (theme) => `0px -3px 0px 0px #E7E7E7 inset`,
                      py: 2,
                      px: 1,
                    }}
                  />
                ))
              }
            />
          </Stack>
        </Box>
      )}
    </>
  );
};

export default memo(CampaignAdminManager);
