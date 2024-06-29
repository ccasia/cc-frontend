import React, { useState, useCallback } from 'react';

import { Menu, Stack, Button, MenuItem, Container, TextField, InputAdornment } from '@mui/material';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';
import useGetCampaigns from 'src/hooks/use-get-campaigns';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import CampaignLists from '../campaign-list';
import CampaignFilter from '../campaign-filter';

const defaultFilters = {
  status: '',
  brands: [],
};

const CampaignView = () => {
  const settings = useSettingsContext();
  const { campaigns } = useGetCampaigns();

  const [anchorEl, setAnchorEl] = useState(null);
  const [filters, setFilters] = useState(defaultFilters);

  const open = Boolean(anchorEl);

  const handleClose = () => {
    setAnchorEl(null);
  };

  const openFilters = useBoolean();

  const dataFiltered = applyFilter({
    inputData: campaigns && campaigns.filter((campaign) => campaign?.stage === 'publish'),
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
        heading="Campaign"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          {
            name: 'Campaign',
            href: paths.dashboard.campaign.root,
          },
          { name: 'List' },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <TextField
          placeholder="Search..."
          sx={{
            width: 250,
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="material-symbols:search" />
              </InputAdornment>
            ),
          }}
        />
        <Button onClick={openFilters.onTrue} endIcon={<Iconify icon="ic:round-filter-list" />}>
          Filter
        </Button>

        <Menu
          id="basic-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            'aria-labelledby': 'basic-button',
          }}
        >
          <MenuItem>Active</MenuItem>
          <MenuItem>Past</MenuItem>
        </Menu>
      </Stack>

      {dataFiltered && <CampaignLists campaigns={dataFiltered} />}
      <CampaignFilter
        open={openFilters.value}
        onOpen={openFilters.onTrue}
        onClose={openFilters.onFalse}
        //
        filters={filters}
        onFilters={handleFilters}
        reset={handleResetFitlers}
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
