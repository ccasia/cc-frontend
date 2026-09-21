import dayjs from 'dayjs';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { useEffect, useCallback } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { updateTreasureHunt } from 'src/api/treasure-hunts';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFUpload, RHFTextField } from 'src/components/hook-form';

import {
  INK,
  MUTED,
  inputSx,
  RequiredMark,
  fieldLabelSx,
  dialogTitleSx,
  primaryButtonSx,
  dialogPaperProps,
  secondaryButtonSx,
} from './find-cipta-shared';

// <input type="datetime-local"> only understands this shape.
const toLocalInput = (value) => (value ? dayjs(value).format('YYYY-MM-DDTHH:mm') : '');

const schema = Yup.object().shape({
  title: Yup.string()
    .trim()
    .required('Event name is required')
    .max(255, 'Keep it under 255 characters'),
  description: Yup.string().trim().required('Description is required'),
  startsAt: Yup.string().required('Start date is required'),
  endsAt: Yup.string()
    .required('End date is required')
    .test('after-start', 'The end date must be after the start date', (value, context) =>
      Boolean(
        value && context.parent.startsAt && new Date(value) > new Date(context.parent.startsAt)
      )
    ),
  rewardXp: Yup.number()
    .typeError('XP must be a number')
    .required('XP per scan is required')
    .integer('Must be a whole number')
    .positive('Must be greater than zero'),
  artwork: Yup.mixed().nullable(),
});

export default function FindCiptaEventEdit({ open, onClose, hunt, mutate }) {
  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      startsAt: '',
      endsAt: '',
      rewardXp: 50,
      artwork: null,
    },
  });

  const {
    reset,
    setValue,
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const artwork = watch('artwork');
  let artworkTitle = 'Add event artwork';

  if (typeof artwork === 'string') {
    artworkTitle = 'Current event artwork';
  } else if (artwork) {
    artworkTitle = 'Replacement ready';
  }

  useEffect(() => {
    if (open && hunt) {
      reset({
        title: hunt.title ?? '',
        description: hunt.description ?? '',
        startsAt: toLocalInput(hunt.startsAt),
        endsAt: toLocalInput(hunt.endsAt),
        rewardXp: hunt.rewardXp ?? 50,
        // A string value renders the existing image; a File means it was replaced.
        artwork: hunt.heroArtworkUrl ?? null,
      });
    }
  }, [open, hunt, reset]);

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        setValue('artwork', Object.assign(file, { preview: URL.createObjectURL(file) }), {
          shouldValidate: true,
        });
      }
    },
    [setValue]
  );

  const onSubmit = handleSubmit(async (data) => {
    try {
      const artworkFile =
        typeof data.artwork === 'string' || !data.artwork ? undefined : data.artwork;

      await updateTreasureHunt(
        hunt.id,
        {
          title: data.title.trim(),
          description: data.description.trim(),
          startsAt: new Date(data.startsAt).toISOString(),
          endsAt: new Date(data.endsAt).toISOString(),
          rewardXp: Number(data.rewardXp),
        },
        artworkFile
      );

      enqueueSnackbar('Event updated.');
      await mutate();
      onClose();
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to update the event.', { variant: 'error' });
    }
  });

  return (
    <Dialog fullWidth open={open} onClose={onClose} maxWidth="sm" PaperProps={dialogPaperProps}>
      <DialogTitle sx={dialogTitleSx}>
        Edit event
        <IconButton onClick={onClose} size="small">
          <Iconify icon="mdi:close" width={24} />
        </IconButton>
      </DialogTitle>

      <Divider sx={{ borderColor: '#EBEBEB', mx: 3 }} />

      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography sx={fieldLabelSx}>
                Event name
                <RequiredMark />
              </Typography>
              <RHFTextField name="title" placeholder="Find Cipta" sx={inputSx} />
            </Box>

            <Box>
              <Typography sx={fieldLabelSx}>
                Description
                <RequiredMark />
              </Typography>
              <RHFTextField
                name="description"
                multiline
                rows={3}
                placeholder="Shown under the event name in the app."
                sx={inputSx}
              />
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box flex={1}>
                <Typography sx={fieldLabelSx}>
                  Starts
                  <RequiredMark />
                </Typography>
                <RHFTextField name="startsAt" type="datetime-local" sx={inputSx} />
              </Box>
              <Box flex={1}>
                <Typography sx={fieldLabelSx}>
                  Ends
                  <RequiredMark />
                </Typography>
                <RHFTextField name="endsAt" type="datetime-local" sx={inputSx} />
              </Box>
            </Stack>

            <Box>
              <Typography sx={fieldLabelSx}>
                XP per scan
                <RequiredMark />
              </Typography>
              <RHFTextField name="rewardXp" type="number" sx={inputSx} />
              <Typography sx={{ mt: 0.5, color: '#8E8E93', fontSize: '0.75rem' }}>
                Awarded once per location, the first time someone collects it. Changing this only
                affects scans from now on.
              </Typography>
            </Box>

            <Box>
              <Typography
                sx={{ ...fieldLabelSx, display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                Event artwork
                <Tooltip
                  title='Square image shown on the "Limited Time Event" card in the app home feed, at the top of the event screen, and on the public page people land on when they scan a QR without the app. JPG or PNG, 1:1, max 3 MB.'
                  placement="top"
                  arrow
                >
                  <Box component="span" sx={{ display: 'inline-flex' }}>
                    <Iconify
                      icon="eva:question-mark-circle-outline"
                      width={15}
                      sx={{ color: '#B0B0B0', cursor: 'help' }}
                    />
                  </Box>
                </Tooltip>
              </Typography>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{
                  p: 1.5,
                  border: '1px solid #E1E1E3',
                  borderRadius: 2,
                  bgcolor: '#fff',
                  boxShadow: '0 1px 0 rgba(20, 18, 19, 0.04)',
                }}
              >
                <RHFUpload
                  name="artwork"
                  type="file"
                  maxSize={3145728}
                  height={176}
                  inputId="event-artwork-input"
                  previewAlt="Event artwork preview"
                  previewSx={{ aspectRatio: '1 / 1', overflow: 'hidden' }}
                  sx={{
                    width: { xs: '100%', sm: 176 },
                    flexShrink: 0,
                    '& .MuiListItemText-primary': { fontSize: '0.875rem', fontWeight: 700 },
                    '& .MuiListItemText-secondary': { fontSize: '0.7rem', mt: 0.5 },
                  }}
                  onDrop={handleDrop}
                />

                <Stack spacing={1.5} sx={{ minWidth: 0, py: 0.5, flex: 1 }}>
                  <Box>
                    <Typography sx={{ color: INK, fontSize: '0.875rem', fontWeight: 700 }}>
                      {artworkTitle}
                    </Typography>
                    <Typography sx={{ color: MUTED, fontSize: '0.75rem', lineHeight: 1.5, mt: 0.5 }}>
                      Used on the event card, event header, and public QR landing page.
                    </Typography>
                  </Box>

                  <Stack direction="row" useFlexGap flexWrap="wrap" gap={0.75}>
                    {['JPG or PNG', '1:1 square', 'Max 3 MB'].map((spec) => (
                      <Box
                        component="span"
                        key={spec}
                        sx={{
                          px: 1,
                          py: 0.45,
                          borderRadius: 0.75,
                          bgcolor: '#F1F2F4',
                          color: '#636366',
                          fontSize: '0.688rem',
                          fontWeight: 700,
                          lineHeight: 1,
                        }}
                      >
                        {spec}
                      </Box>
                    ))}
                  </Stack>

                  <Button
                    component="label"
                    htmlFor="event-artwork-input"
                    startIcon={<Iconify icon="solar:camera-add-bold" width={17} />}
                    sx={{
                      alignSelf: 'flex-start',
                      mt: 'auto !important',
                      minHeight: 40,
                      px: 1.5,
                      border: '1px solid #D8DCE8',
                      borderBottom: '2px solid #C9CEDD',
                      borderRadius: 1,
                      bgcolor: '#fff',
                      color: '#203FF5',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'none',
                      '&:hover': { bgcolor: '#F5F7FF', borderColor: '#BCC5ED' },
                    }}
                  >
                    {artwork ? 'Change image' : 'Choose image'}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} sx={secondaryButtonSx}>
            Cancel
          </Button>
          <LoadingButton type="submit" loading={isSubmitting} sx={primaryButtonSx}>
            Save changes
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}

FindCiptaEventEdit.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  hunt: PropTypes.object,
  mutate: PropTypes.func,
};
