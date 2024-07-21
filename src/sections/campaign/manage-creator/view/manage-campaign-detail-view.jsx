import useSWR from 'swr';
import React from 'react';
import PropTypes from 'prop-types';

import { Container } from '@mui/material';

import { paths } from 'src/routes/paths';

import { fetcher, endpoints } from 'src/utils/axios';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import CampaignDetailItem from '../campaign-detail-item';

const ManageCampaignDetailView = ({ id }) => {
  const { data, isLoading } = useSWR(endpoints.campaign.creator.getCampaign(id), fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnMount: true,
  });

  return (
    <Container maxWidth="lg">
      <CustomBreadcrumbs
        heading="Campaign Detail"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Campaign', href: paths.dashboard.campaign.creator.manage },
          { name: id },
        ]}
      />
      {!isLoading && <CampaignDetailItem campaign={data} />}
    </Container>
  );
};

export default ManageCampaignDetailView;

ManageCampaignDetailView.propTypes = {
  id: PropTypes.string,
};
