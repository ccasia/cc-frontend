import React, { useState } from 'react';

import { Menu, Stack, Button, MenuItem, Container, TextField, InputAdornment } from '@mui/material';

import { paths } from 'src/routes/paths';

import { _tours } from 'src/_mock';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import CampaignLists from '../campaign-list';

const CampaignView = () => {
  const settings = useSettingsContext();

  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
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
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="material-symbols:search" />
              </InputAdornment>
            ),
          }}
        />
        <Button onClick={handleClick} endIcon={<Iconify icon="ep:arrow-down-bold" width={16} />}>
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

      <CampaignLists tours={_tours} />
    </Container>
  );
};

export default CampaignView;
