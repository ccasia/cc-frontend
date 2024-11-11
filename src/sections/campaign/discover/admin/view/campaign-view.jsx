import React, { useState, useCallback } from 'react';

import {
  Box,
  Stack,
  Avatar,
  Button,
  Container,
  TextField,
  Autocomplete,
  ListItemText,
  InputAdornment,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import useGetCampaigns from 'src/hooks/use-get-campaigns';
import { useGetCampaignBrandOption } from 'src/hooks/use-get-company-brand';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import EmptyContent from 'src/components/empty-content/empty-content';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import CampaignLists from '../campaign-list';
import CampaignFilter from '../campaign-filter';

const defaultFilters = {
  status: '',
  brands: [],
};

const CampaignView = () => {
  const settings = useSettingsContext();
  const { campaigns, isLoading } = useGetCampaigns();
  const { data: brandOptions } = useGetCampaignBrandOption();

  const router = useRouter();
  const [filters, setFilters] = useState(defaultFilters);

  const openFilters = useBoolean();

  const dataFiltered = applyFilter({
    inputData: campaigns && campaigns.filter((campaign) => campaign?.status === 'ACTIVE'),
    filters,
  });

  const handleFilters = useCallback((name, value) => {
    setFilters((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  const handleResetFitlers = () => {
    setFilters(defaultFilters);
  };

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
          mb: { xs: 3, md: 5 },
        }}
      />

      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        {campaigns && (
          <Autocomplete
            freeSolo
            sx={{ width: { xs: 1, sm: 260 } }}
            options={campaigns.filter((campaign) => campaign?.status === 'ACTIVE')}
            getOptionLabel={(option) => option.name}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" sx={{ ml: 1, color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box
                {...props}
                component="div"
                onClick={() =>
                  router.push(paths.dashboard.campaign.adminCampaignDetail(option?.id))
                }
              >
                <Avatar
                  alt="Campaign Image"
                  src={option?.campaignBrief?.images[0]}
                  variant="rounded"
                  sx={{
                    width: 48,
                    height: 48,
                    flexShrink: 0,
                    mr: 1.5,
                    borderRadius: 1,
                  }}
                />
                <ListItemText
                  primary={option?.name}
                  secondary={option?.company?.name || option?.brand?.name}
                />
              </Box>
            )}
          />
        )}

        <Button
          onClick={openFilters.onTrue}
          endIcon={<Iconify icon="ic:round-filter-list" />}
          sx={{
            boxShadow: (theme) => `0px 1px 1px 1px ${theme.palette.grey[400]}`,
          }}
        >
          Filter
        </Button>
      </Stack>

      {isLoading && (
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

      {!isLoading &&
        (dataFiltered?.length > 0 ? (
          <CampaignLists campaigns={dataFiltered} />
        ) : (
          <EmptyContent title="No campaign available" />
        ))}

      <CampaignFilter
        open={openFilters.value}
        onOpen={openFilters.onTrue}
        onClose={openFilters.onFalse}
        //
        filters={filters}
        onFilters={handleFilters}
        reset={handleResetFitlers}
        brands={brandOptions}
      />
    </Container>
  );
};

export default CampaignView;

const applyFilter = ({ inputData, filters }) => {
  const { status, brands } = filters;

  const brandIds = brands.map((brand) => brand.id);

  if (status) {
    inputData = inputData.filter((campaign) => campaign?.status === status);
  }

  if (brands.length) {
    inputData = inputData.filter((campaign) =>
      brandIds.includes(campaign?.companyId || campaign?.brandId)
    );
  }

  return inputData;
};
