import React, { useMemo, useState } from 'react';

import { Tab, Tabs, Container } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useGetCampaignByCreatorId } from 'src/hooks/use-get-campaign-based-on-creator-id';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import MyCampaignView from '../my-campaign';
import AppliedCampaignView from '../applied-campaign-view';

const ManageCampaignView = () => {
  const [currentTab, setCurrentTab] = useState('myCampaign');
  const [query, setQuery] = useState('');
  const router = useRouter();
  const { data, isLoading } = useGetCampaignByCreatorId();

  const filteredData = useMemo(
    () =>
      query
        ? data?.campaigns?.filter((elem) => elem.name.toLowerCase()?.includes(query.toLowerCase()))
        : data?.campaigns,
    [data, query]
  );

  const renderTabs = (
    <Tabs
      value={currentTab}
      onChange={(e, val) => setCurrentTab(val)}
      sx={{
        mt: 2,
      }}
    >
      <Tab value="myCampaign" label="My Campaigns" />
      <Tab value="applied" label="I've Applied" />
    </Tabs>
  );

  const handleClick = (id) => {
    router.push(paths.dashboard.campaign.creator.detail(id));
  };

  return (
    <Container>
      <CustomBreadcrumbs
        heading="Campaigns"
        links={[
          {
            name: 'Dashboard',
            href: paths.dashboard.root,
          },
          { name: 'Campaign', href: paths.dashboard.campaign.creator.manage },
          { name: 'Lists' },
        ]}
      />
      {renderTabs}

      {currentTab === 'myCampaign' && !isLoading && (
        <MyCampaignView
          query={query}
          setQuery={setQuery}
          filteredData={filteredData}
          onClick={handleClick}
        />
        // <Box mt={2}>
        //   <TextField
        //     value={query}
        //     placeholder="Search By Campaign Name"
        //     InputProps={{
        //       startAdornment: (
        //         <InputAdornment position="start">
        //           <Iconify icon="hugeicons:search-02" />
        //         </InputAdornment>
        //       ),
        //     }}
        //     sx={{
        //       width: 250,
        //     }}
        //     onChange={(e) => setQuery(e.target.value)}
        //   />
        //   {!isLoading && filteredData.length ? (
        //     <Box
        //       gap={3}
        //       display="grid"
        //       mt={2}
        //       gridTemplateColumns={{
        //         xs: 'repeat(1, 1fr)',
        //         sm: 'repeat(2, 1fr)',
        //         md: 'repeat(3, 1fr)',
        //       }}
        //     >
        //       {filteredData.map((campaign) => (
        //         <CampaignItem
        //           key={campaign?.id}
        //           campaign={campaign}
        //           onClick={() => handleClick(campaign?.id)}
        //         />
        //       ))}
        //     </Box>
        //   ) : (
        //     <EmptyContent title={`No campaign ${query} found.`} />
        //   )}
        // </Box>
      )}
      {currentTab === 'applied' && <AppliedCampaignView />}
    </Container>
  );
};

export default ManageCampaignView;

// ManageCampaignView.propTypes = {};
