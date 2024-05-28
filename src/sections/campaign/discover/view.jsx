
import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';



function DiscoverCampaign() {
  const settings = useSettingsContext();
  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
          heading="Discover Campaign"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Campaign' },
            { name: 'Dicover' },
          ]} />



      </Container>
  );
}

export default DiscoverCampaign;
