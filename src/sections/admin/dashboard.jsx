/* eslint-disable no-unused-vars */
import React, { lazy } from 'react';

import { Container } from '@mui/material';

import { isBdAdmin } from 'src/utils/brief-roles';

import { useAuthContext } from 'src/auth/hooks';

import { useSettingsContext } from 'src/components/settings';

const DashboardFinance = lazy(() => import('./Finance/Dashboard'));
const DashboardBD = lazy(() => import('./dashboard-bd'));
const DashboardSuperadmin = lazy(() => import('./dashboard-superadmin'));
const DashboardAdminRevamped = lazy(() => import('./dashboard-admin'));

const DashboardAdmin = () => {
  const settings = useSettingsContext();
  const { user } = useAuthContext();

  const isSuperadmin = user?.admin?.mode === 'god';
  const isCSM = user?.admin?.role?.name === 'CSM';
  const isCSL = user?.admin?.role?.name === 'CSL';
  // BD (sales & marketing) admins get the dedicated sales pipeline dashboard.
  const isBD = !isSuperadmin && isBdAdmin(user);
  const isFinance = user?.admin?.designation === 'Finance';

  // The BD dashboard manages its own full-width container.
  if (isBD) return <DashboardBD />;

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      {isSuperadmin && <DashboardSuperadmin />}
      {(isCSM || isCSL) && <DashboardAdminRevamped />}
      {isFinance && <DashboardFinance />}
    </Container>
  );
};

export default DashboardAdmin;
