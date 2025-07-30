import toast from 'react-hot-toast';
import React, { useState } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Dialog,
  Button,
  Container,
  TextField,
  Typography,
  DialogActions,
  DialogContent,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import useGetRoles from 'src/hooks/use-get-roles';
import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import RoleLists from './roles-lists';

const Roles = () => {
  const { data, isLoading, mutate } = useGetRoles();

  const [role, setRole] = useState();

  const isRoleOpen = useBoolean(false);
  const buttonLoading = useBoolean();
  const isSubmitting = useBoolean();

  const onChange = (value) => {
    setRole(value);
  };

  const onSubmit = async () => {
    if (!role) {
      toast.error('Please fill in all details');
      return;
    }

    isSubmitting.onTrue();
    try {
      const res = await axiosInstance.post(endpoints.roles.create, { role });
      toast.success(res?.data?.message);
      mutate();
      isRoleOpen.onFalse();
      setRole();
    } catch (error) {
      console.log(error);
      toast.error('error');
    } finally {
      isSubmitting.onFalse();
    }
  };

  return (
    <Container maxWidth="lg">
      <CustomBreadcrumbs
        heading="Roles"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Roles' },
          { name: 'Lists' },
        ]}
        action={
          <LoadingButton
            size="small"
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-fill" />}
            sx={{ borderRadius: 0.5 }}
            onClick={async () => {
              buttonLoading.onTrue();
              await new Promise((resolve) => setTimeout(() => resolve(), 1500));
              buttonLoading.onFalse();
              isRoleOpen.onTrue();
            }}
            loading={buttonLoading.value}
          >
            New Role
          </LoadingButton>
        }
      />
      {!isLoading && <RoleLists roles={data} />}

      <Dialog
        open={isRoleOpen.value}
        PaperProps={{
          sx: {
            borderRadius: 0.5,
            padding: 2,
          },
        }}
        maxWidth="xs"
        fullWidth
      >
        <Typography variant="subtitle1">Create New Role</Typography>
        <DialogContent sx={{ p: 0, mt: 2 }}>
          <TextField
            name="role"
            value={role}
            size="small"
            placeholder="Eg. Client"
            fullWidth
            onChange={(e) => onChange(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 0, mt: 5 }}>
          <Button
            size="small"
            variant="outlined"
            sx={{ borderRadius: 0.5 }}
            onClick={() => {
              setRole();
              isRoleOpen.onFalse();
            }}
          >
            Cancel
          </Button>
          <LoadingButton
            size="small"
            variant="contained"
            sx={{ borderRadius: 0.5 }}
            onClick={onSubmit}
            loading={isSubmitting.value}
          >
            Create
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Roles;
