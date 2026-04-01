import React from 'react';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';

import { Box, Card, Stack, colors, Skeleton, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

const CardMotion = m(Card);

const WhatsappCard = ({ label, id, icon, value = 0, isLoading = false }) => {
  if (isLoading) {
    return (
      <Skeleton
        sx={{
          height: 120,
          maxWidth: 350,
          minWidth: { xs: 1, sm: 0 },
          bgcolor: colors.background,
          border: `1px solid ${colors.grey[200]}`,
          borderRadius: 1,
          flex: 1,
          boxShadow: 0,
          position: 'relative',
          scrollSnapAlign: 'center',
        }}
      />
    );
  }

  return (
    <CardMotion
      animate={{ opacity: [0, 1] }}
      transition={{
        ease: 'easeInOut',
      }}
      sx={{
        p: 3,
        height: 120,
        maxWidth: 350,
        minWidth: { xs: 1, sm: 0 },
        bgcolor: colors.background,
        border: `1px solid ${colors.grey[200]}`,
        borderRadius: 1,
        flex: 1,
        boxShadow: 0,
        position: 'relative',
        scrollSnapAlign: 'center',
      }}
    >
      <Stack spacing={1} height="100%" justifyContent="space-between">
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography
            variant="caption"
            sx={{
              color: colors.secondary,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: 1,
              fontSize: '0.7rem',
            }}
          >
            {label || ''}
          </Typography>
        </Stack>

        <Box sx={{ position: 'absolute', right: 15, top: 10 }}>
          <Iconify
            icon={icon}
            width={80}
            sx={{ color: label === 'Messages read' ? colors.green[100] : colors.grey[100] }}
          />
        </Box>

        <Typography
          variant="h3"
          sx={{
            color: 'black',
            fontWeight: 700,
            lineHeight: 1,
            fontSize: '2rem',
          }}
        >
          {value}
        </Typography>
      </Stack>
    </CardMotion>
  );
};

export default WhatsappCard;

WhatsappCard.propTypes = {
  id: PropTypes.number,
  label: PropTypes.string,
  icon: PropTypes.string,
  value: PropTypes.number,
  isLoading: PropTypes.bool,
};
