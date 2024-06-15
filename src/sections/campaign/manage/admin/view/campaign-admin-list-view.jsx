import React, { useState } from 'react';

import { Tab, Tabs, Button, Container } from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import CampaignList from '../campaign-admin-list';
import CampaignSearch from '../../../discover/creator/campaign-search';

const CampaignListView = () => {
  const settings = useSettingsContext();
  const [tab, setTab] = useState('all');

  const renderTabs = (
    <Tabs value={tab} onChange={(e, val) => setTab(val)}>
      <Tab label="All" value="all" iconPosition="end" icon={<Label>13</Label>} />
      <Tab label="Published" value="published" />
      <Tab label="Draft" value="draft" />
    </Tabs>
  );

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="List"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          {
            name: 'Campaign',
            href: paths.dashboard.campaign.root,
          },
          { name: 'List' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.campaign.create}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            New Campaign
          </Button>
        }
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <CampaignSearch
      // query={search.query}
      // results={search.results}
      // onSearch={handleSearch}
      // hrefItem={(id) => paths.dashboard.tour.details(id)}
      />

      {renderTabs}
      <CampaignList />
    </Container>
  );
};

export default CampaignListView;
