/* eslint-disable no-unused-vars */
import React, { lazy } from 'react';

import { Container } from '@mui/material';

import { useAuthContext } from 'src/auth/hooks';

import { useSettingsContext } from 'src/components/settings';

const DashboardFinance = lazy(() => import('./Finance/Dashboard'));
const DashboardSuperadmin = lazy(() => import('./dashboard-superadmin'));
const DashboardAdminRevamped = lazy(() => import('./dashboard-admin'));

const DashboardAdmin = () => {
  const settings = useSettingsContext();
  const { user } = useAuthContext();

  const isSuperadmin = user?.admin?.mode === 'god';
  const isCSM = user?.admin?.role?.name === 'CSM';
  const isCSL = user?.admin?.role?.name === 'CSL';
  const isSalesMarketing = user?.admin?.role?.slug === 'sales_and_marketing';
  const isFinance = user?.admin?.designation === 'Finance';

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      {isSuperadmin || isSalesMarketing ? (
        <DashboardSuperadmin />
      ) : (
        <>
          {(isCSM || isCSL) && <DashboardAdminRevamped />}
          {isFinance && <DashboardFinance />}
        </>
      )}
    </Container>
  );
};

export default DashboardAdmin;
