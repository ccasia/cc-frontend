import React from 'react';
import PropTypes from 'prop-types';

import { Box, Card, Stack, ListItemText } from '@mui/material';

import Label from 'src/components/label';

const CampaignRequirement = ({ campaign }) => {
  const requirement = campaign?.campaignRequirement;

  return (
    <Box
      maxWidth={800}
      display="grid"
      gridTemplateColumns="repeat(3, 1fr)"
      component={Card}
      p={4}
      mx="auto"
      gap={2}
    >
      <ListItemText
        primary="Age"
        secondary={
          <Stack direction="row" spacing={1}>
            {requirement.age.map((value) => (
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
      <ListItemText
        primary="Gender"
        secondary={
          <Stack direction="row" spacing={1}>
            {requirement.gender.map((value) => (
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
      <ListItemText
        primary="Geo Location"
        secondary={
          <Stack direction="row" spacing={1}>
            {requirement.geoLocation.map((value) => (
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
      <ListItemText
        primary="Languages"
        secondary={
          <Stack direction="row" spacing={1}>
            {requirement.language.map((value) => (
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
      <ListItemText
        primary="Creator Persona"
        secondary={
          <Stack direction="row" spacing={1}>
            {requirement.creator_persona.map((value) => (
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
      <ListItemText
        primary="Gender"
        secondary={requirement.user_persona}
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
    </Box>
  );
};

export default CampaignRequirement;

CampaignRequirement.propTypes = {
  campaign: PropTypes.object,
};
