import { useState } from 'react';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';

import { Box, Stack, alpha, darken, ButtonBase } from '@mui/material';

import { fToNow, fDateTime } from 'src/utils/format-time';

import Iconify from 'src/components/iconify';
import CtaButton from 'src/components/cta-button';

import InfoTooltip, { TooltipContent } from './info-tooltip';

import { ICONS, TONES, COLORS, capitalize, PLATFORM_META, getPolicyStatus } from '../utils';
import { useUpdateAppVersionPolicy } from '../hooks/use-app-version-policies';

// Who changed the policy last and when, e.g. "Saved 2 hours ago" by Afiq
const describeLastSave = (policy, store) => {
  const editor = policy.updatedBy?.name;
  const ago = fToNow(policy.updatedAt).replace(/^about /, '');
  return {
    short: `${editor ? 'Saved' : 'Synced'} ${ago}`,
    heading: editor ? `Saved by ${editor}` : `Updated by the ${store} sync`,
    body: `${capitalize(ago)}, on ${fDateTime(policy.updatedAt, 'd MMM yyyy, h:mm a')}.`,
  };
};

const STATUS_HEADINGS = {
  success: 'Prompted users can update now',
  warning: 'Latest and the store do not match',
  info: 'Store version unknown',
};

// One chip beside the "Versions" title: store status and last save, each with its own icon
export function PolicyStatusBadge({ policy }) {
  const [open, setOpen] = useState(false);
  const { tone, label, message } = getPolicyStatus(policy);
  const { color } = TONES[tone];
  const { store, storeIcon } = PLATFORM_META[policy.platform];
  const saved = describeLastSave(policy, store);

  return (
    <InfoTooltip
      placement="top"
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      title={
        <>
          <Box sx={{ pb: 0.75, mb: 0.75, borderBottom: `1px solid ${COLORS.border}` }}>
            <TooltipContent
              icon={storeIcon}
              iconColor={color}
              heading={STATUS_HEADINGS[tone]}
              body={
                tone === 'success'
                  ? `The latest version (${policy.storeVersion}) is live on the ${store}.`
                  : message
              }
            />
          </Box>
          <TooltipContent
            icon={ICONS.lastSaved}
            iconColor={COLORS.text}
            heading={saved.heading}
            body={saved.body}
          />
        </>
      }
    >
      <ButtonBase
        disableRipple
        aria-label={`${label}. ${saved.heading}, ${saved.body}`}
        onClick={() => setOpen((value) => !value)}
        sx={{
          gap: 0.75,
          px: 1,
          py: 0.25,
          borderRadius: 10,
          border: `1px solid ${COLORS.border}`,
          fontSize: 11,
          fontWeight: 500,
          color: 'text.secondary',
          whiteSpace: 'nowrap',
          transition: 'background-color 120ms, border-color 120ms',
          '&:hover, &.Mui-focusVisible': { bgcolor: COLORS.muted, borderColor: alpha(color, 0.5) },
        }}
      >
        <Stack component="span" direction="row" alignItems="center" spacing={0.5}>
          <Iconify icon={storeIcon} width={13} sx={{ color }} />
          <span>{label}</span>
        </Stack>
        <Box component="span" sx={{ width: '1px', height: 12, bgcolor: COLORS.border }} />
        <Stack component="span" direction="row" alignItems="center" spacing={0.5}>
          <Iconify icon={ICONS.lastSaved} width={13} />
          <span>{saved.short}</span>
        </Stack>
      </ButtonBase>
    </InfoTooltip>
  );
}

PolicyStatusBadge.propTypes = {
  policy: PropTypes.object.isRequired,
};

// Tinted strip at the top of the Versions card, shown only when something needs attention
export function PolicyStatus({ policy, action }) {
  const { tone, message } = getPolicyStatus(policy);
  const { color, icon } = TONES[tone];

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      spacing={1.5}
      sx={{
        px: 2.5,
        py: 1.5,
        bgcolor: alpha(color, 0.08),
        borderBottom: `1px solid ${alpha(color, 0.25)}`,
      }}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        spacing={0.75}
        sx={{ flex: 1, fontSize: 13, color: COLORS.text }}
      >
        <Iconify
          icon={icon}
          width={16}
          sx={{ mt: '1px', flexShrink: 0, color: darken(color, 0.1) }}
        />
        <span>{message}</span>
      </Stack>
      {action}
    </Stack>
  );
}

PolicyStatus.propTypes = {
  policy: PropTypes.object.isRequired,
  action: PropTypes.node,
};

// One-click fix for the status, e.g. "Match App Store (1.0.4)"
export function PolicyStatusFix({ policy, disabled }) {
  const { fix } = getPolicyStatus(policy);
  const { mutateAsync, isPending } = useUpdateAppVersionPolicy();

  if (!fix) return null;

  const applyFix = async () => {
    try {
      await mutateAsync({ platform: policy.platform, latestVersion: fix.latestVersion });
      enqueueSnackbar(
        `${PLATFORM_META[policy.platform].label} latest version set to ${fix.latestVersion}`
      );
    } catch (error) {
      enqueueSnackbar(error?.message || 'Could not save. Try again.', { variant: 'error' });
    }
  };

  return (
    <CtaButton variant="white" size="small" onClick={applyFix} disabled={disabled || isPending}>
      {isPending ? 'Saving…' : `${fix.label} (${fix.latestVersion})`}
    </CtaButton>
  );
}

PolicyStatusFix.propTypes = {
  policy: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
};
