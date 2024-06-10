import Container from '@mui/material/Container';

import { useSettingsContext } from 'src/components/settings';

import JobListView from './campaign-list-view';

function DiscoverCampaign() {
  const settings = useSettingsContext();
  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <JobListView />
    </Container>
  );
}

export default DiscoverCampaign;
