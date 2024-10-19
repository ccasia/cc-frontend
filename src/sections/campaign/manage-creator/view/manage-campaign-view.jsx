import React, { useMemo, useState } from 'react';

import { Tab, Tabs, Container, Grid, Card, Box, Typography, Stack, Chip, Button, Divider, IconButton, Tooltip } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useGetCampaignByCreatorId } from 'src/hooks/use-get-campaign-based-on-creator-id';

import { useAuthContext } from 'src/auth/hooks';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import MyCampaignView from '../my-campaign';
import AppliedCampaignView from '../applied-campaign-view';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';
import Label from 'src/components/label';
import { fDate } from 'src/utils/format-time';

const ManageCampaignView = () => {
  const [currentTab, setCurrentTab] = useState('myCampaign');
  const [query, setQuery] = useState('');
  const router = useRouter();
  const { user } = useAuthContext();
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
      <Tab value="myCampaign" label="Active Campaigns" />
      <Tab value="applied" label="My Applications" />
      <Tab value="completed" label="Completed Campaigns" />
    </Tabs>
  );

  const handleClick = (id) => {
    router.push(paths.dashboard.campaign.creator.detail(id));
  };

  const renderCampaignItem = (campaign) => (
    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <Box sx={{ position: 'relative', p: 1.5 }}>
        <Box sx={{ position: 'relative', height: 180, overflow: 'hidden', borderRadius: 1 }}>
          <Image
            alt={campaign?.name}
            src={campaign?.campaignBrief?.images[0]}
            sx={{
              height: '100%',
              width: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        </Box>
      </Box>
      
      <Stack 
        direction="row" 
        justifyContent="space-between" 
        alignItems="flex-start" 
        sx={{ p: 2, pb: 1.5 }}
      >
        <Stack spacing={0.5} sx={{ flexGrow: 1, mr: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {campaign?.name}
          </Typography>
          <Stack spacing={0.8}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Iconify icon="mdi:office-building" width={14} height={14} sx={{ color: 'text.primary' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'medium' }} noWrap>
                  {campaign?.brand?.name ?? campaign?.company?.name}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Iconify icon="streamline:industry-innovation-and-infrastructure-solid" width={14} sx={{ color: 'text.primary' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                  {campaign?.campaignBrief?.industries}
                </Typography>
              </Stack>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Iconify icon="mdi:clock" width={14} sx={{ color: 'info.main' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {`${fDate(campaign?.campaignBrief?.startDate)} - ${fDate(campaign?.campaignBrief?.endDate)}`}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
      
      <Divider sx={{ my: 1 }} />
      
      <Box sx={{ px: 2, pb: 2, position: 'relative', zIndex: 2 }}>
        <Button
          variant="contained"
          size="small"
          onClick={() => handleClick(campaign.id)}
          sx={{ height: 36, width: '100%' }}
        >
          Manage
        </Button>
      </Box>
    </Card>
  );

  return (
    <Container>
      <CustomBreadcrumbs
        heading="Campaigns"
        links={[
          {
            name: 'Dashboard',
            href: paths.root,
          },
          { name: 'Campaign', href: paths.dashboard.campaign.creator.manage },
          { name: 'Lists' },
        ]}
      />
      {renderTabs}

      {currentTab === 'myCampaign' && !isLoading && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {filteredData
            .filter((campaign) => !campaign?.shortlisted?.find((item) => item.userId === user.id).isCampaignDone)
            .map((campaign) => (
              <Grid item xs={12} sm={6} md={4} key={campaign.id}>
                {renderCampaignItem(campaign)}
              </Grid>
            ))}
        </Grid>
      )}
      {currentTab === 'applied' && <AppliedCampaignView />}
      {currentTab === 'completed' && !isLoading && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {filteredData
            .filter((campaign) => campaign?.shortlisted?.find((item) => item.userId === user.id).isCampaignDone)
            .map((campaign) => (
              <Grid item xs={12} sm={6} md={4} key={campaign.id}>
                {renderCampaignItem(campaign)}
              </Grid>
            ))}
        </Grid>
      )}
    </Container>
  );
};

export default ManageCampaignView;

// ManageCampaignView.propTypes = {};