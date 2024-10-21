import React from 'react';
import PropTypes from 'prop-types';

import { Container } from '@mui/material';

import { paths } from 'src/routes/paths';

import useGetRoles from 'src/hooks/use-get-roles';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import RoleDetails from './role-details';

const ManageRoles = ({ id }) => {
  const { data, isLoading } = useGetRoles(id);

  return (
    <Container maxWidth="md">
      <CustomBreadcrumbs
        heading="Roles"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Roles', href: paths.dashboard.roles.root },
          { name: id },
        ]}
      />

      {!isLoading && <RoleDetails role={data} />}
    </Container>
  );
};

export default ManageRoles;

ManageRoles.propTypes = {
  id: PropTypes.string,
};
