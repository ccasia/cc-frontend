import dayjs from 'dayjs';
import * as Yup from 'yup';
import { mutate } from 'swr';
import { useState } from 'react';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, useWatch, Controller, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { useBoolean } from 'src/hooks/use-boolean';
import { useEventListener } from 'src/hooks/use-event-listener';
import { useGetManageReleaseNotes } from 'src/hooks/use-get-release-notes';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import FormProvider, { RHFTextField, RHFDatePicker } from 'src/components/hook-form';

import { LIP_BUTTON_SX, RELEASE_TYPES, RELEASE_STATUS_META } from '../constants';

const EMPTY_ITEM = { type: 'NEW', title: '', description: '' };

const CalendarIcon = () => <Iconify icon="ant-design:calendar-outlined" width={20} />;

const IS_MAC =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);

const SUBMIT_SHORTCUT_LABEL = IS_MAC ? '⌘ + Enter' : 'Ctrl + Enter';

const getDefaultValues = () => ({ releaseDate: dayjs(), items: [{ ...EMPTY_ITEM }] });

const toFormValues = (release) => ({
  releaseDate: dayjs(release.releaseDate),
  items: release.items.map(({ type, title, description }) => ({ type, title, description })),
});

const ReleaseNoteSchema = Yup.object().shape({
  releaseDate: Yup.mixed()
    .required('Date is required')
    .test('valid-date', 'Invalid date', (value) => dayjs(value).isValid()),
  items: Yup.array()
    .of(
      Yup.object().shape({
        type: Yup.string().oneOf(RELEASE_TYPES).required(),
        title: Yup.string()
          .trim()
          .max(255, 'Keep the title under 255 characters')
          .required('Title is required'),
        description: Yup.string().trim().required('Description is required'),
      })
    )
    .min(1, 'Add at least one update'),
});

const getPrimaryLabel = (status, isFutureDate) => {
  if (status === 'PUBLISHED' || status === 'SCHEDULED') return 'Save changes';
  return isFutureDate ? 'Schedule' : 'Publish';
};

const getSaveMessage = (saved, previousStatus = 'DRAFT') => {
  if (saved.status === previousStatus) return 'Release saved';
  if (saved.status === 'PUBLISHED') return 'Release published';
  if (saved.status === 'SCHEDULED') {
    return `Release scheduled for ${dayjs(saved.releaseDate).format('DD MMM YYYY')}`;
  }
  return 'Release moved to drafts';
};

// ----------------------------------------------------------------------

function ReleaseListItem({ release, selected, onClick }) {
  const status = RELEASE_STATUS_META[release.status] ?? RELEASE_STATUS_META.DRAFT;
  const count = release.items.length;

  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        width: 1,
        py: 1.5,
        px: 2,
        borderRadius: 2.5,
        textAlign: 'left',
        justifyContent: 'space-between',
        border: '1px solid',
        borderColor: selected ? '#1340FF' : '#E7E7E7',
      }}
    >
      <Box>
        <Typography variant="subtitle1">
          {dayjs(release.releaseDate).format('DD MMM YYYY')}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {count} {count === 1 ? 'update' : 'updates'}
        </Typography>
      </Box>
      <Typography variant="caption" sx={{ color: status.color }}>
        {status.label}
      </Typography>
    </ButtonBase>
  );
}

ReleaseListItem.propTypes = {
  release: PropTypes.object,
  selected: PropTypes.bool,
  onClick: PropTypes.func,
};

function ReleaseItemCard({ index, canRemove, onRemove }) {
  const { control } = useFormContext();

  return (
    <Box sx={{ p: 2, border: '1px solid #E7E7E7', borderRadius: 1.5 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Controller
          name={`items.${index}.type`}
          control={control}
          render={({ field }) => (
            <Stack direction="row" spacing={1}>
              {RELEASE_TYPES.map((type) => {
                const selected = field.value === type;
                return (
                  <Button
                    key={type}
                    size="small"
                    variant={selected ? 'contained' : 'outlined'}
                    onClick={() => field.onChange(type)}
                    sx={{
                      borderRadius: 5,
                      px: 2,
                      ...(selected
                        ? { bgcolor: '#1340FF', '&:hover': { bgcolor: '#1340FF' } }
                        : { color: 'text.secondary', borderColor: '#D0D0D0' }),
                    }}
                  >
                    {type}
                  </Button>
                );
              })}
            </Stack>
          )}
        />

        {canRemove && (
          <Button size="small" onClick={onRemove} sx={{color: 'text.secondary'}}>
            Remove
          </Button>
        )}
      </Stack>

      <Stack spacing={2}>
        <RHFTextField name={`items.${index}.title`} label="Update Title" />
        <RHFTextField
          name={`items.${index}.description`}
          label="Update Description"
          multiline
          minRows={2}
        />
      </Stack>
    </Box>
  );
}

ReleaseItemCard.propTypes = {
  index: PropTypes.number,
  canRemove: PropTypes.bool,
  onRemove: PropTypes.func,
};

// ----------------------------------------------------------------------

export default function ReleaseNotesAdminView() {
  const confirm = useBoolean();
  const [selectedId, setSelectedId] = useState(null);
  // Wrapped in an object so "switch to a new blank release" ({ release: null }) is distinct
  // from "no switch pending" (null)
  const [pendingSwitch, setPendingSwitch] = useState(null);
  const { releases, isLoading, mutate: mutateReleases } = useGetManageReleaseNotes();

  const methods = useForm({
    resolver: yupResolver(ReleaseNoteSchema),
    defaultValues: getDefaultValues(),
  });

  const {
    control,
    reset,
    handleSubmit,
    formState: { isDirty, isSubmitting },
  } = methods;

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const selected = releases.find((release) => release.id === selectedId);
  const status = selected?.status;
  const isPublished = status === 'PUBLISHED';
  const isScheduled = status === 'SCHEDULED';

  const releaseDate = useWatch({ control, name: 'releaseDate' });
  const isFutureDate = dayjs(releaseDate).isValid() && dayjs(releaseDate).isAfter(dayjs(), 'day');

  // Reset in the handler (not an effect) so SWR revalidation never wipes in-progress edits
  const handleSelect = (release) => {
    setSelectedId(release?.id ?? null);
    reset(release ? toFormValues(release) : getDefaultValues());
  };

  // User-initiated switches (list click / New) confirm before discarding unsaved edits
  const requestSelect = (release) => {
    // Re-clicking the release that's already open is a no-op
    if (release && release.id === selectedId) return;
    if (isDirty) {
      setPendingSwitch({ release });
      return;
    }
    handleSelect(release);
  };

  const handleDiscardAndSwitch = () => {
    handleSelect(pendingSwitch.release);
    setPendingSwitch(null);
  };

  const refreshAll = () =>
    Promise.all([
      mutateReleases(),
      mutate(endpoints.releaseNotes.root),
      mutate(endpoints.releaseNotes.unseen),
    ]);

  const save = (publish) =>
    handleSubmit(async (values) => {
      const payload = {
        releaseDate: dayjs(values.releaseDate).format('YYYY-MM-DD'),
        items: values.items,
        publish,
      };

      try {
        const res = selectedId
          ? await axiosInstance.patch(endpoints.releaseNotes.detail(selectedId), payload)
          : await axiosInstance.post(endpoints.releaseNotes.root, payload);

        const saved = res.data.data;

        // Once a draft/new release is published or scheduled, start a blank release for the
        // next note; drafts and edits to scheduled/published releases stay selected
        const justReleased = publish && (!status || status === 'DRAFT');
        handleSelect(justReleased ? null : saved);
        await refreshAll();
        enqueueSnackbar(getSaveMessage(saved, status));
      } catch (error) {
        enqueueSnackbar(error?.message || 'Failed to save release', { variant: 'error' });
      }
    });

  // Cmd+Enter (Mac) / Ctrl+Enter (Windows/Linux) triggers the primary action, anywhere on the page
  const handleSubmitShortcut = (event) => {
    const modifierHeld = IS_MAC ? event.metaKey : event.ctrlKey;
    if (event.key !== 'Enter' || !modifierHeld || event.repeat) return;
    // Never fire behind an open confirm dialog or while a save is in flight
    if (confirm.value || pendingSwitch || isSubmitting) return;

    event.preventDefault(); // don't insert a newline in the description field
    save(true)();
  };

  useEventListener('keydown', handleSubmitShortcut);

  const handleDelete = async () => {
    confirm.onFalse();
    try {
      await axiosInstance.delete(endpoints.releaseNotes.detail(selectedId));
      handleSelect(null);
      await refreshAll();
      enqueueSnackbar('Release deleted');
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to delete release', { variant: 'error' });
    }
  };

  return (
    <Container maxWidth="xl">
      <Typography
        sx={{ fontFamily: (theme) => theme.typography.fontSecondaryFamily, fontSize: 48, mb: 3 }}
      >
        Release Notes
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
        <Box sx={{ width: { md: 200 }, flexShrink: 0 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1.5 }}
          >
            <Typography variant="subtitle1">Releases</Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => requestSelect(null)}
              sx={{ ...LIP_BUTTON_SX.outlined, px: 1.5, py: 0.5 }}
            >
              New
            </Button>
          </Stack>

          <Stack spacing={1}>
            {isLoading && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Loading…
              </Typography>
            )}
            {releases.map((release) => (
              <ReleaseListItem
                key={release.id}
                release={release}
                selected={release.id === selectedId}
                onClick={() => requestSelect(release)}
              />
            ))}
          </Stack>
        </Box>

        <Box sx={{ flexGrow: 1, pl: { md: 4 }, borderLeft: { md: '1px solid #E7E7E7' } }}>
          <FormProvider methods={methods} onSubmit={save(true)}>
            <Stack spacing={3}>
              <Stack spacing={1}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                  <RHFDatePicker
                    name="releaseDate"
                    label="Date"
                    slots={{ openPickerIcon: CalendarIcon }}
                    sx={{ width: 0.32 }}
                  />

                  {selectedId && (
                    <Tooltip title="Delete release">
                      <IconButton
                        aria-label="Delete release"
                        onClick={confirm.onTrue}
                        sx={{ ...LIP_BUTTON_SX.danger, width: 40, height: 40, p: 0, mt: 1 }}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" width={20} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>

                {isFutureDate && !isPublished && (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Future date. This release will be scheduled and go live automatically on{' '}
                    {dayjs(releaseDate).format('DD MMM YYYY')} at 12:00 AM (MYT).
                  </Typography>
                )}
              </Stack>

              <Stack spacing={2}>
                <Typography variant="subtitle2">Updates</Typography>

                {fields.map((field, index) => (
                  <ReleaseItemCard
                    key={field.id}
                    index={index}
                    canRemove={fields.length > 1}
                    onRemove={() => remove(index)}
                  />
                ))}

                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="mingcute:add-line" />}
                  onClick={() => append({ ...EMPTY_ITEM })}
                  sx={LIP_BUTTON_SX.outlined}
                >
                  Add Update
                </Button>
              </Stack>

              <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                {!isPublished && (
                  <LoadingButton
                    variant="outlined"
                    loading={isSubmitting}
                    onClick={save(false)}
                    sx={LIP_BUTTON_SX.outlined}
                  >
                    {isScheduled ? 'Move to draft' : 'Save draft'}
                  </LoadingButton>
                )}
                {/* span: Tooltip needs a non-disabled child; LoadingButton disables itself while loading */}
                <Tooltip title={SUBMIT_SHORTCUT_LABEL}>
                  <span>
                    <LoadingButton
                      variant="contained"
                      loading={isSubmitting}
                      onClick={save(true)}
                      sx={LIP_BUTTON_SX.blue}
                    >
                      {getPrimaryLabel(status, isFutureDate)}
                    </LoadingButton>
                  </span>
                </Tooltip>
              </Stack>
            </Stack>
          </FormProvider>
        </Box>
      </Stack>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete release"
        content="This release will be removed for all admins. This cannot be undone."
        action={
          <Button variant="contained" onClick={handleDelete} sx={LIP_BUTTON_SX.danger}>
            Delete
          </Button>
        }
      />

      <ConfirmDialog
        open={Boolean(pendingSwitch)}
        onClose={() => setPendingSwitch(null)}
        title="Discard unsaved changes?"
        content="You have unsaved changes to this release. They will be lost if you continue."
        action={
          <Button variant="contained" onClick={handleDiscardAndSwitch} sx={LIP_BUTTON_SX.danger}>
            Discard
          </Button>
        }
      />
    </Container>
  );
}
