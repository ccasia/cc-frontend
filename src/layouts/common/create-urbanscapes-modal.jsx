import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import { Box, Stack, Button, Dialog, IconButton, Typography } from '@mui/material';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';

import BrushStroke from './brush-stroke';

const TICKET_URL = 'https://luma.com/cultcreative';
const EVENT_END = new Date('2026-11-02T00:00:00+08:00');
const ASSET_DIR = '/assets/images/modals/create-urbanscapes';

const LIME = '#D8FF01';
const ONYX = '#231F20';

const TITLE_UNDERLINE = {
  src: `${ASSET_DIR}/title-underline.svg`,
  width: 321.16,
  height: 18.0345,
  guideWidth: 8,
  guide: [
    [14, 11],
    [50, 8.5],
    [90, 6.8],
    [130, 6.8],
    [152, 7.5],
    [134, 11.5],
    [116, 15.5],
    [160, 13.5],
    [220, 12.5],
    [272, 12.5],
    [288, 14],
    [297, 15],
    [301, 11],
    [312, 5],
    [321, 0],
  ],
};

const CORNER_SCRIBBLE = {
  src: `${ASSET_DIR}/corner-scribble.svg`,
  width: 166.559,
  height: 67.2911,
  guideWidth: 14,
  guide: [
    [12, 53],
    [35, 37],
    [60, 21],
    [85, 9],
    [104, 3],
    [106, 6],
    [100, 14],
    [95, 22],
    [89, 30],
    [82, 40],
    [75, 48],
    [68, 56],
    [80, 51],
    [90, 45],
    [108, 33],
    [128, 21],
    [148, 10],
    [167, 0],
  ],
};

const seenKey = (userId) => `create-urbanscapes-modal-seen:${userId}`;

const hasSeen = (userId) => {
  try {
    return sessionStorage.getItem(seenKey(userId)) === '1';
  } catch {
    return false;
  }
};

const markSeen = (userId) => {
  try {
    sessionStorage.setItem(seenKey(userId), '1');
  } catch {
    // ignore storage errors
  }
};

export default function CreateUrbanscapesModal({ disabled }) {
  const { user } = useAuthContext();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (disabled || user?.role !== 'creator' || !user?.id) return;
    if (new Date() >= EVENT_END || hasSeen(user.id)) return;
    setOpen(true);
  }, [disabled, user?.role, user?.id]);

  const handleClose = () => {
    markSeen(user?.id);
    setOpen(false);
  };

  const handleGetTickets = () => {
    window.open(TICKET_URL, '_blank', 'noopener,noreferrer');
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: { xs: 'calc(100% - 32px)', md: 828 },
          maxWidth: 828,
          m: 2,
          borderRadius: 1.5,
          overflow: 'hidden',
          bgcolor: ONYX,
          backgroundImage: 'none',
        },
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ position: 'relative' }}>
        <Box
          component="img"
          src={`${ASSET_DIR}/poster.jpg`}
          alt="CRE.ATE by Cult Creative at Sky Society KL, 30.10.26 - 01.11.26"
          sx={{
            display: 'block',
            width: { xs: 1, md: 366 },
            height: { xs: 260, sm: 340, md: 'auto' },
            flexShrink: 0,
            objectFit: 'cover',
          }}
        />

        <Box
          component="img"
          src={`${ASSET_DIR}/spark-1.svg`}
          alt=""
          sx={{
            display: { xs: 'none', md: 'block' },
            position: 'absolute',
            left: 357,
            top: 73,
            width: 18,
          }}
        />
        <Box
          component="img"
          src={`${ASSET_DIR}/spark-2.svg`}
          alt=""
          sx={{
            display: { xs: 'none', md: 'block' },
            position: 'absolute',
            left: 361,
            top: 53,
            width: 18,
            transform: 'rotate(-57.41deg)',
          }}
        />

        <Stack
          spacing={4}
          justifyContent="center"
          sx={{
            position: 'relative',
            flex: 1,
            minHeight: { md: 476 },
            p: { xs: 3, md: 6 },
            overflow: 'hidden',
          }}
        >
          <Stack spacing={2.5}>
            <Box sx={{ position: 'relative', alignSelf: 'flex-start' }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ position: 'relative', zIndex: 1 }}
              >
                <Typography sx={titleSx}>CRE.ATE</Typography>
                <Typography sx={{ ...titleSx, fontSize: 20, lineHeight: '24px', pb: '2px' }}>
                  x
                </Typography>
                <Typography sx={titleSx}>URBANSCAPES</Typography>
              </Stack>
              <BrushStroke
                brush={TITLE_UNDERLINE}
                sx={{
                  position: 'absolute',
                  left: -10,
                  top: 20,
                  width: 'calc(100% + 20px)',
                  height: 18,
                  transform: 'rotate(-0.85deg)',
                }}
              />
            </Box>

            <Typography
              sx={{ color: 'common.white', fontSize: { xs: 16, md: 18 }, lineHeight: '22px' }}
            >
              CRE.ATE is taking over Urbanscapes! Get hands-on with workshops, shop your favourite
              local brands, and hear creators spill the real stories behind turning their passion
              into a career.
              <br />
              <br />
              Whether you’re a full-time creator, a side-hustle creative, or just here for the
              vibes, this one’s for you. 👽
            </Typography>
          </Stack>

          <Button
            fullWidth
            onClick={handleGetTickets}
            sx={{
              position: 'relative',
              zIndex: 1,
              height: 40,
              pt: '10px',
              pb: '13px',
              borderRadius: 1,
              bgcolor: LIME,
              color: ONYX,
              fontSize: 14,
              fontWeight: 600,
              lineHeight: '18px',
              boxShadow: 'inset 0px -3px 0px 0px rgba(0,0,0,0.45)',
              '&:hover': { bgcolor: LIME, opacity: 0.9 },
            }}
          >
            Get your tickets here!
          </Button>

          {[
            { right: -41, bottom: -12 },
            { right: -49, bottom: -17 },
          ].map((pos) => (
            <BrushStroke
              key={pos.right}
              brush={CORNER_SCRIBBLE}
              sx={{
                display: { xs: 'none', md: 'block' },
                position: 'absolute',
                ...pos,
                width: 166,
                height: 67,
              }}
            />
          ))}
        </Stack>

        <IconButton
          onClick={handleClose}
          aria-label="Close"
          sx={{
            position: 'absolute',
            top: { xs: 8, md: 11 },
            right: { xs: 8, md: 12 },
            color: 'common.white',
            bgcolor: { xs: 'rgba(0,0,0,0.4)', md: 'transparent' },
            '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
          }}
        >
          <Iconify icon="mingcute:close-line" width={24} />
        </IconButton>
      </Stack>
    </Dialog>
  );
}

const titleSx = {
  fontFamily: 'Aileron',
  fontWeight: 700,
  fontSize: { xs: 20, md: 24 },
  lineHeight: '28px',
  color: LIME,
  whiteSpace: 'nowrap',
};

CreateUrbanscapesModal.propTypes = {
  disabled: PropTypes.bool,
};
