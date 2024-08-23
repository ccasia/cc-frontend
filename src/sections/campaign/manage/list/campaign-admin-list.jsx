import dayjs from 'dayjs';
import { useState } from 'react';
import PropTypes from 'prop-types';

import { Box, Card, Chip, Stack, Divider, MenuItem, IconButton, Typography } from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';

import { formatText } from 'src/utils/format-test';

import { useAuthContext } from 'src/auth/hooks';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { usePopover } from 'src/components/custom-popover';
import CustomPopover from 'src/components/custom-popover/custom-popover';

import { CampaignLog } from './CampaignLog';

const CampaignList = ({ campaign, onView, onEdit, onDelete }) => {
  const smUp = useResponsive('up', 'sm');

  const { user } = useAuthContext();
  const popover = usePopover();

  const [campaignLogIsOpen, setCampaignLogIsOpen] = useState(false);
  const onCloseCampaignLog = () => setCampaignLogIsOpen(false);

  return (
    <>
      <Card
        sx={{
          p: 2,
        }}
      >
        {smUp && (
          <Box
            sx={{
              p: 0.5,
              height: 200,
            }}
          >
            <img
              src={campaign?.campaignBrief?.images[0]}
              alt="test"
              width="100%"
              height="100%"
              style={{ borderRadius: 10, objectFit: 'cover' }}
            />
          </Box>
        )}

        <Box
          sx={{
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            mt: 2,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            {campaign?.stage === 'publish' ? (
              <Label color="primary">{campaign?.stage}</Label>
            ) : (
              <Label color="warning">{campaign?.stage}</Label>
            )}
            <Typography variant="caption" color="text.disabled">
              Created on {dayjs(campaign?.createdAt).format('LL')}
            </Typography>
          </Stack>

          <Stack gap={1} flexGrow={1}>
            <Typography variant="subtitle2">{campaign?.name}</Typography>
            <Typography variant="body2" color="text.disabled" textOverflow="ellipsis">
              {campaign?.description}
            </Typography>
          </Stack>

          <Divider
            sx={{
              borderStyle: 'dashed',
            }}
          />

          {/* Brand information */}
          <Box display="flex" flexDirection="column" gap={1.5}>
            <Stack direction="row" alignItems="center" spacing={1} color="text.disabled">
              <Iconify icon="octicon:organization-24" width={16} />
              <Typography variant="caption">
                {campaign?.company?.name || campaign?.brand?.name}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1} color="text.disabled">
              <Iconify icon="ph:clock-bold" width={16} />
              <Typography variant="caption" textOverflow="ellipsis">
                {`${dayjs(campaign?.campaignBrief?.startDate).format('LL')} - ${dayjs(campaign?.campaignBrief?.endDate).format('LL')}`}
              </Typography>
            </Stack>
          </Box>

          <IconButton
            sx={{
              alignSelf: 'flex-start',
              position: 'absolute',
              bottom: 10,
              right: 10,
            }}
            onClick={popover.onOpen}
          >
            <Iconify icon="zondicons:dots-horizontal-triple" width={18} />
          </IconButton>
        </Box>

        <Chip
          label={formatText(campaign?.status)}
          color="primary"
          size="small"
          sx={{
            position: 'absolute',
            top: 30,
            left: 30,
          }}
        />
      </Card>

      <CustomPopover
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
          <Iconify icon="material-symbols:bookmark-manager" />
          Manage
        </MenuItem>
        <MenuItem
          onClick={() => {
            popover.onClose();
            setCampaignLogIsOpen(true);
          }}
        >
          <Iconify icon="material-symbols:note-rounded" />
          View Log
        </MenuItem>
        {user?.role === 'superadmin' && (
          <MenuItem
            onClick={() => {
              popover.onClose();
              // setOpenDeleteModal(true);
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete
          </MenuItem>
        )}
      </CustomPopover>
      <CampaignLog open={campaignLogIsOpen} campaign={campaign} onClose={onCloseCampaignLog} />
    </>
  );
};

export default CampaignList;

CampaignList.propTypes = {
  campaign: PropTypes.object,
  onView: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};
