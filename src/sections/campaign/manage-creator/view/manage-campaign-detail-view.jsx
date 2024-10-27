import useSWR from 'swr';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import React, { useEffect, useCallback } from 'react';

import { Container } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import { LoadingScreen } from 'src/components/loading-screen';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import CampaignDetailItem from '../campaign-detail-item';

const ManageCampaignDetailView = ({ id }) => {
  const { user } = useAuthContext();
  const router = useRouter();

  const { data, isLoading } = useSWR(endpoints.campaign.creator.getCampaign(id), fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnMount: true,
  });

  // Check if user is shortlisted
  const checkIfUserIsShortlisted = useCallback(() => {
    if (data && !data.shortlisted.some((item) => item.userId === user?.id)) {
      router.back();
      enqueueSnackbar("You're not shortlisted in this campaign.", {
        variant: 'info',
      });
    }
  }, [user?.id, data, router]);

  // Run check when data or user changes
  useEffect(() => {
    if (data) {
      checkIfUserIsShortlisted();
    }
  }, [checkIfUserIsShortlisted, data]);

  return (
    <Container maxWidth="lg">
      <CustomBreadcrumbs
        heading="Campaign Detail"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Campaign', href: paths.dashboard.campaign.creator.manage },
          { name: data?.name },
        ]}
      />
      {!isLoading && data ? <CampaignDetailItem campaign={data} /> : <LoadingScreen />}
    </Container>
  );
};

export default ManageCampaignDetailView;

ManageCampaignDetailView.propTypes = {
  id: PropTypes.string,
};
