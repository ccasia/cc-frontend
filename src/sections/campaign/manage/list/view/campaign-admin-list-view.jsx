/* eslint-disable no-nested-ternary */
import useSWRInfinite from 'swr/infinite';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { Box, Stack, Button, Container, Typography, CircularProgress } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useResponsive } from 'src/hooks/use-responsive';

import { fetcher } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import { useMainContext } from 'src/layouts/dashboard/hooks/dsahboard-context';

import Label from 'src/components/label';
import { useSettingsContext } from 'src/components/settings';
import EmptyContent from 'src/components/empty-content/empty-content';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import CampaignSearch from 'src/sections/campaign/discover/creator/campaign-search';

import CampaignList from '../campaign-admin-list';

const CampaignListView = () => {
  const settings = useSettingsContext();

  const { user } = useAuthContext();

  const scrollContainerRef = useRef(null);

  const [filter, setFilter] = useState('ACTIVE');
  const [showAllCampaigns, setShowAllCampaigns] = useState(false);
  // const { data, isLoading } = useSWR(endpoints.campaign.getCampaignsByAdminId, fetcher, {
  //   revalidateIfStale: true,
  //   revalidateOnFocus: true,
  //   revalidateOnMount: true,
  // });

  const { mainRef } = useMainContext();

  const lgUp = useResponsive('up', 'lg');

  const getKey = (pageIndex, previousPageData) => {
    // When showAllCampaigns is true, we're viewing other admins' campaigns
    const statusParam = showAllCampaigns ? '' : filter.toUpperCase();
    const excludeParam = showAllCampaigns ? '&excludeOwn=true' : '';

    // If there's no previous page data, start from the first page
    if (pageIndex === 0)
      return `/api/campaign/getAllCampaignsByAdminId/${user?.id}?status=${statusParam}&limit=${10}${excludeParam}`;

    // If there's no more data (previousPageData is empty or no nextCursor), stop fetching
    if (!previousPageData?.metaData?.lastCursor) return null;

    // Otherwise, use the nextCursor to get the next page
    return `/api/campaign/getAllCampaignsByAdminId/${user?.id}?status=${statusParam}&limit=${10}&cursor=${previousPageData?.metaData?.lastCursor}${excludeParam}`;
  };

  // OPTIMIZED: Add caching configuration to reduce unnecessary re-fetches
  const { data, error, size, setSize, isValidating, isLoading } = useSWRInfinite(getKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateFirstPage: false,
    dedupingInterval: 30000, // Cache for 30 seconds
  });

  const router = useRouter();
  // Remove unused state variables that were used by the removed useEffect
  // const [campaigns, setCampaigns] = useState([]);
  // const [loading, setLoading] = useState(false);

  const filteredData = useMemo(
    () => (data ? data?.flatMap((item) => item?.data?.campaigns) : []),
    [data]
  );

  const filtered = useMemo(
    () => ({
      all: filteredData?.length || 0,
      active: filteredData?.filter((item) => item.status === 'ACTIVE').length || 0,
      draft: filteredData?.filter((item) => item.status === 'DRAFT').length || 0,
      completed: filteredData?.filter((item) => item.status === 'COMPLETED').length || 0,
      paused: filteredData?.filter((item) => item.status === 'PAUSED').length || 0,
      scheduled: filteredData?.filter((item) => item.status === 'SCHEDULED').length || 0,
    }),
    [filteredData]
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

  // Remove the conflicting useEffect that makes a separate API call
  // This was interfering with the useSWRInfinite pagination and ordering
  // useEffect(() => {
  //   const getAllCampaigns = async () => {
  //     setLoading(true);
  //     try {
  //       const res = await axiosInstance.get(endpoints.campaign.getCampaignsByAdminId);
  //       setCampaigns(res?.data);
  //       setLoading(false);
  //     } catch (err) {
  //       enqueueSnackbar(err?.message, {
  //         variant: 'error',
  //       });
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   getAllCampaigns();
  // }, []);

  // const filteredData = useMemo(
  //   () => !isLoading && (!filter ? data : data.filter((elem) => elem?.status === filter)),
  //   [isLoading, filter, data]
  // );

  const handleScroll = useCallback(() => {
    const scrollContainer = lgUp ? mainRef?.current : document.documentElement;

    const bottom =
      scrollContainer.scrollHeight <=
      scrollContainer.scrollTop + scrollContainer.clientHeight + 0.5;

    if (bottom && !isValidating && data[data.length - 1]?.metaData?.lastCursor) {
      setSize(size + 1);
    }
  }, [data, isValidating, setSize, size, mainRef, lgUp]);

  useEffect(() => {
    const scrollContainer = lgUp ? mainRef?.current : window;

    scrollContainer.addEventListener('scroll', handleScroll);

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll, mainRef, lgUp]);

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );

  // Check if user is a CSM admin (not advanced mode - god/superadmin have different role names)
  // Note: Role name can be either 'CSM' or 'Customer Success Manager' depending on DB entry
  const isCSM = useMemo(
    () =>
      (user?.admin?.role?.name === 'CSM' || user?.admin?.role?.name === 'Customer Success Manager') &&
      user?.admin?.mode !== 'advanced',
    [user]
  );

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Campaigns"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          {
            name: 'Campaigns',
            href: paths.dashboard.campaign.root,
          },
          { name: 'List' },
        ]}
        sx={{
          mb: { xs: 3 },
        }}
      />

      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <CampaignSearch campaigns={filteredData} />
      </Stack>

      <Box display="flex" gap={1} mt={2} flexWrap="wrap">
        <Button
          size="medium"
          variant={!filter && !showAllCampaigns ? 'contained' : 'outlined'}
          onClick={() => {
            setFilter('');
            setShowAllCampaigns(false);
          }}
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
          variant={filter === 'ACTIVE' && !showAllCampaigns ? 'contained' : 'outlined'}
          onClick={() => {
            setFilter('ACTIVE');
            setShowAllCampaigns(false);
          }}
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
          variant={filter === 'DRAFT' && !showAllCampaigns ? 'contained' : 'outlined'}
          onClick={() => {
            setFilter('DRAFT');
            setShowAllCampaigns(false);
          }}
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
          variant={filter === 'SCHEDULED' && !showAllCampaigns ? 'contained' : 'outlined'}
          onClick={() => {
            setFilter('SCHEDULED');
            setShowAllCampaigns(false);
          }}
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
          variant={filter === 'COMPLETED' && !showAllCampaigns ? 'contained' : 'outlined'}
          onClick={() => {
            setFilter('COMPLETED');
            setShowAllCampaigns(false);
          }}
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
          variant={filter === 'PAUSED' && !showAllCampaigns ? 'contained' : 'outlined'}
          onClick={() => {
            setFilter('PAUSED');
            setShowAllCampaigns(false);
          }}
          endIcon={
            <Label>
              <Typography variant="caption">{filtered?.paused}</Typography>
            </Label>
          }
        >
          Paused
        </Button>
        {/* All Campaigns tab - only visible to CSM admins */}
        {isCSM && (
          <Button
            size="medium"
            variant={showAllCampaigns ? 'contained' : 'outlined'}
            onClick={() => {
              setFilter('');
              setShowAllCampaigns(true);
            }}
          >
            All Campaigns
          </Button>
        )}
      </Box>

      {!isLoading ? (
        filteredData?.length > 0 ? (
          <Box>
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                  xs: 'repeat(1, 1fr)',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                },
              }}
            >
              {filteredData.map((campaign) => (
                <CampaignList
                  key={campaign?.id}
                  campaign={campaign}
                  showAdmins={showAllCampaigns}
                  viewOnly={showAllCampaigns}
                  onView={() => onView(campaign?.id)}
                  onEdit={() => onEdit(campaign?.id)}
                  onDelete={() => onDelete(campaign?.id)}
                />
              ))}
            </Box>
            {isValidating && (
              <Box sx={{ textAlign: 'center', my: 2 }}>
                <CircularProgress
                  thickness={7}
                  size={25}
                  sx={{
                    color: (theme) => theme.palette.common.black,
                    strokeLinecap: 'round',
                  }}
                />
              </Box>
            )}
          </Box>
        ) : (
          <EmptyContent
            filled
            title={showAllCampaigns ? 'No campaigns from other admins' : `No Data for ${filter} campaigns`}
            sx={{ py: 10, mt: 2 }}
          />
        )
      ) : (
        <Box
          sx={{
            position: 'relative',
            top: 200,
            textAlign: 'center',
          }}
        >
          <CircularProgress
            thickness={7}
            size={25}
            sx={{
              color: (theme) => theme.palette.common.black,
              strokeLinecap: 'round',
            }}
          />
        </Box>
      )}
    </Container>
  );
};

export default CampaignListView;
