/* eslint-disable no-unused-vars */
import React, { lazy } from 'react';

import { Container } from '@mui/material';

import { useAuthContext } from 'src/auth/hooks';

import { useSettingsContext } from 'src/components/settings';

const DashboardFinance = lazy(() => import('./Finance/Dashboard'));
const DashboardSuperadmin = lazy(() => import('./dashboard-superadmin'));

const DashboardAdmin = () => {
  const settings = useSettingsContext();
  const { user } = useAuthContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      {(user?.admin?.mode === 'god' || user?.admin?.role?.name === 'CSM' || user?.admin?.role?.name === 'CSL') && (
        <DashboardSuperadmin />
      )}
      {user?.admin?.designation === 'Finance' && <DashboardFinance />}
    </Container>
  );
};

export default DashboardAdmin;
