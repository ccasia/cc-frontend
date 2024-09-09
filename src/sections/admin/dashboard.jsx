/* eslint-disable no-unused-vars */
import React, { lazy } from 'react';

import { Container } from '@mui/material';

import { useAuthContext } from 'src/auth/hooks';

import { useSettingsContext } from 'src/components/settings';

// eslint-disable-next-line import/no-unresolved
const DashboardFinance = lazy(() => import('src/sections/admin/Finance/Dashboard'));

const DashboardAdmin = () => {
  const settings = useSettingsContext();
  const { user, role, permission } = useAuthContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      {/* {user?.admin?.role?.name === 'Finance' && <DashboardFinance />} */}

      {/* {(user?.admin?.mode === 'god' || user?.admin?.role?.name === 'CSM') && (
        <DashboardSuperadmin />
      )} */}

      {user?.admin?.designation === 'Finance' && <DashboardFinance />}
    </Container>
  );
};

export default DashboardAdmin;
