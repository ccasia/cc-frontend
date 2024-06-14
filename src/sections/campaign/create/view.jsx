import { SnackbarProvider } from 'notistack';

import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import useGetBrand from 'src/hooks/use-get-brand';
import useGetAdmins from 'src/hooks/use-get-admins';
import useGetCompany from 'src/hooks/use-get-company';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import CreateCampaignForm from './form';

function CreateCampaign() {
  useGetAdmins();
  useGetCompany();
  useGetBrand();
  const settings = useSettingsContext();
  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Create Campaign"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Campaign', href: paths.dashboard.campaign.root },
          { name: 'Create' },
        ]}
      />

      <CreateCampaignForm />
      <SnackbarProvider />
    </Container>
  );
}

export default CreateCampaign;
