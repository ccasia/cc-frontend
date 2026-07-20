import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import PipelineCard from './pipeline-card';
import { PIPELINE_COLUMNS, groupBriefsIntoColumns } from './pipeline-utils';

// ----------------------------------------------------------------------

const SECTION_LABEL_SX = {
  fontFamily: "'Inter Display', Inter, sans-serif",
  fontSize: '0.72rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  color: '#9ca3af',
};

// The board fills from its top down to the bottom of the viewport. Fixed (not
// max) height keeps it a definite-height flex container so each column's card
// list can scroll internally instead of the whole board scrolling as one.
const BOARD_HEIGHT = 'calc(100vh - 230px)';

export default function PipelineBoard({ briefs, actions }) {
  const columns = groupBriefsIntoColumns(briefs);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: BOARD_HEIGHT, minHeight: 360 }}>
      <Typography sx={{ ...SECTION_LABEL_SX, mb: 2, flexShrink: 0 }}>Your Pipeline</Typography>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowX: 'auto',
          pb: 1,
          // Hide the board's horizontal scrollbar (still scrollable by trackpad/shift-wheel).
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <Stack direction="row" spacing={2} sx={{ minWidth: 1100, height: '100%' }}>
          {PIPELINE_COLUMNS.map((col) => {
            const items = columns[col.key] || [];
            return (
              <Box
                key={col.key}
                sx={{
                  flex: 1,
                  minWidth: 220,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  borderRadius: 2,
                  bgcolor: '#fafafa',
                  border: '1px solid #f0f0f0',
                  p: 1.5,
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 1.5, pb: 1, borderBottom: '1px solid #ebebeb', flexShrink: 0 }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: col.color }} />
                    <Typography
                      sx={{
                        ...SECTION_LABEL_SX,
                        fontSize: '0.7rem',
                        color: '#4b5563',
                      }}
                    >
                      {col.label}
                    </Typography>
                  </Stack>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#9ca3af' }}>
                    {items.length}
                  </Typography>
                </Stack>

                {/* The lane's scroll area — flex:1 fills the column, minHeight:0
                    lets it shrink so overflowing cards scroll within the lane. */}
                <Stack
                  spacing={1.5}
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: 'auto',
                    pb: 0.5,
                    // Hide the lane's vertical scrollbar (still scrollable by wheel/trackpad).
                    scrollbarWidth: 'none',
                    '&::-webkit-scrollbar': { display: 'none' },
                  }}
                >
                  {items.map((brief) => (
                    <PipelineCard key={brief.id} brief={brief} {...actions} />
                  ))}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
}

PipelineBoard.propTypes = {
  briefs: PropTypes.array,
  actions: PropTypes.object,
};
