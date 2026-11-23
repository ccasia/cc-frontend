import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

export const STATUS = {
  conflict: {
    icon: 'mingcute:warning-fill',
    color: '#FFAB00',
    label: 'differ',
    hint: 'Values differ between places. Check these first.',
  },
  noBox: {
    icon: 'mingcute:eye-close-line',
    color: '#919EAB',
    label: 'no box',
    hint: 'No box on the image. Check these by eye.',
  },
  verified: {
    icon: 'solar:check-read-linear',
    color: '#22C55E',
    label: 'cross-checked',
    hint: 'Same value found in 2 or more places.',
  },
};

export const getStatus = (field) => {
  if (field.conflict) return 'conflict';
  if (!field.sources.some((source) => source.hasBox)) return 'noBox';
  if (field.sources.length > 1) return 'verified';
  return null;
};

function StatusDetail({ status, field }) {
  if (status === 'noBox') return 'No box on the image. Check this value by eye.';
  if (status === 'verified') return `Same value in ${field.sources.length} places.`;

  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        Values differ
      </Typography>
      {field.sources.map((source, i) => (
        <Typography key={i} variant="caption">
          {source.fileName}: {source.value}
        </Typography>
      ))}
    </Stack>
  );
}

StatusDetail.propTypes = {
  status: PropTypes.string.isRequired,
  field: PropTypes.object.isRequired,
};

export default function FieldStatus({ field }) {
  const status = getStatus(field);
  if (!status) return null;

  return (
    <Tooltip title={<StatusDetail status={status} field={field} />} placement="left" arrow>
      <Box component="span" sx={{ display: 'inline-flex', color: STATUS[status].color, flexShrink: 0 }}>
        <Iconify icon={STATUS[status].icon} width={16} />
      </Box>
    </Tooltip>
  );
}

FieldStatus.propTypes = {
  field: PropTypes.object.isRequired,
};
