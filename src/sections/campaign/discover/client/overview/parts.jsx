import PropTypes from 'prop-types';

import { Box, Stack, alpha, darken, Typography } from '@mui/material';

import { setCurrentTab } from 'src/sections/campaign/discover/admin/store/use-tabs';

import { TONES } from './stages';

export const tabularNums = { fontVariantNumeric: 'tabular-nums' };

export const goToTab = (tab) => {
  localStorage.setItem('campaigndetail', tab);
  setCurrentTab(tab);
};

export function toneColors(tone) {
  const color = TONES[tone]?.color ?? TONES.idle.color;
  return { main: color, soft: alpha(color, 0.16), text: darken(color, 0.4) };
}

export function OverviewCard({ title, aside, children, sx }) {
  return (
    <Box
      component="section"
      sx={{
        px: { xs: 2, sm: 2.75 },
        py: 2.25,
        border: 1,
        borderColor: 'divider',
        borderRadius: '14px',
        bgcolor: 'background.paper',
        ...sx,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Typography component="h2" sx={{ fontSize: 15, fontWeight: 600 }}>
          {title}
        </Typography>
        {aside}
      </Stack>
      {children}
    </Box>
  );
}

OverviewCard.propTypes = {
  title: PropTypes.node.isRequired,
  aside: PropTypes.node,
  children: PropTypes.node,
  sx: PropTypes.object,
};

// Same look as the admin StatusChip, which only takes submission statuses.
export function StatusPill({ tone, children }) {
  const colors = toneColors(tone);

  return (
    <Stack
      component="span"
      direction="row"
      alignItems="center"
      spacing={0.75}
      sx={{
        px: 1.25,
        py: 0.5,
        flex: 'none',
        borderRadius: 100,
        bgcolor: colors.soft,
        color: colors.text,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: '16px',
        whiteSpace: 'nowrap',
      }}
    >
      <Box
        component="span"
        sx={{ width: 7, height: 7, flexShrink: 0, borderRadius: '50%', bgcolor: colors.main }}
      />
      <span>{children}</span>
    </Stack>
  );
}

StatusPill.propTypes = {
  tone: PropTypes.oneOf(Object.keys(TONES)).isRequired,
  children: PropTypes.node,
};
