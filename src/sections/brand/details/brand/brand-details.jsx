import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import React, { useState, useEffect } from 'react';

import { Tab, Box, Tabs, Grid, Stack, Button, Container, Typography } from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import CustomChip from 'src/components/custom-chip/custom-chip';

const BrandDetails = ({ id }) => {
  const [currentTab, setCurrentTab] = useState('details');
  const [brand, setBrand] = useState();
  const router = useRouter();

  const handleChangeTab = (e, newVal) => {
    setCurrentTab(newVal);
  };

  const renderTabs = (
    <Tabs
      value={currentTab}
      onChange={handleChangeTab}
      sx={{
        mb: { xs: 3, md: 5 },
      }}
    >
      {[
        { label: 'Details', value: 'details' },
        { label: 'Campaigns', value: 'campaign' },
        { label: 'Sub brands', value: 'sub' },
      ].map((elem, index) => (
        <Tab key={index} value={elem.value} label={elem.label} iconPosition="end" />
      ))}
    </Tabs>
  );

  const renderContents = (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Box
          sx={{
            bgcolor: (theme) => theme.palette.background.paper,
            width: '100%',
            borderRadius: 1.5,
            p: 2,
          }}
        >
          <Typography variant="h5">General Information</Typography>
          <Stack mt={2} spacing={2}>
            <Typography variant="h6">{brand?.name}</Typography>
            <Stack>
              <Typography variant="h6">About</Typography>
              <Typography variant="subtitle2">{brand?.description}</Typography>
            </Stack>
            <Stack>
              <Typography variant="h6">Objectives</Typography>
              <Stack direction="row" alignItems="center">
                <ul>
                  {brand?.objectives?.map((elem) => (
                    <li>
                      <Typography variant="inherit">{elem.value}</Typography>
                    </li>
                  ))}
                </ul>
              </Stack>
            </Stack>
            <Stack direction="row" spacing={1}>
              {brand?.industries.map((item) => (
                <CustomChip label={item} />
              ))}
            </Stack>
          </Stack>
        </Box>
      </Grid>
      <Grid item xs={12} md={4}>
        <Box
          sx={{
            bgcolor: (theme) => theme.palette.background.paper,
            width: '100%',
            borderRadius: 1.5,
            p: 2,
          }}
        >
          <Typography variant="h5">Socials</Typography>
          <Stack mt={2} spacing={1.5}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Iconify icon="ic:baseline-email" />
              <Typography variant="subtitle2">{brand?.email}</Typography>
            </Stack>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Iconify icon="ic:baseline-phone" />
              <Typography variant="subtitle2">{brand?.phone}</Typography>
            </Stack>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Iconify icon="iconoir:www" />
              <Typography variant="subtitle2">{brand?.website}</Typography>
            </Stack>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Iconify icon="mdi:instagram" />
              <Typography variant="subtitle2">{brand?.instagram}</Typography>
            </Stack>
            {brand?.tiktok && (
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Iconify icon="ic:baseline-tiktok" />
                <Typography variant="subtitle2">{brand?.tiktok}</Typography>
              </Stack>
            )}
          </Stack>
        </Box>
      </Grid>
    </Grid>
  );

  useEffect(() => {
    const getBrand = async () => {
      try {
        const res = await axiosInstance.get(endpoints.company.brandDetail(id));
        setBrand(res?.data);
      } catch (error) {
        enqueueSnackbar('Error', {
          variant: 'error',
        });
      }
    };
    getBrand();
  }, [brand, id]);

  return (
    <Container maxWidth="lg">
      <Button
        startIcon={<Iconify icon="material-symbols:arrow-back-ios" width={12} sx={{ ml: 1 }} />}
        onClick={() => router.back()}
      >
        Back
      </Button>

      {renderTabs}

      {brand && renderContents}

      {/* {brand && JSON.stringify(brand)} */}
    </Container>
  );
};

export default BrandDetails;

BrandDetails.propTypes = {
  id: PropTypes.string,
};
