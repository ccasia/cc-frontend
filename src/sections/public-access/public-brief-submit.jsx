import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useState, useEffect, useCallback } from 'react';

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import axiosInstance, { endpoints } from 'src/utils/axios';

import BriefForm from 'src/sections/campaign/briefs/brief-form';
import BriefFormLayout from 'src/sections/campaign/briefs/brief-form-layout';
import BriefSubmittedDialog from 'src/sections/campaign/briefs/dialogs/brief-submitted-dialog';

const GEO_FOCUS_LABEL_TO_VALUE = {
  'SEA Region': 'SEAregion',
  Global: 'global',
  Others: 'others',
};

const toIsoOrNull = (d) => (d ? new Date(d).toISOString() : null);

// Public invite-link page (/campaign-brief/:token). Renders the shared BriefForm
// in single-submit mode and POSTs the prospect's brief to the BD invite endpoint.
export default function PublicBriefSubmit({ token }) {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [bdName, setBdName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [doneOpen, setDoneOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    axiosInstance
      .get(endpoints.campaignBrief.publicInfo(token))
      .then((res) => {
        if (!cancelled) setBdName(res.data?.bdName || '');
      })
      .catch(() => {
        if (!cancelled) setInvalid(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Map BriefForm values → the bdSubmitDraft payload shape. `files` are the
  // locally-staged attachments (up to 3) from the public form.
  const handleSubmit = useCallback(
    async (values, files = []) => {
      setSubmitting(true);
      try {
        const payload = {
          brandName: values.brandName?.trim() || '',
          industry: values.industry || '',
          postingStart: toIsoOrNull(values.dateFrom),
          postingEnd: toIsoOrNull(values.dateTo),
          // The objectives grid feeds secondaryObjectives; primaryGoal is fixed.
          primaryGoal: 'Awareness',
          secondaryObjectives: values.secondaryObjectives || [],
          kpis: values.kpis || [],
          kpiNotes: values.kpiNotes || '',
          additionalInfo: values.extraNotes || '',
          gender: values.gender || [],
          age: values.age || [],
          country: values.country || '',
          language: values.language || [],
          creator_persona: values.creatorPersona || [],
          user_persona: values.userPersona || '',
          geographic_focus: values.geographicFocus
            ? GEO_FOCUS_LABEL_TO_VALUE[values.geographicFocus] ?? values.geographicFocus
            : '',
        };

        const url = endpoints.campaignBrief.publicSubmit(token);
        if (files.length > 0) {
          // Multipart: scalar fields as-is, arrays JSON-stringified (the backend
          // parses both), files under the `brandGuidelines` field.
          const fd = new FormData();
          Object.entries(payload).forEach(([k, v]) => {
            fd.append(k, Array.isArray(v) ? JSON.stringify(v) : v ?? '');
          });
          files.forEach((file) => fd.append('brandGuidelines', file));
          await axiosInstance.post(url, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } else {
          await axiosInstance.post(url, payload);
        }
        setDoneOpen(true);
      } catch (err) {
        const fields = err?.response?.data?.invalidFields;
        const fileErrs = err?.response?.data?.fileErrors;
        enqueueSnackbar(
          (fields?.length && `Please check: ${fields.join(', ')}`) ||
            (fileErrs?.length && fileErrs.join(', ')) ||
            err?.response?.data?.message ||
            'Failed to submit brief',
          { variant: 'error' }
        );
      } finally {
        setSubmitting(false);
      }
    },
    [token, enqueueSnackbar]
  );

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (invalid) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          This link is no longer valid
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please request a new invite link from your contact.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 6 }, px: { xs: 2, sm: 3, md: 4 }, overflowX: 'hidden' }}>
      <BriefFormLayout
        leftExtra={
          bdName ? (
            <Typography variant="body2" sx={{ mt: 4, color: '#6B7280' }}>
              {bdName} invited you to share a brief.
            </Typography>
          ) : null
        }
      >
        <BriefForm mode="public-submit" onSubmit={handleSubmit} submitting={submitting} />
      </BriefFormLayout>

      <BriefSubmittedDialog open={doneOpen} onClose={() => setDoneOpen(false)} />
    </Container>
  );
}

PublicBriefSubmit.propTypes = {
  token: PropTypes.string,
};
