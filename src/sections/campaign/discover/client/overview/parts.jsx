import PropTypes from 'prop-types';

import { Box, Stack, Typography } from '@mui/material';

import { setCurrentTab } from 'src/sections/campaign/discover/admin/store/use-tabs';

import { TONES } from './stages';

export const tabularNums = { fontVariantNumeric: 'tabular-nums' };

export const goToTab = (tab) => {
  localStorage.setItem('campaigndetail', tab);
  setCurrentTab(tab);
};

export function toneColors(tone) {
  const key = TONES[tone]?.palette;
  if (!key) return { bar: 'grey.300', pillBg: 'grey.200', pillText: 'grey.600' };
  return { bar: `${key}.main`, pillBg: `${key}.lighter`, pillText: `${key}.darker` };
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

export function Pill({ children, bgcolor, color, sx }) {
  return (
    <Box
      component="span"
      sx={{
        px: 1,
        py: 0.25,
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 500,
        lineHeight: 1.6,
        whiteSpace: 'nowrap',
        bgcolor,
        color,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

Pill.propTypes = {
  children: PropTypes.node,
  bgcolor: PropTypes.string,
  color: PropTypes.string,
  sx: PropTypes.object,
};
