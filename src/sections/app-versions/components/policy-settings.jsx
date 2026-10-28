import PropTypes from 'prop-types';

import { Box, Link, Stack } from '@mui/material';
import { alpha, darken, keyframes } from '@mui/material/styles';

import Iconify from 'src/components/iconify';

import Pill from './pill';
import InfoTooltip, { TooltipContent } from './info-tooltip';
import VersionStat from './version-stat';
import { ICONS, COLORS, APP_SCREENS, PLATFORM_META, normalizeVersion } from '../utils';

const STORE_BLUE = '#1340FF';

const savedFlash = keyframes`
  0%, 35% { background-color: ${alpha('#1340FF', 0.07)}; }
  100% { background-color: transparent; }
`;

// Briefly tints the values that changed in the last save
const flashSx = (highlight, key) =>
  highlight.includes(key) && { animation: `${savedFlash} 1.8s ease-out` };

// Store name as a blue link to the listing, with an arrow so it reads as clickable
function StoreLink({ url, store }) {
  if (!url) return <span>{store}</span>;

  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener"
      aria-label={`${store} listing, opens in a new tab`}
      underline="always"
      sx={{
        color: STORE_BLUE,
        textDecorationColor: alpha(STORE_BLUE, 0.35),
        textUnderlineOffset: 3,
        transition: 'color 120ms, text-decoration-color 120ms',
        '&:hover': { color: darken(STORE_BLUE, 0.2), textDecorationColor: 'currentColor' },
      }}
    >
      {store}
      <Iconify
        icon={ICONS.store}
        width={12}
        sx={{ display: 'inline-block', verticalAlign: 'middle', ml: 0.25 }}
      />
    </Link>
  );
}

StoreLink.propTypes = { url: PropTypes.string, store: PropTypes.string.isRequired };

// The saved values inside the Versions card: a three-cell version strip, then the message
export default function PolicySettings({ policy, highlight = [] }) {
  const meta = PLATFORM_META[policy.platform];
  const latestVersion = normalizeVersion(policy.latestVersion);
  const synced = policy.storeSyncEnabled;

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
          borderBottom: `1px solid ${COLORS.border}`,
          '& > :not(:first-of-type)': {
            borderTop: { xs: `1px solid ${COLORS.border}`, sm: 'none' },
            borderLeft: { sm: `1px solid ${COLORS.border}` },
          },
        }}
      >
        <VersionStat
          icon={ICONS.minimum}
          color={COLORS.danger}
          label="Minimum"
          value={normalizeVersion(policy.minimumVersion)}
          caption="Blocks older versions"
          sx={flashSx(highlight, 'minimumVersion')}
        />

        <VersionStat
          icon={ICONS.latest}
          color="#E89B00"
          label="Latest"
          value={latestVersion}
          caption="Prompts older versions"
          sx={flashSx(highlight, 'latestVersion')}
        />

        <VersionStat
          icon={meta.storeIcon}
          color={STORE_BLUE}
          label={<StoreLink url={policy.storeUrl} store={meta.store} />}
          value={policy.storeVersion ?? '–'}
          caption={
            <InfoTooltip
              placement="bottom"
              title={
                <TooltipContent
                  heading={synced ? 'Auto update is on' : 'Auto update is off'}
                  body={
                    synced
                      ? `Every hour, the server checks ${meta.storeRef}. When a new release is live, it raises the latest version.`
                      : `The server has no ${meta.store} access yet. After each release, raise the latest version by hand.`
                  }
                />
              }
            >
              <Stack
                component="span"
                direction="row"
                alignItems="center"
                spacing={0.6}
                tabIndex={0}
                sx={{ display: 'inline-flex', cursor: 'help' }}
              >
                <Box
                  component="span"
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: synced ? COLORS.success : COLORS.warning,
                  }}
                />
                <span>{synced ? 'Synced hourly' : 'Not connected'}</span>
              </Stack>
            </InfoTooltip>
          }
        />
      </Box>

      <Box sx={{ px: 2.5, py: 2, ...flashSx(highlight, 'message') }}>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Iconify icon={ICONS.message} width={16} sx={{ flexShrink: 0, color: '#8E33FF' }} />
          <Box sx={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>Message</Box>
          {!policy.message && <Pill>Default</Pill>}
          <Box sx={{ flex: 1, textAlign: 'right', fontSize: 12, color: 'text.secondary' }}>
            Shown on both update screens
          </Box>
        </Stack>
        <Box
          sx={{
            mt: 1.25,
            px: 1.5,
            py: 1.25,
            borderRadius: 1,
            bgcolor: COLORS.muted,
            border: `1px solid ${COLORS.border}`,
            fontSize: 13,
            lineHeight: 1.5,
            color: policy.message ? COLORS.text : 'text.secondary',
            wordBreak: 'break-word',
          }}
        >
          {policy.message || APP_SCREENS.soft.body(latestVersion)}
        </Box>
      </Box>
    </>
  );
}

PolicySettings.propTypes = {
  policy: PropTypes.object.isRequired,
  highlight: PropTypes.arrayOf(PropTypes.string),
};
