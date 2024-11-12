import React, { memo, useMemo } from 'react';

import { Box, Chip, Typography, CircularProgress } from '@mui/material';

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
            // top: '50%',
            // left: '50%',
            // transform: 'translate(-50%, -50%)',
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
          <Typography variant="h5">Select Admin Manager</Typography>

          <RHFAutocomplete
            name="adminManager"
            multiple
            placeholder="Admin Manager"
            options={
              filteredAdmins.map((admin) => ({
                id: admin?.id,
                name: admin?.name,
                role: admin?.admin?.role?.name,
              })) || []
            }
            freeSolo
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionLabel={(option) => `${option.name}`}
            renderTags={(selected, getTagProps) =>
              selected.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option?.id}
                  label={option?.id === user?.id ? 'Me' : option?.name || ''}
                  size="small"
                  color="info"
                  variant="soft"
                />
              ))
            }
          />
        </Box>
      )}
    </>
  );
};

export default memo(CampaignAdminManager);
