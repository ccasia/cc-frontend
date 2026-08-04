import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';

import { Box, Stack, Button, Container, Typography, CircularProgress } from '@mui/material';

import { useParams } from 'src/routes/hooks';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

// Public store listings — safe to expose; opening the app is the primary CTA.
const APP_STORE_URL = 'https://apps.apple.com/app/cult-creative/id0000000000';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.cultcreative.cultapp';
const INSTAGRAM_URL = 'https://www.instagram.com/cultcreativeasia/';

// The giveaway terms, kept in sync with cult-app's hunt detail screen
// (app/(app)/hunts/[id]/index.tsx). Broken into fields rather than paragraphs so
// the prize can lead and the mechanics can be steps — a wall of body copy is the
// one thing nobody reads on a page they reached by scanning a poster.
const GIVEAWAY = {
  artist: 'The Weeknd',
  prizeQuantity: '2 concert tickets',
  partner: 'Universal Music Malaysia',
  deadline: '9 Oct 2026, 9:00 PM MYT',
  steps: [
    'Find Cipta hiding around the Klang Valley — up to ten spots in all.',
    'Scan each QR in the Cult Creative app. One scan, one entry.',
    'The more spots you find, the more entries you get.',
  ],
  winnerHandle: '@cultcreativeasia',
};

const PALETTE = {
  ink: '#0B0A0C',
  surface: '#17151A',
  raised: '#211D24',
  line: 'rgba(255, 255, 255, 0.10)',
  text: '#F6F4F1',
  muted: '#948D98',
  green: '#4ADE80',
  lilac: '#E4B7F0',
};

// Matches the film grain in Cipta's own artwork so the page and the character
// share a texture instead of the art sitting on flat digital black.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

const AVAILABILITY = {
  AVAILABLE: null,
  NOT_STARTED: { icon: 'mdi:clock-outline', text: 'The hunt hasn’t started yet — check back soon.' },
  PAUSED: { icon: 'mdi:pause-circle-outline', text: 'The hunt is paused for now. Try again later.' },
  ENDED: { icon: 'mdi:flag-checkered', text: 'This hunt has ended.' },
  ARCHIVED: { icon: 'mdi:flag-checkered', text: 'This hunt has ended.' },
  LOCATION_DISABLED: {
    icon: 'mdi:map-marker-off-outline',
    text: 'This spot is no longer part of the hunt.',
  },
};

// Staggered reveal — one orchestrated entrance beats scattered micro-animations,
// and it gives the scan a small moment of ceremony.
const rise = (delay) => ({
  opacity: 0,
  animation: 'ciptaRise 620ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
  animationDelay: `${delay}ms`,
  '@keyframes ciptaRise': {
    from: { opacity: 0, transform: 'translateY(14px)' },
    to: { opacity: 1, transform: 'none' },
  },
});

const Eyebrow = ({ children, color = PALETTE.muted }) => (
  <Typography
    component="p"
    sx={{
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color,
    }}
  >
    {children}
  </Typography>
);

Eyebrow.propTypes = { children: PropTypes.node, color: PropTypes.string };

/**
 * The prize drawn as an actual ticket stub — perforation, notches and all. The
 * giveaway is concert tickets, so the one metaphor everyone already recognises
 * is the thing itself; a bordered box was leaving that on the table.
 */
const PrizeTicket = () => {
  const notch = {
    content: '""',
    position: 'absolute',
    top: 0,
    width: 20,
    height: 20,
    borderRadius: '50%',
    bgcolor: PALETTE.ink,
    transform: 'translateY(-50%)',
  };

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 3,
        overflow: 'hidden',
        // Deliberately borderless: a rectangular outline runs straight past the
        // notches and flattens them back into decoration. The fill alone lets
        // the bites read as real cut-outs.
        background: `linear-gradient(158deg, #2A2430 0%, ${PALETTE.surface} 58%)`,
      }}
    >
      <Stack spacing={0.75} alignItems="center" sx={{ px: 2, pt: 3, pb: 2.75, textAlign: 'center' }}>
        <Eyebrow>Stand a chance to win</Eyebrow>

        <Stack direction="row" spacing={0.875} alignItems="center" sx={{ pt: 0.5 }}>
          <Iconify icon="mdi:ticket-confirmation" width={17} sx={{ color: PALETTE.lilac }} />
          <Typography
            sx={{
              fontSize: 12.5,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: PALETTE.lilac,
            }}
          >
            {GIVEAWAY.prizeQuantity}
          </Typography>
        </Stack>

        <Typography
          sx={{
            fontFamily: 'Instrument Serif',
            // Fluid rather than stepped: the headline is the page's loudest
            // element and must never wrap awkwardly on a 320px screen.
            fontSize: 'clamp(2.75rem, 16vw, 3.75rem)',
            lineHeight: 1.02,
            letterSpacing: '-0.015em',
            width: '100%',
            wordBreak: 'break-word',
          }}
        >
          {GIVEAWAY.artist}
        </Typography>

        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ pt: 0.75 }}>
          <Box sx={{ width: 22, height: '1px', bgcolor: 'rgba(255,255,255,0.18)' }} />
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.26em',
              textTransform: 'uppercase',
              color: PALETTE.muted,
            }}
          >
            Live in concert
          </Typography>
          <Box sx={{ width: 22, height: '1px', bgcolor: 'rgba(255,255,255,0.18)' }} />
        </Stack>
      </Stack>

      {/* Perforation: a dashed rule with a bite taken out of each edge. */}
      <Box
        sx={{
          position: 'relative',
          height: 0,
          borderTop: `1px dashed rgba(255,255,255,0.18)`,
          '&::before': { ...notch, left: -10 },
          '&::after': { ...notch, right: -10 },
        }}
      />

      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2.5, py: 1.75 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: PALETTE.muted,
            }}
          >
            In collaboration with
          </Typography>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.3, mt: 0.25 }}>
            {GIVEAWAY.partner}
          </Typography>
        </Box>

        {/* Faux barcode — the detail that makes the stub unmistakably a ticket. */}
        <Box
          aria-hidden
          sx={{
            flexShrink: 0,
            width: 52,
            height: 26,
            opacity: 0.45,
            backgroundImage:
              'repeating-linear-gradient(90deg, #fff 0 1px, transparent 1px 3px, #fff 3px 5px, transparent 5px 8px)',
          }}
        />
      </Stack>
    </Box>
  );
};

/**
 * Store badge in the familiar two-line lockup, drawn with icon fonts rather than
 * Apple's and Google's official badge artwork, which is brand-licensed — swap in
 * the real assets before a public launch.
 */
const StoreBadge = ({ href, icon, caption, name }) => (
  <Button
    href={href}
    target="_blank"
    rel="noopener"
    sx={{
      flex: 1,
      // Without this a flex child refuses to shrink below its content width,
      // which is what pushes these two side-by-side badges off a 320px screen.
      minWidth: 0,
      justifyContent: 'center',
      gap: 1,
      px: 1.25,
      py: 1.15,
      borderRadius: 2,
      color: PALETTE.text,
      bgcolor: 'transparent',
      border: `1px solid ${PALETTE.line}`,
      textTransform: 'none',
      transition: 'background-color 160ms ease, border-color 160ms ease',
      '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.24)' },
    }}
  >
    <Iconify icon={icon} width={20} sx={{ flexShrink: 0 }} />
    <Box sx={{ textAlign: 'left', lineHeight: 1.15, minWidth: 0 }}>
      <Box
        component="span"
        sx={{ display: 'block', fontSize: 8.5, color: PALETTE.muted, whiteSpace: 'nowrap' }}
      >
        {caption}
      </Box>
      <Box
        component="span"
        sx={{ display: 'block', fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap' }}
      >
        {name}
      </Box>
    </Box>
  </Button>
);

StoreBadge.propTypes = {
  href: PropTypes.string,
  icon: PropTypes.string,
  caption: PropTypes.string,
  name: PropTypes.string,
};

export default function HuntLinkView() {
  const { token } = useParams();
  const [state, setState] = useState({ loading: true, preview: null, error: false });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await axiosInstance.post(endpoints.treasureHunt.preview, { token });
        if (active) setState({ loading: false, preview: res.data?.data ?? res.data, error: false });
      } catch {
        if (active) setState({ loading: false, preview: null, error: true });
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  const openApp = () => {
    // Custom-scheme fallback: if the app is installed but the Universal Link
    // didn't open it, this deep link will.
    window.location.href = `cultapp://hunt/${token}`;
  };

  const { loading, preview, error } = state;
  const hunt = preview?.hunt;
  const location = preview?.location;
  const availability = preview?.availability ?? 'AVAILABLE';
  const notice = AVAILABILITY[availability] ?? null;
  const isClaimable = !notice;

  return (
    <>
      <Helmet>
        <title>Cipta is Hiding — Cult Creative</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="referrer" content="no-referrer" />
        <meta name="theme-color" content={PALETTE.ink} />
      </Helmet>

      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: PALETTE.ink,
          color: PALETTE.text,
          position: 'relative',
          overflow: 'hidden',
          // Lilac bloom behind the artwork, picked straight out of Cipta's own
          // backdrop so the page reads as an extension of the character.
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -160,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 620,
            height: 620,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(228,183,240,0.20) 0%, rgba(228,183,240,0) 68%)`,
            pointerEvents: 'none',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundImage: GRAIN,
            opacity: 0.05,
            mixBlendMode: 'overlay',
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="xs" sx={{ position: 'relative', py: { xs: 5, sm: 7 } }}>
          {loading && (
            <Stack alignItems="center" sx={{ py: 14 }}>
              <CircularProgress size={26} thickness={5} sx={{ color: PALETTE.lilac }} />
            </Stack>
          )}

          {!loading && error && (
            <Stack spacing={2} alignItems="center" sx={{ py: 12, textAlign: 'center' }}>
              <Iconify icon="mdi:link-variant-off" width={44} sx={{ color: PALETTE.muted }} />
              <Typography
                sx={{ fontFamily: 'Instrument Serif', fontSize: 34, lineHeight: 1.1 }}
              >
                This link isn’t valid
              </Typography>
              <Typography sx={{ color: PALETTE.muted, fontSize: 14 }}>
                The QR code may be expired or mistyped.
              </Typography>
            </Stack>
          )}

          {!loading && !error && (
            <Stack spacing={3.5}>
              {/* The find is the reward — acknowledge it before asking for anything. */}
              <Stack alignItems="center" spacing={2.5} sx={rise(0)}>
                <Box sx={{ position: 'relative' }}>
                  {hunt?.heroArtworkUrl && (
                    <Box
                      component="img"
                      src={hunt.heroArtworkUrl}
                      alt={hunt?.title ?? 'Cipta'}
                      sx={{
                        width: 'clamp(112px, 34vw, 148px)',
                        height: 'clamp(112px, 34vw, 148px)',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        display: 'block',
                        boxShadow: `0 0 0 1px ${PALETTE.line}, 0 24px 60px rgba(228,183,240,0.18)`,
                      }}
                    />
                  )}
                  {isClaimable && (
                    <Stack
                      alignItems="center"
                      justifyContent="center"
                      sx={{
                        position: 'absolute',
                        right: -2,
                        bottom: -2,
                        width: 42,
                        height: 42,
                        borderRadius: '50%',
                        bgcolor: PALETTE.green,
                        color: PALETTE.ink,
                        border: `3px solid ${PALETTE.ink}`,
                      }}
                    >
                      <Iconify icon="eva:checkmark-fill" width={22} />
                    </Stack>
                  )}
                </Box>

                {location?.name && (
                  <Stack alignItems="center" spacing={0.75} sx={{ width: '100%' }}>
                    <Eyebrow color={isClaimable ? PALETTE.green : PALETTE.muted}>
                      {isClaimable ? 'You found Cipta' : 'Cipta was hiding at'}
                    </Eyebrow>
                    <Typography
                      sx={{
                        fontSize: 20,
                        fontWeight: 600,
                        textAlign: 'center',
                        // Venue names are admin-entered and can run long.
                        wordBreak: 'break-word',
                      }}
                    >
                      {location.name}
                    </Typography>
                  </Stack>
                )}
              </Stack>

              {notice ? (
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  sx={{
                    ...rise(80),
                    p: 2,
                    borderRadius: 2,
                    bgcolor: PALETTE.surface,
                    border: `1px solid ${PALETTE.line}`,
                  }}
                >
                  <Iconify icon={notice.icon} width={22} sx={{ color: PALETTE.muted }} />
                  <Typography sx={{ fontSize: 14, color: PALETTE.muted }}>{notice.text}</Typography>
                </Stack>
              ) : (
                <>
                  {/* The prize is the only reason anyone reads on. It leads. */}
                  <Box sx={rise(80)}>
                    <PrizeTicket />
                  </Box>

                  {/* CTA sits above the explanation: they just scanned, they want
                      to claim. Detail is for whoever scrolls. */}
                  <Stack spacing={1.5} sx={rise(160)}>
                    <Button
                      onClick={openApp}
                      startIcon={<Iconify icon="mdi:cellphone-arrow-down" width={20} />}
                      sx={{
                        py: 1.6,
                        px: 1.5,
                        borderRadius: 2,
                        fontSize: { xs: 14.5, sm: 15 },
                        fontWeight: 700,
                        lineHeight: 1.3,
                        textTransform: 'none',
                        color: PALETTE.ink,
                        bgcolor: PALETTE.green,
                        transition: 'transform 140ms ease, background-color 140ms ease',
                        '&:hover': { bgcolor: '#3FCB71', transform: 'translateY(-1px)' },
                        '&:active': { transform: 'none' },
                      }}
                    >
                      Claim this entry in the app
                    </Button>

                    <Stack direction="row" spacing={1.5}>
                      <StoreBadge
                        href={APP_STORE_URL}
                        icon="mdi:apple"
                        caption="Download on the"
                        name="App Store"
                      />
                      <StoreBadge
                        href={PLAY_STORE_URL}
                        icon="mdi:google-play"
                        caption="Get it on"
                        name="Google Play"
                      />
                    </Stack>

                    <Typography sx={{ fontSize: 12, color: PALETTE.muted, textAlign: 'center' }}>
                      Don’t have the app yet? Install it, then scan again to log this spot.
                    </Typography>
                  </Stack>

                  {/* A connecting rail turns three bullets into one sequence —
                      the mechanics are ordered, so they should look ordered. */}
                  <Box sx={{ ...rise(240), pt: 1 }}>
                    <Box sx={{ mb: 2 }}>
                      <Eyebrow>How it works</Eyebrow>
                    </Box>

                    {GIVEAWAY.steps.map((step, index) => {
                      const isLast = index === GIVEAWAY.steps.length - 1;

                      return (
                        <Stack key={step} direction="row" spacing={1.75} alignItems="stretch">
                          <Stack alignItems="center" sx={{ flexShrink: 0 }}>
                            <Stack
                              alignItems="center"
                              justifyContent="center"
                              sx={{
                                width: 26,
                                height: 26,
                                borderRadius: '50%',
                                bgcolor: PALETTE.raised,
                                border: `1px solid rgba(228,183,240,0.30)`,
                                fontSize: 12,
                                fontWeight: 700,
                                color: PALETTE.lilac,
                              }}
                            >
                              {index + 1}
                            </Stack>
                            {!isLast && (
                              <Box
                                sx={{
                                  flexGrow: 1,
                                  width: '1px',
                                  my: 0.75,
                                  bgcolor: 'rgba(255,255,255,0.12)',
                                }}
                              />
                            )}
                          </Stack>

                          <Typography
                            sx={{
                              fontSize: 14,
                              lineHeight: 1.55,
                              color: '#CFC9D2',
                              pt: '3px',
                              pb: isLast ? 0 : 2.5,
                            }}
                          >
                            {step}
                          </Typography>
                        </Stack>
                      );
                    })}
                  </Box>

                  {/* Label/value pairs so the two facts read as one spec block
                      rather than a heading and a loose sentence. */}
                  <Stack
                    sx={{
                      ...rise(320),
                      borderRadius: 2.5,
                      overflow: 'hidden',
                      bgcolor: PALETTE.surface,
                    }}
                  >
                    <Stack direction="row" spacing={1.75} alignItems="center" sx={{ p: 2 }}>
                      <Iconify icon="mdi:timer-sand" width={20} sx={{ color: PALETTE.lilac }} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: 9.5,
                            fontWeight: 700,
                            letterSpacing: '0.16em',
                            textTransform: 'uppercase',
                            color: PALETTE.muted,
                          }}
                        >
                          Entries close
                        </Typography>
                        <Typography sx={{ fontSize: 14.5, fontWeight: 600, mt: 0.25 }}>
                          {GIVEAWAY.deadline}
                        </Typography>
                      </Box>
                    </Stack>

                    <Box sx={{ height: '1px', bgcolor: 'rgba(255,255,255,0.07)', mx: 2 }} />

                    <Stack
                      component="a"
                      href={INSTAGRAM_URL}
                      target="_blank"
                      rel="noopener"
                      direction="row"
                      spacing={1.75}
                      alignItems="center"
                      sx={{
                        p: 2,
                        textDecoration: 'none',
                        color: 'inherit',
                        transition: 'background-color 160ms ease',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                      }}
                    >
                      <Iconify icon="mdi:instagram" width={20} sx={{ color: PALETTE.lilac }} />
                      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                        <Typography
                          sx={{
                            fontSize: 9.5,
                            fontWeight: 700,
                            letterSpacing: '0.16em',
                            textTransform: 'uppercase',
                            color: PALETTE.muted,
                          }}
                        >
                          Winner announced
                        </Typography>
                        <Typography sx={{ fontSize: 14.5, fontWeight: 600, mt: 0.25 }} noWrap>
                          {GIVEAWAY.winnerHandle}
                        </Typography>
                      </Box>
                      <Iconify
                        icon="eva:arrow-ios-forward-fill"
                        width={18}
                        sx={{ color: PALETTE.muted, flexShrink: 0 }}
                      />
                    </Stack>
                  </Stack>
                </>
              )}

              <Typography
                sx={{
                  ...rise(400),
                  fontSize: 11,
                  color: PALETTE.muted,
                  textAlign: 'center',
                  pt: 0.5,
                }}
              >
                Cult Creative
              </Typography>
            </Stack>
          )}
        </Container>
      </Box>
    </>
  );
}
