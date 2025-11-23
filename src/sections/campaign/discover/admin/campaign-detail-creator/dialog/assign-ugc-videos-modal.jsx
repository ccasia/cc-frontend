import * as yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import React, { useMemo, useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, useFieldArray } from 'react-hook-form';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  List,
  alpha,
  Stack,
  Button,
  Dialog,
  ListItem,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Label from 'src/components/label';
import FormProvider, { RHFTextField } from 'src/components/hook-form';
import { useGetAgreements } from 'src/hooks/use-get-agreeements';

import { useShortlistedCreators } from '../hooks/shortlisted-creator';

const schema = yup.object().shape({
  shortlistedCreators: yup.array().of(
    yup.object().shape({
      credits: yup.number().min(1, 'Minumum credit is 1'),
    })
  ),
});

const AssignUGCVideoModal = ({ dialog, onClose, credits, campaignId, modalClose, creditsLeft, campaign, campaignMutate }) => {
  const shortlistedCreators = useShortlistedCreators((state) => state.shortlistedCreators);
  const resetState = useShortlistedCreators((state) => state.reset);
  const { data: agreements } = useGetAgreements(campaignId);

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      shortlistedCreators: [],
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const {
    control,
    setValue,
    handleSubmit,
    reset,
    watch,
    formState: { isValid, isSubmitting },
  } = methods;

  // For v4 campaigns, calculate credits used only from sent agreements
  const v4UsedCredits = useMemo(() => {
    if (campaign?.submissionVersion !== 'v4' || !campaign?.campaignCredits) return null;
    if (!agreements || !campaign?.shortlisted) return 0;
    
    // Get userIds of Platform Creators whose agreements have been sent
    const sentAgreementUserIds = new Set(
      agreements
        .filter(
          (agreement) =>
            agreement.isSent &&
            agreement.user?.creator?.isGuest !== true
        )
        .map((agreement) => agreement.userId)
    );
    
    return campaign.shortlisted.reduce((acc, creator) => {
      if (
        sentAgreementUserIds.has(creator.userId) &&
        creator.user?.creator?.isGuest !== true &&
        creator.ugcVideos
      ) {
        return acc + (creator.ugcVideos || 0);
      }
      return acc;
    }, 0);
  }, [campaign, agreements]);

  // Watch the form values to calculate real-time credits left
  const watchedCreators = watch('shortlistedCreators');
  const realTimeCreditsLeft = useMemo(() => {
    if (!campaign?.campaignCredits) return null;
    
    // For v4 campaigns, only count credits from sent agreements
    if (campaign?.submissionVersion === 'v4') {
      const alreadyUtilized = v4UsedCredits ?? 0;
      const newlyAssigned = watchedCreators?.reduce(
        (acc, creator) => acc + (creator?.credits || 0),
        0
      ) || 0;
      return campaign.campaignCredits - alreadyUtilized - newlyAssigned;
    }
    
    // For non-v4 campaigns, count all shortlisted creators
    const alreadyUtilized = (campaign?.shortlisted || []).reduce(
      (acc, item) => acc + (item?.ugcVideos || 0),
      0
    );
    const newlyAssigned = watchedCreators?.reduce(
      (acc, creator) => acc + (creator?.credits || 0),
      0
    ) || 0;
    return campaign.campaignCredits - alreadyUtilized - newlyAssigned;
  }, [watchedCreators, campaign?.campaignCredits, campaign?.shortlisted, campaign?.submissionVersion, v4UsedCredits]);

  const { fields } = useFieldArray({
    control,
    name: 'shortlistedCreators',
  });

  const onSubmit = handleSubmit(async ({ shortlistedCreators: data }) => {
    const totalCredits = data.reduce((acc, sum) => acc + sum.credits, 0);

    // Only check credit limits for admin-created campaigns
    if (campaign?.origin !== 'CLIENT' && totalCredits > credits) {
      enqueueSnackbar('Error - Credits exceeded', {
        variant: 'error',
      });
      return;
    }

    try {
      // Debug logging
      console.log('Campaign data:', campaign);
      console.log('Campaign origin:', campaign?.origin);
      
      if (campaign?.origin === 'CLIENT') {
        // For V3 campaigns, first shortlist creators, then assign UGC credits
        console.log('V3 Campaign: Shortlisting creators first...');
        
        // Step 1: Shortlist creators (without UGC credits)
        await axiosInstance.post('/api/campaign/v3/shortlistCreator', {
          creators: data.map(creator => ({ id: creator.id })), // Only send IDs for shortlisting
          campaignId,
        });
        
        // Step 2: Assign UGC credits
        console.log('V3 Campaign: Assigning UGC credits...');
        await axiosInstance.post('/api/campaign/v3/assignUGCCredits', {
          creators: data,
          campaignId,
        });
        
        enqueueSnackbar('Successfully shortlisted creators and assigned UGC credits', {
          variant: 'success',
        });
      } else {
        // For V2 campaigns, use existing logic
        console.log('V2 Campaign: Using existing shortlist logic...');
        await axiosInstance.post('/api/campaign/v2/shortlistCreator', {
          creators: data,
          campaignId,
        });
        
        enqueueSnackbar('Successfully shortlisted creators', {
          variant: 'success',
        });
      }
      
      // Refresh data
      if (campaignMutate) {
        campaignMutate(); // Refresh campaign data to update ugcLeft calculation
      }
      mutate(endpoints.campaign.getCampaignById(campaignId));
      mutate(endpoints.campaign.creatorAgreement(campaignId));
      reset();
      onClose();
      modalClose();
      resetState();
    } catch (error) {
      console.error('Error in onSubmit:', error);
      enqueueSnackbar(error?.response?.data?.message || error?.message || 'An error occurred', {
        variant: 'error',
      });
    }
  });

  useEffect(() => {
    if (shortlistedCreators.length > 0) {
      setValue(
        'shortlistedCreators',
        shortlistedCreators.map((item) => ({ ...item, credits: 0 }))
      );
    }
  }, [setValue, shortlistedCreators]);

  return (
    <Dialog
      open={dialog}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 0.5,
        },
      }}
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle
          sx={{
            fontFamily: (theme) => theme.typography.fontSecondaryFamily,
            '&.MuiTypography-root': {
              fontSize: 25,
            },
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            Assign UGC Credits
            <Label
              sx={{
                fontFamily: (theme) => theme.typography.fontFamily,
                color: realTimeCreditsLeft !== null && realTimeCreditsLeft < 0 ? 'error.main' : 'inherit',
              }}
            >
              UGC Credits: {(realTimeCreditsLeft ?? creditsLeft ?? 0) < 0 ? 0 : (realTimeCreditsLeft ?? creditsLeft ?? 0)} left
            </Label>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <List>
            {fields.map((field, index) => (
              <ListItem key={field.id}>
                <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="subtitle1" color="text.secondary">
                      {field?.name}
                    </Typography>
                  </Stack>

                  <RHFTextField
                    name={`shortlistedCreators.${index}.credits`}
                    size="small"
                    placeholder="Number of UGC Videos"
                    type="number"
                    // onChange={(e) => {
                    //   handleInputChange(
                    //     e.currentTarget.value,
                    //     `shortlistedCreators.${index}.credits`
                    //   );
                    // }}
                  />
                </Box>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        
        {/* Warning message when credits exceed available amount */}
        {realTimeCreditsLeft !== null && realTimeCreditsLeft < 0 && (
          <Box sx={{ px: 3, pb: 2 }}>
            <Typography 
              variant="body2" 
              color="error.main" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                fontSize: '0.875rem'
              }}
            >
              ⚠️ Credits exceeded by {Math.abs(realTimeCreditsLeft)}. Please reduce the assigned credits.
            </Typography>
          </Box>
        )}

        <DialogActions>
          <Button
            onClick={() => {
              onClose();
            }}
            disabled={isSubmitting}
            sx={{
              bgcolor: '#ffffff',
              border: '1px solid #e7e7e7',
              borderBottom: '3px solid #e7e7e7',
              height: 44,
              color: '#203ff5',
              fontSize: '0.875rem',
              fontWeight: 600,
              px: 3,
              '&:hover': {
                bgcolor: alpha('#636366', 0.08),
                opacity: 0.9,
              },
            }}
          >
            Back
          </Button>

          <LoadingButton
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting || !isValid || (realTimeCreditsLeft !== null && realTimeCreditsLeft < 0)}
            sx={{
              bgcolor: '#203ff5',
              border: '1px solid #203ff5',
              borderBottom: '3px solid #1933cc',
              height: 44,
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 600,
              px: 3,
              '&:hover': {
                bgcolor: '#1933cc',
                opacity: 0.9,
              },
              '&:disabled': {
                bgcolor: '#e7e7e7',
                color: '#999999',
                border: '1px solid #e7e7e7',
                borderBottom: '3px solid #d1d1d1',
              },
            }}
          >
            {isSubmitting ? '' : 'Confirm'}
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
};

export default AssignUGCVideoModal;

AssignUGCVideoModal.propTypes = {
  dialog: PropTypes.bool,
  onClose: PropTypes.func,
  credits: PropTypes.number,
  campaignId: PropTypes.string,
  modalClose: PropTypes.func,
  creditsLeft: PropTypes.number,
  campaign: PropTypes.object,
  campaignMutate: PropTypes.func,
};
