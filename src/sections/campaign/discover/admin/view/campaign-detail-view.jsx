import PropTypes from 'prop-types';
import React, { useState, useCallback } from 'react';

import { Tab, Tabs, Button, Container } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import useGetCampaigns from 'src/hooks/use-get-campaigns';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

import CampaignDetailBrand from '../campaign-detail-brand';
import CampaignDetailPitch from '../campaign-detail-pitch';
import CampaignDetailContent from '../campaign-detail-content';

const CampaignDetailView = ({ id }) => {
  const settings = useSettingsContext();
  const router = useRouter();
  const { campaigns } = useGetCampaigns();

  const currentCampaign = campaigns && campaigns.filter((campaign) => campaign.id === id)[0];

  //   const currentTour = _tours.filter((tour) => tour.id === id)[0];

  const [currentTab, setCurrentTab] = useState('campaign-content');

  const handleChangeTab = useCallback((event, newValue) => {
    setCurrentTab(newValue);
  }, []);

  const renderTabs = (
    <Tabs
      value={currentTab}
      onChange={handleChangeTab}
      sx={{
        mb: { xs: 3, md: 5 },
      }}
    >
      {[
        { label: 'Campaign Content', value: 'campaign-content' },
        { label: 'Creator', value: 'creator' },
        { label: 'Brand', value: 'brand' },
        { label: 'Shortlisted', value: 'shortlist' },
        { label: 'Pitch', value: 'pitch' },
      ].map((tab) => (
        <Tab
          key={tab.value}
          iconPosition="end"
          value={tab.value}
          label={tab.label}
          icon={
            tab.value === 'pitch' ? (
              <Label variant="filled">{currentCampaign?.Pitch.length}</Label>
            ) : (
              ''
            )
          }
        />
      ))}
    </Tabs>
  );

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <Button
        startIcon={<Iconify icon="material-symbols:arrow-back-ios" width={12} sx={{ ml: 1 }} />}
        onClick={() => router.push(paths.dashboard.campaign.view)}
        sx={{
          mb: 3,
        }}
      >
        Back
      </Button>

      {renderTabs}

      {currentTab === 'campaign-content' && <CampaignDetailContent campaign={currentCampaign} />}
      {currentTab === 'creator' && <CampaignDetailContent campaign={currentCampaign} />}
      {currentTab === 'brand' && (
        <CampaignDetailBrand brand={currentCampaign?.brand ?? currentCampaign?.company} />
      )}
      {currentTab === 'shortlisted' && <CampaignDetailContent campaign={currentCampaign} />}
      {currentTab === 'pitch' && (
        <CampaignDetailPitch
          pitches={currentCampaign?.Pitch}
          shortlisted={currentCampaign?.ShortListedCreator}
        />
      )}
    </Container>
  );
};

export default CampaignDetailView;

CampaignDetailView.propTypes = {
  id: PropTypes.string,
};
