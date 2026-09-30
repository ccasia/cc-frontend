import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';

import ReleaseTypeChip from './release-type-chip';
import { sortByType, LIP_BUTTON_SX } from '../constants';

export default function WhatsNewPopup({ open, releaseNote, onDismiss }) {
  if (!releaseNote) return null;

  return (
    <Dialog
      open={open}
      onClose={onDismiss}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 2, p: 3 } }}
    >
      <Typography variant="overline" sx={{ color: 'text.secondary' }}>
        Release • {dayjs(releaseNote.releaseDate).format('DD MMM YYYY')}
      </Typography>

      <Typography
        sx={{
          fontFamily: (theme) => theme.typography.fontSecondaryFamily,
          fontSize: 40,
          lineHeight: 1.2,
          mt: 0.5,
        }}
      >
        What&apos;s New
      </Typography>

      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Here&apos;s what the product team shipped since you last logged in.
      </Typography>

      <Stack spacing={2.5} sx={{ maxHeight: 360, overflowY: 'auto', pr: 1 }}>
        {sortByType(releaseNote.items).map((item) => (
          <Stack key={item.id} direction="row" spacing={2} alignItems="flex-start">
            <ReleaseTypeChip type={item.type} />
            <Box>
              <Typography variant="subtitle2">{item.title}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-line' }}>
                {item.description}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{ mt: 3 }}
      >
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Find this anytime from the What&apos;s New icon in the top bar.
        </Typography>
        <Button
          variant="contained"
          onClick={onDismiss}
          sx={{ ...LIP_BUTTON_SX.dark, flexShrink: 0 }}
        >
          Dismiss
        </Button>
      </Stack>
    </Dialog>
  );
}

WhatsNewPopup.propTypes = {
  open: PropTypes.bool,
  onDismiss: PropTypes.func,
  releaseNote: PropTypes.object,
};
