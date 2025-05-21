import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { FixedSizeList } from 'react-window';
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
  Typography,
  DialogTitle,
  ListItemText,
  Autocomplete,
  DialogContent,
  DialogActions,
  InputAdornment,
  CircularProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import { useGetAgreements } from 'src/hooks/use-get-agreeements';

import { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import { shortlistCreator, useGetAllCreators } from 'src/api/creator';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';
import { RHFAutocomplete } from 'src/components/hook-form';
import { useSettingsContext } from 'src/components/settings';
import FormProvider from 'src/components/hook-form/form-provider';

import UserCard from './user-card';
import CampaignAgreementEdit from '../campaign-agreement-edit';
import AssignUGCVideoModal from './dialog/assign-ugc-videos-modal';
import { useShortlistedCreators } from './hooks/shortlisted-creator';
import ShortlistedCreatorPopUp from './hooks/shortlisted-creator-popup';

const LISTBOX_PADDING = 8;
const OuterElementContext = React.createContext({});

const ListboxComponent = React.forwardRef((props, ref) => {
  // eslint-disable-next-line react/prop-types
  const { children, ...other } = props;
  const items = React.Children.toArray(children);

  const itemCount = items.length;
  const itemSize = 60; // Adjust row height

  return (
    <div ref={ref} {...other}>
      <OuterElementContext.Provider value={other}>
        <FixedSizeList
          height={
            itemCount > 8 ? 8 * itemSize + LISTBOX_PADDING : itemCount * itemSize + LISTBOX_PADDING
          }
          width="100%"
          itemSize={itemSize}
          itemCount={itemCount}
          overscanCount={5}
        >
          {({ index, style }) => (
            <div style={{ ...style, top: style.top + LISTBOX_PADDING }}>{items[index]}</div>
          )}
        </FixedSizeList>
      </OuterElementContext.Provider>
    </div>
  );
});

const CampaignDetailCreator = ({ campaign, campaignMutate }) => {
  const [query, setQuery] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const { data, isLoading } = useGetAllCreators();

  const { user } = useAuthContext();

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
  const ugcVidesoModal = useBoolean();
  const { addCreators, shortlistedCreators: creators } = useShortlistedCreators();

  const totalUsedCredits = campaign?.shortlisted?.reduce(
    (acc, creator) => acc + (creator?.ugcVideos ?? 0),
    0
  );

  const ugcLeft = useMemo(() => {
    if (!campaign?.campaignCredits) return null;
    const totalUGCs = campaign?.shortlisted?.reduce((acc, sum) => acc + (sum?.ugcVideos ?? 0), 0);
    return campaign.campaignCredits - totalUGCs;
  }, [campaign]);

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

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );

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

  const handleToggleSort = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const filteredCreators = useMemo(
    () => {
      let filtered = query
        ? creatorsWithAgreements?.filter((elem) =>
            elem?.user?.name?.toLowerCase().includes(query.toLowerCase())
          )
        : creatorsWithAgreements;
        
      if (filtered?.length) {
        filtered = [...filtered].sort((a, b) => {
          const nameA = (a?.user?.name || '').toLowerCase();
          const nameB = (b?.user?.name || '').toLowerCase();
          
          return sortDirection === 'asc' 
            ? nameA.localeCompare(nameB) 
            : nameB.localeCompare(nameA);
        });
      }
      
      return filtered;
    },
    [creatorsWithAgreements, query, sortDirection]
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

  const renderShortlistFormModalWithCampaignCredits = (
    <Dialog
      open={modal.value}
      onClose={selectedCreator.length ? confirmModal.onTrue : modal.onFalse}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 0.5,
        },
      }}
    >
      <DialogTitle
        sx={{
          fontFamily: (theme) => theme.typography.fontSecondaryFamily,
          '&.MuiTypography-root': {
            fontSize: 25,
          },
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          Shortlist Creators
          <Label
            sx={{
              fontFamily: (theme) => theme.typography.fontFamily,
            }}
          >
            UGC Credits: {ugcLeft} left
          </Label>
        </Stack>
      </DialogTitle>

      {isLoading ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 2,
          }}
        >
          <CircularProgress
            thickness={7}
            size={25}
            sx={{
              color: (theme) => theme.palette.common.black,
              strokeLinecap: 'round',
            }}
          />
        </Box>
      ) : (
        <>
          <Box
            sx={{ width: '100%', borderBottom: '1px solid', borderColor: 'divider', mt: -1, mb: 2 }}
          />
          <DialogContent>
            <Box py={1}>
              <Box sx={{ mb: 2, fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem' }}>
                Who would you like to shortlist?
              </Box>

              <Autocomplete
                value={creators}
                onChange={(e, val) => {
                  addCreators(val, user);

                }}
                ListboxComponent={ListboxComponent}
                disableListWrap
                multiple
                disableCloseOnSelect
                options={data?.filter(
                  (item) => item.status === 'active' && item?.creator?.isFormCompleted
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
                renderInput={(params) => (
                  <TextField label="Select Creator to shortlist" {...params} />
                )}
              />
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
              disabled={isSubmitting || !creators.length}
              loading={loading.value}
              onClick={() => {
                if (campaign?.campaignCredits) {
                  ugcVidesoModal.onTrue();
                } else {
                  console.log('ASDS');
                }
              }}
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
              Continue
            </LoadingButton>
          </DialogActions>
        </>
      )}
    </Dialog>
  );

  const renderShortlistFormModalWithoutCampaignCredits = (
    <Dialog
      open={modal.value}
      onClose={selectedCreator.length ? confirmModal.onTrue : modal.onFalse}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 0.5,
        },
      }}
    >
      <DialogTitle
        sx={{
          fontFamily: (theme) => theme.typography.fontSecondaryFamily,
          '&.MuiTypography-root': {
            fontSize: 25,
          },
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          Shortlist Creators
          {campaign?.campaignCredits && (
            <Label
              sx={{
                fontFamily: (theme) => theme.typography.fontFamily,
              }}
            >
              UGC Credits: {ugcLeft} left
            </Label>
          )}
        </Stack>
      </DialogTitle>

      {isLoading ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 2,
          }}
        >
          <CircularProgress
            thickness={7}
            size={25}
            sx={{
              color: (theme) => theme.palette.common.black,
              strokeLinecap: 'round',
            }}
          />
        </Box>
      ) : (
        <>
          <Box
            sx={{ width: '100%', borderBottom: '1px solid', borderColor: 'divider', mt: -1, mb: 2 }}
          />
          <FormProvider methods={methods} onSubmit={onSubmit}>
            <DialogContent>
              <Box py={1}>
                <Box sx={{ mb: 2, fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem' }}>
                  Who would you like to shortlist?
                </Box>

                <RHFAutocomplete
                  name="creator"
                  label="Select Creator to shortlist"
                  ListboxComponent={ListboxComponent}
                  disableListWrap
                  multiple
                  disableCloseOnSelect
                  options={data?.filter(
                    (item) => item.status === 'active' && item?.creator?.isFormCompleted
                  )}
                  filterOptions={(option, state) => {
                    const options = option.filter(
                      (item) => !shortlistedCreatorsId.includes(item.id)
                    );
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
                          avatar={
                            <Avatar src={option?.photoURL}>{option?.name?.slice(0, 1)}</Avatar>
                          }
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
                disabled={isDisabled || !selectedCreator.length || isSubmitting}
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
        </>
      )}
    </Dialog>
  );

  return (
    <>
      <Stack gap={3}>
        <Stack alignItems="center" direction="row" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
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
            
            <Button
              onClick={handleToggleSort}
              endIcon={
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  {sortDirection === 'asc' ? (
                    <Stack direction="column" alignItems="center" spacing={0}>
                      <Typography variant="caption" sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 700 }}>
                        A
                      </Typography>
                      <Typography variant="caption" sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 400 }}>
                        Z
                      </Typography>
                    </Stack>
                  ) : (
                    <Stack direction="column" alignItems="center" spacing={0}>
                      <Typography variant="caption" sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 400 }}>
                        Z
                      </Typography>
                      <Typography variant="caption" sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 700 }}>
                        A
                      </Typography>
                    </Stack>
                  )}
                  <Iconify 
                    icon={sortDirection === 'asc' ? 'eva:arrow-downward-fill' : 'eva:arrow-upward-fill'} 
                    width={12}
                  />
                </Stack>
              }
              sx={{
                px: 1.5,
                py: 0.75,
                height: '42px',
                color: '#637381',
                fontWeight: 600,
                fontSize: '0.875rem',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: 1,
                textTransform: 'none',
                whiteSpace: 'nowrap',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: '#221f20',
                },
              }}
            >
              Alphabetical
            </Button>
          </Stack>
          
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
              disabled={isDisabled || totalUsedCredits === campaign?.campaignCredits}
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
                  campaign={campaign}
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

      {campaign?.campaignCredits
        ? renderShortlistFormModalWithCampaignCredits
        : renderShortlistFormModalWithoutCampaignCredits}

      <AssignUGCVideoModal
        dialog={ugcVidesoModal.value}
        onClose={ugcVidesoModal.onFalse}
        credits={campaign?.campaignCredits ?? 0}
        campaignId={campaign.id}
        modalClose={modal.onFalse}
        creditsLeft={ugcLeft}
      />

      <CampaignAgreementEdit
        dialog={editDialog}
        agreement={selectedAgreement}
        campaign={campaign}
      />
      <ShortlistedCreatorPopUp/>
    

    </>
  );
};

export default CampaignDetailCreator;

CampaignDetailCreator.propTypes = {
  campaign: PropTypes.any,
  campaignMutate: PropTypes.func,
};
