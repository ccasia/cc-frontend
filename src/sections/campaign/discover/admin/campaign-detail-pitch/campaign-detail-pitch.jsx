/* eslint-disable no-nested-ternary */
import dayjs from 'dayjs';
/* eslint-disable no-plusplus */
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useTheme } from '@emotion/react';
import { LoadingButton } from '@mui/lab';
import React, { useMemo, useState } from 'react';

import {
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  Autocomplete,
  Box,
  Stack,
  Table,
  Button,
  Avatar,
  TableRow,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  InputAdornment,
  TableContainer,
  CircularProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import { useAuthContext } from 'src/auth/hooks';
import { shortlistCreator, useGetAllCreators, shortlistGuestCreator } from 'src/api/creator';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import EmptyContent from 'src/components/empty-content/empty-content';

import PitchModal from '../pitch-modal';
import MediaKitModal from '../media-kit-modal';
import { useShortlistedCreators } from '../campaign-detail-creator/hooks/shortlisted-creator';

const TABLE_HEAD = [
  { id: 'creator', label: 'Creator', width: 300 },
  { id: 'email', label: "Creator's Email", width: 350 },
  { id: 'submitDate', label: 'Pitch Submitted', width: 120 },
  { id: 'format', label: 'Pitch Format', width: 100 },
  { id: 'status', label: 'Status', width: 100 },
  { id: 'actions', label: 'Actions', width: 80 },
];

const CampaignDetailPitch = ({ pitches, timelines, campaign, onUpdate }) => {
  const { user } = useAuthContext();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedPitch, setSelectedPitch] = useState(null);
  const [openPitchModal, setOpenPitchModal] = useState(false);
  const [addCreatorOpen, setAddCreatorOpen] = useState(false);
  const [nonPlatformOpen, setNonPlatformOpen] = useState(false);
  const [platformCreatorOpen, setPlatformCreatorOpen] = useState(false);
  const mediaKit = useBoolean();
  const theme = useTheme();
  const smUp = useResponsive('up', 'sm');
  const modal = useBoolean();
  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );
  const [modalOpen, setModalOpen] = useState(false);

  const handleModalOpen = () => {
    setAddCreatorOpen(true);
  };
  const handleModalClose = () => setModalOpen(false);

  const totalUsedCredits = campaign?.shortlisted?.reduce(
    (acc, creator) => acc + (creator?.ugcVideos ?? 0),
    0
  );

  const undecidedCount = pitches?.filter((pitch) => pitch.status === 'undecided').length || 0;
  const approvedCount = pitches?.filter((pitch) => pitch.status === 'approved').length || 0;

  const filteredPitches = useMemo(() => {
    let filtered = pitches;

    // Apply status filter
    if (selectedFilter === 'undecided') {
      filtered = filtered?.filter((pitch) => pitch.status === 'undecided');
    } else if (selectedFilter === 'approved') {
      filtered = filtered?.filter((pitch) => pitch.status === 'approved');
    }

    // Apply search filter
    if (search) {
      filtered = filtered?.filter((elem) =>
        elem.user.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    return filtered;
  }, [pitches, selectedFilter, search]);

  const matchCampaignPercentage = (pitch) => {
    if (!pitch) return null;

    const creator = pitch?.user?.creator;
    const requirements = campaign?.campaignRequirement;

    const calculateInterestMatchingPercentage = () => {
      if (!requirements?.creator_persona?.length || !creator?.interests?.length) return 0;

      // Convert creator interests to lowercase names
      const creatorInterests = creator.interests
        .map((int) => (typeof int === 'string' ? int.toLowerCase() : int?.name?.toLowerCase()))
        .filter(Boolean);

      // Count matching interests
      const matchingInterests = creatorInterests.filter((interest) =>
        requirements.creator_persona.map((p) => p.toLowerCase()).includes(interest)
      ).length;

      return (matchingInterests / requirements.creator_persona.length) * 100;
    };

    const calculateRequirementMatchingPercentage = () => {
      let matches = 0;
      let totalCriteria = 0;

      // Age check
      if (requirements?.age?.length) {
        totalCriteria++;
        const creatorAge = dayjs().diff(dayjs(creator.birthDate), 'year');
        const isAgeInRange = requirements.age.some((range) => {
          const [min, max] = range.split('-').map(Number);
          return creatorAge >= min && creatorAge <= max;
        });
        if (isAgeInRange) matches++;
      }

      // Gender check
      if (requirements?.gender?.length) {
        totalCriteria++;
        const creatorGender =
          creator.pronounce === 'he/him'
            ? 'male'
            : creator.pronounce === 'she/her'
              ? 'female'
              : 'nonbinary';
        if (requirements.gender.includes(creatorGender)) matches++;
      }

      // Language check
      if (requirements?.language?.length && creator.languages?.length) {
        totalCriteria++;
        const hasLanguageMatch = creator.languages.some((lang) =>
          requirements.language.map((l) => l.toLowerCase()).includes(lang.toLowerCase())
        );
        if (hasLanguageMatch) matches++;
      }

      return totalCriteria > 0 ? (matches / totalCriteria) * 100 : 0;
    };

    const interestMatch = calculateInterestMatchingPercentage();
    const requirementMatch = calculateRequirementMatchingPercentage();

    return Math.round(interestMatch * 0.5 + requirementMatch * 0.5);
  };

  const handleViewPitch = (pitch) => {
    const completePitch = pitches.find((p) => p.id === pitch.id);
    const data = matchCampaignPercentage(pitch);

    setSelectedPitch({ ...completePitch, matchingPercentage: data });
    setOpenPitchModal(true);
  };

  const handleClosePitchModal = () => {
    setOpenPitchModal(false);
  };

  const handlePitchUpdate = (updatedPitch) => {
    // Update the pitch in the local state
    const updatedPitches = pitches.map((p) => (p.id === updatedPitch.id ? updatedPitch : p));

    // Call the parent's onUpdate if it exists
    if (onUpdate) {
      onUpdate(updatedPitches);
    }
  };

  const mdUp = useResponsive('up', 'md');

  const handleCreatorTypeSelect = (type) => {
    setAddCreatorOpen(false);

    switch (type) {
      case 'platform':
        setPlatformCreatorOpen(true);
        break;
      case 'non-platform':
        setNonPlatformOpen(true);
        break;
      default:
        console.warn(`Unknown creator type: ${type}`);
    }
  };

  return pitches?.length > 0 ? (
    <>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ width: { xs: '100%', md: 'auto' } }}
        >
          <Button
            fullWidth={!mdUp}
            onClick={() => setSelectedFilter('all')}
            sx={{
              px: 1.5,
              py: 2.5,
              height: '42px',
              border: '1px solid #e7e7e7',
              borderBottom: '3px solid #e7e7e7',
              borderRadius: 1,
              fontSize: '0.85rem',
              fontWeight: 600,
              textTransform: 'none',
              ...(selectedFilter === 'all'
                ? {
                    color: '#203ff5',
                    bgcolor: 'rgba(32, 63, 245, 0.04)',
                  }
                : {
                    color: '#637381',
                    bgcolor: 'transparent',
                  }),
              '&:hover': {
                bgcolor: selectedFilter === 'all' ? 'rgba(32, 63, 245, 0.04)' : 'transparent',
              },
            }}
          >
            All
          </Button>

          <Button
            fullWidth={!mdUp}
            onClick={() => setSelectedFilter('undecided')}
            sx={{
              px: 1.5,
              py: 2.5,
              height: '42px',
              border: '1px solid #e7e7e7',
              borderBottom: '3px solid #e7e7e7',
              borderRadius: 1,
              fontSize: '0.85rem',
              fontWeight: 600,
              textTransform: 'none',
              ...(selectedFilter === 'undecided'
                ? {
                    color: '#203ff5',
                    bgcolor: 'rgba(32, 63, 245, 0.04)',
                  }
                : {
                    color: '#637381',
                    bgcolor: 'transparent',
                  }),
              '&:hover': {
                bgcolor: selectedFilter === 'undecided' ? 'rgba(32, 63, 245, 0.04)' : 'transparent',
              },
            }}
          >
            {`Pending (${undecidedCount})`}
          </Button>

          <Button
            fullWidth={!mdUp}
            onClick={() => setSelectedFilter('approved')}
            sx={{
              px: 1.5,
              py: 2.5,
              height: '42px',
              border: '1px solid #e7e7e7',
              borderBottom: '3px solid #e7e7e7',
              borderRadius: 1,
              fontSize: '0.85rem',
              fontWeight: 600,
              textTransform: 'none',
              ...(selectedFilter === 'approved'
                ? {
                    color: '#203ff5',
                    bgcolor: 'rgba(32, 63, 245, 0.04)',
                  }
                : {
                    color: '#637381',
                    bgcolor: 'transparent',
                  }),
              '&:hover': {
                bgcolor: selectedFilter === 'approved' ? 'rgba(32, 63, 245, 0.04)' : 'transparent',
              },
            }}
          >
            {`Approved (${approvedCount})`}
          </Button>

          <Button
            // onClick={handleToggleSort}
            // endIcon={
            //   <Stack direction="row" alignItems="center" spacing={0.5}>
            //     {sortDirection === 'asc' ? (
            //       <Stack direction="column" alignItems="center" spacing={0}>
            //         <Typography
            //           variant="caption"
            //           sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 700 }}
            //         >
            //           A
            //         </Typography>
            //         <Typography
            //           variant="caption"
            //           sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 400 }}
            //         >
            //           Z
            //         </Typography>
            //       </Stack>
            //     ) : (
            //       <Stack direction="column" alignItems="center" spacing={0}>
            //         <Typography
            //           variant="caption"
            //           sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 400 }}
            //         >
            //           Z
            //         </Typography>
            //         <Typography
            //           variant="caption"
            //           sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 700 }}
            //         >
            //           A
            //         </Typography>
            //       </Stack>
            //     )}
            //     <Iconify
            //       icon={
            //         sortDirection === 'asc' ? 'eva:arrow-downward-fill' : 'eva:arrow-upward-fill'
            //       }
            //       width={12}
            //     />
            //   </Stack>
            // }
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

        {/* <TextField
          placeholder="Search by Creator Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth={!mdUp}
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
        /> */}
        {!smUp ? (
          <IconButton
            sx={{ bgcolor: (theme) => theme.palette.background.paper, borderRadius: 1 }}
            onClick={handleModalOpen}
          >
            <Iconify icon="fluent:people-add-28-filled" width={18} />
          </IconButton>
        ) : (
          <Button
            onClick={handleModalOpen}
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
            Add New Creators
          </Button>
        )}
      </Stack>

      <Box>
        <Scrollbar>
          <TableContainer
            sx={{
              minWidth: 800,
              position: 'relative',
              bgcolor: 'transparent',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      py: 1,
                      color: '#221f20',
                      fontWeight: 600,
                      width: 300,
                      borderRadius: '10px 0 0 10px',
                      bgcolor: '#f5f5f5',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Creator
                  </TableCell>
                  <TableCell
                    sx={{
                      py: 1,
                      color: '#221f20',
                      fontWeight: 600,
                      width: 350,
                      bgcolor: '#f5f5f5',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Creator&apos;s Email
                  </TableCell>
                  <TableCell
                    sx={{
                      py: 1,
                      color: '#221f20',
                      fontWeight: 600,
                      width: 120,
                      bgcolor: '#f5f5f5',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Pitch Submitted
                  </TableCell>
                  <TableCell
                    sx={{
                      py: 1,
                      color: '#221f20',
                      fontWeight: 600,
                      width: 100,
                      bgcolor: '#f5f5f5',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Pitch Format
                  </TableCell>
                  <TableCell
                    sx={{
                      py: 1,
                      color: '#221f20',
                      fontWeight: 600,
                      width: 100,
                      bgcolor: '#f5f5f5',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Status
                  </TableCell>
                  <TableCell
                    sx={{
                      py: 1,
                      color: '#221f20',
                      fontWeight: 600,
                      width: 80,
                      borderRadius: '0 10px 10px 0',
                      bgcolor: '#f5f5f5',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {/* Actions */}
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredPitches?.map((pitch) => (
                  <TableRow
                    key={pitch.id}
                    hover
                    sx={{
                      bgcolor: 'transparent',
                      '& td': {
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      },
                    }}
                  >
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar
                          src={pitch.user?.photoURL}
                          alt={pitch.user?.name}
                          sx={{
                            width: 40,
                            height: 40,
                            border: '2px solid',
                            borderColor: 'background.paper',
                            boxShadow: theme.customShadows.z8,
                          }}
                        >
                          {pitch.user?.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2">{pitch.user?.name}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{pitch.user?.email}</TableCell>
                    <TableCell>
                      <Stack spacing={0.5} alignItems="start">
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '0.875rem',
                          }}
                        >
                          {new Date(pitch.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#8e8e93',
                            display: 'block',
                            fontSize: '0.875rem',
                            mt: '-2px',
                          }}
                        >
                          {new Date(pitch.createdAt).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>
                      {pitch.type === 'text' ? 'Letter' : pitch.type}
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          display: 'inline-block',
                          px: 1.5,
                          py: 0.5,
                          fontSize: '0.75rem',
                          border: '1px solid',
                          borderBottom: '3px solid',
                          borderRadius: 0.8,
                          bgcolor: 'white',
                          whiteSpace: 'nowrap',
                          ...(pitch.status === 'pending' && {
                            color: '#FF9A02',
                            borderColor: '#FF9A02',
                          }),
                          ...(pitch.status === 'undecided' && {
                            color: '#FF9A02',
                            borderColor: '#FF9A02',
                          }),
                          ...(pitch.status === 'approved' && {
                            color: '#1ABF66',
                            borderColor: '#1ABF66',
                          }),
                          ...(pitch.status === 'rejected' && {
                            color: '#ff4842',
                            borderColor: '#ff4842',
                          }),
                        }}
                      >
                        {pitch.status === 'undecided'
                          ? 'PENDING REVIEW'
                          : pitch.status?.toUpperCase() || 'PENDING'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleViewPitch(pitch)}
                        sx={{
                          cursor: 'pointer',
                          px: 1.5,
                          py: 2,
                          border: '1px solid #e7e7e7',
                          borderBottom: '3px solid #e7e7e7',
                          borderRadius: 1,
                          color: '#203ff5',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          textTransform: 'none',
                          bgcolor: 'transparent',
                          whiteSpace: 'nowrap',
                          '&:hover': {
                            bgcolor: 'rgba(32, 63, 245, 0.04)',
                            border: '1px solid #e7e7e7',
                            borderBottom: '3px solid #e7e7e7',
                          },
                        }}
                      >
                        View Pitch
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>
      </Box>

      <PitchModal
        pitch={selectedPitch}
        open={openPitchModal}
        onClose={handleClosePitchModal}
        onUpdate={handlePitchUpdate}
        campaign={campaign}
      />

      <MediaKitModal
        open={mediaKit.value}
        handleClose={mediaKit.onFalse}
        creatorId={selectedPitch?.user?.creator?.id}
      />

      <AddCreatorModal
        open={addCreatorOpen}
        onClose={() => setAddCreatorOpen(false)}
        onSelect={handleCreatorTypeSelect}
      />

      <PlatformCreatorModal
        open={platformCreatorOpen}
        onClose={() => setPlatformCreatorOpen(false)}
        campaign={campaign}
      />

      <NonPlatformCreatorFormDialog
        open={nonPlatformOpen}
        onClose={handleModalClose}
        campaignId={campaign.id}
      />
    </>
  ) : (
    <EmptyContent title="No Pitches" filled />
  );
};

export function AddCreatorModal({ open, onClose, onSelect }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Select Creator Type</DialogTitle>
      <Box sx={{ px: 3, pb: 3 }}>
        <DialogActions sx={{ flexDirection: 'column', gap: 2 }}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={() => onSelect('platform')}
          >
            Platform Creator
          </Button>
          <Button
            fullWidth
            variant="outlined"
            color="primary"
            onClick={() => onSelect('non-platform')}
          >
            Non-Platform Creator
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export function PlatformCreatorModal({ campaign }) {
  const { addCreators, shortlistedCreators: creators } = useShortlistedCreators();
  const { data, isLoading } = useGetAllCreators();
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

  const selectedCreator = watch('creator');
  const loading = useBoolean();
  const modal = useBoolean();
  const shortlistedCreators = campaign?.shortlisted;
  const shortlistedCreatorsId = shortlistedCreators?.map((item) => item.userId);

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
              itemCount > 8
                ? 8 * itemSize + LISTBOX_PADDING
                : itemCount * itemSize + LISTBOX_PADDING
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
                addCreators(val);
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
  </Dialog>;
}

export function NonPlatformCreatorFormDialog({ open, onClose, campaignId }) {
  const [formValues, setFormValues] = useState({
    creators: [{ name: '', followerCount: '', profileLink: '', adminComments: '' }],
  });

  const loading = useBoolean();

  const handleCreatorChange = (index, field) => (event) => {
    const updatedCreators = [...formValues.creators];
    updatedCreators[index][field] = event.target.value;
    setFormValues({ ...formValues, creators: updatedCreators });
  };

  const handleAddCreator = () => {
    if (formValues.creators.length < 3) {
      setFormValues((prev) => ({
        ...prev,
        creators: [
          ...prev.creators,
          { name: '', followerCount: '', profileLink: '', adminComments: '' },
        ],
      }));
    }
  };

  const handleRemoveCreator = () => {
    if (formValues.creators.length > 1) {
      const updated = formValues.creators.slice(0, formValues.creators.length - 1);
      setFormValues({ ...formValues, creators: updated });
    }
  };

  const handleSubmit = async () => {
    try {
      loading.onTrue();

      const res = await shortlistGuestCreator({
        guestCreators: formValues.creators,
        campaignId,
      });

      onClose();
      setFormValues({
        creators: [{ name: '', followerCount: '', profileLink: '', adminComments: '' }],
      });

      enqueueSnackbar(res?.data?.message || 'Creators shortlisted successfully!');
      mutate(`/campaign/creatorAgreement/${campaignId}`);
    } catch (error) {
      console.error('Error shortlisting guest creators:', error);
      enqueueSnackbar('Error shortlisting guest creator', { variant: 'error' });
    } finally {
      loading.onFalse();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: { backgroundColor: '#fafafa' },
      }}
    >
      <DialogTitle
        sx={{
          fontFamily: (theme) => theme.typography.fontSecondaryFamily,
          fontSize: 35,
          backgroundColor: '#fafafa',
          mt: -1,
          mb: 2,
        }}
      >
        Add Non-Platform Creator
      </DialogTitle>
      <DialogContent>
        {formValues.creators.map((creator, index) => (
          <Box
            key={index}
            mb={3}
            p={2}
            sx={{ width: '100%', borderBottom: '1px solid', borderColor: 'divider' }}
          >
            <Box display="flex" gap={2} mb={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" fontWeight="600" mb={0.5} display="block">
                  Creator Name
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={creator.name}
                  onChange={handleCreatorChange(index, 'name')}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" fontWeight="600" mb={0.5} display="block">
                  Follower Count
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={creator.followerCount}
                  onChange={handleCreatorChange(index, 'followerCount')}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" fontWeight="600" mb={0.5} display="block">
                  Profile Link
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={creator.profileLink}
                  onChange={handleCreatorChange(index, 'profileLink')}
                />
              </Box>
            </Box>
            <Box mb={2}>
              <Typography variant="caption" fontWeight="600" mb={0.5} display="block">
                CS Comments (Optional)
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={creator.adminComments}
                onChange={handleCreatorChange(index, 'adminComments')}
              />
            </Box>
          </Box>
        ))}

        <Box display="flex" justifyContent="flex-end" marginRight="10px" gap={1}>
          <Button
            variant="outlined"
            size="small"
            color="error"
            disabled={formValues.creators.length <= 1}
            onClick={handleRemoveCreator}
          >
            -
          </Button>
          <Button
            variant="contained"
            size="small"
            color="primary"
            disabled={formValues.creators.length >= 3}
            onClick={handleAddCreator}
          >
            +
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSubmit} variant="contained" disabled={loading.value}>
          {loading.value ? 'Adding...' : 'Add Creator'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CampaignDetailPitch;

CampaignDetailPitch.propTypes = {
  pitches: PropTypes.array,
  timelines: PropTypes.array,
  campaign: PropTypes.object,
  onUpdate: PropTypes.func,
};
