import React from 'react';

import { Button, Container } from '@mui/material';

import { paths } from 'src/routes/paths';

import useGetRoles from 'src/hooks/use-get-roles';

import Iconify from 'src/components/iconify';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import RoleLists from './roles-lists';

const Roles = () => {
  const { data, isLoading } = useGetRoles();
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
          <Button size="small" variant="contained" startIcon={<Iconify icon="mingcute:add-fill" />}>
            Create New Role
          </Button>
        }
      />
      {!isLoading && <RoleLists roles={data} />}
    </Container>
  );
};

export default Roles;
