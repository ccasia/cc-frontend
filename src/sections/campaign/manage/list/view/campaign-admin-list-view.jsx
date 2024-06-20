import { enqueueSnackbar } from 'notistack';
import React, { useState, useEffect, useCallback } from 'react';

import Chip from '@mui/material/Chip';
import { Box, Menu, Stack, alpha, Button, MenuItem, Container, Typography } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import EmptyContent from 'src/components/empty-content/empty-content';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import CampaignSearch from 'src/sections/campaign/discover/creator/campaign-search';

import CampaignList from '../campaign-admin-list';

const CampaignListView = () => {
  const settings = useSettingsContext();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [filter, setFilter] = useState('');
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

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
        enqueueSnackbar('FAIL', {
          variant: 'error',
        });
      } finally {
        setLoading(false);
      }
    };
    getAllCampaigns();
  }, []);

  const filteredData = !filter ? campaigns : campaigns.filter((elem) => elem?.stage === filter);

  const renderFilter = (
    <>
      <Button
        id="basic-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        startIcon={
          <Iconify
            icon="ep:arrow-down-bold"
            width={12}
            sx={{
              ml: 1,
            }}
          />
        }
      >
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
        onChange={(e, val) => console.log(val)}
      >
        <MenuItem
          onClick={() => {
            setFilter('publish');
            handleClose();
          }}
        >
          Publish
        </MenuItem>
        <MenuItem
          onClick={() => {
            setFilter('draft');
            handleClose();
          }}
        >
          Draft
        </MenuItem>
      </Menu>
    </>
  );

  const renderResultFilter = filter && (
    <Box
      sx={{
        border: (theme) => `solid 1px ${alpha(theme.palette.grey[500], 0.16)}`,
        borderStyle: 'dashed',
        borderRadius: 1,
        p: 1,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="body2">Stage: </Typography>

        <Chip
          size="small"
          label={filter}
          onDelete={() => {
            setFilter();
          }}
        />
      </Stack>
    </Box>
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
        {renderFilter}
      </Stack>

      <Box display="inline-flex" mt={1}>
        {renderResultFilter}
      </Box>

      {loading && <Iconify icon="eos-icons:bubble-loading" />}

      {filteredData.length < 1 ? (
        <Box mt={2}>
          <EmptyContent
            filled
            title="No Data"
            sx={{
              py: 10,
            }}
          />
        </Box>
      ) : (
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
              campaign={campaign}
              onView={() => onView(campaign?.id)}
              onEdit={() => onEdit(campaign?.id)}
              onDelete={() => onDelete(campaign?.id)}
            />
          ))}
        </Box>
      )}
    </Container>
  );
};

export default CampaignListView;
