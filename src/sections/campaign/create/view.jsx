import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import CreateCampaignForm from './form';

function CreateCampaign() {
  // useGetAdmins();
  // useGetCompany();
  // useGetBrand();
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
    </Container>
  );
}

export default CreateCampaign;
