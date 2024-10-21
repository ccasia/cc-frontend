/* eslint-disable no-unused-vars */
import React, { lazy } from 'react';

import { Container } from '@mui/material';

import { useAuthContext } from 'src/auth/hooks';

import { useSettingsContext } from 'src/components/settings';

const DashboardFinance = lazy(() => import('./finance/Dashboard'));
const DashboardSuperadmin = lazy(() => import('./dashboard-superadmin'));

const DashboardAdmin = () => {
  const settings = useSettingsContext();
  const { user, role, permission } = useAuthContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      {(user?.admin?.mode === 'god' || user?.admin?.role?.name === 'CSM') && (
        <DashboardSuperadmin />
      )}
      {user?.admin?.designation === 'Finance' && <DashboardFinance />}
    </Container>
  );
};

export default DashboardAdmin;
