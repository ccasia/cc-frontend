/* eslint-disable no-nested-ternary */
import useSWR from 'swr';
import { enqueueSnackbar } from 'notistack';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import { Box, Stack, Button, Skeleton, Container, Typography } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import EmptyContent from 'src/components/empty-content/empty-content';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import CampaignSearch from 'src/sections/campaign/discover/creator/campaign-search';

import CampaignList from '../campaign-admin-list';

const CampaignListView = () => {
  const settings = useSettingsContext();
  const { data, isLoading } = useSWR(endpoints.campaign.getCampaignsByAdminId, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnMount: true,
  });

  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filter, setFilter] = useState('');

  const filtered = useMemo(
    () => ({
      all: campaigns?.length,
      active: campaigns?.filter((item) => item.status === 'ACTIVE').length,
      draft: campaigns?.filter((item) => item.status === 'DRAFT').length,
      completed: campaigns?.filter((item) => item.status === 'COMPLETED').length,
      paused: campaigns?.filter((item) => item.status === 'PAUSED').length,
      scheduled: campaigns?.filter((item) => item.status === 'SCHEDULED').length,
    }),
    [campaigns]
  );

  const onView = useCallback(
    (id) => {
      router.push(paths.dashboard.campaign.adminCampaignManageDetail(id));
    },
    [router]
  );

  const onEdit = useCallback(
    (id) => {
      router.push(paths.dashboard.campaign.adminCampaignEdit(id));
    },
    [router]
  );

  const onDelete = useCallback((id) => {
    console.log('Delete', id);
  }, []);

  useEffect(() => {
    const getAllCampaigns = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(endpoints.campaign.getCampaignsByAdminId);
        setCampaigns(res?.data);
        setLoading(false);
      } catch (error) {
        enqueueSnackbar(error?.message, {
          variant: 'error',
        });
      } finally {
        setLoading(false);
      }
    };
    getAllCampaigns();
  }, []);

  const filteredData = useMemo(
    () => !isLoading && (!filter ? data : data.filter((elem) => elem?.status === filter)),
    [isLoading, filter, data]
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

      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <CampaignSearch campaigns={campaigns} />
      </Stack>

      <Box display="flex" gap={1} mt={2}>
        <Button
          size="medium"
          variant={filter ? 'outlined' : 'contained'}
          onClick={() => setFilter('')}
          endIcon={
            <Label>
              <Typography variant="caption">{filtered?.all}</Typography>
            </Label>
          }
        >
          All
        </Button>
        <Button
          size="medium"
          variant={filter === 'ACTIVE' ? 'contained' : 'outlined'}
          onClick={() => setFilter('ACTIVE')}
          endIcon={
            <Label>
              <Typography variant="caption">{filtered?.active}</Typography>
            </Label>
          }
        >
          Active
        </Button>
        <Button
          size="medium"
          variant={filter === 'DRAFT' ? 'contained' : 'outlined'}
          onClick={() => setFilter('DRAFT')}
          endIcon={
            <Label>
              <Typography variant="caption">{filtered?.draft}</Typography>
            </Label>
          }
        >
          Draft
        </Button>
        <Button
          size="medium"
          variant={filter === 'SCHEDULED' ? 'contained' : 'outlined'}
          onClick={() => setFilter('SCHEDULED')}
          endIcon={
            <Label>
              <Typography variant="caption">{filtered?.scheduled}</Typography>
            </Label>
          }
        >
          Scheduled
        </Button>
        <Button
          size="medium"
          variant={filter === 'COMPLETED' ? 'contained' : 'outlined'}
          onClick={() => setFilter('COMPLETED')}
          endIcon={
            <Label>
              <Typography variant="caption">{filtered?.completed}</Typography>
            </Label>
          }
        >
          Completed
        </Button>
        <Button
          size="medium"
          variant={filter === 'PAUSED' ? 'contained' : 'outlined'}
          onClick={() => setFilter('PAUSED')}
          endIcon={
            <Label>
              <Typography variant="caption">{filtered?.paused}</Typography>
            </Label>
          }
        >
          Paused
        </Button>
      </Box>

      {!isLoading ? (
        filteredData.length > 0 ? (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: 'repeat(1, 1fr)',
                md: 'repeat(2, 1fr)',
              },
              mt: 1,
            }}
          >
            {filteredData.map((campaign) => (
              <CampaignList
                key={campaign?.id}
                campaign={campaign}
                onView={() => onView(campaign?.id)}
                onEdit={() => onEdit(campaign?.id)}
                onDelete={() => onDelete(campaign?.id)}
              />
            ))}
          </Box>
        ) : (
          <EmptyContent filled title="No Data" sx={{ py: 10 }} />
        )
      ) : (
        <Skeleton width={500} height={500} />
      )}
    </Container>
  );
};

export default CampaignListView;
