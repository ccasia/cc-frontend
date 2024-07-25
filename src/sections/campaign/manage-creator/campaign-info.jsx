import React from 'react';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import {
  Box,
  List,
  Stack,
  Divider,
  ListItem,
  Typography,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

const CampaignInfo = ({ campaign }) => {
  const renderOverview = (
    <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
      <Stack direction="row" spacing={1} alignItems="start">
        <Iconify icon="mdi:clock" width={18} />
        <Stack>
          <ListItemText
            primary="Durations"
            secondary={`${dayjs(campaign?.campaignBrief?.startDate).format('LL')} - ${dayjs(campaign?.campaignBrief?.endDate).format('LL')}`}
            primaryTypographyProps={{
              typography: 'body2',
              color: 'text.secondary',
              mb: 0.5,
            }}
            secondaryTypographyProps={{
              typography: 'subtitle2',
              color: 'text.primary',
              component: 'span',
            }}
          />
        </Stack>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="start">
        <Iconify icon="material-symbols:domain" width={18} />
        <Stack>
          <ListItemText
            primary="Industries"
            secondary={
              <Stack direction="row" spacing={1}>
                {campaign?.campaignBrief?.industries.map((value) => (
                  <Label>{value}</Label>
                ))}
              </Stack>
            }
            primaryTypographyProps={{
              typography: 'body2',
              color: 'text.secondary',
              mb: 0.5,
            }}
            secondaryTypographyProps={{
              typography: 'subtitle2',
              color: 'text.primary',
              component: 'span',
            }}
          />
        </Stack>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="start">
        <Iconify icon="typcn:point-of-interest" width={18} />
        <Stack>
          <ListItemText
            primary="Interests"
            secondary={
              <Stack direction="row" spacing={1}>
                {campaign?.campaignBrief?.interests.map((value) => (
                  <Label>{value}</Label>
                ))}
              </Stack>
            }
            primaryTypographyProps={{
              typography: 'body2',
              color: 'text.secondary',
              mb: 0.5,
            }}
            secondaryTypographyProps={{
              typography: 'subtitle2',
              color: 'text.primary',
              component: 'span',
            }}
          />
        </Stack>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="start">
        <Iconify icon="ci:main-component" width={18} />
        <Stack>
          <ListItemText
            primary="Brand"
            secondary={campaign?.brand?.name ?? campaign?.company?.name}
            primaryTypographyProps={{
              typography: 'body2',
              color: 'text.secondary',
              mb: 0.5,
            }}
            secondaryTypographyProps={{
              typography: 'subtitle2',
              color: 'text.primary',
              component: 'span',
            }}
          />
        </Stack>
      </Stack>
    </Box>
  );

  const renderInformation = (
    <Stack spacing={5}>
      <ListItemText
        primary={campaign?.name}
        secondary={campaign?.description}
        primaryTypographyProps={{
          variant: 'h4',
        }}
        secondaryTypographyProps={{
          variant: 'body2',
        }}
      />
      {/* <Typography variant="h4">{campaign?.name}</Typography> */}
      <Divider
        sx={{
          borderStyle: 'dashed',
        }}
      />

      {renderOverview}

      <Divider
        sx={{
          borderStyle: 'dashed',
        }}
      />

      <Stack direction="column">
        <Typography variant="h5">Objectives</Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <Iconify icon="octicon:dot-16" />
            </ListItemIcon>
            <ListItemText primary="Single-line item" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Iconify icon="octicon:dot-16" />
            </ListItemIcon>
            <ListItemText primary="Single-line item" />
          </ListItem>
        </List>
      </Stack>

      <Divider
        sx={{
          borderStyle: 'dashed',
        }}
      />

      <Stack direction="column">
        <Typography variant="h5">Campaign Do&apos;s</Typography>
        <List>
          {campaign?.campaignBrief?.campaigns_do.map((item, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <Iconify icon="octicon:dot-16" sx={{ color: 'success.main' }} />
              </ListItemIcon>
              <ListItemText primary={item.value} />
            </ListItem>
          ))}
        </List>
      </Stack>

      <Stack direction="column">
        <Typography variant="h5">Campaign Dont&apos;s</Typography>
        <List>
          {campaign?.campaignBrief?.campaigns_dont.map((item, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <Iconify icon="octicon:dot-16" sx={{ color: 'error.main' }} />
              </ListItemIcon>
              <ListItemText primary={item.value} />
            </ListItem>
          ))}
        </List>
      </Stack>
    </Stack>
  );
  return (
    <Stack spacing={2} maxWidth={800} mx="auto">
      {renderInformation}
    </Stack>
  );
};

export default CampaignInfo;

CampaignInfo.propTypes = {
  campaign: PropTypes.object,
};
