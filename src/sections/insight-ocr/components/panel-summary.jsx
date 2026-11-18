import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

import { STATUS, getStatus } from './field-status';

const ORDER = ['conflict', 'noBox', 'verified'];

export default function PanelSummary({ title, fields }) {
  const counts = fields.reduce((acc, field) => {
    const status = getStatus(field);
    if (status) acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});
  const statuses = ORDER.filter((status) => counts[status]);

  if (!title && !statuses.length) return null;

  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1, minHeight: 32 }}>
      {title && (
        <>
          <Typography variant="subtitle2">{title}</Typography>
          {!!fields.length && (
            <Box
              sx={{
                px: 0.75,
                borderRadius: 0.75,
                bgcolor: '#F4F4F5',
                typography: 'caption',
                fontWeight: 600,
                lineHeight: '20px',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {fields.length}
            </Box>
          )}
        </>
      )}

      <Box sx={{ flex: 1 }} />

      {statuses.map((status) => (
        <Tooltip key={status} title={STATUS[status].hint} arrow>
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ cursor: 'default' }}>
            <Iconify icon={STATUS[status].icon} width={14} sx={{ color: STATUS[status].color }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
              {counts[status]} {STATUS[status].label}
            </Typography>
          </Stack>
        </Tooltip>
      ))}
    </Stack>
  );
}

PanelSummary.propTypes = {
  title: PropTypes.string,
  fields: PropTypes.array.isRequired,
};
