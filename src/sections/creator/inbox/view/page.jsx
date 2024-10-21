import React, { useState } from 'react';

import { Tab, Tabs, Container } from '@mui/material';

import { paths } from 'src/routes/paths';

import useGetNotificationById from 'src/hooks/use-get-notification-by-id';

import { useSettingsContext } from 'src/components/settings';
import EmptyContent from 'src/components/empty-content/empty-content';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import AllNotifications from '../all_notification';
import CampaignInbox from '../campaign_inbox/view/pages';

const CreatorInbox = () => {
  const settings = useSettingsContext();
  const [currentTab, setCurrentTab] = useState('all');
  const { data, isLoading } = useGetNotificationById();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Inbox"
        links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Inbox' }]}
        sx={{
          mb: { xs: 3, md: 3 },
        }}
      />
      <Tabs value={currentTab} onChange={(_, val) => setCurrentTab(val)} sx={{ mb: 2 }}>
        <Tab label="All" value="all" />
        <Tab label="Campaign Inbox" value="campaign_inbox" />
        <Tab label="Chat Inbox" value="campaign_inbod" />
      </Tabs>

      {!isLoading && data?.notifications.length > 0 ? (
        <>
          {currentTab === 'all' && <AllNotifications data={data?.notifications} />}
          {currentTab === 'campaign_inbox' && <CampaignInbox />}
        </>
      ) : (
        <EmptyContent title="No Inbox" />
      )}
    </Container>
  );
};

export default CreatorInbox;
