import PropTypes from 'prop-types';
import { format } from 'date-fns';

import { alpha } from '@mui/material/styles';
import { Box, Card, Stack, Typography } from '@mui/material';

import { FONTS, ACTION_BLUE, creditBreakdown } from './utils';

export default function CreditsPanel({ credits }) {
  const { total, used, reserved, free } = creditBreakdown(credits);
  // Scale against the bigger figure, since campaigns can hold more credits than the active package.
  const scale = Math.max(total, used + reserved + free);

  const rows = [
    { label: 'Used on confirmed creators', value: used, color: 'text.primary' },
    { label: 'Reserved for running campaigns', value: reserved, color: ACTION_BLUE },
    { label: 'Free to assign', value: free, color: 'grey.400' },
  ];

  const subtitle = [
    credits?.packageName && `${credits.packageName} package`,
    credits?.validUntil && `valid until ${format(new Date(credits.validUntil), 'd MMM yyyy')}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card
      component="aside"
      aria-labelledby="client-home-credits"
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
        borderRadius: '16px',
        border: 1,
        borderColor: 'divider',
        boxShadow: 'none',
      }}
    >
      <Box>
        <Typography
          id="client-home-credits"
          component="h2"
          sx={{ fontFamily: FONTS.tight, fontWeight: 600, fontSize: 15 }}
        >
          Package credits
        </Typography>
        {subtitle && (
          <Typography sx={{ mt: 0.5, fontSize: 13, color: 'text.secondary' }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      <Box>
        <Stack direction="row" alignItems="baseline" spacing={1}>
          <Typography
            component="strong"
            sx={{
              fontFamily: FONTS.serif,
              fontSize: 44,
              lineHeight: 1,
              fontWeight: 400,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {free}
          </Typography>
          <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
            credits free to assign
          </Typography>
        </Stack>

        <Stack
          direction="row"
          spacing="3px"
          role="img"
          aria-label={`${used} used, ${reserved} reserved, ${free} free of ${total} credits`}
          sx={(theme) => ({
            mt: 1.25,
            height: 6,
            borderRadius: '3px',
            ...(!scale && { bgcolor: alpha(theme.palette.grey[500], 0.16) }),
          })}
        >
          {scale > 0 &&
            rows
              .filter((row) => row.value > 0)
              .map((row) => (
                <Box
                  key={row.label}
                  sx={{
                    width: `${(row.value / scale) * 100}%`,
                    borderRadius: '3px',
                    bgcolor: row.color,
                  }}
                />
              ))}
        </Stack>
      </Box>

      <Stack component="ul" spacing={1.25} sx={{ m: 0, p: 0, listStyle: 'none', fontSize: 13 }}>
        {rows.map((row) => (
          <LegendRow key={row.label} {...row} />
        ))}
        <Stack
          component="li"
          direction="row"
          justifyContent="space-between"
          sx={(theme) => ({
            pt: 1.25,
            borderTop: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
            color: 'text.secondary',
          })}
        >
          <span>Package total</span>
          <Box component="span" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {total}
          </Box>
        </Stack>
      </Stack>
    </Card>
  );
}

CreditsPanel.propTypes = {
  credits: PropTypes.shape({
    packageName: PropTypes.string,
    validUntil: PropTypes.string,
    total: PropTypes.number,
    assigned: PropTypes.number,
    used: PropTypes.number,
  }),
};

function LegendRow({ label, value, color }) {
  return (
    <Stack
      component="li"
      direction="row"
      justifyContent="space-between"
      spacing={1.5}
      sx={{ color: 'grey.700' }}
    >
      <Stack component="span" direction="row" alignItems="center" spacing={1}>
        <Box
          component="i"
          sx={{ width: 8, height: 8, borderRadius: '2px', flex: 'none', bgcolor: color }}
        />
        <span>{label}</span>
      </Stack>
      <Box component="span" sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Box>
    </Stack>
  );
}

LegendRow.propTypes = {
  label: PropTypes.string,
  value: PropTypes.number,
  color: PropTypes.string,
};
