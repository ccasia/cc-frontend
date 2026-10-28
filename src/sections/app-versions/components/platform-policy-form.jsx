import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { Box, Stack, Button } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import CtaButton from 'src/components/cta-button';
import { ConfirmDialog } from 'src/components/custom-dialog';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

import { LIP_BUTTON_SX } from 'src/sections/release-notes/constants';

import SwapIn from './swap-in';
import Pill from './pill';
import PolicyBody from './policy-body';
import SettingRow from './setting-row';
import RHFVersionField from './rhf-version-field';
import StoreGapWarning from './store-gap-warning';
import RaiseMinimumDialog from './raise-minimum-dialog';
import { useUpdateAppVersionPolicy } from '../hooks/use-app-version-policies';
import {
  COLORS,
  isVersion,
  APP_SCREENS,
  bumpVersion,
  PLATFORM_META,
  VERSION_REGEX,
  getLatestFloor,
  compareVersions,
  normalizeVersion,
} from '../utils';

const MESSAGE_MAX = 200;

const FORMAT_ERROR = 'Enter a version like 1.2.3, using numbers and dots only.';

const buildSchema = (policy, floor) =>
  Yup.object().shape({
    latestVersion: Yup.string()
      .trim()
      .required('Enter the latest version')
      .matches(VERSION_REGEX, FORMAT_ERROR)
      .test(
        'no-lower',
        floor === policy.latestVersion
          ? `Enter ${floor} or higher. The latest version can't be lowered.`
          : `Enter ${floor} or higher. The latest version can't go below the store version.`,
        (value) => !isVersion(value) || compareVersions(value, floor) >= 0
      ),
    minimumVersion: Yup.string()
      .trim()
      .required('Enter the minimum version')
      .matches(VERSION_REGEX, FORMAT_ERROR)
      .test('not-above-latest', (value, ctx) => {
        const latest = ctx.parent.latestVersion;
        if (!isVersion(value) || !isVersion(latest) || compareVersions(value, latest) <= 0)
          return true;
        return ctx.createError({
          message: `Enter ${latest} or lower. Users can't update to a version that isn't in the store yet.`,
        });
      }),
    message: Yup.string()
      .trim()
      .max(MESSAGE_MAX, `Keep the message under ${MESSAGE_MAX} characters.`),
  });

export default function PlatformPolicyForm({ policy, layout, onDone }) {
  const confirm = useBoolean();
  const discard = useBoolean();
  const { mutateAsync, isPending } = useUpdateAppVersionPolicy();
  const { label, store, storeRef } = PLATFORM_META[policy.platform];
  const floor = getLatestFloor(policy);

  const methods = useForm({
    resolver: yupResolver(buildSchema(policy, floor)),
    defaultValues: {
      latestVersion: policy.latestVersion,
      minimumVersion: policy.minimumVersion,
      message: policy.message ?? '',
    },
  });
  const { control, handleSubmit, formState } = methods;
  const [minimumVersion, latestVersion, message] = useWatch({
    control,
    name: ['minimumVersion', 'latestVersion', 'message'],
  });

  const requestCancel = () => (formState.isDirty ? discard.onTrue() : onDone());

  const minimumSuggestions =
    isVersion(latestVersion) && latestVersion !== minimumVersion
      ? [
          {
            label: 'Same as latest',
            value: latestVersion,
            hint: `Set the minimum to ${latestVersion}. Every older version gets blocked.`,
          },
        ]
      : [];

  const { storeVersion } = policy;
  const canMatchStore =
    isVersion(storeVersion) && storeVersion !== normalizeVersion(latestVersion ?? '');

  const latestSuggestions = [
    ...(canMatchStore
      ? [
          {
            label: `Match ${store}`,
            value: storeVersion,
            hint: `Set the latest version to ${storeVersion}, the version live on ${storeRef}.`,
          },
        ]
      : []),
    ...['patch', 'minor'].map((part) => {
      const value = bumpVersion(policy.latestVersion, part);
      return { label: `Next ${part}`, value, hint: `Set the latest version to ${value}.` };
    }),
  ];

  const isRaisingMinimum =
    isVersion(minimumVersion) && compareVersions(minimumVersion, policy.minimumVersion) > 0;

  // Preview the typed values only while they form a valid policy
  const canPreview =
    isVersion(minimumVersion) &&
    isVersion(latestVersion) &&
    compareVersions(latestVersion, floor) >= 0 &&
    compareVersions(minimumVersion, latestVersion) <= 0;

  const save = async (values) => {
    const next = {
      minimumVersion: normalizeVersion(values.minimumVersion),
      latestVersion: normalizeVersion(values.latestVersion),
      message: values.message?.trim() || null,
    };
    const changed = Object.keys(next).filter((key) =>
      key === 'message'
        ? next.message !== (policy.message || null)
        : next[key] !== normalizeVersion(policy[key])
    );
    try {
      await mutateAsync({ platform: policy.platform, ...next });
      confirm.onFalse();
      enqueueSnackbar(`${label} versions saved`);
      onDone(changed);
    } catch (error) {
      enqueueSnackbar(error?.message || 'Could not save. Try again.', { variant: 'error' });
    }
  };

  const onSubmit = handleSubmit((values) => (isRaisingMinimum ? confirm.onTrue() : save(values)));

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <PolicyBody
        {...layout}
        title="Edit versions"
        description="Changes apply to the app right after you save."
        action={formState.isDirty && <Pill color={COLORS.warning}>Unsaved changes</Pill>}
        minimumVersion={
          canPreview ? normalizeVersion(minimumVersion) : normalizeVersion(policy.minimumVersion)
        }
        latestVersion={
          canPreview ? normalizeVersion(latestVersion) : normalizeVersion(policy.latestVersion)
        }
        storeVersion={storeVersion}
        storeName={store}
        message={message?.trim()}
      >
        <SwapIn>
          <Box
            onKeyDown={(event) => {
              if (event.key === 'Escape' && !confirm.value && !discard.value) requestCancel();
            }}
          >
            <Box sx={{ px: 2.5 }}>
              <SettingRow
                label="Minimum version"
                description={
                  isRaisingMinimum ? (
                    <Box component="span" sx={{ color: 'error.main' }}>
                      Users below {minimumVersion} will be blocked until they update.
                    </Box>
                  ) : (
                    'Older versions are blocked and must update.'
                  )
                }
              >
                <RHFVersionField
                  name="minimumVersion"
                  label="Minimum version"
                  autoFocus
                  suggestions={minimumSuggestions}
                />
              </SettingRow>

              <SettingRow
                label="Latest version"
                description={
                  <>
                    Older versions get an update prompt they can skip.
                    {storeVersion &&
                      ` ${store} has ${storeVersion}, so this can't go below ${floor}.`}
                    <Box sx={{ mt: 0.75 }}>
                      <StoreGapWarning
                        latestVersion={
                          isVersion(latestVersion) ? normalizeVersion(latestVersion) : null
                        }
                        storeVersion={storeVersion}
                        storeRef={storeRef}
                      />
                    </Box>
                  </>
                }
              >
                <RHFVersionField
                  name="latestVersion"
                  label="Latest version"
                  suggestions={latestSuggestions}
                />
              </SettingRow>

              <SettingRow
                label="Message"
                description={`Optional. Replaces the text on both update screens. Leave empty to keep the default.`}
              >
                <RHFTextField
                  name="message"
                  size="small"
                  placeholder={APP_SCREENS.soft.body(
                    isVersion(latestVersion)
                      ? normalizeVersion(latestVersion)
                      : policy.latestVersion
                  )}
                  inputProps={{ 'aria-label': 'Message' }}
                  multiline
                  rows={3}
                  helperText={`${(message ?? '').length}/${MESSAGE_MAX}`}
                  FormHelperTextProps={{ sx: { textAlign: 'right', mx: 0 } }}
                />
              </SettingRow>
            </Box>

            <Stack
              direction="row"
              spacing={1.5}
              justifyContent="flex-end"
              sx={{
                px: 2.5,
                py: 1.75,
                bgcolor: COLORS.muted,
                borderTop: `1px solid ${COLORS.border}`,
              }}
            >
              <CtaButton variant="white" onClick={requestCancel}>
                Cancel
              </CtaButton>
              <CtaButton type="submit" variant="blue" disabled={!formState.isDirty || isPending}>
                {isPending && !confirm.value ? 'Saving…' : 'Save changes'}
              </CtaButton>
            </Stack>
          </Box>
        </SwapIn>
      </PolicyBody>

      <RaiseMinimumDialog
        open={confirm.value}
        platformLabel={label}
        version={minimumVersion}
        loading={isPending}
        onClose={confirm.onFalse}
        onConfirm={handleSubmit(save)}
      />

      <ConfirmDialog
        open={discard.value}
        onClose={discard.onFalse}
        title="Discard your changes?"
        content={`Your ${label} version changes are not saved yet. They will be lost if you close the editor.`}
        action={
          <Button variant="contained" onClick={() => onDone()} sx={LIP_BUTTON_SX.danger}>
            Discard
          </Button>
        }
      />
    </FormProvider>
  );
}

PlatformPolicyForm.propTypes = {
  policy: PropTypes.object.isRequired,
  layout: PropTypes.object,
  onDone: PropTypes.func.isRequired,
};
