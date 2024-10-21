import React from 'react';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useTheme } from '@emotion/react';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';

import { pink, amber } from '@mui/material/colors';
import {
  Box,
  Grid,
  Stack,
  Input,
  Avatar,
  Button,
  Divider,
  Tooltip,
  Typography,
  IconButton,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

import RoleAssignee from './role-assignee';

const RoleDetails = ({ role }) => {
  const theme = useTheme();
  const edit = useBoolean();

  const methods = useForm({
    defaultValues: {
      role: role?.name || '',
    },
  });

  const { register, handleSubmit, reset } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.patch(endpoints.roles.update(role.id), { ...data });
      enqueueSnackbar(res?.data?.message);
      reset();
      mutate(endpoints.roles.get(role.id));
      edit.onFalse();
    } catch (error) {
      enqueueSnackbar(error?.message, { variant: 'error' });
    }
  });

  return (
    <Box mt={2}>
      <Grid container alignItems="center">
        <Grid item xs={12} sm={5}>
          <Box
            sx={{
              borderRadius: 2,
              p: 5,
              flexGrow: 1,
              position: 'relative',
            }}
          >
            {!edit.value ? (
              <Typography variant="h3">{role?.name}</Typography>
            ) : (
              <Input
                {...register('role', {
                  required: true,
                })}
                autoFocus
                sx={{
                  '.MuiInputBase-input': {
                    fontSize: theme.typography.h3,
                    maxWidth: 250,
                  },
                }}
              />
            )}
            {!edit.value ? (
              <Tooltip title="Edit Role Name">
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                  }}
                  onClick={() => {
                    edit.onTrue();
                  }}
                >
                  <Iconify icon="bx:edit" />
                </IconButton>
              </Tooltip>
            ) : (
              <>
                <Tooltip title="Cancel">
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                    }}
                    onClick={() => {
                      edit.onFalse();
                      reset();
                    }}
                  >
                    <Iconify icon="ic:round-close" />
                  </IconButton>
                </Tooltip>
                <Button
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                  }}
                  onClick={onSubmit}
                  variant="outlined"
                  size="small"
                >
                  Save
                </Button>
              </>
            )}
          </Box>
        </Grid>
        <Grid item xs={12} sm={2}>
          <Divider
            sx={{
              border: 0.5,
              color: 'text.secondary',
              rotate: { sm: '90deg' },
            }}
          />
        </Grid>
        <Grid item xs={12} sm={5}>
          <Box
            sx={{
              borderRadius: 2,
              p: 5,
              flexGrow: 1,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              <Typography variant="h3">Assignee</Typography>
              <Avatar sx={{ width: 50, height: 50, bgcolor: pink[500], color: amber[50] }}>
                {role?.admin.length}
              </Avatar>
            </Stack>
          </Box>
        </Grid>
      </Grid>

      <RoleAssignee admins={role?.admin} />
    </Box>
  );
};
export default RoleDetails;

RoleDetails.propTypes = {
  role: PropTypes.object,
};
