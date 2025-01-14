import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import React, { useMemo, useState } from 'react';
import { ClimbingBoxLoader } from 'react-spinners';

import { LoadingButton } from '@mui/lab';
import { alpha } from '@mui/material/styles';
import {
  Box,
  Chip,
  Stack,
  Button,
  Dialog,
  Avatar,
  Checkbox,
  TextField,
  IconButton,
  DialogTitle,
  ListItemText,
  DialogContent,
  DialogActions,
  InputAdornment,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import { useGetAgreements } from 'src/hooks/use-get-agreeements';

import { endpoints } from 'src/utils/axios';

import { shortlistCreator, useGetAllCreators } from 'src/api/creator';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';
import { RHFAutocomplete } from 'src/components/hook-form';
import { useSettingsContext } from 'src/components/settings';
import FormProvider from 'src/components/hook-form/form-provider';

import UserCard from './user-card';
import CampaignAgreementEdit from '../campaign-agreement-edit';

const CampaignDetailCreator = ({ campaign, campaignMutate }) => {
  const [query, setQuery] = useState('');
  const { data, isLoading } = useGetAllCreators();

  const { data: agreements, isLoading: loadingAgreements } = useGetAgreements(campaign?.id);
  const smUp = useResponsive('up', 'sm');

  const shortlistedCreators = campaign?.shortlisted;
  const shortlistedCreatorsId = shortlistedCreators?.map((item) => item.userId);
  const modal = useBoolean();
  const confirmModal = useBoolean();
  const editDialog = useBoolean();
  const settings = useSettingsContext();
  const loading = useBoolean();
  const [selectedAgreement, setSelectedAgreement] = useState(null);

  const methods = useForm({
    defaultValues: {
      creator: [],
    },
  });

  const {
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting },
  } = methods;

  const creatorsWithAgreements = useMemo(() => {
    if (!agreements || !campaign?.shortlisted) return campaign?.shortlisted;

    const agreementsMap = agreements.reduce((acc, agreement) => {
      acc[agreement.userId] = {
        isSent: agreement.isSent,
        status: agreement.status,
      };
      return acc;
    }, {});

    return campaign.shortlisted.map((creator) => ({
      ...creator,
      isSent: agreementsMap[creator.userId]?.isSent || false,
      agreementStatus: agreementsMap[creator.userId]?.status || 'NOT_SENT',
    }));
  }, [agreements, campaign]);

  const filteredCreators = useMemo(
    () =>
      query
        ? creatorsWithAgreements?.filter((elem) =>
            elem?.user?.name?.toLowerCase().includes(query.toLowerCase())
          )
        : creatorsWithAgreements,
    [creatorsWithAgreements, query]
  );

  const selectedCreator = watch('creator');

  const onSubmit = handleSubmit(async (value) => {
    try {
      loading.onTrue();

      const newVal = value?.creator?.map((val) => ({
        ...val,
        creator: { ...val.creator, socialMediaData: '' },
      }));

      const res = await shortlistCreator({ newVal, campaignId: campaign.id });
      modal.onFalse();
      reset();
      enqueueSnackbar(res?.data?.message);
      campaignMutate();
      mutate(endpoints.campaign.creatorAgreement(campaign.id));
    } catch (error) {
      console.log(error);
      loading.onFalse();
      enqueueSnackbar('Error Shortlist Creator', {
        variant: 'error',
      });
    } finally {
      loading.onFalse();
    }
  });

  const handleEditAgreement = (creator) => {
    const agreement = agreements.find((a) => a.userId === creator.userId);

    if (!loadingAgreements && (!agreement || agreement.isSent)) {
      enqueueSnackbar('No editable agreement found for this creator', { variant: 'info' });
      return;
    }

    setSelectedAgreement(agreement);
    editDialog.onTrue();
  };

  const renderShortlistFormModal = (
    <Dialog
      open={modal.value}
      onClose={selectedCreator.length ? confirmModal.onTrue : modal.onFalse}
      maxWidth="xs"
      fullWidth
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Shortlist Creators</DialogTitle>
        <Box
          sx={{ width: '100%', borderBottom: '1px solid', borderColor: 'divider', mt: -1, mb: 2 }}
        />
        <DialogContent>
          <Box py={1}>
            <Box sx={{ mb: 2, fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem' }}>
              Who would you like to shortlist?
            </Box>
            {!isLoading && (
              <RHFAutocomplete
                name="creator"
                label="Select Creator to shortlist"
                multiple
                disableCloseOnSelect
                options={data?.filter(
                  (user) => user.status === 'active' && user?.creator?.isFormCompleted
                )}
                filterOptions={(option, state) => {
                  const options = option.filter((item) => !shortlistedCreatorsId.includes(item.id));
                  if (state?.inputValue) {
                    return options?.filter(
                      (item) =>
                        item?.email?.toLowerCase()?.includes(state.inputValue.toLowerCase()) ||
                        item?.name?.toLowerCase()?.includes(state.inputValue.toLowerCase())
                    );
                  }
                  return options;
                }}
                getOptionLabel={(option) => option?.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={(props, option, { selected }) => {
                  // eslint-disable-next-line react/prop-types
                  const { key, ...optionProps } = props;
                  return (
                    <Box key={key} component="div" {...optionProps}>
                      <Checkbox style={{ marginRight: 8 }} checked={selected} />
                      <Avatar
                        alt="dawd"
                        src={option?.photoURL}
                        variant="rounded"
                        sx={{
                          width: 30,
                          height: 30,
                          flexShrink: 0,
                          mr: 1.5,
                          borderRadius: 2,
                        }}
                      />
                      <ListItemText primary={option?.name} secondary={option?.email} />
                    </Box>
                  );
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip
                        variant="outlined"
                        avatar={<Avatar src={option?.photoURL}>{option?.name?.slice(0, 1)}</Avatar>}
                        sx={{
                          border: 1,
                          borderColor: '#EBEBEB',
                          boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                          py: 2,
                        }}
                        label={option?.name}
                        key={key}
                        {...tagProps}
                      />
                    );
                  })
                }
              />
            )}
          </Box>

          {loading.value && (
            <ClimbingBoxLoader
              color={settings.themeMode === 'light' ? 'black' : 'white'}
              size={18}
              cssOverride={{
                marginInline: 'auto',
              }}
            />
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              modal.onFalse();
              reset();
            }}
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
            Cancel
          </Button>

          <LoadingButton
            type="submit"
            disabled={!selectedCreator.length || isSubmitting}
            loading={loading.value}
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
            Shortlist {selectedCreator.length > 0 && selectedCreator.length} Creators
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );

  return (
    <>
      <Stack gap={3}>
        <Stack alignItems="center" direction="row" justifyContent="space-between">
          <TextField
            placeholder="Search by Creator Name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            fullWidth={!smUp}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="material-symbols:search" />
                </InputAdornment>
              ),
              sx: {
                height: '42px',
                '& input': {
                  py: 3,
                  height: '42px',
                },
              },
            }}
            sx={{
              width: { xs: '100%', md: 260 },
              '& .MuiOutlinedInput-root': {
                height: '42px',
                border: '1px solid #e7e7e7',
                borderBottom: '3px solid #e7e7e7',
                borderRadius: 1,
              },
            }}
          />
          {!smUp ? (
            <IconButton
              sx={{ bgcolor: (theme) => theme.palette.background.paper, borderRadius: 1 }}
              onClick={modal.onTrue}
            >
              <Iconify icon="fluent:people-add-28-filled" width={18} />
            </IconButton>
          ) : (
            <Button
              onClick={modal.onTrue}
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
              startIcon={<Iconify icon="fluent:people-add-28-filled" width={16} />}
            >
              Shortlist New Creators
            </Button>
          )}
        </Stack>
        {campaign?.shortlisted?.length > 0 ? (
          <>
            <Box
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              }}
              gap={2}
              sx={{
                width: '100%',
                '& > *': {
                  minWidth: 0,
                  height: '100%',
                },
              }}
            >
              {filteredCreators?.map((elem) => (
                <UserCard
                  key={elem?.id}
                  creator={elem?.user}
                  campaignId={campaign?.id}
                  isSent={elem.isSent}
                  onEditAgreement={() => handleEditAgreement(elem)}
                  agreementStatus={elem.agreementStatus}
                  campaignMutate={campaignMutate}
                />
              ))}
            </Box>
            {filteredCreators?.length < 1 && (
              <EmptyContent title={`No Creator with name "${query}" Found`} />
            )}
          </>
        ) : (
          <EmptyContent title="No Shortlisted Creator." />
        )}
      </Stack>
      {renderShortlistFormModal}
      {/* {renderConfirmationModal} */}
      <CampaignAgreementEdit
        dialog={editDialog}
        agreement={selectedAgreement}
        campaign={campaign}
      />
    </>
  );
};

export default CampaignDetailCreator;

CampaignDetailCreator.propTypes = {
  campaign: PropTypes.any,
  campaignMutate: PropTypes.func,
};
