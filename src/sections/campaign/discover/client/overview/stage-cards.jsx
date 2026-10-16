import PropTypes from 'prop-types';

import { Box, Stack, ButtonBase, Typography } from '@mui/material';

import { TONES, dueText, ownerLabel, SEGMENT_COLORS } from './stages';
import { Pill, goToTab, monoFont, toneColors, tabularNums } from './parts';

export default function StageCards({ stages, viewerRole }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'minmax(0, 1fr)',
          sm: 'repeat(2, minmax(0, 1fr))',
          lg: 'repeat(4, minmax(0, 1fr))',
        },
        border: 1,
        borderColor: 'divider',
        borderRadius: '14px',
        overflow: 'hidden',
        // Dividers between columns and rows, whichever way the grid wraps.
        gap: '1px',
        bgcolor: 'divider',
      }}
    >
      {stages.map((stage, index) => (
        <StageCard key={stage.key} stage={stage} number={index + 1} viewerRole={viewerRole} />
      ))}
    </Box>
  );
}

StageCards.propTypes = {
  stages: PropTypes.array.isRequired,
  viewerRole: PropTypes.oneOf(['client', 'admin']).isRequired,
};

function StageCard({ stage, number, viewerRole }) {
  const colors = toneColors(stage.tone);

  return (
    <Stack spacing={1.25} sx={{ px: 2, pb: 2, bgcolor: 'background.paper', minWidth: 0 }}>
      <Box sx={{ height: 3, mx: -2, bgcolor: 'grey.200' }}>
        <Box sx={{ height: 1, width: `${stage.progress}%`, bgcolor: colors.bar }} />
      </Box>

      <Stack direction="row" alignItems="center" spacing={1} sx={{ pt: 0.75 }}>
        <Box
          sx={{
            width: 18,
            height: 18,
            flex: 'none',
            display: 'grid',
            placeItems: 'center',
            borderRadius: '50%',
            border: 1,
            borderColor: 'divider',
            fontSize: 10,
            color: 'text.secondary',
            ...monoFont,
          }}
        >
          {number}
        </Box>
        <Typography sx={{ fontSize: 13, fontWeight: 600, flex: 1, minWidth: 0 }} noWrap>
          {stage.name}
        </Typography>
        <Pill bgcolor={colors.pillBg} color={colors.pillText}>
          {stage.pill || TONES[stage.tone].pill}
        </Pill>
      </Stack>

      <Stack direction="row" alignItems="baseline" spacing={0.75}>
        <Typography sx={{ fontSize: 24, fontWeight: 600, lineHeight: 1.2, ...tabularNums }}>
          {stage.stat}
        </Typography>
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{stage.statLabel}</Typography>
      </Stack>

      <SegmentBar segments={stage.segments} />

      <Box sx={{ mt: 'auto !important', pt: 0.5 }}>
        {stage.action ? (
          <ActionCallout action={stage.action} tab={stage.tab} viewerRole={viewerRole} />
        ) : (
          <Box
            sx={{
              px: 1.5,
              py: 1.25,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              fontSize: 12,
              color: 'text.secondary',
            }}
          >
            {stage.note}
          </Box>
        )}
      </Box>
    </Stack>
  );
}

StageCard.propTypes = {
  stage: PropTypes.object.isRequired,
  number: PropTypes.number.isRequired,
  viewerRole: PropTypes.string.isRequired,
};

export function SegmentBar({ segments }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <Box sx={{ minHeight: 34 }}>
      <Stack
        direction="row"
        spacing="2px"
        sx={{
          height: 5,
          borderRadius: 1,
          overflow: 'hidden',
          bgcolor: total ? 'transparent' : 'grey.200',
        }}
      >
        {segments.map((s) => (
          <Box
            key={s.label}
            sx={{ width: `${(s.value / total) * 100}%`, bgcolor: SEGMENT_COLORS[s.color] }}
          />
        ))}
      </Stack>
      <Stack
        direction="row"
        flexWrap="wrap"
        columnGap={1.25}
        rowGap={0.25}
        sx={{ mt: 1, fontSize: 11, color: 'text.secondary', ...tabularNums }}
      >
        {segments.map((s) => (
          <Stack key={s.label} direction="row" alignItems="center" spacing={0.625}>
            <Box
              sx={{ width: 7, height: 7, borderRadius: '2px', bgcolor: SEGMENT_COLORS[s.color] }}
            />
            <span>
              {s.value} {s.label}
            </span>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

SegmentBar.propTypes = {
  segments: PropTypes.arrayOf(
    PropTypes.shape({ label: PropTypes.string, value: PropTypes.number, color: PropTypes.string })
  ).isRequired,
};

function ActionCallout({ action, tab, viewerRole }) {
  const due = dueText(action.dueAt);
  const overdue = due?.startsWith('Overdue');

  return (
    <ButtonBase
      onClick={() => goToTab(tab)}
      sx={{
        width: 1,
        px: 1.5,
        py: 1.25,
        gap: 1,
        justifyContent: 'space-between',
        textAlign: 'left',
        borderRadius: 1,
        bgcolor: 'warning.lighter',
        '&:hover': { bgcolor: 'warning.light' },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'warning.dark' },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: 'text.primary' }}>
          {action.text}
        </Typography>
        <Typography
          sx={{ mt: 0.25, fontSize: 11, color: overdue ? 'error.dark' : 'warning.darker' }}
        >
          {[ownerLabel(action.owner, viewerRole), due].filter(Boolean).join(' · ')}
        </Typography>
      </Box>
      <Box component="span" aria-hidden sx={{ color: 'warning.darker' }}>
        →
      </Box>
    </ButtonBase>
  );
}

ActionCallout.propTypes = {
  action: PropTypes.object.isRequired,
  tab: PropTypes.string.isRequired,
  viewerRole: PropTypes.string.isRequired,
};
