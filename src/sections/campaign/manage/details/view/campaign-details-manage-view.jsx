import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { useTheme } from '@emotion/react';
import { RiseLoader } from 'react-spinners';
import { enqueueSnackbar } from 'notistack';
import { useState, useEffect } from 'react';

import {
  Box,
  Card,
  Chip,
  Grid,
  List,
  Stack,
  Divider,
  ListItem,
  Container,
  Typography,
  ListItemText,
  ListItemIcon,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useResponsive } from 'src/hooks/use-responsive';

import { formatText } from 'src/utils/format-test';
import axiosInstance, { endpoints } from 'src/utils/axios';

import withPermission from 'src/auth/guard/withPermissions';

import Iconify from 'src/components/iconify';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

const CampaignDetailManageView = ({ id }) => {
  const [campaign, setCampaign] = useState();
  const [loading, setLoading] = useState(true);
  //   const router = useRouter();
  const theme = useTheme();
  const smUp = useResponsive('down', 'sm');

  useEffect(() => {
    const getCampaign = async () => {
      try {
        const res = await axiosInstance.get(endpoints.campaign.getCampaignById(id));
        setCampaign(res.data);
      } catch (error) {
        enqueueSnackbar('Error', {
          variant: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    setTimeout(() => {
      getCampaign();
    }, 1000);
  }, [id]);

  const renderCampaignInformation = (
    <Box p={2} component={Card}>
      <ListItemText
        primary={campaign?.name}
        secondary={campaign?.description}
        primaryTypographyProps={{
          component: 'span',
          typography: 'h5',
        }}
        secondaryTypographyProps={{
          typography: 'subtitle2',
        }}
      />
      {!smUp && (
        <Stack direction="row" spacing={1} position="absolute" top={10} right={10}>
          <Chip label={campaign?.stage} size="small" />
          <Chip label={campaign?.status} size="small" color="primary" />
        </Stack>
      )}

      <Stack mt={2} color="text.disabled">
        <Typography variant="caption">
          Start date: {dayjs(campaign?.campaignBrief?.startDate).format('LL')}
        </Typography>
        <Typography variant="caption">
          End date: {dayjs(campaign?.campaignBrief?.endDate).format('LL')}
        </Typography>
      </Stack>

      <Divider
        sx={{
          borderStyle: 'dashed',
          my: 2,
        }}
      />

      <Stack spacing={1}>
        <Typography variant="subtitle1">Interests</Typography>
        <Stack direction="row" spacing={1}>
          {campaign?.campaignBrief?.interests.map((interest) => (
            <Chip label={interest} size="small" color="secondary" />
          ))}
        </Stack>
      </Stack>

      <Stack spacing={1} mt={2}>
        <Typography variant="subtitle1">Industries</Typography>
        <Stack direction="row" spacing={1}>
          {campaign?.campaignBrief?.industries.map((industry) => (
            <Chip label={industry} size="small" color="secondary" />
          ))}
        </Stack>
      </Stack>
    </Box>
  );

  const renderDosAndDonts = (
    <Box component={Card} p={2}>
      <Typography variant="h5">Do&apos;s & Donts&apos;</Typography>
      <Divider
        sx={{
          borderStyle: 'dashed',
          my: 1,
        }}
      />
      <Stack>
        <Typography variant="subtitle1">Dos</Typography>
        <List>
          {campaign?.campaignBrief?.campaigns_do.map((elem) => (
            <ListItem>
              <ListItemIcon>
                <Iconify
                  icon="octicon:dot-24"
                  sx={{
                    color: theme.palette.primary.main,
                  }}
                />
              </ListItemIcon>
              <ListItemText primary={elem?.value} />
            </ListItem>
          ))}
        </List>
      </Stack>
      <Stack mt={2}>
        <Typography variant="subtitle1">Donts</Typography>
        <List>
          {campaign?.campaignBrief?.campaigns_dont.map((elem) => (
            <ListItem>
              <ListItemIcon>
                <Iconify
                  icon="octicon:dot-24"
                  sx={{
                    color: theme.palette.error.main,
                  }}
                />
              </ListItemIcon>
              <ListItemText primary={elem?.value} />
            </ListItem>
          ))}
        </List>
      </Stack>
    </Box>
  );

  const renderRequirement = (
    <Box component={Card} p={2}>
      <Typography variant="h5">Requirements</Typography>
      <List>
        <ListItemText
          primary="Gender"
          secondary={formatText(campaign?.campaignRequirement?.gender)}
        />
        <ListItemText primary="Age" secondary={formatText(campaign?.campaignRequirement?.age)} />
        <ListItemText
          primary="Geo Location"
          secondary={formatText(campaign?.campaignRequirement?.geoLocation)}
        />
        <ListItemText
          primary="Language"
          secondary={formatText(campaign?.campaignRequirement?.language)}
        />
        <ListItemText
          primary="Creator Persona"
          secondary={formatText(campaign?.campaignRequirement?.creator_persona)}
        />
        <ListItemText
          primary="User Persona"
          secondary={formatText(campaign?.campaignRequirement?.user_persona)}
        />
      </List>
    </Box>
  );

  const renderTimeline = (
    <Box component={Card} p={2}>
      <Typography variant="h5">Timeline</Typography>
      <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2} mt={1}>
        <ListItemText
          primary="Open For Pitch"
          secondary={`${campaign?.customCampaignTimeline?.openForPitch} days`}
        />
        <ListItemText
          primary="Shortlist Creator"
          secondary={`${campaign?.customCampaignTimeline?.shortlistCreator} days`}
        />
        <ListItemText
          primary="First Draft"
          secondary={`${campaign?.customCampaignTimeline?.firstDraft} days`}
        />
        <ListItemText
          primary="Final Draft"
          secondary={`${campaign?.customCampaignTimeline?.finalDraft} days`}
        />
        <ListItemText
          primary="Feedback First Draft"
          secondary={`${campaign?.customCampaignTimeline?.feedBackFirstDraft} days`}
        />
        <ListItemText
          primary="Feedback Final Draft"
          secondary={`${campaign?.customCampaignTimeline?.feedBackFinalDraft} days`}
        />
        <ListItemText
          primary="Filter Pitch"
          secondary={`${campaign?.customCampaignTimeline?.filterPitch} days`}
        />
        <ListItemText
          primary="Agreement Sign"
          secondary={`${campaign?.customCampaignTimeline?.agreementSign} days`}
        />
        <ListItemText primary="QC" secondary={`${campaign?.customCampaignTimeline?.qc} days`} />
        <ListItemText
          primary="Posting"
          secondary={`${campaign?.customCampaignTimeline?.posting} days`}
        />
      </Box>
    </Box>
  );

  const renderBrand = (
    <Box component={Card} p={2}>
      <Typography variant="h5">Brand Information</Typography>
      <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2} mt={2}>
        {campaign?.brand &&
          Object.keys(campaign?.brand)
            .filter(
              (e) =>
                ![
                  'id',
                  'createdAt',
                  'updatedAt',
                  'companyId',
                  'objectives',
                  'logo',
                  'service_name',
                ].includes(e)
            )
            .map(
              (e) =>
                campaign?.brand[e] && (
                  <ListItemText primary={formatText(e)} secondary={campaign?.brand[e]} />
                )
            )}
      </Box>
    </Box>
  );

  const renderCompany = (
    <Box component={Card} p={2}>
      <Typography variant="h5">Brand Information</Typography>
      <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2} mt={2}>
        {campaign?.company &&
          Object.keys(campaign?.company)
            .filter((e) => !['id', 'createdAt', 'updatedAt', 'objectives', 'logo'].includes(e))
            .map(
              (e) =>
                campaign?.company[e] && (
                  <ListItemText primary={formatText(e)} secondary={campaign?.company[e]} />
                )
            )}
      </Box>
    </Box>
  );

  return (
    <Container maxWidth="lg">
      <CustomBreadcrumbs
        heading="Detail"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          {
            name: 'Campaign',
            href: paths.dashboard.campaign.manage,
          },
          { name: 'Detail' },
          { name: id },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <Grid container spacing={2}>
        {!loading ? (
          <>
            <Grid item xs={12} md={8}>
              <Stack spacing={2}>
                {renderCampaignInformation}
                {campaign?.brand ? renderBrand : renderCompany}
                {renderDosAndDonts}
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack spacing={2}>
                {renderRequirement}
                {renderTimeline}
              </Stack>
            </Grid>
          </>
        ) : (
          <Grid item xs={12} textAlign="center" mt={20}>
            <RiseLoader color="#36d7b7" />
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default withPermission(['view'], 'campaign', CampaignDetailManageView);

CampaignDetailManageView.propTypes = {
  id: PropTypes.string,
};
