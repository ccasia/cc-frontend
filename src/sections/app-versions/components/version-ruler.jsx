import PropTypes from 'prop-types';
import { m, useReducedMotion } from 'framer-motion';

import { Box, Stack, darken, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

import InfoTooltip, { TooltipContent } from './info-tooltip';
import { ICONS, COLORS, PLATFORM_META, compareVersions } from '../utils';

const STORE_COLOR = '#1340FF';
const EASE_OUT = [0.2, 0, 0, 1];
const SLIDE = '300ms cubic-bezier(0.2, 0, 0, 1)';

const ROLE_ICONS = {
  minimum: { icon: ICONS.minimum, color: COLORS.danger },
  latest: { icon: ICONS.latest, color: '#E89B00' },
};

// Versions are not evenly spaced, so zones get fixed widths and markers sit on the zone edges
const buildRuler = (minimumVersion, latestVersion, storeVersion) => {
  const hasPrompt = compareVersions(minimumVersion, latestVersion) < 0;
  const minEdge = hasPrompt ? 25 : 40;
  const latestEdge = hasPrompt ? 75 : 40;

  const zones = [
    {
      key: 'blocked',
      label: 'Blocked',
      hint: 'Must update to continue',
      color: COLORS.danger,
      from: 0,
      to: minEdge,
    },
    ...(hasPrompt
      ? [
          {
            key: 'prompted',
            label: 'Prompted',
            hint: 'See a prompt they can skip',
            color: COLORS.warning,
            from: minEdge,
            to: latestEdge,
          },
        ]
      : []),
    {
      key: 'upToDate',
      label: 'Up to date',
      hint: 'No prompt',
      color: COLORS.success,
      from: latestEdge,
      to: 100,
    },
  ];

  const markers = [{ at: minEdge, version: minimumVersion, roles: ['minimum'] }];
  if (hasPrompt) markers.push({ at: latestEdge, version: latestVersion, roles: ['latest'] });
  else markers[0].roles.push('latest');

  if (storeVersion) {
    const vsMin = compareVersions(storeVersion, minimumVersion);
    const vsLatest = compareVersions(storeVersion, latestVersion);
    const same = vsLatest === 0 ? markers[markers.length - 1] : vsMin === 0 && markers[0];

    if (same) same.roles.push('store');
    else {
      let at = (latestEdge + 100) / 2;
      if (vsMin < 0) at = minEdge / 2;
      else if (vsLatest < 0) at = (minEdge + latestEdge) / 2;
      markers.push({ at, version: storeVersion, roles: ['store'] });
    }
  }

  return { zones, markers };
};

const describeMarker = (roles, storeName) => {
  const names = roles.filter((role) => role !== 'store');
  if (!names.length) return `${storeName} version`;

  const text = `${names.join(' and ')} version`;
  return text.charAt(0).toUpperCase() + text.slice(1);
};

// One short line per role: what this version does to users
const explainMarker = (marker, { minimumVersion, latestVersion, storeName, storeIcon }) =>
  marker.roles.map((role) => {
    if (role === 'minimum') {
      return {
        ...ROLE_ICONS.minimum,
        text: `Versions below ${minimumVersion} are blocked until they update.`,
      };
    }

    if (role === 'latest') {
      return {
        ...ROLE_ICONS.latest,
        text: marker.roles.includes('minimum')
          ? 'No skippable prompt, because it matches the minimum.'
          : 'Older versions get an update prompt they can skip.',
      };
    }

    const store = { icon: storeIcon ?? ICONS.store, color: STORE_COLOR };
    const vsLatest = compareVersions(marker.version, latestVersion);
    if (vsLatest < 0) {
      return {
        ...store,
        color: COLORS.warning,
        text: `The ${storeName} is behind, so prompted users cannot update yet.`,
      };
    }
    if (vsLatest > 0) {
      return {
        ...store,
        text: 'Newer than the latest version. Raise the latest version to prompt users.',
      };
    }
    return { ...store, text: `Live on the ${storeName}, so users can update now.` };
  });

export default function VersionRuler({
  minimumVersion,
  latestVersion,
  storeVersion,
  storeName,
  animateIn = true,
}) {
  const { zones, markers } = buildRuler(minimumVersion, latestVersion, storeVersion);
  const reduceMotion = useReducedMotion();
  // Bar wipes in from the left, then the chips pop onto the seams, then the labels fade in
  const intro = (from, delay = 0) => ({
    initial: animateIn ? from : false,
    transition: { duration: 0.45, ease: EASE_OUT, delay },
  });
  const storeIcon = Object.values(PLATFORM_META).find(
    (meta) => meta.store === storeName
  )?.storeIcon;

  return (
    <Box>
      <Box sx={{ position: 'relative', py: '8px' }}>
        <Box
          component={m.div}
          {...intro(reduceMotion ? { opacity: 0 } : { clipPath: 'inset(0 100% 0 0)' })}
          animate={reduceMotion ? { opacity: 1 } : { clipPath: 'inset(0 0% 0 0)' }}
          sx={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: '2px' }}
        >
          {zones.map((zone) => (
            <Box
              key={zone.key}
              sx={{
                width: `${zone.to - zone.from}%`,
                bgcolor: zone.color,
                transition: `width ${SLIDE}`,
              }}
            />
          ))}
        </Box>

        {markers.map((marker, index) => {
          const label = describeMarker(marker.roles, storeName);
          const isStore = marker.roles.includes('store');

          return (
            <InfoTooltip
              key={marker.roles.join('-')}
              title={
                <TooltipContent
                  heading={label}
                  items={explainMarker(marker, {
                    minimumVersion,
                    latestVersion,
                    storeName,
                    storeIcon,
                  })}
                />
              }
              placement="top"
            >
              <Stack
                component={m.div}
                {...intro({ opacity: 0, scale: reduceMotion ? 1 : 0.8 })}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  ...(reduceMotion
                    ? { duration: 0.2 }
                    : { type: 'spring', bounce: 0.35, duration: 0.45 }),
                  delay: animateIn ? 0.25 + index * 0.08 : 0,
                }}
                style={{ x: '-50%', y: '-50%' }}
                direction="row"
                alignItems="center"
                spacing={0.5}
                tabIndex={0}
                aria-label={`${marker.version}, ${label}`}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: `${marker.at}%`,
                  transition: `left ${SLIDE}`,
                  height: 24,
                  px: 1,
                  borderRadius: 1,
                  border: `1px solid ${isStore ? '#C9D3FF' : COLORS.border}`,
                  borderBottomWidth: 3,
                  bgcolor: 'common.white',
                  color: isStore ? STORE_COLOR : COLORS.text,
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'default',
                }}
              >
                {marker.roles
                  .filter((role) => role !== 'store')
                  .map((role) => (
                    <Iconify
                      key={role}
                      icon={ROLE_ICONS[role].icon}
                      width={14}
                      sx={{ color: ROLE_ICONS[role].color }}
                    />
                  ))}
                <span>{marker.version}</span>
                {isStore && storeIcon && (
                  <Iconify icon={storeIcon} width={14} sx={{ color: STORE_COLOR }} />
                )}
              </Stack>
            </InfoTooltip>
          );
        })}
      </Box>

      <Box
        component={m.div}
        {...intro({ opacity: 0, y: reduceMotion ? 0 : 4 }, 0.35)}
        animate={{ opacity: 1, y: 0 }}
        sx={{ display: 'flex', mt: 1.25 }}
      >
        {zones.map((zone) => (
          <Box
            key={zone.key}
            sx={{
              width: `${zone.to - zone.from}%`,
              minWidth: 0,
              px: 0.5,
              textAlign: 'center',
              transition: `width ${SLIDE}`,
            }}
          >
            <Typography
              noWrap
              sx={{ fontSize: 13, fontWeight: 600, color: darken(zone.color, 0.4) }}
            >
              {zone.label}
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25, lineHeight: 1.4 }}>
              {zone.hint}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

VersionRuler.propTypes = {
  minimumVersion: PropTypes.string.isRequired,
  latestVersion: PropTypes.string.isRequired,
  storeVersion: PropTypes.string,
  storeName: PropTypes.string,
  animateIn: PropTypes.bool,
};
