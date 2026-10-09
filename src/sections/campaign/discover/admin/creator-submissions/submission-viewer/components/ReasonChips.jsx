import PropTypes from 'prop-types';

import { Box, Chip, Stack, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

import { sectionLabelSx } from '../styles';
import useReasonPicker from '../hooks/use-reason-picker';
import { useCreatorSubmissionsStore } from '../../store/use-creator-submissions-store';

// Multi-select reasons as a full-width checklist of toggle chips. Everything comes from the
// store via useReasonPicker(kind). The label counts what's selected. Selected values outside
// the options (e.g. a client's custom reason) still show, so they can be kept or dropped.
export default function ReasonChips({ kind }) {
  const { label, options, selected, onChange, error } = useReasonPicker(kind);
  // Locked while a decision, caption save or feedback post is in flight
  const disabled = useCreatorSubmissionsStore(
    (s) => Boolean(s.pendingDecision) || s.captionSaving || s.feedbackSending
  );

  const choices = [...new Set([...options, ...selected])];

  const toggle = (reason) =>
    onChange(
      selected.includes(reason) ? selected.filter((item) => item !== reason) : [...selected, reason]
    );

  return (
    <Stack gap={0.75}>
      <Typography sx={sectionLabelSx}>
        {label}
        {selected.length > 0 && (
          <Box component="span" sx={{ color: '#1304FF' }}>
            {' '}
            · {selected.length} selected
          </Box>
        )}
      </Typography>

      <Stack gap={0.75}>
        {choices.map((reason) => {
          const isSelected = selected.includes(reason);
          return (
            <Chip
              key={reason}
              label={reason}
              clickable
              disabled={disabled}
              onClick={() => toggle(reason)}
              icon={
                <Iconify icon={isSelected ? 'eva:checkmark-fill' : 'eva:plus-fill'} width={14} />
              }
              variant={isSelected ? 'filled' : 'outlined'}
              aria-pressed={isSelected}
              sx={{
                width: 1,
                height: 36,
                px: 0.5,
                borderRadius: 1,
                justifyContent: 'flex-start',
                fontSize: 13,
                fontWeight: 500,
                borderColor: error && !isSelected ? '#F04438' : '#D9D9DE',
                ...(isSelected
                  ? {
                      color: '#1304FF',
                      bgcolor: '#EDEBFF',
                      '&:hover': { bgcolor: '#DCD8FF' },
                      '& .MuiChip-icon': { color: '#1304FF' },
                    }
                  : { color: '#3C3C44', '& .MuiChip-icon': { color: '#8A8A92' } }),
              }}
            />
          );
        })}
      </Stack>

      {error && <Typography sx={{ fontSize: 12, color: '#F04438' }}>{error}</Typography>}
    </Stack>
  );
}

ReasonChips.propTypes = {
  kind: PropTypes.oneOf(['link', 'creator']).isRequired,
};
