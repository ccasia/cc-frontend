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
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#9ca3af',
};

export default function PipelineBoard({ briefs, actions }) {
  const columns = groupBriefsIntoColumns(briefs);

  return (
    <Box>
      <Typography sx={{ ...SECTION_LABEL_SX, mb: 2 }}>Your Pipeline</Typography>

      <Box sx={{ overflowX: 'auto', pb: 1 }}>
        <Stack direction="row" spacing={2} sx={{ minWidth: 1100 }}>
          {PIPELINE_COLUMNS.map((col) => {
            const items = columns[col.key] || [];
            return (
              <Box key={col.key} sx={{ flex: 1, minWidth: 220 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 1.5, pb: 1, borderBottom: '1px solid #ebebeb' }}
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

                <Stack spacing={1.5}>
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
