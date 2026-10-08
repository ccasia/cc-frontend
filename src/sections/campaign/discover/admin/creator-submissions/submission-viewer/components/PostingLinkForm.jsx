import PropTypes from 'prop-types';
import { m, AnimatePresence } from 'framer-motion';

import { Box, Stack, Button, Tooltip, TextField, IconButton, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

import { sectionLabelSx } from '../styles';
import { MAX_POSTING_LINKS } from '../posting-links';
import usePostingLinkForm from '../hooks/use-posting-link-form';

const FIELD_ATTR = 'data-posting-link-field';

const focusField = (index) =>
  requestAnimationFrame(() => document.querySelector(`[${FIELD_ATTR}="${index}"] input`)?.focus());

const fieldMotion = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
};

// Admin adds the creator's posting link(s); a superadmin or CS lead then approves them
export default function PostingLinkForm({ submission }) {
  const {
    fields,
    errors,
    validCount,
    submitError,
    submitting,
    change,
    commit,
    remove,
    paste,
    submit,
  } = usePostingLinkForm(submission);

  const handleKeyDown = (event, index) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    commit(index);
    focusField(index + 1);
  };

  // Clickable as soon as anything's typed; submitting shows what's wrong
  const hasText = fields.some((value) => value.trim());
  const submitLabel =
    validCount > 1 ? `Send ${validCount} links for approval` : 'Send link for approval';

  return (
    <Stack gap={1} sx={{ mt: 1.5 }}>
      <Stack direction="row" alignItems="baseline">
        <Typography sx={sectionLabelSx}>Add the posting link yourself</Typography>
        <Typography sx={{ ml: 'auto', fontSize: 11.5, color: '#9A9AA2' }}>
          Up to {MAX_POSTING_LINKS}
        </Typography>
      </Stack>

      {/* Spacing lives inside each animated field so it folds away with it */}
      <Box sx={{ mb: -1 }}>
        <AnimatePresence initial={false}>
          {fields.map((value, index) => (
            <m.div key={index} {...fieldMotion} style={{ overflow: 'hidden' }}>
              <Box sx={{ pb: 1 }}>
                <TextField
                  {...{ [FIELD_ATTR]: index }}
                  fullWidth
                  size="small"
                  value={value}
                  disabled={submitting}
                  placeholder={
                    index === 0
                      ? 'Paste the TikTok or Instagram post link'
                      : 'Add another link (optional)'
                  }
                  error={Boolean(errors[index])}
                  helperText={errors[index] || ''}
                  onChange={(event) => change(index, event.target.value)}
                  onBlur={() => commit(index)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                  onPaste={(event) => {
                    if (paste(index, event.clipboardData.getData('text'))) event.preventDefault();
                  }}
                  InputProps={{
                    sx: { fontSize: 13 },
                    endAdornment: value ? (
                      <Tooltip title="Remove">
                        <IconButton
                          size="small"
                          edge="end"
                          disabled={submitting}
                          onClick={() => remove(index)}
                        >
                          <Iconify icon="eva:close-fill" width={16} />
                        </IconButton>
                      </Tooltip>
                    ) : undefined,
                  }}
                />
              </Box>
            </m.div>
          ))}
        </AnimatePresence>
      </Box>

      {submitError && (
        <Typography sx={{ fontSize: 12, color: '#F04438' }}>{submitError}</Typography>
      )}

      <Button
        fullWidth
        variant="contained"
        disabled={submitting || !hasText}
        onClick={submit}
        sx={{ height: 40, bgcolor: '#1304FF', '&:hover': { bgcolor: '#0F03CC' } }}
      >
        {submitting ? 'Sending…' : submitLabel}
      </Button>
      <Typography sx={{ fontSize: 11.5, color: '#8A8A92', textAlign: 'center' }}>
        Links added by an admin are approved by a superadmin or CS lead.
      </Typography>
    </Stack>
  );
}

PostingLinkForm.propTypes = {
  submission: PropTypes.object.isRequired,
};
