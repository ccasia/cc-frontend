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
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { addTreasureHuntLocation, updateTreasureHuntLocation } from 'src/api/treasure-hunts';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFUpload, RHFSwitch, RHFTextField } from 'src/components/hook-form';

import {
  inputSx,
  RequiredMark,
  fieldLabelSx,
  dialogTitleSx,
  primaryButtonSx,
  dialogPaperProps,
  secondaryButtonSx,
} from './find-cipta-shared';

const buildSchema = (isEdit) =>
  Yup.object().shape({
    name: Yup.string()
      .trim()
      .required('Location name is required')
      .max(255, 'Keep it under 255 characters'),
    hint: Yup.string().trim().required('A hint is required'),
    isEnabled: Yup.boolean(),
    artwork: isEdit
      ? Yup.mixed().nullable()
      : Yup.mixed()
          .required('Artwork is required')
          .test('has-file', 'Artwork is required', (v) => Boolean(v)),
  });

export default function FindCiptaLocationForm({ open, onClose, huntId, location, mutate }) {
  const isEdit = Boolean(location);

  const methods = useForm({
    resolver: yupResolver(buildSchema(isEdit)),
    defaultValues: { name: '', hint: '', isEnabled: true, artwork: null },
  });

  const {
    reset,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (!open) return;
    reset({
      name: location?.name ?? '',
      hint: location?.hint ?? '',
      isEnabled: location?.isEnabled ?? true,
      // A string value renders the existing image; a File means it was replaced.
      artwork: location?.artworkUrl ?? null,
    });
  }, [open, location, reset]);

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
      const artwork = typeof data.artwork === 'string' || !data.artwork ? undefined : data.artwork;

      if (isEdit) {
        await updateTreasureHuntLocation(
          huntId,
          location.id,
          { name: data.name.trim(), hint: data.hint.trim(), isEnabled: data.isEnabled },
          artwork
        );
        enqueueSnackbar('Location updated.');
      } else {
        await addTreasureHuntLocation(
          huntId,
          { name: data.name.trim(), hint: data.hint.trim() },
          artwork
        );
        enqueueSnackbar('Location added.');
      }

      await mutate();
      onClose();
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to save the location.', { variant: 'error' });
    }
  });

  return (
    <Dialog fullWidth open={open} onClose={onClose} maxWidth="sm" PaperProps={dialogPaperProps}>
      <DialogTitle sx={dialogTitleSx}>
        {isEdit ? 'Edit location' : 'Add location'}
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
                Location name
                <RequiredMark />
              </Typography>
              <RHFTextField name="name" placeholder="e.g. ZUS Coffee, Bangsar" sx={inputSx} />
              <Typography sx={{ mt: 0.5, color: '#8E8E93', fontSize: '0.75rem' }}>
                Shown in the app&apos;s collectible grid and in your reports.
              </Typography>
            </Box>

            <Box>
              <Typography sx={fieldLabelSx}>
                Hint
                <RequiredMark />
              </Typography>
              <RHFTextField name="hint" placeholder="e.g. Look behind the counter" sx={inputSx} />
              <Typography sx={{ mt: 0.5, color: '#8E8E93', fontSize: '0.75rem' }}>
                Shown under the location name before someone scans it — keep it short and cryptic.
              </Typography>
            </Box>

            <Box>
              <Typography sx={fieldLabelSx}>
                Location artwork
                {!isEdit && <RequiredMark />}
              </Typography>
              <Typography sx={{ mb: 1, color: '#8E8E93', fontSize: '0.75rem' }}>
                Square image shown in the app&apos;s collectible grid before someone scans this
                spot. Once they scan it, their own photo replaces it. JPG or PNG, 1:1, max 3 MB.
                {isEdit && ' Drop a new image to replace the current one.'}
              </Typography>
              <RHFUpload
                name="artwork"
                type="file"
                maxSize={3145728}
                onDrop={handleDrop}
                onDelete={() => setValue('artwork', null, { shouldValidate: true })}
              />
            </Box>

            {isEdit && (
              <Box>
                <RHFSwitch name="isEnabled" label="Show this spot in the app" />
                <Typography sx={{ color: '#8E8E93', fontSize: '0.75rem' }}>
                  Switch off to hide it from the app without losing the scans it already has.
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} sx={secondaryButtonSx}>
            Cancel
          </Button>
          <LoadingButton type="submit" loading={isSubmitting} sx={primaryButtonSx}>
            {isEdit ? 'Save changes' : 'Add location'}
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}

FindCiptaLocationForm.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  huntId: PropTypes.string,
  location: PropTypes.object,
  mutate: PropTypes.func,
};
