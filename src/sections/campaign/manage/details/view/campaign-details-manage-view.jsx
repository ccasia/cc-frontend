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
  Tooltip,
  ListItem,
  Container,
  Typography,
  IconButton,
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

import { EditBrand } from '../../edit/EditBrand';
import { EditTimeline } from '../../edit/EditTimeline';
import { EditDosAndDonts } from '../../edit/EditDosAndDonts';
import { EditCampaignInfo } from '../../edit/EditCampaignInfo';
import { EditRequirements } from '../../edit/EditRequirements';

const EditButton = ({ tooltip, onClick }) => (
  <Stack direction="row" spacing={1} position="absolute" top={10} right={10} alignItems="center">
    <Tooltip title={tooltip} arrow>
      <IconButton onClick={onClick}>
        <Iconify icon="lucide:edit" />
      </IconButton>
    </Tooltip>
  </Stack>
);

EditButton.propTypes = {
  tooltip: PropTypes.string,
  onClick: PropTypes.func,
};

const CampaignDetailManageView = ({ id }) => {
  const [campaign, setCampaign] = useState();
  const [loading, setLoading] = useState(true);

  const theme = useTheme();
  const smUp = useResponsive('down', 'sm');

  const [open, setOpen] = useState({
    campaignInfo: false,
    campaignBrand: false,
    campaignCompany: false,
    dosAndDonts: false,
    campaignRequirements: false,
    timeline: false,
  });

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

  const onClose = (data) => {
    setOpen((prev) => ({
      ...prev,
      [data]: false,
    }));
  };

  const formatDays = (days) => (days === 1 ? 'day' : 'days');

  const renderCampaignInformation = (
    <>
      <Box p={2} component={Card} position="relative">
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

        <Stack
          direction="row"
          spacing={1}
          position="absolute"
          top={10}
          right={10}
          alignItems="center"
        >
          {!smUp && (
            <>
              <Chip label={campaign?.stage} size="small" />
              <Chip label={campaign?.status} size="small" color="primary" />
            </>
          )}
          <Tooltip title="Edit Campaign Information" arrow>
            <IconButton
              onClick={() =>
                setOpen((prev) => ({
                  ...prev,
                  campaignInfo: true,
                }))
              }
            >
              <Iconify icon="lucide:edit" />
            </IconButton>
          </Tooltip>
        </Stack>

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
      <EditCampaignInfo open={open} campaign={campaign} onClose={onClose} />
    </>
  );

  const renderBrand = (
    <>
      <Box component={Card} p={2}>
        <Typography variant="h5">Brand Information</Typography>

        <EditButton
          tooltip="Edit Brand"
          onClick={() =>
            setOpen((prev) => ({
              ...prev,
              campaignBrand: true,
            }))
          }
        />

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
      <EditBrand open={open} campaign={campaign} onClose={onClose} />
    </>
  );

  const renderCompany = (
    <>
      <Box component={Card} p={2}>
        <Typography variant="h5">Brand Information</Typography>
        <EditButton
          tooltip="Edit Company"
          onClick={() =>
            setOpen((prev) => ({
              ...prev,
              campaignBrand: true,
            }))
          }
        />
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
      <EditBrand open={open} campaign={campaign} onClose={onClose} />
    </>
  );

  const renderDosAndDonts = (
    <>
      <Box component={Card} p={2}>
        <Typography variant="h5">Dos & Don&apos;ts</Typography>
        <EditButton
          tooltip="Edit Dos and Don'ts"
          onClick={() =>
            setOpen((prev) => ({
              ...prev,
              dosAndDonts: true,
            }))
          }
        />
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
      <EditDosAndDonts open={open} campaign={campaign} onClose={onClose} />
    </>
  );

  const renderRequirement = (
    <>
      <Box component={Card} p={2}>
        <Typography variant="h5">Requirements</Typography>
        <EditButton
          tooltip="Edit Requirements"
          onClick={() =>
            setOpen((prev) => ({
              ...prev,
              campaignRequirements: true,
            }))
          }
        />
        <Stack spacing={1} mt={1}>
          <ListItemText
            primary="Gender"
            secondary={
              campaign?.campaignRequirement?.gender?.map((e, index) => (
                <Chip
                  key={index}
                  label={formatText(e)}
                  size="small"
                  sx={{
                    mr: 1,
                  }}
                  color="primary"
                />
              )) || null
            }
          />
          <ListItemText
            primary="Age"
            secondary={
              campaign?.campaignRequirement?.age?.map((e, index) => (
                <Chip
                  key={index}
                  label={formatText(e)}
                  size="small"
                  sx={{
                    mr: 1,
                  }}
                  color="primary"
                />
              )) || null
            }
          />
          <ListItemText
            primary="Geo Location"
            secondary={
              campaign?.campaignRequirement?.geoLocation?.map((e, index) => (
                <Chip
                  key={index}
                  label={formatText(e)}
                  size="small"
                  sx={{
                    mr: 1,
                  }}
                  color="primary"
                />
              )) || null
            }
          />
          <ListItemText
            primary="Language"
            secondary={
              campaign?.campaignRequirement?.language?.map((e, index) => (
                <Chip
                  key={index}
                  label={formatText(e)}
                  size="small"
                  sx={{
                    mr: 1,
                  }}
                  color="primary"
                />
              )) || null
            }
          />
          <ListItemText
            primary="Creator Persona"
            secondary={
              campaign?.campaignRequirement?.creator_persona?.map((e, index) => (
                <Chip
                  key={index}
                  label={formatText(e)}
                  size="small"
                  sx={{
                    mr: 1,
                  }}
                  color="primary"
                />
              )) || null
            }
          />
          <ListItemText
            primary="User Persona"
            secondary={formatText(campaign?.campaignRequirement?.user_persona)}
          />
        </Stack>
      </Box>
      <EditRequirements open={open} campaign={campaign} onClose={onClose} />
    </>
  );

  const renderTimeline = (
    <>
      <Box component={Card} p={2}>
        <Typography variant="h5">Timeline</Typography>
        <EditButton
          tooltip="Edit Timeline"
          onClick={() =>
            setOpen((prev) => ({
              ...prev,
              timeline: true,
            }))
          }
        />
        <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2} mt={1}>
          <ListItemText
            primary="Open For Pitch"
            secondary={`${
              campaign?.customCampaignTimeline?.openForPitch ??
              campaign?.defaultCampaignTimeline?.openForPitch
            }
            ${formatDays(
              campaign?.customCampaignTimeline?.openForPitch ??
                campaign?.defaultCampaignTimeline?.openForPitch
            )}`}
          />
          <ListItemText
            primary="Shortlist Creator"
            secondary={`${
              campaign?.customCampaignTimeline?.shortlistCreator ??
              campaign?.defaultCampaignTimeline?.shortlistCreator
            }
            ${formatDays(
              campaign?.customCampaignTimeline?.shortlistCreator ??
                campaign?.defaultCampaignTimeline?.shortlistCreator
            )}`}
          />
          <ListItemText
            primary="First Draft"
            secondary={`${
              campaign?.customCampaignTimeline?.firstDraft ??
              campaign?.defaultCampaignTimeline?.firstDraft
            }
            ${formatDays(
              campaign?.customCampaignTimeline?.firstDraft ??
                campaign?.defaultCampaignTimeline?.firstDraft
            )}`}
          />
          <ListItemText
            primary="Final Draft"
            secondary={`${
              campaign?.customCampaignTimeline?.finalDraft ??
              campaign?.defaultCampaignTimeline?.finalDraft
            }
            ${formatDays(
              campaign?.customCampaignTimeline?.finalDraft ??
                campaign?.defaultCampaignTimeline?.finalDraft
            )}`}
          />
          <ListItemText
            primary="Feedback First Draft"
            secondary={`${
              campaign?.customCampaignTimeline?.feedBackFirstDraft ??
              campaign?.defaultCampaignTimeline?.feedBackFirstDraft
            }
            ${formatDays(
              campaign?.customCampaignTimeline?.feedBackFirstDraft ??
                campaign?.defaultCampaignTimeline?.feedBackFirstDraft
            )}`}
          />
          <ListItemText
            primary="Feedback Final Draft"
            secondary={`${
              campaign?.customCampaignTimeline?.feedBackFinalDraft ??
              campaign?.defaultCampaignTimeline?.feedBackFinalDraft
            }
            ${formatDays(
              campaign?.customCampaignTimeline?.feedBackFinalDraft ??
                campaign?.defaultCampaignTimeline?.feedBackFinalDraft
            )}`}
          />
          <ListItemText
            primary="Filter Pitch"
            secondary={`${
              campaign?.customCampaignTimeline?.filterPitch ??
              campaign?.defaultCampaignTimeline?.filterPitch
            }
            ${formatDays(
              campaign?.customCampaignTimeline?.filterPitch ??
                campaign?.defaultCampaignTimeline?.filterPitch
            )}`}
          />
          <ListItemText
            primary="Agreement Sign"
            secondary={`${
              campaign?.customCampaignTimeline?.agreementSign ??
              campaign?.defaultCampaignTimeline?.agreementSign
            }
            ${formatDays(
              campaign?.customCampaignTimeline?.agreementSign ??
                campaign?.defaultCampaignTimeline?.agreementSign
            )}`}
          />
          <ListItemText
            primary="QC"
            secondary={`${campaign?.customCampaignTimeline?.qc ?? campaign?.defaultCampaignTimeline?.qc}
                ${formatDays(
                  campaign?.customCampaignTimeline?.qc ?? campaign?.defaultCampaignTimeline?.qc
                )}`}
          />
          <ListItemText
            primary="Posting"
            secondary={`${
              campaign?.customCampaignTimeline?.posting ??
              campaign?.defaultCampaignTimeline?.posting
            }
            ${formatDays(
              campaign?.customCampaignTimeline?.posting ??
                campaign?.defaultCampaignTimeline?.posting
            )}`}
          />
        </Box>
      </Box>
      <EditTimeline open={open} campaign={campaign} onClose={onClose} />
    </>
  );

  const renderAdminManager = (
    <Box component={Card} p={2}>
      <Typography variant="h5">Admin Manager</Typography>
      <List>
        {campaign?.CampaignAdmin?.map((item, index) => (
          <ListItem>
            <ListItemText primary={`${index + 1}. ${item?.admin?.user?.name}`} />
          </ListItem>
        ))}
      </List>
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
                {renderAdminManager}
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

export default withPermission(['read'], 'campaign', CampaignDetailManageView);

CampaignDetailManageView.propTypes = {
  id: PropTypes.string,
};
