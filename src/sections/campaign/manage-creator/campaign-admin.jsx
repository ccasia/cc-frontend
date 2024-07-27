import React from 'react';
import PropTypes from 'prop-types';

import { Box, Card, Stack, Avatar, Tooltip, IconButton, ListItemText } from '@mui/material';

import Iconify from 'src/components/iconify';

const CampaignAdmin = ({ campaign }) => {
  console.log(campaign);
  return (
    <Box display="flex" gap={2}>
      {campaign?.campaignAdmin.map((elem) => (
        <Box key={elem.id} component={Card} p={2} width={260}>
          <Stack direction="row" alignItems="start" gap={2}>
            <Avatar src={elem.admin.user.photoURL} />
            <Stack alignItems="start">
              <ListItemText
                primary={elem.admin.user.name}
                secondary={elem.admin.designation}
                secondaryTypographyProps={{
                  variant: 'caption',
                  color: 'text.disabled',
                }}
              />
              <Tooltip title="Chat Account Manager">
                <IconButton>
                  <Iconify icon="fluent:chat-12-regular" color="success.main" />
                </IconButton>
                <IconButton>
                  <Iconify icon="ic:outline-email" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>
      ))}
    </Box>
  );
};

export default CampaignAdmin;

CampaignAdmin.propTypes = {
  campaign: PropTypes.object,
};
