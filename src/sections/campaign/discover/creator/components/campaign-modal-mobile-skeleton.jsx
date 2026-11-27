import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

const labelSx = { color: '#8e8e93', fontWeight: 600 };
const dividerSx = { borderColor: '#EBEBEB', width: '100%', borderWidth: 0.8 };

function Field({ label, width }) {
  return (
    <Box>
      <Typography variant="body2" sx={{ ...labelSx, mb: 0.5 }}>
        {label}
      </Typography>
      <Skeleton width={width} height={14} />
    </Box>
  );
}

Field.propTypes = {
  label: PropTypes.string,
  width: PropTypes.string,
};

function ChipField({ label, widths }) {
  return (
    <Box sx={{ flex: 1 }}>
      <Typography variant="body2" sx={{ ...labelSx, mb: 1 }}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {widths.map((width, index) => (
          <Skeleton key={index} width={width} height={24} />
        ))}
      </Box>
    </Box>
  );
}

ChipField.propTypes = {
  label: PropTypes.string,
  widths: PropTypes.array,
};

export default function CampaignModalMobileSkeleton() {
  return (
    <Stack spacing={2} aria-busy="true" aria-label="Loading">
      <Divider sx={{ ...dividerSx, mt: 1 }} />

      <Stack spacing={2}>
        <Field label="Campaign Duration" width="60%" />
        <Field label="Posting Period" width="55%" />
        <ChipField label="Industry" widths={[72, 96]} />
      </Stack>

      <Stack spacing={2}>
        <Box sx={{ display: 'flex' }}>
          <ChipField label="Gender" widths={[56, 64]} />
          <ChipField label="Age" widths={[60]} />
        </Box>
        <Box sx={{ display: 'flex' }}>
          <ChipField label="Language" widths={[64, 52]} />
          <ChipField label="Creator Persona" widths={[80]} />
        </Box>
        <Field label="Geographic Focus" width="40%" />
      </Stack>

      <Divider sx={{ ...dividerSx, mb: 0.8 }} />

      <Stack spacing={1}>
        {[...Array(3)].map((_, index) => (
          <Skeleton key={index} height={42} />
        ))}
      </Stack>
    </Stack>
  );
}
