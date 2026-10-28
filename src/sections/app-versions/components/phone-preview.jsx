import PropTypes from 'prop-types';
import { useId, useState } from 'react';
import { m, AnimatePresence, useReducedMotion } from 'framer-motion';

import { Box, Stack, ButtonBase, Typography } from '@mui/material';

import { COLORS, APP_SCREENS, compareVersions } from '../utils';
import { SoftDialog, ForceScreen } from './app-screens';

// Live preview of what each group of users sees in the app
export default function PhonePreview({ minimumVersion, latestVersion, message }) {
  const hasPrompt = compareVersions(minimumVersion, latestVersion) < 0;
  const [picked, setPicked] = useState('prompted');
  const screen = hasPrompt ? picked : 'blocked';
  const tabId = useId();
  const reduceMotion = useReducedMotion();

  const options = [
    { key: 'blocked', label: 'Blocked', caption: `Users below ${minimumVersion}` },
    ...(hasPrompt
      ? [
          {
            key: 'prompted',
            label: 'Prompted',
            caption: `Users on ${minimumVersion} or later, but below ${latestVersion}`,
          },
        ]
      : []),
  ];
  const caption = options.find((option) => option.key === screen).caption;

  return (
    <Stack spacing={1.5} alignItems="center">
      <Stack
        direction="row"
        spacing={0.5}
        role="tablist"
        sx={{
          p: 0.5,
          width: 1,
          borderRadius: 1.25,
          bgcolor: COLORS.muted,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        {options.map((option) => {
          const selected = option.key === screen;
          return (
            <ButtonBase
              key={option.key}
              role="tab"
              aria-selected={selected}
              onClick={() => setPicked(option.key)}
              disableRipple
              sx={{
                flex: 1,
                py: 0.5,
                position: 'relative',
                borderRadius: 0.75,
                fontSize: 12,
                fontFamily: "'InterDisplay Medium', InterDisplay, sans-serif",
                fontWeight: 400,
                color: selected ? COLORS.text : 'text.secondary',
                transition: 'color 200ms',
                '&.Mui-focusVisible': { outline: `2px solid ${COLORS.border}`, outlineOffset: 1 },
              }}
            >
              {selected && (
                <Box
                  component={m.span}
                  layoutId={`preview-tab-${tabId}`}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: 'spring', bounce: 0.15, duration: 0.35 }
                  }
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 0.75,
                    bgcolor: 'common.white',
                    boxShadow: `0 0 0 1px ${COLORS.border}`,
                  }}
                />
              )}
              <Box component="span" sx={{ position: 'relative' }}>
                {option.label}
              </Box>
            </ButtonBase>
          );
        })}
      </Stack>

      <Box
        sx={{
          width: 1,
          maxWidth: 260,
          aspectRatio: '9 / 19',
          borderRadius: 5,
          overflow: 'hidden',
          border: '6px solid #3A3736',
          position: 'relative',
          bgcolor: '#141213',
        }}
      >
        <AnimatePresence initial={false}>
          <Box
            key={screen}
            component={m.div}
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
            sx={{ position: 'absolute', inset: 0 }}
          >
            {screen === 'blocked' ? (
              <ForceScreen
                title={APP_SCREENS.force.title}
                body={message || APP_SCREENS.force.body}
              />
            ) : (
              <SoftDialog
                title={APP_SCREENS.soft.title}
                body={message || APP_SCREENS.soft.body(latestVersion)}
              />
            )}
          </Box>
        </AnimatePresence>
      </Box>

      <Typography
        key={screen}
        component={m.p}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        sx={{ fontSize: 12, color: 'text.secondary', textAlign: 'center' }}
      >
        {caption}
      </Typography>
    </Stack>
  );
}

PhonePreview.propTypes = {
  minimumVersion: PropTypes.string.isRequired,
  latestVersion: PropTypes.string.isRequired,
  message: PropTypes.string,
};
