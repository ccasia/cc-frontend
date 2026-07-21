import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import React, { useRef, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';

import { Box, Grid, Stack, Alert, Button, Typography, CircularProgress } from '@mui/material';

import Iconify from 'src/components/iconify';
import {
  ManualCreatorCard,
  UserPerformanceCard,
  ManualCreatorEntryForm,
} from 'src/components/campaign-analytics';

import { useAnalyticsStore, setShowAddCreatorForm } from '../stores/analytics.store';

const CreatorList = ({
  campaignId,
  loadingInsights,
  filteredSubmissions,
  mutateManualEntries,
  isDisabled,
  creatorListRowsSorted,
  handleDeleteClick,
  postingSubmissions,
  manualEntries,
}) => {
  const formRef = useRef();

  const showAddCreatorForm = useAnalyticsStore((state) => state.showAddCreatorForm);
  const formState = useAnalyticsStore((state) => state.formState);
  const selectedPlatform = useAnalyticsStore((state) => state.selectedPlatform);
  console.log('FORM', formState);
  const sanitizedList = useMemo(() => {
    const seenUsers = new Set();
    return (
      filteredSubmissions?.filter((sub) => {
        if (seenUsers.has(sub?.user)) return false;
        seenUsers.add(sub?.user);
        return true;
      }) || []
    );
  }, [filteredSubmissions]);

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1,
        }}
      >
        <Typography fontSize={24} fontWeight={600} fontFamily="Aileron">
          Creator List
        </Typography>

        {/* Show Add New Creators button or Cancel/Save buttons */}
        {!showAddCreatorForm ? (
          <Button
            onClick={() => setShowAddCreatorForm(true)}
            disabled={isDisabled}
            sx={{
              bgcolor: '#FFFFFF',
              border: '1.5px solid #e7e7e7',
              borderBottom: '3px solid #e7e7e7',
              borderRadius: 1.15,
              color: '#1340FF',
              height: 44,
              px: 2.5,
              fontWeight: 600,
              fontSize: '0.85rem',
              textTransform: 'none',
              '&:hover': {
                bgcolor: 'rgba(19, 64, 255, 0.08)',
                border: '1.5px solid #1340FF',
                borderBottom: '3px solid #1340FF',
                color: '#1340FF',
              },
              '&.Mui-disabled': {
                cursor: 'not-allowed',
                pointerEvents: 'auto',
              },
            }}
            startIcon={<Iconify icon="fluent:people-add-28-filled" width={16} />}
          >
            Add New Creators
          </Button>
        ) : (
          <Stack direction="row" spacing={1.5}>
            {/* Cancel Button */}
            <Button
              onClick={() => setShowAddCreatorForm(false)}
              disabled={formState.isSubmitting}
              sx={{
                bgcolor: '#FFFFFF',
                border: '1.5px solid #e7e7e7',
                borderBottom: '3px solid #e7e7e7',
                borderRadius: 1.15,
                color: '#1340FF',
                height: 44,
                minWidth: 100,
                px: 2.5,
                fontWeight: 600,
                fontSize: '1rem',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'rgba(19, 64, 255, 0.08)',
                  border: '1.5px solid #1340FF',
                  borderBottom: '3px solid #1340FF',
                  color: '#1340FF',
                },
              }}
            >
              Cancel
            </Button>

            {/* Save Button */}
            <Button
              onClick={() => formRef.current?.submit()}
              disabled={!formState.isValid || formState.isSubmitting}
              sx={{
                bgcolor: formState.isValid && !formState.isSubmitting ? '#1340FF' : '#B0B0B1',
                border: '1.5px solid',
                borderColor: formState.isValid && !formState.isSubmitting ? '#1340FF' : '#B0B0B1',
                borderBottom: '3px solid',
                borderBottomColor:
                  formState.isValid && !formState.isSubmitting ? '#0D2BA8' : '#9E9E9F',
                borderRadius: 1.15,
                color: '#FFFFFF',
                height: 44,
                minWidth: 100,
                px: 2.5,
                fontWeight: 600,
                fontSize: '1rem',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: formState.isValid && !formState.isSubmitting ? '#0D2BA8' : '#B0B0B1',
                  color: '#FFFFFF',
                },
                '&.Mui-disabled': {
                  bgcolor: '#B0B0B1',
                  border: '1.5px solid #B0B0B1',
                  borderBottom: '3px solid #9E9E9F',
                  color: '#FFFFFF',
                },
              }}
            >
              {formState.isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Save'}
            </Button>
          </Stack>
        )}
      </Box>

      <AnimatePresence>
        {showAddCreatorForm && (
          <ManualCreatorEntryForm
            ref={formRef}
            campaignId={campaignId}
            selectedPlatform={selectedPlatform !== 'ALL' ? selectedPlatform : null}
            submissionsWithoutInsights={sanitizedList}
            onSuccess={() => {
              setShowAddCreatorForm(false);
              mutateManualEntries();
              enqueueSnackbar('Creator entry added successfully', { variant: 'success' });
            }}
            // onFormStateChange={setFormState}
          />
        )}
      </AnimatePresence>

      <Grid container spacing={1}>
        {/* eslint-disable react/prop-types */}
        {creatorListRowsSorted.map((row, index) => {
          if (row.kind === 'manual') {
            return (
              <ManualCreatorCard
                index={index}
                key={row.dedupKey}
                entry={row.entry}
                campaignId={campaignId}
                onUpdate={mutateManualEntries}
                onDelete={handleDeleteClick}
                isDisabled={isDisabled}
              />
            );
          }

          return (
            <UserPerformanceCard
              index={index}
              key={row.dedupKey}
              submission={row.submission}
              insightData={row.insightData}
              engagementRate={row.engagementRate}
              loadingInsights={loadingInsights}
            />
          );
        })}
        {/* eslint-enable react/prop-types */}

        {!postingSubmissions?.length && !manualEntries?.length && (
          <Grid item xs={12}>
            <Box
              sx={{
                textAlign: 'center',
                py: 6,
                px: 3,
                bgcolor: '#F8F9FA',
                borderRadius: 2,
                border: '1px dashed #E0E0E0',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 1,
                  color: '#6B7280',
                  fontWeight: 500,
                }}
              >
                No Creator Data Yet
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#9CA3AF',
                  maxWidth: 400,
                  mx: 'auto',
                }}
              >
                Creator performance data will appear here once creators submit their posting links
                and content goes live.
              </Typography>
            </Box>
          </Grid>
        )}

        {filteredSubmissions.length === 0 && postingSubmissions.length > 0 && (
          <Grid item xs={12}>
            <Alert severity="info">
              No {selectedPlatform.toLowerCase()} submissions found for this campaign.
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default CreatorList;

CreatorList.propTypes = {
  campaignId: PropTypes.string,
  loadingInsights: PropTypes.bool,
  filteredSubmissions: PropTypes.array,
  mutateManualEntries: PropTypes.func,
  isDisabled: PropTypes.bool,
  creatorListRowsSorted: PropTypes.array,
  handleDeleteClick: PropTypes.array,
  postingSubmissions: PropTypes.array,
  manualEntries: PropTypes.array,
};
