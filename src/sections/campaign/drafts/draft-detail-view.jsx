import dayjs from 'dayjs';
import useSWR from 'swr';
import { useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';
import { useParams, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';
import { collectMissingBDDraftFields } from 'src/contants/bd-draft-fields';

import UpdateGeneralInformation from 'src/sections/campaign/manage/details/UpdateGeneralInformation';
import UpdateObjectives from 'src/sections/campaign/manage/details/UpdateObjectives';
import UpdateAudience from 'src/sections/campaign/manage/details/UpdateAudience';
import DraftPackageSection from 'src/sections/campaign/drafts/draft-package-section';
import { LoadingButton } from '@mui/lab';
import { DarkGlassTooltip } from 'src/components/tooltip/glass-tooltip';

function SectionCard({ title, missingCount, children }) {
  return (
    <Card sx={{ p: 3, mb: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        {missingCount > 0 && (
          <Chip size="small" color="warning" variant="outlined" label={`${missingCount} missing`} />
        )}
      </Stack>
      <Divider sx={{ mb: 3 }} />
      <Box sx={{ '& > form > div': { maxWidth: '100% !important' } }}>{children}</Box>
    </Card>
  );
}

export default function DraftCampaignDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const {
    data: campaign,
    isLoading,
    mutate,
  } = useSWR(id ? endpoints.campaign.getCampaignById(id) : null, fetcher);

  const [submitting, setSubmitting] = useState(false);
  const [campaignCredits, setCampaignCredits] = useState('');

  const missing = useMemo(
    () => (campaign ? collectMissingBDDraftFields(campaign) : []),
    [campaign]
  );

  const missingBySection = useMemo(() => {
    const counts = { campaign: 0, brief: 0, requirement: 0, package: 0 };
    missing.forEach((m) => {
      counts[m.section] = (counts[m.section] || 0) + 1;
    });
    return counts;
  }, [missing]);

  const handleSubmitForReview = async () => {
    setSubmitting(true);
    try {
      await axiosInstance.post(endpoints.campaign.submitDraftForReview(id), {
        campaignCredits: Number(campaignCredits),
      });
      enqueueSnackbar('Sent to CSM for review', { variant: 'success' });
      navigate(paths.dashboard.campaign.drafts);
    } catch (error) {
      const msg = error?.missingFields
        ? `Missing: ${error.missingFields.map((f) => f.label).join(', ')}`
        : error?.message || 'Failed to submit';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Stack alignItems="center" py={8}>
          <CircularProgress />
        </Stack>
      </Container>
    );
  }

  if (!campaign) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>
          Draft not found, or it has already been submitted.
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Button onClick={() => navigate(paths.dashboard.campaign.drafts)}>Back to drafts</Button>
        </Box>
      </Container>
    );
  }

  const resolvedCompany = campaign?.brand?.company || campaign?.company || null;
  const activeSub = resolvedCompany?.subscriptions?.find((s) => s.status === 'ACTIVE') || null;
  const availableCredits = activeSub
    ? (activeSub.totalCredits ?? 0) - (activeSub.creditsUsed ?? 0)
    : 0;

  const canSubmit =
    missing.length === 0 &&
    campaignCredits !== '' &&
    Number(campaignCredits) > 0 &&
    Number(campaignCredits) <= availableCredits;

  return (
    <Container maxWidth="md" sx={{ pb: 12 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4">{campaign.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            Draft &bull; Created {dayjs(campaign.createdAt).format('DD MMM YYYY')}
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => navigate(paths.dashboard.campaign.drafts)}>
          Back
        </Button>
      </Stack>

      {missing.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {missing.length} required field{missing.length === 1 ? '' : 's'} still missing:{' '}
          {missing.map((f) => f.label).join(', ')}
        </Alert>
      )}

      {/* Section 1: General Information */}
      <SectionCard
        title="General Information"
        missingCount={missingBySection.campaign + missingBySection.brief}
      >
        <UpdateGeneralInformation campaign={campaign} campaignMutate={mutate} />
      </SectionCard>

      {/* Section 2: Objectives */}
      <SectionCard title="Campaign Objectives" missingCount={0}>
        <UpdateObjectives campaign={campaign} campaignMutate={mutate} />
      </SectionCard>

      {/* Section 3: Target Audience */}
      <SectionCard title="Target Audience" missingCount={missingBySection.requirement}>
        <UpdateAudience campaign={campaign} campaignMutate={mutate} />
      </SectionCard>

      {/* Section 4: Company / Brand */}
      <SectionCard title="Company & Package" missingCount={missingBySection.package}>
        <DraftPackageSection
          campaign={campaign}
          onSaved={mutate}
          campaignCredits={campaignCredits}
          onCreditsChange={setCampaignCredits}
        />
      </SectionCard>

      {/* Sticky footer */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          py: 2,
          px: 3,
          zIndex: 10,
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={2}>
            <Typography variant="body2" color={canSubmit ? 'text.primary' : '#FF3500'}>
              {canSubmit
                ? 'Ready to submit.'
                : missing.length > 0
                  ? `${missing.length} required field${missing.length === 1 ? '' : 's'} remaining.`
                  : 'Set campaign credits to submit.'}
            </Typography>
            <DarkGlassTooltip
              title={canSubmit ? '' : 'Fill all required fields and set campaign credits to submit.'}
            >
              <span>
                <LoadingButton
                  type="submit"
                  variant="contained"
                  loading={submitting}
                  disabled={!canSubmit || submitting}
                  onClick={handleSubmitForReview}
                  size="large"
                  sx={{
                    bgcolor: '#1340ff',
                    boxShadow: '0px -3px 0px 0px rgba(0,0,0,0.45) inset',
                    '&:hover': {
                      bgcolor: '#1340ff',
                    },
                    '&:disabled': {
                      bgcolor: 'rgba(19, 64, 255, 0.3)',
                      color: '#fff',
                      boxShadow: '0px -3px 0px 0px inset rgba(0, 0, 0, 0.1)',
                    },
                  }}
                >
                  Create Campaign
                </LoadingButton>
              </span>
            </DarkGlassTooltip>
          </Stack>
        </Container>
      </Box>
    </Container>
  );
}
