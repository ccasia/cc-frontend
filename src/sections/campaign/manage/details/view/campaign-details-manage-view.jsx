import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useTheme } from '@emotion/react';
import { useMemo, useState } from 'react';
import { Page, Document } from 'react-pdf';
import { enqueueSnackbar } from 'notistack';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Grid,
  List,
  Link,
  Stack,
  Avatar,
  Dialog,
  Button,
  Divider,
  Tooltip,
  ListItem,
  Container,
  Typography,
  IconButton,
  DialogTitle,
  ListItemText,
  ListItemIcon,
  DialogActions,
  DialogContent,
  CircularProgress,
  DialogContentText,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import { useGetCampaignById } from 'src/hooks/use-get-campaign-by-id';

import { formatText } from 'src/utils/format-test';
import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import withPermission from 'src/auth/guard/withPermissions';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Carousel from 'src/components/carousel/carousel';
import { MultiFilePreview } from 'src/components/upload';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import { EditTimeline } from './EditTimeline';
import EditReferences from './EditReferences';
import EditAttachments from './EditAttachment';
import { EditDosAndDonts } from './EditDosAndDonts';
import EditCampaignAdmin from './EditCampaignAdmin';
import { EditCampaignInfo } from './EditCampaignInfo';
import { EditRequirements } from './EditRequirements';
import EditCampaignImages from './EditCampaignImages';
import { EditBrandOrCompany } from './EditBrandOrCompany';
import EditAgreementTemplate from './EditAgreementTemplate';

const EditButton = ({ tooltip, onClick }) => (
  <Stack direction="row" spacing={1} position="absolute" top={10} right={10} alignItems="center">
    <Tooltip title={tooltip} arrow>
      <IconButton
        onClick={onClick}
        sx={{
          '&.MuiIconButton-root': {
            // bgcolor: (theme) => theme.palette.success.main,
            color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
            border: 1,
          },
        }}
      >
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
  const { campaign, campaignLoading, mutate: campaignMutate } = useGetCampaignById(id);

  const [pages, setPages] = useState();

  const campaignStartDate = useMemo(
    () => !campaignLoading && campaign?.campaignBrief?.startDate,
    [campaign, campaignLoading]
  );

  const { user } = useAuthContext();

  const modalConfirm = useBoolean();

  const loadingButton = useBoolean();

  const theme = useTheme();
  const smUp = useResponsive('down', 'sm');

  const [open, setOpen] = useState({
    campaignInfo: false,
    campaignBrand: false,
    campaignCompany: false,
    dosAndDonts: false,
    campaignRequirements: false,
    timeline: false,
    campaignAgreement: false,
    campaignImages: false,
    campaignAdmin: false,
    campaignAttachments: false,
    campaignReferences: false,
  });

  const onClose = (data) => {
    setOpen((prev) => ({
      ...prev,
      [data]: false,
    }));
  };

  const refreshPdf = () => {
    mutate(endpoints.campaign.getCampaignById(id));
  };

  const isEditable = campaign?.status !== 'ACTIVE';

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );
  const handleChangeStatus = async (status) => {
    if (status === 'active' && dayjs(campaign?.campaignBrief?.endDate).isBefore(dayjs, 'date')) {
      enqueueSnackbar('You cannot publish a campaign that is already end.', {
        variant: 'error',
      });
      return;
    }
    try {
      loadingButton.onTrue();
      const res = await axiosInstance.patch(endpoints.campaign.changeStatus(campaign?.id), {
        status,
      });

      if (res?.data?.status === 'ACTIVE') {
        enqueueSnackbar('Campaign is now live!');
      } else if (res?.data?.status === 'SCHEDULED') {
        enqueueSnackbar('Campaign is scheduled!');
      } else {
        enqueueSnackbar('Campaign is paused');
      }

      mutate(endpoints.campaign.getCampaignById(id), (currentData) => {
        const newCampaign = {
          ...currentData,
          status: res?.status,
        };
        return {
          ...currentData,
          newCampaign,
        };
      });

      loadingButton.onFalse();
    } catch (error) {
      enqueueSnackbar('Failed to change status', {
        variant: 'error',
      });
      loadingButton.onFalse();
    }
  };

  const closeCampaign = async () => {
    try {
      const res = await axiosInstance.patch(endpoints.campaign.closeCampaign(id));
      enqueueSnackbar(res?.data?.message);

      mutate(endpoints.campaign.getCampaignById(id), (currentData) => {
        const newCampaign = {
          ...currentData,
          status: 'past',
        };
        return {
          ...currentData,
          newCampaign,
        };
      });
      modalConfirm.onFalse();
    } catch (error) {
      enqueueSnackbar('Error to close campaign', {
        variant: 'error',
      });
    }
  };

  const statusColor = useMemo(() => {
    if (campaign?.status === 'PAUSED') {
      return 'warning';
    }
    if (campaign?.status === 'DRAFT' || campaign?.status === 'SCHEDULED') {
      return 'info';
    }
    return 'success';
  }, [campaign]);

  const renderCampaignInformation = (
    <>
      <Box p={2} component={Card} position="relative">
        <Typography variant="h5">Campaign General Information</Typography>
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
          {!smUp && <Chip label={campaign?.status} size="small" color={statusColor} />}
          {isEditable && (
            <Tooltip title="Edit Campaign Information" disabled={isDisabled} arrow>
              <IconButton
                sx={{
                  '&.MuiIconButton-root': {
                    // bgcolor: theme.palette.success.main,
                    border: 1,
                    color: theme.palette.mode === 'light' ? 'black' : 'white',
                  },
                }}
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
          )}
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
          <Typography variant="subtitle1">Industries</Typography>
          <Stack direction="row" spacing={1}>
            <Label color="secondary">{campaign?.campaignBrief?.industries}</Label>
          </Stack>
        </Stack>
      </Box>

      <EditCampaignInfo open={open} campaign={campaign} onClose={onClose} />
    </>
  );

  const renderBrand = (
    <>
      <Box component={Card} p={2}>
        <Typography variant="h5">Brand</Typography>

        {isEditable && (
          <EditButton
            tooltip="Edit Brand"
            disabled={isDisabled}
            onClick={() =>
              setOpen((prev) => ({
                ...prev,
                campaignBrand: true,
              }))
            }
          />
        )}

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
                (e, index) =>
                  campaign?.brand[e] && (
                    <ListItemText
                      key={index}
                      primary={formatText(e)}
                      secondary={
                        typeof campaign?.brand[e] === 'object' ? (
                          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                            {campaign?.brand[e].map((val, index2) => (
                              <Label key={index2}>{val}</Label>
                            ))}
                          </Stack>
                        ) : (
                          campaign?.brand[e]
                        )
                      }
                    />
                  )
              )}
        </Box>
      </Box>
      <EditBrandOrCompany open={open} campaign={campaign} onClose={onClose} />
    </>
  );

  const renderCompany = (
    <>
      <Box component={Card} p={2}>
        <Typography variant="h5">Company</Typography>
        {isEditable && (
          <EditButton
            tooltip="Edit Company"
            disabled={isDisabled}
            onClick={() =>
              setOpen((prev) => ({
                ...prev,
                campaignBrand: true,
              }))
            }
          />
        )}
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
      <EditBrandOrCompany open={open} campaign={campaign} onClose={onClose} />
    </>
  );

  const renderDosAndDonts = (
    <>
      <Box component={Card} p={2}>
        <Typography variant="h5">Dos & Don&apos;ts</Typography>
        {isEditable && (
          <EditButton
            tooltip="Edit Dos and Don'ts"
            disabled={isDisabled}
            onClick={() =>
              setOpen((prev) => ({
                ...prev,
                dosAndDonts: true,
              }))
            }
          />
        )}
        <Divider
          sx={{
            borderStyle: 'dashed',
            my: 1,
          }}
        />
        <Stack>
          <Typography variant="subtitle1">Dos</Typography>
          <List>
            {campaign?.campaignBrief?.campaigns_do.map((elem, index) => (
              <ListItem key={index}>
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
          <Typography variant="subtitle1">Don&apos;ts</Typography>
          <List>
            {campaign?.campaignBrief?.campaigns_dont.map((elem, index) => (
              <ListItem key={index}>
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
      {isEditable && <EditDosAndDonts open={open} campaign={campaign} onClose={onClose} />}
    </>
  );

  const renderRequirement = (
    <>
      <Box component={Card} p={2}>
        <Typography variant="h5">Campaign Requirements</Typography>
        {isEditable && (
          <EditButton
            tooltip="Edit Requirements"
            disabled={isDisabled}
            onClick={() =>
              setOpen((prev) => ({
                ...prev,
                campaignRequirements: true,
              }))
            }
          />
        )}
        <Stack spacing={1} mt={1}>
          <ListItemText
            primary="Gender"
            secondary={
              <Stack spacing={1} direction="row" flexWrap="wrap">
                {campaign?.campaignRequirement?.gender?.map((e, index) => (
                  <Label key={index} color="secondary">
                    {e}
                  </Label>
                )) || null}
              </Stack>
            }
          />
          <ListItemText
            primary="Age"
            secondary={
              <Stack spacing={1} direction="row" flexWrap="wrap">
                {campaign?.campaignRequirement?.age?.map((e, index) => (
                  <Label key={index} color="secondary">
                    {formatText(e)}
                  </Label>
                )) || null}
              </Stack>
            }
          />
          <ListItemText
            primary="Geo Location"
            secondary={
              <Stack spacing={1} direction="row" flexWrap="wrap">
                {campaign?.campaignRequirement?.geoLocation?.map((e, index) => (
                  <Label key={index} color="secondary">
                    {formatText(e)}
                  </Label>
                )) || null}
              </Stack>
            }
          />
          <ListItemText
            primary="Language"
            secondary={
              <Stack spacing={1} direction="row" flexWrap="wrap">
                {campaign?.campaignRequirement?.language?.map((e, index) => (
                  <Label key={index} color="secondary">
                    {formatText(e)}
                  </Label>
                )) || null}
              </Stack>
            }
          />
          <ListItemText
            primary="Creator Persona"
            secondary={
              <Stack spacing={1} direction="row" flexWrap="wrap">
                {campaign?.campaignRequirement?.creator_persona?.map((e, index) => (
                  <Label key={index} color="secondary">
                    {formatText(e)}
                  </Label>
                )) || null}
              </Stack>
            }
          />
          <ListItemText
            primary="User Persona"
            secondary={
              <Box
                sx={{
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  whiteSpace: 'pre-wrap',
                  maxWidth: '100%',
                }}
              >
                {formatText(campaign?.campaignRequirement?.user_persona)}
              </Box>
            }
          />
          <ListItemText
            primary="Social Media Platform"
            secondary={
              <Stack spacing={1} direction="row" flexWrap="wrap">
                {campaign?.campaignBrief?.socialMediaPlatform?.map((e, index) => (
                  <Label key={index} color="secondary">
                    {formatText(e)}
                  </Label>
                )) || null}
              </Stack>
            }
          />
          <ListItemText
            primary="Video Angle"
            secondary={
              <Stack spacing={1} direction="row" flexWrap="wrap">
                {campaign?.campaignBrief?.videoAngle?.map((e, index) => (
                  <Label key={index} color="secondary">
                    {formatText(e)}
                  </Label>
                )) || null}
              </Stack>
            }
          />
          <ListItemText
            primary="Deliverables"
            secondary={
              <Stack spacing={1} direction="row" flexWrap="wrap">
                {[
                  { label: 'UGC Videos', value: true },
                  { label: 'Raw Footage', value: campaign?.rawFootage },
                  { label: 'Photos', value: campaign?.photos },
                  { label: 'Ads', value: campaign?.ads },
                ].map((deliverable) => (
                  deliverable.value && (
                    <Label key={deliverable.label} color="secondary">
                      {deliverable.label}
                    </Label>
                  )
                ))}
              </Stack>
            }
          />
        </Stack>
      </Box>
      {isEditable && <EditRequirements open={open} campaign={campaign} onClose={onClose} />}
    </>
  );

  const renderTimeline = (
    <>
      <Box component={Card} p={2}>
        <Typography variant="h5">Timeline</Typography>
        {isEditable && (
          <EditButton
            tooltip="Edit Timeline"
            onClick={() =>
              setOpen((prev) => ({
                ...prev,
                timeline: true,
              }))
            }
            disabled={isDisabled}
          />
        )}

        <Box display="grid" gridTemplateColumns="repeat(1, 1fr)" gap={2} mt={1}>
          {campaign &&
            campaign?.campaignTimeline
              .sort((a, b) => a.order - b.order)
              .map((timeline, index) => (
                <Box key={timeline?.id}>
                  <Stack direction="row" spacing={1} alignItems="start">
                    <Avatar sx={{ width: 15, height: 15, fontSize: 10 }}>{index + 1}</Avatar>
                    <ListItemText
                      primary={timeline?.name}
                      secondary={`${dayjs(timeline?.startDate).format('ddd LL')} - ${dayjs(timeline?.endDate).format('ddd LL')}`}
                      secondaryTypographyProps={{
                        variant: 'caption',
                      }}
                    />
                  </Stack>
                </Box>
              ))}
        </Box>
      </Box>
      {isEditable && <EditTimeline open={open} campaign={campaign} onClose={onClose} />}
    </>
  );

  const renderAdminManager = (
    <Box component={Card} p={2}>
      <Typography variant="h5">Admin Manager</Typography>
      {isEditable && (
        <EditButton
          tooltip="Edit Campaign Admin"
          onClick={() =>
            setOpen((prev) => ({
              ...prev,
              campaignAdmin: true,
            }))
          }
          disabled={isDisabled}
        />
      )}
      <List>
        {campaign?.campaignAdmin?.map((item, index) => (
          <ListItem key={index}>
            <ListItemText primary={`${index + 1}. ${item?.admin?.user?.name}`} />
          </ListItem>
        ))}
      </List>

      <EditCampaignAdmin
        open={open.campaignAdmin}
        onClose={() => onClose('campaignAdmin')}
        campaign={campaign}
      />
    </Box>
  );

  const confirmationModal = (
    <Dialog open={modalConfirm.value} onClose={modalConfirm.onFalse}>
      <DialogTitle>Confirm end campaign</DialogTitle>
      <DialogContent>
        <DialogContentText>Are you sure you want to end the campaign?</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={modalConfirm.onFalse}>Cancel</Button>
        <Button onClick={closeCampaign} variant="contained">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderAgreementTemplate = (
    <>
      <Box component={Card} p={2}>
        <Typography variant="h5">Agreement Template</Typography>
        {campaign?.status !== 'ACTIVE' && (
          <Tooltip title="Refresh">
            <IconButton
              sx={{
                position: 'absolute',
                top: 10,
                right: 50,
                border: 1,
              }}
              onClick={() => refreshPdf()}
            >
              <Iconify icon="material-symbols:refresh" />
            </IconButton>
          </Tooltip>
        )}

        {isEditable && (
          <EditButton
            tooltip="Edit Agreement Template"
            onClick={() =>
              setOpen((prev) => ({
                ...prev,
                campaignAgreement: true,
              }))
            }
            disabled={isDisabled}
          />
        )}

        <Box my={4} maxHeight={500} overflow="auto" textAlign="center">
          <Box
            sx={{
              display: 'inline-block',
            }}
          >
            {campaign?.agreementTemplate ? (
              <Document
                file={campaign?.agreementTemplate?.url}
                onLoadSuccess={({ numPages }) => setPages(numPages)}
                renderMode="canvas"
              >
                <Stack spacing={2}>
                  {pages &&
                    Array.from({ length: pages }, (_, index) => (
                      <Page
                        key={index}
                        pageIndex={index}
                        pageNumber={index + 1}
                        scale={1}
                        renderTextLayer={false}
                      />
                    ))}
                </Stack>
              </Document>
            ) : (
              <Typography variant="caption" color="text-secondary">
                No agreement template found
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
      {isEditable && (
        <EditAgreementTemplate
          open={open}
          campaign={campaign}
          onClose={onClose}
          campaignMutate={campaignMutate}
        />
      )}
    </>
  );

  const renderCampaignImages = (
    <>
      <Box component={Card} p={2}>
        <Typography variant="h5">Campaign Images</Typography>
        {isEditable && (
          <EditButton
            tooltip="Edit Campaign Images"
            onClick={() =>
              setOpen((prev) => ({
                ...prev,
                campaignImages: true,
              }))
            }
            disabled={isDisabled}
          />
        )}
        <Box my={4} maxHeight={500} overflow="auto" textAlign="center">
          <Carousel images={campaign?.campaignBrief?.images} />
        </Box>
      </Box>
      {isEditable && <EditCampaignImages open={open} campaign={campaign} onClose={onClose} />}
    </>
  );

  const renderAttachments = (
    <>
      <Box component={Card} p={2}>
        <Typography variant="h5">Other Attachments</Typography>
        {isEditable && (
          <EditButton
            tooltip="Edit Campaign Attachments"
            onClick={() =>
              setOpen((prev) => ({
                ...prev,
                campaignAttachments: true,
              }))
            }
            disabled={isDisabled}
          />
        )}
        {campaign?.campaignBrief?.otherAttachments?.length ? (
          <Box my={1} overflow="auto">
            <MultiFilePreview files={campaign?.campaignBrief?.otherAttachments} thumbnail />
          </Box>
        ) : (
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
            }}
          >
            No attachments found.
          </Typography>
        )}
      </Box>
      {isEditable && <EditAttachments open={open} campaign={campaign} onClose={onClose} />}
    </>
  );

  const renderReferenceLinks = (
    <>
      <Box component={Card} p={2}>
        <Typography variant="h5">Reference Links</Typography>
        {isEditable && (
          <EditButton
            tooltip="Edit Campaign Reference"
            onClick={() =>
              setOpen((prev) => ({
                ...prev,
                campaignReferences: true,
              }))
            }
            disabled={isDisabled}
          />
        )}

        {campaign?.campaignBrief?.referencesLinks?.length > 0 ? (
          <List>
            {campaign?.campaignBrief?.referencesLinks?.map((link, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <Iconify icon="ix:reference" />
                </ListItemIcon>
                <Link
                  key={index}
                  href={link}
                  target="_blank"
                  sx={{ overflowX: 'auto', scrollbarWidth: 'none' }}
                >
                  {link}
                </Link>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            No references found.
          </Typography>
        )}
      </Box>

      {isEditable && <EditReferences open={open} campaign={campaign} onClose={onClose} />}
    </>
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
          { name: 'Edit' },
          { name: campaign?.name },
        ]}
        action={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            {campaign?.status === 'ACTIVE' && (
              <LoadingButton
                startIcon={<Iconify icon="ion:close" />}
                variant="outlined"
                color="error"
                onClick={modalConfirm.onTrue}
                size="small"
                disabled={isDisabled}
              >
                End Campaign
              </LoadingButton>
            )}
            {campaign?.status === 'SCHEDULED' &&
              dayjs().isSame(dayjs(campaign?.campaignBrief?.startDate), 'date') && (
                <LoadingButton
                  variant="contained"
                  color="success"
                  onClick={() => handleChangeStatus('ACTIVE')}
                  size="small"
                  disabled={isDisabled}
                >
                  Start Campaign
                </LoadingButton>
              )}
            {campaign &&
              (campaign?.status === 'PAUSED' ||
                (campaign?.status === 'DRAFT' &&
                  dayjs(campaignStartDate).isSame(dayjs(), 'D'))) && (
                <LoadingButton
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<Iconify icon="eva:cloud-upload-fill" />}
                  onClick={() => handleChangeStatus('ACTIVE')}
                  loading={loadingButton.value}
                  disabled={isDisabled}
                >
                  Publish
                </LoadingButton>
              )}
            {campaign && campaign?.status === 'ACTIVE' && (
              <LoadingButton
                variant="contained"
                color="warning"
                size="small"
                startIcon={<Iconify icon="solar:file-text-bold" />}
                onClick={() => handleChangeStatus('PAUSED')}
                loading={loadingButton.value}
                disabled={isDisabled}
              >
                Pause
              </LoadingButton>
            )}
          </Stack>
        }
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <Grid container spacing={2}>
        {!campaignLoading ? (
          <>
            <Grid item xs={12} md={8}>
              <Stack spacing={2}>
                {renderCampaignInformation}
                {campaign?.brand ? renderBrand : renderCompany}
                {campaign?.campaignBrief?.campaign_do &&
                  campaign?.campaignBrief?.campaign_dont &&
                  renderDosAndDonts}
                {renderAgreementTemplate}
                {renderCampaignImages}
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack spacing={2}>
                {renderRequirement}
                {renderTimeline}
                {renderAdminManager}
                {renderAttachments}
                {renderReferenceLinks}
              </Stack>
            </Grid>
          </>
        ) : (
          <Grid item xs={12} textAlign="center" mt={20}>
            <Box
              sx={{
                position: 'relative',
                top: 200,
                textAlign: 'center',
              }}
            >
              <CircularProgress
                thickness={7}
                size={25}
                sx={{
                  color: theme.palette.common.black,
                  strokeLinecap: 'round',
                }}
              />
            </Box>
          </Grid>
        )}
      </Grid>

      {confirmationModal}
    </Container>
  );
};

export default withPermission(['view:campaign'], CampaignDetailManageView);

CampaignDetailManageView.propTypes = {
  id: PropTypes.string,
};
