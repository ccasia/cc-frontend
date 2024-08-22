import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import ListItemText from '@mui/material/ListItemText';
import { Box, Card, Chip, Grid, Typography } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { formatText } from 'src/utils/format-test';

import Image from 'src/components/image';
import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export default function CampaignItem({ campaign, onView, onEdit, onDelete, status, pitchStatus }) {
  const settings = useSettingsContext();
  const { user } = useAuthContext();

  const router = useRouter();

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
    <Stack
      sx={{
        p: (theme) => theme.spacing(2.5, 2.5, 2, 2.5),
      }}
    >
      <ListItemText
        primary={
          <Link component={RouterLink} color="inherit">
            {campaign?.name}
          </Link>
        }
        secondary={`by ${campaign?.brand?.name ?? campaign?.company?.name}`}
        primaryTypographyProps={{
          noWrap: true,
          component: 'span',
          color: 'text.primary',
          typography: 'subtitle1',
        }}
        secondaryTypographyProps={{
          noWrap: true,
          color: 'text.disabled',
          typography: 'caption',
        }}
      />
    </Stack>
  );

  const renderInfo = (
    // <Stack
    //   spacing={1.5}
    //   sx={{
    //     position: 'relative',
    //     p: (theme) => theme.spacing(0, 2.5, 2.5, 2.5),
    //   }}
    // >
    //   {[
    //     {
    //       id: 1,
    //       label:
    //         campaign &&
    //         campaign?.campaignBrief?.interests?.map((e, index) => (
    //           <Chip key={index} size="small" variant="outlined" label={e} color="error" />
    //         )),
    //       icon: <Iconify icon="mdi:company" sx={{ color: 'error.main' }} width={21} />,
    //     },
    //     {
    //       id: 2,
    //       label: (
    //         <Typography variant="caption">
    //           {`${dayjs(campaign?.campaignBrief?.startDate).format('LL')} -
    //             ${dayjs(campaign?.campaignBrief?.endDate).format('LL')}`}
    //         </Typography>
    //       ),
    //       icon: <Iconify icon="solar:clock-circle-bold" sx={{ color: 'info.main' }} width={21} />,
    //     },
    //     // {
    //     //   id: 3,
    //     //   label: (
    //     //     <Chip label={campaign?.status} size="small" color="secondary" variant="outlined" />
    //     //   ),
    //     //   icon: <Iconify icon="lets-icons:status" sx={{ color: 'secondary.main' }} width={21} />,
    //     // },
    //   ].map((item, index) => (
    //     <Stack
    //       key={item.id}
    //       spacing={1}
    //       direction="row"
    //       alignItems="center"
    //       sx={{ typography: 'body2' }}
    //     >
    //       {item.icon}
    //       {item.label}
    //     </Stack>
    //   ))}
    // </Stack>
    <Stack
      spacing={1.5}
      sx={{
        // position: 'relative',
        p: (theme) => theme.spacing(0, 2.5, 2.5, 2.5),
      }}
    >
      <Grid container>
        <Grid item xs={1}>
          <Iconify icon="mingcute:location-fill" sx={{ color: 'error.main' }} />
        </Grid>
        <Grid item xs={11}>
          <Stack gap={1.5} direction="row" alignItems="center" flexWrap="wrap">
            {campaign?.campaignBrief?.interests.map((e, index) => (
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Label color="primary">{e}</Label>
              </Stack>
            ))}
          </Stack>
        </Grid>
      </Grid>

      <Grid container>
        <Grid item xs={1}>
          <Iconify icon="solar:clock-circle-bold" sx={{ color: 'info.main' }} />
        </Grid>
        <Grid item xs={11}>
          <Typography variant="caption" color="text.disabled">
            {`${dayjs(campaign?.campaignBrief?.startDate).format('LL')} - ${dayjs(campaign?.campaignBrief?.endDate).format('LL')}`}
          </Typography>
        </Grid>
      </Grid>
    </Stack>
  );

  return (
    <Box
      component={Card}
      onClick={
        user?.role === 'finance'
          ? () => {
              router.push(paths.dashboard.finance.creatorInvoice(campaign?.id));
            }
          : () => {
              router.push(paths.dashboard.campaign.adminCampaignDetail(campaign?.id));
            }
      }
      // onClick={() => {
      //   router.push(paths.dashboard.campaign.adminCampaignDetail(campaign.id));
      // }}
      sx={{
        cursor: 'pointer',
        transition: '.2s ease',
        '&:hover': {
          bgcolor: (theme) =>
            settings.themeMode === 'light' ? theme.palette.grey[300] : theme.palette.grey[700],
        },
      }}
    >
      {status && (
        <Chip
          label={formatText(campaign?.status)}
          color="primary"
          size="small"
          sx={{
            position: 'absolute',
            top: 15,
            left: 15,
            zIndex: 11,
          }}
        />
      )}

      {pitchStatus && (
        <Chip
          label={formatText(pitchStatus !== 'approved' && 'In review')}
          color="primary"
          size="small"
          sx={{
            position: 'absolute',
            bottom: 15,
            right: 15,
            zIndex: 11,
          }}
        />
      )}

      {/* <Tooltip
        title={
          <>
            <ListItemText
              primary="Status"
              secondary={campaign?.status}
              primaryTypographyProps={{
                variant: 'caption',
              }}
              secondaryTypographyProps={{
                variant: 'caption',
                color: 'text.disabled',
              }}
            />
            <ListItemText
              primary="Stage"
              secondary={campaign?.stage}
              primaryTypographyProps={{
                variant: 'caption',
              }}
              secondaryTypographyProps={{
                variant: 'caption',
                color: 'text.disabled',
              }}
            />
          </>
        }
      >
        <Iconify
          icon="material-symbols:info"
          sx={{
            position: 'absolute',
            top: 15,
            right: 15,
            zIndex: 300,
          }}
        />
      </Tooltip> */}

      {renderImages}

      {renderTexts}

      {renderInfo}
    </Box>
  );
}

CampaignItem.propTypes = {
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
  onView: PropTypes.func,
  campaign: PropTypes.object,
  status: PropTypes.bool,
  pitchStatus: PropTypes.string,
};
