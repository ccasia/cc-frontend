import dayjs from 'dayjs';
import React from 'react';
import PropTypes from 'prop-types';
// import { Link } from 'react-router-dom';

import { Box, Card, Link, Stack, Typography, ListItemText } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import Image from 'src/components/image';
import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

import CampaignModal from '../discover/creator/campaign-modal';

const CampaignItem = ({ campaign, onClick, pitchStatus, type }) => {
  const campaignInfo = useBoolean();

  const renderImages = (
    <Stack
      spacing={0.5}
      direction="row"
      sx={{
        p: (theme) => theme.spacing(1, 1, 0, 1),
      }}
    >
      <Stack flexGrow={1} sx={{ position: 'relative' }}>
        <Image
          alt="/test.jpeg"
          src={campaign?.campaignBrief?.images[0]}
          sx={{ borderRadius: 1, height: 164, width: 1 }}
        />
      </Stack>
      <Stack spacing={0.5}>
        <Image
          alt="/test.jpeg"
          src={campaign?.campaignBrief?.images[1]}
          ratio="1/1"
          sx={{ borderRadius: 1, width: 80 }}
        />
        <Image
          alt="/test.jpeg"
          src={campaign?.campaignBrief?.images[2]}
          ratio="1/1"
          sx={{ borderRadius: 1, width: 80 }}
        />
      </Stack>
    </Stack>
  );

  const renderText = (
    <ListItemText
      sx={{
        p: (theme) => theme.spacing(2.5, 2.5, 2, 2.5),
      }}
      primary={
        <Link
          component="a"
          color="inherit"
          sx={{
            cursor: 'pointer',
          }}
        >
          {campaign?.name}
        </Link>
      }
      primaryTypographyProps={{
        noWrap: true,
        component: 'a',
        color: 'text.primary',
        typography: 'subtitle1',
      }}
    />
  );

  const renderInfo = (
    <Stack
      spacing={1.5}
      sx={{
        position: 'relative',
        p: (theme) => theme.spacing(0, 2.5, 2.5, 2.5),
      }}
    >
      {[
        {
          label: campaign?.campaignBrief?.interests.map((e, index) => (
            <Label key={index} variant="filled" size="small" color="primary">
              {e}
            </Label>
          )),
          icon: <Iconify icon="material-symbols:interests-outline-rounded" color="error.main" />,
        },
        {
          label: (
            <Typography variant="caption" color="text.disabled">
              {`${dayjs(campaign?.campaignBrief?.startDate).format('LL')} - ${dayjs(campaign?.campaignBrief?.endDate).format('LL')}`}
            </Typography>
          ),
          icon: <Iconify icon="solar:clock-circle-bold" sx={{ color: 'info.main' }} />,
        },
      ].map((item, index) => (
        <Stack
          key={index}
          spacing={1}
          direction="row"
          alignItems="center"
          sx={{ typography: 'body2' }}
        >
          {item.icon}
          {item.label}
        </Stack>
      ))}
    </Stack>
  );

  return (
    <>
      <Box
        component={Card}
        onClick={type === 'my-campaign' ? onClick : campaignInfo.onTrue}
        sx={{
          cursor: 'pointer',
        }}
      >
        {renderImages}
        {renderText}
        {renderInfo}
      </Box>
      <CampaignModal
        open={campaignInfo.value}
        handleClose={campaignInfo.onFalse}
        campaign={campaign}
      />
    </>
  );
};

export default CampaignItem;

CampaignItem.propTypes = {
  campaign: PropTypes.object,
  onClick: PropTypes.func,
  pitchStatus: PropTypes.string,
  type: PropTypes.string,
};
