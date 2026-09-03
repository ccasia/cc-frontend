import * as yup from 'yup';
import PropTypes from 'prop-types';
import { UAParser } from 'ua-parser-js';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import React, { useRef, useMemo, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useInfiniteQuery } from '@tanstack/react-query';

import { LoadingButton } from '@mui/lab';
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Stack, Dialog, Button, Divider, IconButton, Typography } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import FormProvider, { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

import Iconify from './iconify';

const CATEGORIES = [
  { id: 'ui', label: 'UI / layout' },
  { id: 'data', label: 'Wrong data' },
  { id: 'payments', label: 'Payments' },
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'auth', label: 'Login & access' },
  { id: 'other', label: 'Something else' },
];

const MAX_ATTACHMENTS = 5;

const schema = yup.object().shape({
  stepsToReproduce: yup.string().required('Please describe what happened'),
  category: yup.string().nullable(),
  campaignName: yup.object({}),
  attachments: yup
    .array()
    .of(yup.mixed())
    .max(MAX_ATTACHMENTS, `Maximum ${MAX_ATTACHMENTS} attachments allowed`),
});

const FieldLabel = ({ children, hint }) => (
  <Typography
    component="label"
    sx={{
      fontFamily: '"Inter Tight", sans-serif',
      fontSize: '12.5px',
      fontWeight: 500,
      color: '#3d3952',
    }}
  >
    {children}{' '}
    <Box component="span" sx={{ fontWeight: 400, color: '#8b8799' }}>
      — {hint}
    </Box>
  </Typography>
);

FieldLabel.propTypes = {
  children: PropTypes.node,
  hint: PropTypes.string,
};

const inputSx = {
  '& .MuiInputBase-root': {
    borderRadius: '11px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #ddd9e8',
    '&:hover': { backgroundColor: '#FFFFFF', borderColor: '#ddd9e8' },
    '&.Mui-focused': {
      backgroundColor: '#FFFFFF',
      borderColor: '#1340FF',
      boxShadow: '0 0 0 3px rgba(19, 64, 255, 0.12)',
    },
  },
  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
  '& .MuiInputBase-input': {
    padding: '12px 14px',
    fontFamily: '"Inter Tight", sans-serif',
    fontSize: '14px',
    color: '#17142e',
    '&::placeholder': { color: '#a9a6b4', opacity: 1 },
  },
};

const getContextSnapshot = (user) => {
  const parser = new UAParser();
  const result = parser.getResult();
  const browser = [result.browser.name, result.browser.version].filter(Boolean).join(' ');
  const os = [result.os.name, result.os.version].filter(Boolean).join(' ');

  return {
    path: window.location.pathname,
    browserOs: [browser, os].filter(Boolean).join(' · ') || 'Unknown device',
    viewport: `${window.innerWidth}×${window.innerHeight}`,
    account: user?.id ? `acct #${user.id.slice(-6)}` : undefined,
  };
};

const revokePreviews = (files) => {
  (files || []).forEach((file) => {
    if (file?.preview) URL.revokeObjectURL(file.preview);
  });
};

const placeholders = {
  creator: "Clicked Submit Pitch and it doesn't submit — the button just spins forever.",
  admin: 'Clicked Invite Client and the modal closed without sending anything.',
  client: 'Clicked Approve Deliverable and the page reloaded without saving my comment.',
};

const ITEM_HEIGHT = 36;

const VirtualizedListbox = React.forwardRef((props, ref) => {
  // eslint-disable-next-line react/prop-types
  const { children, onFetchNextPage, hasNextPage, isFetchingNextPage, ...other } = props;
  const items = React.Children.toArray(children);
  const parentRef = React.useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // Trigger next page when the last visible row is near the end
  React.useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;

    if (lastItem.index >= items.length - 1 && hasNextPage && !isFetchingNextPage) {
      onFetchNextPage?.();
    }
  }, [virtualItems, items.length, hasNextPage, isFetchingNextPage, onFetchNextPage]);

  return (
    <div ref={ref} {...other}>
      <div ref={parentRef} style={{ maxHeight: 300, overflow: 'auto' }}>
        <div
          style={{
            height: rowVirtualizer.getTotalSize(),
            position: 'relative',
            width: '100%',
          }}
        >
          {virtualItems.map((virtualRow) => (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: virtualRow.size,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {items[virtualRow.index]}
            </div>
          ))}
        </div>
        {isFetchingNextPage && (
          <div style={{ padding: 8, textAlign: 'center', fontSize: 13 }}>Loading more...</div>
        )}
      </div>
    </div>
  );
});

const BugReportForm = () => {
  const theme = useTheme();
  const { user } = useAuthContext();

  const bugFormDialog = useBoolean();
  const fileInputRef = useRef(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const {
    data: campaigns,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
  } = useInfiniteQuery({
    queryKey: ['campaigns'],
    queryFn: async ({ pageParam }) => {
      const res = await axiosInstance.get('/api/campaign/getAllActiveCampaign', {
        params: { cursor: pageParam, limit: 10 },
      });
      return res.data; // { campaigns, nextCursor, hasMore }
    },
    initialPageParam: undefined, // no cursor on first fetch
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    enabled: bugFormDialog.value,
  });

  const campaignOptions = useMemo(
    () => campaigns?.pages.flatMap((page) => page.campaigns) ?? [],
    [campaigns]
  );

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      stepsToReproduce: '',
      category: null,
      campaignName: '',
      attachments: [],
    },
  });

  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { isSubmitting },
  } = methods;

  const description = watch('stepsToReproduce');
  const category = watch('category');
  const attachments = watch('attachments') || [];

  const isFormFilled = !!description?.trim();

  const descriptionPlaceholder = placeholders[user?.role] || placeholders.admin;

  const contextSnapshot = useMemo(
    () => (bugFormDialog.value ? getContextSnapshot(user) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bugFormDialog.value, user?.id]
  );

  const addFiles = (newFiles) => {
    const room = MAX_ATTACHMENTS - attachments.length;
    if (room <= 0) {
      enqueueSnackbar(`Maximum ${MAX_ATTACHMENTS} attachments allowed`, { variant: 'warning' });
      return;
    }

    const filesToAdd = newFiles
      .filter((file) => file.type?.startsWith('image/'))
      .slice(0, room)
      .map((file) => Object.assign(file, { preview: URL.createObjectURL(file) }));

    if (filesToAdd.length) {
      setValue('attachments', [...attachments, ...filesToAdd], { shouldValidate: true });
    }
  };

  const handleRemoveFile = (fileToRemove) => {
    revokePreviews([fileToRemove]);
    setValue(
      'attachments',
      attachments.filter((file) => file !== fileToRemove),
      { shouldValidate: true }
    );
  };

  const handleDescriptionPaste = (event) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    const imageFiles = Array.from(items)
      .filter((item) => item.type?.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter(Boolean);

    if (imageFiles.length) addFiles(imageFiles);
  };

  const closeAndResetForm = () => {
    revokePreviews(getValues('attachments'));
    reset();
    bugFormDialog.onFalse();
  };

  const onSubmit = handleSubmit(async (data) => {
    const formData = new FormData();
    const { attachments: files, ...rest } = data;

    if (files?.length) {
      files.forEach((file) => {
        formData.append('attachments', file);
      });
    }

    formData.append(
      'data',
      JSON.stringify({
        ...rest,
        campaignName: rest.campaignName?.name ?? '',
        context: contextSnapshot || getContextSnapshot(user),
      })
    );

    try {
      const res = await axiosInstance.post(endpoints.bug.create, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      enqueueSnackbar(res?.data?.message || 'Report sent');
      setJustSubmitted(true);

      setTimeout(() => {
        setJustSubmitted(false);
        closeAndResetForm();
      }, 1400);
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    }
  });

  const feedbackButton = (
    <Box
      component="div"
      sx={{
        position: 'fixed',
        transform: 'rotate(-90deg)',
        transformOrigin: 'bottom right',
        top: { xs: 140, sm: 150, md: 160 },
        right: { xs: 8, sm: 12, md: 15 },
        zIndex: 1099,
      }}
    >
      <Button
        variant="contained"
        color="info"
        startIcon={<Iconify icon="solar:bug-line-duotone" width={20} />}
        onClick={bugFormDialog.onTrue}
        sx={{
          border: 1,
          borderBottomRightRadius: 0,
          borderBottomLeftRadius: 0,
          opacity: 0.5,
          transition: 'all linear .2s',
          py: { xs: 0.5, sm: 0.75, md: 1 },
          px: { xs: 1, sm: 1.5, md: 2 },
          fontSize: { xs: '11px', sm: '12px', md: '14px' },
          '&:hover': {
            opacity: 1,
          },
        }}
      >
        Report a bug
      </Button>
    </Box>
  );

  return (
    <>
      {feedbackButton}
      <Dialog
        open={bugFormDialog.value}
        maxWidth={false}
        PaperProps={{
          sx: {
            width: '640px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            borderRadius: '16px',
            padding: '24px',
            gap: '24px',
            backgroundColor: theme.palette.grey[100],
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <Stack sx={{ height: '100%', maxHeight: 'calc(90vh - 48px)' }}>
            {/* Header — fixed top */}
            <Stack spacing={1} sx={{ pb: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Stack spacing={1}>
                  <Typography
                    sx={{
                      fontFamily: 'Instrument Serif, serif',
                      fontWeight: 400,
                      fontSize: '32px',
                      lineHeight: '1.05',
                      color: '#17142e',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Report a bug
                  </Typography>

                  <Typography
                    sx={{
                      fontFamily: '"Inter Tight", sans-serif',
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '20px',
                      color: '#6B6879',
                    }}
                  >
                    Tell us what went wrong and we&apos;ll pick it up from here.
                  </Typography>
                </Stack>
                <IconButton
                  onClick={closeAndResetForm}
                  sx={{
                    mt: -0.5,
                    mr: -1,
                    color: theme.palette.grey[700],
                    '&:hover': {
                      color: theme.palette.grey[800],
                      bgcolor: alpha('#4B475E', 0.2),
                    },
                    bgcolor: alpha('#4B475E', 0.1),
                    borderRadius: 1,
                  }}
                >
                  <Iconify icon="charm:cross" width={20} />
                </IconButton>
              </Stack>
              <Divider sx={{ borderColor: '#E5E5EA', py: 1 }} />
            </Stack>

            {/* Form Fields */}
            <Box sx={{ flex: 1, overflowY: 'auto', py: 1, px: 2 }}>
              <Stack spacing={2.75}>
                <Stack gap={1}>
                  <FieldLabel hint="required">What happened?</FieldLabel>

                  <RHFTextField
                    name="stepsToReproduce"
                    placeholder={descriptionPlaceholder}
                    multiline
                    rows={4}
                    inputProps={{ onPaste: handleDescriptionPaste }}
                    sx={{
                      ...inputSx,
                      '& .MuiInputBase-root': {
                        ...inputSx['& .MuiInputBase-root'],
                        height: 'auto',
                        alignItems: 'flex-start',
                      },
                      '& .MuiInputBase-inputMultiline': {
                        padding: '0px',
                      },
                    }}
                  />
                  <Typography sx={{ fontSize: '11.5px', color: '#8b8799' }}>
                    If you can, include what you expected to happen instead. You can also paste an
                    image straight into this box.
                  </Typography>
                </Stack>

                <Stack gap={1.1}>
                  <FieldLabel hint="optional">Where does it sit?</FieldLabel>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {CATEGORIES.map((cat) => {
                      const selected = category === cat.id;
                      return (
                        <Box
                          key={cat.id}
                          component="button"
                          type="button"
                          onClick={() =>
                            setValue('category', selected ? null : cat.id, {
                              shouldValidate: true,
                            })
                          }
                          sx={{
                            px: '14px',
                            py: '9px',
                            fontFamily: '"Inter Tight", sans-serif',
                            fontSize: '13px',
                            fontWeight: 500,
                            borderRadius: '999px',
                            cursor: 'pointer',
                            transition: 'background .12s, color .12s, border-color .12s',
                            bgcolor: selected ? '#1340FF' : '#FFFFFF',
                            color: selected ? '#FFFFFF' : '#4b475e',
                            border: `1px solid ${selected ? '#1340FF' : '#ddd9e8'}`,
                          }}
                        >
                          {cat.label}
                        </Box>
                      );
                    })}
                  </Stack>
                </Stack>

                <Stack gap={1}>
                  <FieldLabel hint="optional">Campaign or client involved</FieldLabel>
                  <RHFAutocomplete
                    name="campaignName"
                    placeholder="Search campaigns..."
                    options={campaignOptions}
                    getOptionLabel={(option) => option.name ?? ''}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    loading={isPending}
                    ListboxComponent={VirtualizedListbox}
                    ListboxProps={{
                      onFetchNextPage: fetchNextPage,
                      hasNextPage,
                      isFetchingNextPage,
                    }}
                    sx={inputSx}
                  />
                  {/* <RHFTextField name="campaignName" placeholder="Search campaigns…" sx={inputSx} /> */}
                </Stack>

                <Stack gap={1.1}>
                  <Stack direction="row" alignItems="baseline" justifyContent="space-between">
                    <FieldLabel hint={`optional, up to ${MAX_ATTACHMENTS}`}>Screenshots</FieldLabel>
                    <Typography sx={{ fontSize: '11.5px', color: '#8b8799' }}>
                      JPG, PNG, SVG
                    </Typography>
                  </Stack>

                  <Stack direction="row" gap={1.25} flexWrap="wrap">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={(event) => {
                        addFiles(Array.from(event.target.files || []));
                        event.target.value = '';
                      }}
                    />

                    {attachments.length < MAX_ATTACHMENTS && (
                      <Box
                        component="button"
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        sx={{
                          width: 96,
                          height: 76,
                          flex: 'none',
                          border: '1px dashed #c9c4da',
                          borderRadius: '11px',
                          bgcolor: '#f7f5fb',
                          color: '#4b475e',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          '&:hover': {
                            borderColor: '#1340FF',
                            bgcolor: alpha('#1340FF', 0.06),
                            color: '#1340FF',
                          },
                        }}
                      >
                        <Typography sx={{ fontSize: '19px', lineHeight: 1 }}>+</Typography>
                        <Typography sx={{ fontSize: '11px' }}>Add file</Typography>
                      </Box>
                    )}

                    {attachments.map((file) => (
                      <Box
                        key={file.preview}
                        sx={{
                          width: 96,
                          height: 76,
                          flex: 'none',
                          position: 'relative',
                          borderRadius: '11px',
                          overflow: 'hidden',
                          boxShadow: 'inset 0 0 0 1px rgba(20,16,45,0.08)',
                        }}
                      >
                        <Box
                          component="img"
                          src={file.preview}
                          alt={file.name}
                          sx={{ width: 1, height: 1, objectFit: 'cover' }}
                        />
                        <IconButton
                          onClick={() => handleRemoveFile(file)}
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            width: 20,
                            height: 20,
                            bgcolor: 'rgba(20,16,45,0.55)',
                            color: '#fff',
                            '&:hover': { bgcolor: 'rgba(20,16,45,0.8)' },
                          }}
                        >
                          <Iconify icon="charm:cross" width={11} />
                        </IconButton>
                        <Typography
                          noWrap
                          sx={{
                            position: 'absolute',
                            bottom: 5,
                            left: 5,
                            right: 5,
                            fontFamily: '"IBM Plex Mono", monospace',
                            fontSize: '9.5px',
                            color: '#4b475e',
                            bgcolor: 'rgba(253,252,255,0.85)',
                            px: '5px',
                            py: '2px',
                            borderRadius: '4px',
                          }}
                        >
                          {file.name}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Stack>

                <Box
                  sx={{
                    border: '1px solid #ebe8f2',
                    bgcolor: '#f7f5fb',
                    borderRadius: '11px',
                    px: '14px',
                    py: '12px',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '11.5px',
                      fontWeight: 500,
                      color: '#3d3952',
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Attached automatically
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap="6px 10px" sx={{ mt: 0.75 }}>
                    {[
                      contextSnapshot?.path,
                      contextSnapshot?.browserOs,
                      contextSnapshot?.viewport,
                      contextSnapshot?.account,
                    ]
                      .filter(Boolean)
                      .map((text) => (
                        <Typography
                          key={text}
                          sx={{
                            fontFamily: '"IBM Plex Mono", monospace',
                            fontSize: '11px',
                            color: '#6b6879',
                          }}
                        >
                          {text}
                        </Typography>
                      ))}
                  </Stack>
                </Box>
              </Stack>
            </Box>

            {/* Footer — fixed bottom */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 2,
                pt: 2,
                mt: 1,
                borderTop: '1px solid #ebe8f2',
              }}
            >
              <Stack direction="row" gap={1.25}>
                <Button
                  variant="outlined"
                  onClick={closeAndResetForm}
                  sx={{
                    fontFamily: 'Inter Display, sans-serif',
                    fontWeight: 500,
                    fontSize: '13.5px',
                    textTransform: 'none',
                    borderRadius: '10px',
                    color: '#4b475e',
                    borderColor: '#ddd9e8',
                    px: 2,
                    '&:hover': { bgcolor: '#f1eff6', borderColor: '#ddd9e8', color: '#17142e' },
                  }}
                >
                  Cancel
                </Button>

                <LoadingButton
                  variant="contained"
                  type="submit"
                  loading={isSubmitting}
                  disabled={justSubmitted}
                  sx={{
                    backgroundColor: '#1340FF',
                    color: '#FFFFFF',
                    fontFamily: 'Inter Display, sans-serif',
                    fontWeight: 550,
                    fontSize: '14px',
                    lineHeight: '20px',
                    textTransform: 'none',
                    borderRadius: '8px',
                    px: 3,
                    pt: 1.25,
                    pb: 1.6,
                    boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
                    '&:hover': {
                      backgroundColor: '#0F35CC',
                      boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
                    },
                    ...(!isFormFilled && {
                      background:
                        'linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6)), #3A3A3C',
                      boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.1) inset',
                      pointerEvents: 'none',
                    }),
                    ...(justSubmitted && {
                      backgroundColor: '#1F8A5F',
                      '&:hover': { backgroundColor: '#1F8A5F' },
                    }),
                  }}
                >
                  {justSubmitted ? 'Report sent' : 'Submit report'}
                </LoadingButton>
              </Stack>
            </Box>
          </Stack>
        </FormProvider>
      </Dialog>
    </>
  );
};

export default BugReportForm;
