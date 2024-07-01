import dayjs from 'dayjs';
import { useState } from 'react';
import PropTypes from 'prop-types';

import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import ListItemText from '@mui/material/ListItemText';
import { Chip, Button, Typography } from '@mui/material';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';

import CampaignPitchOptionsModal from './campaign-pitch-options-modal';

// ----------------------------------------------------------------------

export default function CampaignItem({ campaign }) {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

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

  const renderTexts = (
    <ListItemText
      sx={{
        p: (theme) => theme.spacing(2.5, 2.5, 2, 2.5),
      }}
      primary={
        <Link
          component="a"
          color="inherit"
          onClick={() => setOpen(true)}
          sx={{
            cursor: 'pointer',
          }}
        >
          {campaign?.name}
        </Link>
      }
      primaryTypographyProps={{
        mt: 1,
        noWrap: true,
        component: 'span',
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
      {/* <IconButton onClick={popover.onOpen} sx={{ position: 'absolute', bottom: 20, right: 8 }}>
        <Iconify icon="eva:more-vertical-fill" />
      </IconButton> */}

      <Button
        sx={{ position: 'absolute', bottom: 10, right: 10 }}
        variant="contained"
        size="small"
        startIcon={<Iconify icon="ph:paper-plane-tilt-bold" width={20} />}
        onClick={() => setOpen(true)}
      >
        Pitch
      </Button>

      {[
        {
          label: campaign?.campaignBrief?.industries.map((e, index) => (
            <Chip key={index} label={e} variant="filled" size="small" color="primary" />
          )),
          icon: <Iconify icon="mingcute:location-fill" sx={{ color: 'error.main' }} />,
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
      <Card>
        {renderImages}

        {renderTexts}

        {renderInfo}
      </Card>

      {/* <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
        sx={{ width: 140 }}
      >
        <MenuItem
          onClick={() => {
            popover.onClose();
            onView();
          }}
        >
          <Iconify icon="solar:eye-bold" />
          View
        </MenuItem>

        <MenuItem
          onClick={() => {
            popover.onClose();
            onEdit();
          }}
        >
          <Iconify icon="solar:pen-bold" />
          Edit
        </MenuItem>

        <MenuItem
          onClick={() => {
            popover.onClose();
            onDelete();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          Delete
        </MenuItem>
      </CustomPopover> */}
      {/* <CampaignModal open={open} handleClose={handleClose} campaign={campaign} /> */}
      <CampaignPitchOptionsModal open={open} handleClose={handleClose} campaign={campaign} />
    </>
  );
}

CampaignItem.propTypes = {
  campaign: PropTypes.object,
};
