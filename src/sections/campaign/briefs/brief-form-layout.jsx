import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// Shared chrome for the campaign brief form — the two-column layout with the
// title, italic subtitle, and numbered side-steps on the left and the form on
// the right. Used by both the authenticated detail view and the public invite
// page so the two render identically.

export const SIDE_STEPS = [
  { n: 1, title: 'Share your goals', desc: 'Tell us your audience, objective, and budget' },
  {
    n: 2,
    title: 'We do the heavy lifting',
    desc: 'We map the plan and match you with the right creators',
  },
  { n: 3, title: 'You call the shots', desc: "Approve and launch when you're ready" },
];

export default function BriefFormLayout({ topLeft, leftExtra, children, scrollMode }) {
  const internal = scrollMode === 'internal';

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' },
        gap: 4,
        alignItems: 'flex-start',
        ...(internal && {
          height: '100%',
          minHeight: 0,
          alignItems: 'stretch',
        }),
      }}
    >
      {/* Left side — title and steps. On the page it's sticky to the viewport;
          inside a fixed-height container it just stays put while the right
          column (the form) scrolls. */}
      <Box
        sx={{
          minWidth: 0,
          ...(internal
            ? { maxHeight: '100%', overflowY: 'auto' }
            : {
                position: { md: 'sticky' },
                top: { md: 24 },
                maxHeight: { md: 'calc(100vh - 48px)' },
                overflowY: { md: 'auto' },
              }),
        }}
      >
        {topLeft}
        <Typography
          sx={{
            fontFamily: 'Aileron, sans-serif',
            fontWeight: 700,
            fontStyle: 'normal',
            fontSize: { xs: '40px', sm: '52px', md: '64px' },
            lineHeight: { xs: '44px', sm: '56px', md: '68px' },
            letterSpacing: '-0.06em',
            textTransform: 'capitalize',
            textShadow: '0px 4px 6px rgba(0, 0, 0, 0.25)',
            mb: 2,
          }}
        >
          Your Campaign Starts Here
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Times New Roman", serif',
            fontWeight: 400,
            fontStyle: 'italic',
            fontSize: { xs: '26px', sm: '32px', md: '40px' },
            lineHeight: { xs: '30px', sm: '36px', md: '44px' },
            letterSpacing: '-0.04em',
            textShadow: '0px 4px 6px rgba(0, 0, 0, 0.25)',
            mb: 5,
            color: '#0F172A',
          }}
        >
          Tell us what you&apos;re building - we&apos;ll handle the rest
        </Typography>
        {/* Steps — numbered circles connected by a vertical blue line. The line
            is drawn as a per-step segment below each circle (except the last)
            so it never overshoots the final step. */}
        <Stack spacing={3}>
          {SIDE_STEPS.map((s, idx) => {
            const isLast = idx === SIDE_STEPS.length - 1;
            return (
              <Stack
                key={s.n}
                direction="row"
                spacing={2}
                alignItems="flex-start"
                sx={{ position: 'relative' }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    color: '#FFFFFF',
                    border: '2px solid #1340FF',
                    bgcolor: '#1340FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 13,
                    flexShrink: 0,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {s.n}
                </Box>
                {!isLast && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 13, // (28 - 2) / 2 to center the 2px line under the circle
                      top: 28, // bottom edge of the circle
                      bottom: -24, // span to the next circle's top (row bottom + 24px gap)
                      width: '2px',
                      bgcolor: '#1340FF',
                      zIndex: 0,
                    }}
                  />
                )}
                <Box sx={{ pt: 0.25 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 17, color: '#0F172A', lineHeight: 1.2 }}>
                    {s.title}
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: '#6B7280', mt: 0.25 }}>{s.desc}</Typography>
                </Box>
              </Stack>
            );
          })}
        </Stack>
        {leftExtra}
      </Box>

      {/* Right side — form + actions. minWidth:0 keeps a wide child (e.g. a
          long chip label) from forcing this grid column past its track and
          eating the page's right padding on mobile. In 'internal' mode this is
          the sole scroll area, so the left column stays fixed. */}
      <Box
        sx={{
          minWidth: 0,
          borderLeft: { md: '1px solid #E5E7EB' },
          pl: { md: 4 },
          ...(internal && { minHeight: 0, overflowY: 'auto', pr: { md: 1 } }),
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

BriefFormLayout.propTypes = {
  // Rendered above the title (e.g. a Back button). Optional.
  topLeft: PropTypes.node,
  // Rendered below the steps (e.g. status alerts). Optional.
  leftExtra: PropTypes.node,
  // Right-column content (the form + action bar).
  children: PropTypes.node,
  scrollMode: PropTypes.oneOf(['page', 'internal']),
};
