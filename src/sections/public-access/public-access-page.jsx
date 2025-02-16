/* eslint-disable perfectionist/sort-imports */
import React, { useRef, useState, useEffect, useCallback } from 'react';

import { useParams } from 'react-router-dom';

import { Box, Stack, Button, Container, Typography } from '@mui/material';

import { useSettingsContext } from 'src/components/settings';

import { useGetCampaignById } from 'src/routes/hooks/use-public-campaign';
//  import { useGetCampaignById } from 'src/hooks/use-get-campaign-by-id';
import { format } from 'date-fns';
import { LoadingScreen } from 'src/components/loading-screen';

import CampaignLogistics from '../campaign/discover/admin/campaign-logistics';
import CampaignDetailBrand from '../campaign/discover/admin/campaign-detail-brand';
import CampaignInvoicesList from '../campaign/discover/admin/campaign-invoices-list';
import CampaignDraftSubmissions from '../campaign/discover/admin/campaign-draft-submission';
import CampaignDetailPitch from '../campaign/discover/admin/campaign-detail-pitch/campaign-detail-pitch';

import PublicCampaignDetailContent from './publicCampaignDetail';
import PublicCampaignOverview from './publicOverview';
import PublicCreatorDetail from './publicCreatorDetail';

const PublicAccessPage = () => {
  const { id } = useParams();
  const settings = useSettingsContext();

  const { campaign, campaignLoading, mutate: campaignMutate } = useGetCampaignById(id);

  const [anchorEl, setAnchorEl] = useState(null);
  const reminderRef = useRef(null);

  const open = Boolean(anchorEl);

  const [currentTab, setCurrentTab] = useState(
    localStorage.getItem('campaigndetail') || 'campaign-content'
  );

  const handleChangeTab = useCallback((event, newValue) => {
    localStorage.setItem('campaigndetail', newValue);
    setCurrentTab(newValue);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'MMMM d, yyyy');
  };

  const renderTabs = (
    <Box sx={{ mt: 2, mb: 2.5 }}>
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          position: 'relative',
          width: '100%',
          overflowX: 'auto',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1px',
            bgcolor: 'divider',
          },
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{
            width: { xs: '100%', sm: 'auto' },
            overflowX: 'auto',
          }}
        >
          {[
            { label: 'Overview', value: 'overview' },
            { label: 'Campaign Details', value: 'campaign-content' },
            // { label: 'Client Info', value: 'client' },
            {
              label: `Pitches (${campaign?.pitch?.filter((p) => p.status === 'undecided').length || 0})`,
              value: 'pitch',
            },
            {
              label: `Creators (${campaign?.shortlisted?.length || 0})`,
              value: 'creator',
            },
            // {
            //   label: `Agreements (${campaign?.creatorAgreement?.length || 0})`,
            //   value: 'agreement',
            // },
            // {
            //   label: `Invoices (${campaignInvoices?.length || 0})`,
            //   value: 'invoices',
            // },
            {
              label: `Logistics (${campaign?.logistic?.length || 0})`,
              value: 'logistics',
            },
          ].map((tab) => (
            <Button
              key={tab.value}
              disableRipple
              size="large"
              onClick={() => handleChangeTab(null, tab.value)}
              sx={{
                px: { xs: 1, sm: 1.5 },
                py: 0.5,
                pb: 1,
                minWidth: 'fit-content',
                color: currentTab === tab.value ? '#221f20' : '#8e8e93',
                position: 'relative',
                fontSize: { xs: '0.9rem', sm: '1.05rem' },
                fontWeight: 650,
                whiteSpace: 'nowrap',
                mr: { xs: 1, sm: 2 },
                transition: 'transform 0.1s ease-in-out',
                '&:focus': {
                  outline: 'none',
                  bgcolor: 'transparent',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                  bgcolor: 'transparent',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  width: currentTab === tab.value ? '100%' : '0%',
                  bgcolor: '#1340ff',
                  transition: 'all 0.3s ease-in-out',
                  transform: 'scaleX(1)',
                  transformOrigin: 'left',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                  '&::after': {
                    width: '100%',
                    opacity: currentTab === tab.value ? 1 : 0.5,
                  },
                },
                // mr: 2,
              }}
            >
              {tab.label}
            </Button>
          ))}
        </Stack>
      </Stack>
    </Box>
  );

  useEffect(() => {
    window.addEventListener('click', (event) => {
      if (reminderRef.current && !reminderRef.current.contains(event.target)) {
        setAnchorEl(false);
      }
    });
  }, [open]);

  const renderTabContent = {
    overview: <PublicCampaignOverview campaign={campaign} />,
    'campaign-content': <PublicCampaignDetailContent campaign={campaign} />,
    creator: <PublicCreatorDetail campaign={campaign} campaignMutate={campaignMutate} />,
    // agreement: <CampaignAgreements campaign={campaign} campaignMutate={campaignMutate} />,
    logistics: <CampaignLogistics campaign={campaign} campaignMutate={campaignMutate} />,
    invoices: <CampaignInvoicesList campId={campaign?.id} campaignMutate={campaignMutate} />,
    client: (
      <CampaignDetailBrand brand={campaign?.brand ?? campaign?.company} campaign={campaign} />
    ),
    pitch: (
      <CampaignDetailPitch
        pitches={campaign?.pitch}
        timeline={campaign?.campaignTimeline?.find((elem) => elem.name === 'Open For Pitch')}
        timelines={campaign?.campaignTimeline?.filter(
          (elem) => elem.for === 'creator' && elem.name !== 'Open For Pitch'
        )}
        shortlisted={campaign?.shortlisted}
        campaignMutate={campaignMutate}
        campaign={campaign}
      />
    ),
    submission: <CampaignDraftSubmissions campaign={campaign} campaignMutate={campaignMutate} />,
  };

  return (
    <Container
      maxWidth={settings.themeStretch ? false : 'xl'}
      sx={{
        px: { xs: 2, sm: 5 },
        m: { xs: 2, sm: 5 },
      }}
    >
      <Stack spacing={1}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          width="100%"
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            {campaign?.campaignBrief?.images?.[0] && (
              <img
                src={campaign?.campaignBrief.images[0]}
                alt={campaign?.name}
                style={{
                  width: '100%',
                  maxWidth: 80,
                  height: 'auto',
                  borderRadius: '12px',
                  border: '1px solid #e0e0e0',
                  objectFit: 'cover',
                }}
              />
            )}
            <Typography
              variant="h5"
              sx={{
                fontFamily: 'Instrument Serif, serif',
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.4rem' },
                fontWeight: 550,
              }}
            >
              {campaign?.name || 'Campaign Detail'}
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            spacing={{ xs: 1, sm: 0 }}
            width={{ xs: '100%', sm: 'auto' }}
            justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
          >
            <Stack
              alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
              spacing={0}
              justifyContent="center"
              sx={{ minHeight: { sm: '76px' } }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: '#8e8e93',
                  fontWeight: 500,
                  fontSize: { xs: '0.75rem', sm: '0.9rem' },
                  letterSpacing: '0.5px',
                }}
              >
                CAMPAIGN PERIOD:
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{
                  color: '#221f20',
                  fontWeight: 500,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                }}
              >
                {formatDate(campaign?.campaignBrief?.startDate)} -{' '}
                {formatDate(campaign?.campaignBrief?.endDate)}
              </Typography>
            </Stack>

            <Box
              sx={{
                height: '76px',
                width: '1px',
                backgroundColor: '#e7e7e7',
                mx: 2,
                display: { xs: 'none', sm: 'block' },
              }}
            />
          </Stack>
        </Stack>
      </Stack>

      {renderTabs}

      {(!campaignLoading ? renderTabContent[currentTab] : <LoadingScreen />) || null}
    </Container>
  );
};

export default PublicAccessPage;
