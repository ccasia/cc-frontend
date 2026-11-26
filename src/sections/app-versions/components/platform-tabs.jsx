import PropTypes from 'prop-types';
import { m, useReducedMotion } from 'framer-motion';

import { Box, Stack, ButtonBase } from '@mui/material';

import Iconify from 'src/components/iconify';

import { TONES, COLORS, PLATFORM_META, getPolicyStatus } from '../utils';

// The panel remounts per platform, so a fixed layoutId lets the white pill slide between them
export default function PlatformTabs({ policies, value, onChange }) {
  const reduceMotion = useReducedMotion();

  return (
    <Stack
      direction="row"
      spacing={0.5}
      role="tablist"
      sx={{
        p: 0.4,
        width: 'fit-content',
        borderRadius: 1.25,
        bgcolor: COLORS.muted,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      {policies.map((policy) => {
        const meta = PLATFORM_META[policy.platform];
        const selected = policy.platform === value;
        const { tone } = getPolicyStatus(policy);

        return (
          <ButtonBase
            key={policy.platform}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(policy.platform)}
            disableRipple
            sx={{
              position: 'relative',
              px: 1.5,
              py: 0.6,
              borderRadius: 1,
              fontSize: 13,
              fontWeight: 600,
              color: selected ? COLORS.text : 'text.secondary',
              transition: 'color .15s ease',
              '&:hover': { color: COLORS.text },
              '&.Mui-focusVisible': { outline: `2px solid ${COLORS.border}`, outlineOffset: 1 },
            }}
          >
            {selected && (
              <Box
                component={m.span}
                layoutId="app-versions-platform-tab"
                transition={
                  reduceMotion ? { duration: 0 } : { type: 'spring', bounce: 0.15, duration: 0.35 }
                }
                sx={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 1,
                  bgcolor: 'common.white',
                  boxShadow: `0 0 0 1px ${COLORS.border}, 0 1px 2px rgba(15, 23, 42, 0.06)`,
                }}
              />
            )}
            <Stack
              component="span"
              direction="row"
              alignItems="center"
              spacing={0.75}
              sx={{ position: 'relative' }}
            >
              <Iconify icon={meta.icon} width={16} />
              <span>{meta.label}</span>
              <Box
                aria-label={tone}
                sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: TONES[tone].color }}
              />
            </Stack>
          </ButtonBase>
        );
      })}
    </Stack>
  );
}

PlatformTabs.propTypes = {
  policies: PropTypes.array.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};
